import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppT } from "@/app/i18n";
import type { IconName } from "@/icons";
import { describeError } from "@/lib/api";
import { bookingApi } from "../../api";
import { bookingReducer, defaultBranchId, personName, type BookingAction, type BookingState } from "../../bookingState";
import { firstBookableDay, dayKeyOf, formatPhone, parseStart } from "../../bookingFormat";
import { useBookingFlow } from "../../flow/BookingContext";
import { bookingKeys } from "../../queries";
import { FIRST_VISIT_PROMO } from "../../pricing";
import type { VisitSuggestion } from "../../types";
import { itemDuration } from "../../useBookingTotals";
import { windowOf, type DayWindow } from "../agenda/agendaModel";
import { codeFromText, parseBookingText, phoneFromText, type ParsedRequest } from "./parseBookingText";

/** La tarjeta que trae un mensaje del asistente: con ella se responde tocando en vez de escribiendo. */
export type ChatWidget = "phone" | "code" | "profile" | "blocked" | "home" | "branches" | "services" | "barbers" | "times" | "cart" | "products" | "note" | "payment" | "receipt" | "manage" | "call";

/** Respuestas rápidas: una pastilla bajo el último mensaje que hace lo mismo que escribirla. */
export type ChatReplyId = "manage" | "info" | "call" | "book" | "different" | "pay" | "another" | "products" | "note" | "again" | "finish" | "restart" | "gift" | "packages" | "anyBarber" | "cart";

export interface ChatReply {
  id: ChatReplyId;
  label: string;
  icon?: IconName;
}

export interface ChatTurn {
  id: string;
  from: "agent" | "user";
  text: string;
  widget?: ChatWidget;
  replies?: readonly ChatReply[];
}

/** Para qué día (y franja) se abren las horas: lo que dijo en su frase, si dijo algo. */
export interface TimeFocus {
  date?: string;
  window?: DayWindow;
}

/** El tiempo que «escribe» el asistente antes de cada mensaje; en pruebas, nada. */
const TYPING_MS = import.meta.env.MODE === "test" ? 0 : 450;
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const plainText = (value: string): string => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** La tarjeta que se puede usar ahora: la del último mensaje del asistente que trae una. */
const widgetOf = (turns: readonly ChatTurn[]): ChatWidget | undefined => [...turns].reverse().find((turn) => turn.from === "agent" && turn.widget)?.widget;

interface EventHandlers {
  greetKnown: () => Promise<void> | void;
  welcomeNew: () => void;
  receipt: (number: string) => void;
}

let turnSeed = 0;
const nextId = () => {
  turnSeed += 1;
  return `turn_${turnSeed}`;
};

/**
 * La conversación de la reserva. No guarda la reserva aparte: cada respuesta
 * despacha las mismas acciones que las otras versiones sobre el mismo estado
 * (`bookingReducer`), y la conversación solo decide qué preguntar después y
 * con qué tarjeta. Lo que el cliente escribe se interpreta con
 * `parseBookingText`; lo que no se entiende se vuelve a preguntar con opciones.
 */
export function useChatBooking({ onFinish }: { onFinish?: () => void }) {
  const t = useAppT();
  const queryClient = useQueryClient();
  const { state, dispatch, shop, catalog, fmt } = useBookingFlow();
  const [turns, setTurns] = React.useState<readonly ChatTurn[]>([]);
  const [typing, setTyping] = React.useState(false);
  const [focus, setFocus] = React.useState<TimeFocus>({});
  const [suggestion, setSuggestion] = React.useState<VisitSuggestion | null>(null);
  // El estado de la reserva al instante: tras despachar, la conversación ya decide con lo nuevo.
  const stateRef = React.useRef<BookingState>(state);
  const catalogRef = React.useRef(catalog);
  const queue = React.useRef<Promise<void>>(Promise.resolve());
  const pendingManage = React.useRef(false);
  const started = React.useRef(false);
  const seenCustomer = React.useRef<string | null>(null);

  const apply = React.useCallback(
    (action: BookingAction) => {
      stateRef.current = bookingReducer(stateRef.current, action);
      dispatch(action);
    },
    [dispatch]
  );

  const pushUser = React.useCallback((text: string) => setTurns((current) => [...current, { id: nextId(), from: "user", text }]), []);

  /** Mensajes del asistente, uno tras otro, con su «escribiendo…» delante. */
  const say = React.useCallback((...messages: Omit<ChatTurn, "id" | "from">[]) => {
    const delay = reducedMotion() ? 0 : TYPING_MS;
    queue.current = queue.current.then(async () => {
      for (const message of messages) {
        if (delay > 0) {
          setTyping(true);
          await new Promise((resolve) => window.setTimeout(resolve, delay));
        }
        setTyping(false);
        setTurns((current) => [...current, { id: nextId(), from: "agent", ...message }]);
      }
    });
  }, []);

  const turnsRef = React.useRef(turns);
  const activeWidget = (): ChatWidget | undefined => widgetOf(turnsRef.current);

  const serviceNames = (ids: readonly string[]) => ids.map((id) => catalogRef.current?.services.find((service) => service.id === id)?.name ?? id).join(" + ");
  const barberName = (id: string | null) => (id ? (catalogRef.current?.barbers.find((barber) => barber.id === id)?.name ?? "") : "");

  /* ───────────────────────────── identidad ───────────────────────────── */

  const askPhone = React.useCallback(
    (text: string) =>
      say({
        text,
        widget: "phone",
        replies: [
          { id: "manage", label: t("booking.chat.reply.manage"), icon: "calendar" },
          { id: "info", label: t("booking.chat.reply.info"), icon: "compass" },
          { id: "call", label: t("booking.chat.reply.call"), icon: "phone" },
        ],
      }),
    [say, t]
  );

  const submitPhone = async (phone: string) => {
    pushUser(formatPhone(phone));
    try {
      const sent = await bookingApi.requestOtp(phone);
      apply({ type: "codeSent", phone, sentTo: sent.sentTo, channel: sent.channel });
      say({ text: t(sent.channel === "whatsapp" ? "booking.chat.codeWhatsapp" : "booking.chat.codeSms", { phone: sent.sentTo }), widget: "code" });
    } catch (error) {
      say({ text: describeError(error).description, widget: "phone" });
    }
  };

  const submitCode = async (code: string) => {
    const current = stateRef.current;
    try {
      const result = await bookingApi.verifyOtp(current.phone, code);
      if (result.status === "known") apply({ type: "customerFound", customer: result.customer, token: result.token });
      else if (result.status === "new") {
        apply({ type: "customerIsNew", token: result.token });
        say({ text: t("booking.chat.newHello", { shop: shop.name }), widget: "profile" });
      } else {
        apply({ type: "customerBlocked" });
        say({ text: t("booking.chat.blocked"), widget: "blocked" });
      }
    } catch (error) {
      say({ text: describeError(error).description, widget: "code" });
    }
  };

  /* ───────────────────────────── la reserva ───────────────────────────── */

  const ensureDraft = () => {
    if (!stateRef.current.draft) apply({ type: "openDraft", person: { kind: "self" }, serviceIds: [], barberId: null });
  };

  /** La sede: la única, la de siempre o se pregunta. Devuelve si ya hay sede. */
  const ensureBranch = (): boolean => {
    const current = stateRef.current;
    if (current.branchId) return true;
    const known = defaultBranchId(current.customer, shop.branches.map((branch) => branch.id));
    if (!known) {
      say({ text: t("booking.chat.askBranch", { count: shop.branches.length }), widget: "branches" });
      return false;
    }
    apply({ type: "chooseBranch", branchId: known });
    return true;
  };

  /** La sede que se da por hecha (única o la de siempre), sin preguntar: así el catálogo ya viene en camino. */
  const presetBranch = () => {
    const current = stateRef.current;
    if (current.branchId) return;
    const known = defaultBranchId(current.customer, shop.branches.map((branch) => branch.id));
    if (known) apply({ type: "chooseBranch", branchId: known });
  };

  /** El catálogo de la sede para entender la frase; si aún no llegó, se espera. */
  const loadCatalog = async () => {
    const branchId = stateRef.current.branchId;
    if (catalogRef.current || !branchId) return catalogRef.current;
    try {
      const loaded = await queryClient.fetchQuery({ queryKey: bookingKeys.catalog(branchId), queryFn: ({ signal }) => bookingApi.catalog(branchId, signal), staleTime: 10 * 60_000 });
      catalogRef.current = loaded;
      return loaded;
    } catch {
      return undefined;
    }
  };

  const askServices = (text = t("booking.chat.askServices")) => {
    if (!ensureBranch()) return;
    ensureDraft();
    say({ text, widget: "services" });
  };

  const askBarber = () => {
    const draft = stateRef.current.draft;
    if (!draft) return askServices();
    const able = (catalogRef.current?.barbers ?? []).filter((barber) => draft.serviceIds.every((id) => barber.prices[id] !== undefined));
    say({ text: t("booking.chat.askBarber", { count: able.length, services: serviceNames(draft.serviceIds) }), widget: "barbers", replies: [{ id: "anyBarber", label: t("booking.chat.reply.anyBarber"), icon: "users" }] });
  };

  const askTime = (next: TimeFocus = {}) => {
    const draft = stateRef.current.draft;
    if (!draft) return askServices();
    setFocus(next);
    const name = barberName(draft.barberId).split(" ")[0];
    say({ text: name ? t("booking.chat.askTimeWith", { name }) : t("booking.chat.askTimeAny"), widget: "times" });
  };

  const showCart = (lead: string) =>
    say({
      text: lead,
      widget: "cart",
      replies: [
        { id: "pay", label: t("booking.chat.reply.pay"), icon: "lock" },
        { id: "another", label: t("booking.chat.reply.another"), icon: "userAdd" },
        ...((catalogRef.current?.products.length ?? 0) > 0 ? [{ id: "products" as const, label: t("booking.chat.reply.products"), icon: "layers" as const }] : []),
        { id: "note", label: t("booking.chat.reply.note"), icon: "edit" },
      ],
    });

  const heldText = () => {
    const current = stateRef.current;
    const item = current.items.at(-1);
    if (!item?.start) return t("booking.chat.cartLead");
    const who = item.person.kind === "self" ? "" : ` ${t("booking.chat.forWhom", { name: personName(item.person, current.customer) })}`;
    return t("booking.chat.held", {
      services: serviceNames(item.serviceIds),
      barber: item.barberId ? t("booking.chat.withName", { name: barberName(item.barberId) }) : t("booking.chat.withAny"),
      when: fmt.when(parseStart(item.start)),
      who,
    });
  };

  const commitTime = (start: string, { echo }: { echo: boolean }) => {
    if (echo) pushUser(fmt.when(parseStart(start)));
    apply({ type: "chooseTime", start });
    showCart(heldText());
  };

  /** Lo de una frase del cliente aplicado de una vez: servicios, barbero, día y hora; pregunta lo que falte. */
  const fulfil = async (parsed: ParsedRequest) => {
    if (!ensureBranch()) return;
    ensureDraft();
    const draft = stateRef.current.draft;
    if (!draft) return;
    if (parsed.serviceIds.length > 0) {
      const target = new Set(parsed.serviceIds);
      draft.serviceIds.filter((id) => !target.has(id)).forEach((serviceId) => apply({ type: "toggleService", serviceId }));
      parsed.serviceIds.filter((id) => !draft.serviceIds.includes(id)).forEach((serviceId) => apply({ type: "toggleService", serviceId }));
    }
    if (parsed.barberId !== undefined) apply({ type: "chooseBarber", barberId: parsed.barberId });
    const ready = stateRef.current.draft;
    if (!ready || ready.serviceIds.length === 0) return askServices(t("booking.chat.whichService"));

    if (parsed.time) {
      const current = stateRef.current;
      const branch = shop.branches.find((item) => item.id === current.branchId);
      // Sin día: el que ya se está mirando en la conversación o, si no, el primero que se puede.
      const date = parsed.date ?? focus.date ?? (branch ? dayKeyOf(firstBookableDay(branch.closesAt, shop.minNoticeMinutes)) : dayKeyOf(new Date()));
      const params = { branchId: current.branchId as string, date, serviceIds: ready.serviceIds, barberId: ready.barberId };
      try {
        const availability = await queryClient.fetchQuery({
          queryKey: bookingKeys.availability(params.branchId, date, params.serviceIds, params.barberId),
          queryFn: ({ signal }) => bookingApi.availability(params, signal),
          staleTime: 30_000,
        });
        if (availability.slots.some((slot) => slot.time === parsed.time)) return commitTime(`${date}T${parsed.time}`, { echo: false });
        say({ text: t("booking.chat.notFree", { when: fmt.when(parseStart(`${date}T${parsed.time}`)) }) });
        return askTime({ date, window: windowOf(parsed.time) });
      } catch (error) {
        say({ text: describeError(error).description });
        return askTime({ date });
      }
    }
    if (parsed.date || parsed.window) return askTime({ date: parsed.date, window: parsed.window });
    if (parsed.barberId !== undefined) return askTime();
    return askBarber();
  };

  const greetKnown = async () => {
    const current = stateRef.current;
    const customer = current.customer;
    if (!customer) return;
    presetBranch();
    say({ text: t("booking.chat.knownHello", { name: customer.firstName }) });
    if (pendingManage.current) {
      pendingManage.current = false;
      return manage();
    }
    const next = current.token ? await bookingApi.suggestion(current.token).then((result) => result.suggestion, () => null) : null;
    setSuggestion(next);
    const replies: ChatReply[] = [
      { id: "different", label: t("booking.chat.reply.different"), icon: "plus" },
      ...(customer.upcoming > 0 ? [{ id: "manage" as const, label: t("booking.chat.reply.upcoming", { count: customer.upcoming }), icon: "calendar" as const }] : []),
      ...(shop.packages.length > 0 ? [{ id: "packages" as const, label: t("booking.packages.cta"), icon: "ticket" as const }] : []),
      ...(shop.payment.card ? [{ id: "gift" as const, label: t("booking.gift.cta"), icon: "ticket" as const }] : []),
    ];
    if (next) {
      const service = serviceNames(next.serviceIds);
      say({ text: t(next.isOverdue ? "booking.chat.dueOverdue" : "booking.chat.due", { service, days: next.everyDays }), widget: "home", replies });
    } else if (customer.lastVisit) {
      say({ text: t("booking.chat.repeatAsk", { services: serviceNames(customer.lastVisit.serviceIds) }), widget: "home", replies });
    } else {
      askServices();
    }
  };

  const welcomeNew = () => {
    presetBranch();
    const customer = stateRef.current.customer;
    const offer = FIRST_VISIT_PROMO ? (FIRST_VISIT_PROMO.type === "percent" ? `${FIRST_VISIT_PROMO.value} %` : fmt.money(FIRST_VISIT_PROMO.value)) : null;
    say({ text: offer ? t("booking.chat.niceToMeetOffer", { name: customer?.firstName ?? "", offer }) : t("booking.chat.niceToMeet", { name: customer?.firstName ?? "" }) });
    if (pendingManage.current) {
      pendingManage.current = false;
      return manage();
    }
    askServices();
  };

  const manage = () => {
    if (!stateRef.current.token || !stateRef.current.customer) {
      pendingManage.current = true;
      return askPhone(t("booking.chat.manageNeedsPhone"));
    }
    say({ text: t("booking.chat.manageIntro"), widget: "manage", replies: [{ id: "book", label: t("booking.chat.reply.book"), icon: "plus" }] });
  };

  const info = () => {
    const lines = shop.branches.map((branch) => `**${branch.name}** · ${branch.address}, ${branch.city} · ${t("booking.chat.todayHours", { from: fmt.clock(branch.opensAt), to: fmt.clock(branch.closesAt) })}`);
    say({ text: [t("booking.chat.infoLead"), ...lines.map((line) => `- ${line}`)].join("\n"), replies: [{ id: "book", label: t("booking.chat.reply.book"), icon: "calendar" }, { id: "call", label: t("booking.chat.reply.call"), icon: "phone" }] });
  };

  const call = () => say({ text: t("booking.chat.callText", { phone: formatPhone(shop.phone) }), widget: "call" });

  const checkout = () => {
    if (stateRef.current.items.length === 0) return askServices(t("booking.chat.nothingYet"));
    apply({ type: "goTo", step: "payment" });
    say({ text: t("booking.chat.payIntro"), widget: "payment" });
  };

  const another = () => {
    apply({ type: "openDraft", person: { kind: "self" }, serviceIds: [], barberId: null });
    say({ text: t("booking.chat.anotherAsk"), widget: "services" });
  };

  const restart = () => {
    apply({ type: "restart" });
    pendingManage.current = false;
    seenCustomer.current = null;
    setTurns([]);
    say({ text: t("booking.chat.hello", { shop: shop.name }) });
    askPhone(t("booking.chat.askPhone"));
  };

  /* ───────────────────────────── lo que reacciona ───────────────────────────── */

  // Al abrir: el saludo y el celular (como en WhatsApp, primero se sabe quién escribe).
  React.useEffect(() => {
    if (started.current) return;
    started.current = true;
    say({ text: t("booking.chat.hello", { shop: shop.name }) });
    askPhone(t("booking.chat.askPhone"));
  }, [askPhone, say, shop.name, t]);

  // Lo que hacen los efectos, siempre en su versión de este render (sin volver a dispararlos).
  const onEvents = React.useRef<EventHandlers | null>(null);

  // Cuando ya se sabe quién es (por el código o al crear su perfil), se le saluda por su nombre.
  const customerId = state.customer?.id ?? null;
  React.useEffect(() => {
    if (!customerId || seenCustomer.current === customerId) return;
    seenCustomer.current = customerId;
    if (stateRef.current.customer?.isNew) onEvents.current?.welcomeNew();
    else void onEvents.current?.greetKnown();
  }, [customerId]);

  // La reserva hecha (desde la tarjeta de pago): el recibo en la conversación.
  const receipt = (number: string) =>
    say({
      text: t("booking.chat.done", { name: stateRef.current.customer?.firstName ?? "", number }),
      widget: "receipt",
      replies: [
        { id: "again", label: t("booking.chat.reply.again"), icon: "plus" },
        { id: "manage", label: t("booking.chat.reply.manage"), icon: "calendar" },
        ...(onFinish ? [{ id: "finish" as const, label: t("booking.confirmed.done"), icon: "check" as const }] : []),
      ],
    });
  // Lo último de cada render, para los efectos y los manejadores (se escribe tras pintar, no durante).
  React.useLayoutEffect(() => {
    stateRef.current = state;
    catalogRef.current = catalog;
    turnsRef.current = turns;
    onEvents.current = { greetKnown, welcomeNew, receipt };
  });
  const reservationId = state.reservation?.id ?? null;
  const seenReservation = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!reservationId || seenReservation.current === reservationId) return;
    seenReservation.current = reservationId;
    onEvents.current?.receipt(stateRef.current.reservation?.number ?? "");
  }, [reservationId]);

  /* ───────────────────────────── entradas ───────────────────────────── */

  const reply = (id: ChatReplyId, label: string) => {
    pushUser(label);
    switch (id) {
      case "manage":
        return manage();
      case "info":
        return info();
      case "call":
        return call();
      case "book":
        return stateRef.current.customer ? askServices() : askPhone(t("booking.chat.askPhone"));
      case "different":
        return askServices();
      case "pay":
        return checkout();
      case "another":
        return another();
      case "products":
        return say({ text: t("booking.chat.productsIntro"), widget: "products" });
      case "note":
        return say({ text: t("booking.chat.noteAsk"), widget: "note" });
      case "cart":
        return showCart(t("booking.chat.cartLead"));
      case "again":
        apply({ type: "bookAgain" });
        return askServices();
      case "finish":
        return onFinish?.();
      case "restart":
        return restart();
      case "gift":
      case "packages":
        return apply({ type: "goTo", step: id });
      case "anyBarber":
        apply({ type: "chooseBarber", barberId: null });
        return askTime();
    }
  };

  const send = (text: string) => {
    const current = stateRef.current;
    const stage = activeWidget();
    // Un celular escrito en el chat: se repite ya con formato, como lo verá la barbería.
    const typedPhone = !current.customer && stage !== "code" && stage !== "profile" ? phoneFromText(text) : null;
    if (typedPhone) return void submitPhone(typedPhone);
    pushUser(text);
    void interpret(text, stage);
  };

  const interpret = async (text: string, stage: ChatWidget | undefined) => {
    const current = stateRef.current;
    const loaded = current.customer ? await loadCatalog() : catalogRef.current;
    const parsed = parseBookingText(text, { services: loaded?.services ?? [], barbers: loaded?.barbers ?? [], now: new Date() });

    if (parsed.intent === "restart") return restart();
    if (parsed.intent === "info") return info();
    if (parsed.intent === "call") return call();

    // Antes de saber quién es: el celular y el código.
    if (!current.customer) {
      if (stage === "code") {
        const code = codeFromText(text);
        return code ? void submitCode(code) : say({ text: t("booking.chat.needCode"), widget: "code" });
      }
      if (stage === "profile") return say({ text: t("booking.chat.fillProfile"), widget: "profile" });
      if (stage === "blocked") return call();
      if (parsed.intent === "manage") pendingManage.current = true;
      return askPhone(parsed.intent === "manage" ? t("booking.chat.manageNeedsPhone") : t("booking.chat.needPhone"));
    }

    if (stage === "payment") {
      const method = /barberia|local|efectivo|alla|shop|cash/.test(plainText(text)) ? "shop" : /billetera|apple|google|wallet/.test(plainText(text)) ? "wallet" : /tarjeta|card/.test(plainText(text)) ? "card" : null;
      if (method) {
        apply({ type: "setMethod", method });
        const label = { shop: t("booking.payment.shop"), wallet: t("booking.payment.wallet"), card: t("booking.payment.card") }[method];
        return say({ text: t("booking.chat.methodSet", { method: label.toLowerCase() }), widget: "payment" });
      }
    }
    if (stage === "note") {
      apply({ type: "setNotes", notes: [current.notes, text].filter(Boolean).join("\n") });
      return showCart(t("booking.chat.noted"));
    }
    switch (parsed.intent) {
      case "manage":
        return manage();
      case "products":
        return say({ text: t("booking.chat.productsIntro"), widget: "products" });
      case "note":
        return say({ text: t("booking.chat.noteAsk"), widget: "note" });
      case "pay":
        return checkout();
      case "another":
        return another();
      case "help":
        return say({ text: t("booking.chat.help") });
      default:
        break;
    }
    const hasRequest = parsed.serviceIds.length > 0 || parsed.barberId !== undefined || parsed.date !== undefined || parsed.time !== undefined || parsed.window !== undefined;
    if (hasRequest) return void fulfil(parsed);
    if (parsed.intent === "yes") {
      if (stage === "home" && suggestion?.options[0]) {
        const option = suggestion.options[0];
        apply({ type: "acceptSuggestion", branchId: suggestion.branchId, serviceIds: suggestion.serviceIds, barberId: option.barberId, start: option.start });
        return showCart(heldText());
      }
      if (stage === "home" && current.customer.lastVisit) {
        apply({ type: "repeatLastVisit", lastVisit: current.customer.lastVisit });
        return askTime();
      }
      if (stage === "cart") return another();
    }
    if (parsed.intent === "no") {
      if (stage === "cart") return checkout();
      if (stage === "home") return askServices();
    }
    return say({ text: t("booking.chat.fallback"), widget: stage && !["receipt", "payment"].includes(stage) ? stage : undefined });
  };

  /* ───────────────────────────── desde las tarjetas ───────────────────────────── */

  const actions = {
    submitPhone: (phone: string) => void submitPhone(phone),
    submitCode: (code: string) => void submitCode(code),
    resendCode: async () => {
      try {
        const sent = await bookingApi.requestOtp(stateRef.current.phone);
        apply({ type: "codeSent", phone: stateRef.current.phone, sentTo: sent.sentTo, channel: sent.channel });
        say({ text: t("booking.chat.codeAgain", { phone: sent.sentTo }), widget: "code" });
      } catch (error) {
        say({ text: describeError(error).description, widget: "code" });
      }
    },
    changePhone: () => {
      seenCustomer.current = null;
      apply({ type: "signOut" });
      askPhone(t("booking.chat.askPhone"));
    },
    chooseBranch: (branchId: string) => {
      pushUser(shop.branches.find((branch) => branch.id === branchId)?.name ?? branchId);
      apply({ type: "chooseBranch", branchId });
      ensureDraft();
      say({ text: t("booking.chat.askServices"), widget: "services" });
    },
    servicesDone: () => {
      const draft = stateRef.current.draft;
      if (!draft || draft.serviceIds.length === 0) return;
      const who = draft.person.kind === "self" ? "" : ` · ${personName(draft.person, stateRef.current.customer)}`;
      pushUser(`${serviceNames(draft.serviceIds)}${who}`);
      askBarber();
    },
    chooseBarber: (barberId: string | null) => {
      pushUser(barberId ? t("booking.chat.withName", { name: barberName(barberId) }) : t("booking.chat.reply.anyBarber"));
      apply({ type: "chooseBarber", barberId });
      askTime();
    },
    chooseTime: (start: string) => commitTime(start, { echo: true }),
    acceptSuggestion: (option: VisitSuggestion["options"][number]) => {
      if (!suggestion) return;
      pushUser(fmt.when(parseStart(option.start)));
      apply({ type: "acceptSuggestion", branchId: suggestion.branchId, serviceIds: suggestion.serviceIds, barberId: option.barberId, start: option.start });
      showCart(heldText());
    },
    repeatLast: () => {
      const last = stateRef.current.customer?.lastVisit;
      if (!last) return;
      pushUser(t("booking.chat.reply.same"));
      apply({ type: "repeatLastVisit", lastVisit: last });
      askTime();
    },
    editItem: () => {
      say({ text: t("booking.chat.editing"), widget: "services" });
    },
    productsDone: () => showCart(t("booking.chat.productsDone")),
    noteDone: () => showCart(t("booking.chat.noted")),
    reply,
  };

  const draftMinutes = itemDuration(state.draft?.serviceIds ?? [], catalog);
  return { turns, typing, focus, suggestion, send, actions, stage: widgetOf(turns), draftMinutes };
}

export type ChatEngine = ReturnType<typeof useChatBooking>;

const ChatEngineContext = React.createContext<ChatEngine | null>(null);
export const ChatEngineProvider = ChatEngineContext.Provider;

export function useChatEngine(): ChatEngine {
  const value = React.useContext(ChatEngineContext);
  if (!value) throw new Error("useChatEngine va dentro de <ChatFlow>.");
  return value;
}
