import * as React from "react";
import { addDays, differenceInMinutes, isSameDay, startOfDay } from "date-fns";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { ShellHeaderSlot, ShellRailSlot, useShellConfig } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/navigation";
import { PageHeader } from "@/components/utility";
import { Text } from "@/components/typography";
import { ConfirmDialog } from "@/components/overlays";
import { DataListActionRail, ScreenHeaderActions, useActionsPlacement } from "@/components/action-rail";
import { Skeleton } from "@/components/ui/skeleton";
import type { ScheduleDrop, ScheduleEvent, ScheduleResourceAlert, ScheduleSlot } from "@/components/scheduling";
import { atMinutes, formatClock, formatClockRange, minutesOfDay } from "@/components/scheduling";
import { DEFAULT_BRANCH_ID } from "@/features/branches";
import { CalendarToolbar } from "./CalendarToolbar";
import { CalendarDayView } from "./CalendarDayView";
import { CalendarAgendaView } from "./CalendarAgendaView";
import { CalendarMonthView } from "./CalendarMonthView";
import { AppointmentDrawer } from "./AppointmentDrawer";
import { CreateAppointmentDrawer, type CreateAppointmentDraft, type CreateAppointmentInitial } from "./CreateAppointmentDrawer";
import { CalendarFilters, type ServiceFilterOption } from "./CalendarFilters";
import { GapsDrawer } from "./GapsDrawer";
import { dayGaps } from "./gapsModel";
import { dayPulse } from "./pulseModel";
import { CalendarAssistantDrawer } from "./CalendarAssistantDrawer";
import { dayBrief, type WaitlistMatch } from "./dayBrief";
import { CheckoutDrawer } from "./CheckoutDrawer";
import { BlockDrawer } from "./BlockDrawer";
import { CollectionsDrawer } from "./CollectionsDrawer";
import { WaitlistDrawer } from "./WaitlistDrawer";
import { QuickSaleDrawer } from "./QuickSaleDrawer";
import { WalkInSaleDrawer } from "./WalkInSaleDrawer";
import { ReflowBanner } from "./ReflowBanner";
import { calendarRailActions } from "./calendarRailActions";
import { clockLabel, useMoney } from "./calendarFormat";
import { useCalendarDensity } from "./calendarDensity";
import { useCalendarShortcuts } from "./useCalendarShortcuts";
import { useCalendarState } from "./useCalendarState";
import { useCatalogQuery, useDayQuery, useRemoveBlock, useUpdateAppointment, useWaitlistQuery } from "./queries";
import { CalendarWeekView } from "./CalendarWeekView";
import { moveStart, reflowPlan, type ReflowPlan } from "./reflowModel";
import type { SlotSuggestion } from "./slotSuggestions";
import { BLOCK_CATEGORY_KEYS } from "./types";
import {
  appointmentEnd,
  appointmentStart,
  applyDayHours,
  durationLabel,
  visibleBarbers,
  followsAgendaRules,
  isActive,
  serviceCategories,
  serviceColor,
  clashingAppointments,
  findBarber,
  findClient,
  nextStep,
  parseLocal,
  placementProblem,
  placementReason,
  toEvent,
  toLocalIso,
  type AgendaFilters,
  type ModelContext,
} from "./calendarModel";
import { STATUS_KEYS, type Appointment, type AppointmentPatch, type AppointmentStatus, type Barber, type CalendarDay, type TimeBlock, type WaitlistEntry } from "./types";

/**
 * El calendario de la barbería: el día por barbero, la agenda como lista y
 * la ocupación del mes, con todo lo que se hace desde aquí —agendar, mover,
 * atender, cobrar, bloquear, vender— en drawers del sistema. La barra
 * flotante concentra las acciones de pantalla; cada cita abre su detalle.
 *
 * Lo que la agenda propone se ve antes de aplicarse: los huecos sugeridos
 * del alta, a dónde iría cada cita en un reacomodo y el hueco que deja una
 * cancelación se pintan sobre la rejilla y se aceptan o se descartan.
 * Cualquier cambio deja un «Deshacer» en el toast y el porqué en el historial.
 *
 * El estado que se comparte (día, vista, filtro, cita abierta) vive en la
 * URL; los paneles de trabajo (crear, cobrar, bloquear…) en memoria.
 */

type Panel =
  | { kind: "create"; initial: CreateAppointmentInitial | null }
  | { kind: "assistant" }
  | { kind: "checkout"; appointment: Appointment }
  | { kind: "block"; barberId: string | null }
  | { kind: "collections" }
  | { kind: "waitlist" }
  | { kind: "quickSale" }
  | { kind: "walkInSale" }
  | { kind: "gaps" }
  | { kind: "removeBlock"; block: TimeBlock }
  | { kind: "confirm"; action: "cancel" | "noShow"; appointment: Appointment };

/** Un plan de reacomodo en pantalla, y el cambio que lo provocó (alargar una cita) si lo hubo. */
interface PendingReflow {
  plan: ReflowPlan;
  anchorPatch: AppointmentPatch | null;
}

/** Un hueco que dejó una cancelación y a quién de la lista de espera le serviría. */
interface FreedSlot {
  id: string;
  dateKey: string;
  barberId: string;
  start: Date;
  end: Date;
  matches: WaitlistEntry[];
}

const EMPTY_CATALOG = { barbers: [], clients: [], services: [], products: [] };
const EMPTY_DRAFT: CreateAppointmentDraft = { serviceIds: [], walkIn: false, notes: "" };

const suggestionId = (suggestion: SlotSuggestion): string => `suggest-${suggestion.barber.id}-${suggestion.start.getTime()}`;
/** Las mismas sugerencias, aunque la lista sea otra: así no se repinta la agenda por nada. */
const sameSuggestions = (a: readonly SlotSuggestion[], b: readonly SlotSuggestion[]): boolean =>
  a.length === b.length && a.every((item, index) => suggestionId(item) === suggestionId(b[index]) && item.reasonKey === b[index].reasonKey);
const sameDraft = (a: CreateAppointmentDraft, b: CreateAppointmentDraft): boolean =>
  a.clientId === b.clientId && a.walkIn === b.walkIn && a.notes === b.notes && a.serviceIds.join() === b.serviceIds.join();
/** Al reacomodar por retraso, cuánto se supone que le queda a quien está en silla. */
const RUNNING_LATE_GRACE_MINUTES = 10;
/** El rato libre más corto que se marca al ver solo los huecos. */
const FREE_SLOT_MIN_MINUTES = 15;

export interface CalendarPageProps {
  /** El «ahora» de la línea roja y de la agenda de hoy. Inyectable para las pruebas. */
  now?: Date;
}

export function CalendarPage({ now }: CalendarPageProps = {}) {
  const t = useAppT();
  const navigate = useNavigate();
  const { current } = useLocale();
  const formatMoney = useMoney();
  const { activeCompanyId, activeRoleId } = useShellConfig();
  // Solo el barbero de comisión agenda con reglas; los demás roles pueden pisar citas y horarios.
  const enforceRules = followsAgendaRules(activeRoleId);
  const branchId = activeCompanyId ?? DEFAULT_BRANCH_ID;
  const nowDate = React.useMemo(() => now ?? new Date(), [now]);
  // «Hoy» con identidad estable: de él cuelgan la fecha, el catálogo del día y
  // todo lo que se memoriza con ellos. Uno nuevo en cada render los recalcula sin fin.
  const today = React.useMemo(() => startOfDay(nowDate), [nowDate]);
  const state = useCalendarState(today);
  const catalog = useCatalogQuery(branchId);
  const day = useDayQuery(branchId, state.dateKey);
  const waitlist = useWaitlistQuery(branchId, null);
  const update = useUpdateAppointment();
  const removeBlock = useRemoveBlock();
  const [searchParams] = useSearchParams();
  const [density, setDensity, slotHeight] = useCalendarDensity();
  /* Llegar desde la ficha de un cliente («Crear cita») abre el alta con él ya elegido. */
  const [panel, setPanel] = React.useState<Panel | null>(() => {
    const clientId = searchParams.get("cliente");
    return clientId ? { kind: "create", initial: { clientId } } : null;
  });
  /** Sube cuando el alta debe remontarse con otros datos (una propuesta aceptada). */
  const [createNonce, setCreateNonce] = React.useState(0);
  const [reflow, setReflow] = React.useState<PendingReflow | null>(null);
  const [suggestions, setSuggestions] = React.useState<readonly SlotSuggestion[]>([]);
  const [draft, setDraft] = React.useState<CreateAppointmentDraft>(EMPTY_DRAFT);
  const [freed, setFreed] = React.useState<FreedSlot[]>([]);
  /** Lo último que se movió, para la tecla Z. */
  const undoRef = React.useRef<(() => void) | null>(null);
  const closePanel = () => setPanel(null);

  // Un solo panel a la vez junto a la agenda: abrir una cita cierra lo que hubiera, y al revés.
  const openAppointment = React.useCallback(
    (appointment: Appointment) => {
      setPanel(null);
      state.openAppointment(appointment.id);
    },
    [state]
  );
  const openPanel = React.useCallback(
    (next: Panel) => {
      state.openAppointment(null);
      setPanel(next);
    },
    [state]
  );
  const currentAppointment = React.useMemo(() => day.data?.appointments.find((item) => item.id === state.appointmentId) ?? null, [day.data, state.appointmentId]);

  const patch = React.useCallback(
    (appointment: Appointment, changes: AppointmentPatch, done?: (updated: Appointment) => void) => {
      update.mutate(
        { id: appointment.id, patch: changes },
        {
          onSuccess: (updated) => done?.(updated),
          onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
        }
      );
    },
    [update]
  );

  /** Un cambio que se puede deshacer: el toast lo ofrece y la tecla Z lo recuerda. */
  const patchWithUndo = React.useCallback(
    (appointment: Appointment, changes: AppointmentPatch, revert: AppointmentPatch, title: string, description: string) => {
      patch(appointment, changes, (updated) => {
        const undo = () => {
          undoRef.current = null;
          patch(updated, revert, () => toast.success(t("calendar.undone")));
        };
        undoRef.current = undo;
        toast.success(title, { description, action: { label: t("calendar.undo"), onClick: undo } });
      });
    },
    [patch, t]
  );

  const changeStatus = React.useCallback(
    (appointment: Appointment, status: AppointmentStatus) => {
      if (status === "paid") {
        openPanel({ kind: "checkout", appointment });
        return;
      }
      patch(appointment, { status }, (updated) => {
        const client = findClient(catalog.data ?? EMPTY_CATALOG, updated.clientId);
        toast.success(t("calendar.statusChanged"), {
          description: t("calendar.statusChangedHint", { client: client?.name ?? "", status: t(STATUS_KEYS[updated.status]) }),
        });
      });
    },
    [catalog.data, openPanel, patch, t]
  );

  // Las franjas del día (con las excepciones de la semana) pisan el horario
  // fijo del catálogo: así el calendario enseña lo que de verdad se trabaja.
  const dayCatalog = React.useMemo(
    () => (catalog.data ? { ...catalog.data, barbers: applyDayHours(catalog.data.barbers, state.date, day.data?.hours) } : null),
    [catalog.data, day.data?.hours, state.date]
  );
  const ctx = React.useMemo<ModelContext | null>(
    () =>
      dayCatalog
        ? {
            t,
            intl: current.intl,
            formatMoney,
            catalog: dayCatalog,
            now: nowDate,
            onNextStep: (appointment) => {
              const step = nextStep(appointment.status);
              if (step) changeStatus(appointment, step.status);
            },
          }
        : null,
    [dayCatalog, changeStatus, current.intl, formatMoney, nowDate, t]
  );

  const barbers = React.useMemo(() => dayCatalog?.barbers ?? [], [dayCatalog]);
  const pulse = React.useMemo(() => (day.data && dayCatalog ? dayPulse(day.data.appointments, dayCatalog, nowDate) : null), [day.data, dayCatalog, nowDate]);
  const brief = React.useMemo(() => (day.data && dayCatalog ? dayBrief(day.data, dayCatalog, state.date, nowDate) : null), [day.data, dayCatalog, state.date, nowDate]);

  // Los servicios del catálogo con el color de sus tarjetas y cuántas citas vivas tienen hoy: filtro y leyenda a la vez.
  const serviceOptions = React.useMemo<ServiceFilterOption[]>(() => {
    if (!dayCatalog) return [];
    const active = (day.data?.appointments ?? []).filter(isActive);
    const order = serviceCategories(dayCatalog);
    return [...dayCatalog.services]
      .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.name.localeCompare(b.name))
      .map((service) => ({ id: service.id, name: service.name, color: serviceColor(dayCatalog, service.id) ?? 1, count: active.filter((item) => item.serviceIds.includes(service.id)).length }));
  }, [dayCatalog, day.data]);
  const filters = React.useMemo<AgendaFilters>(() => ({ stages: state.focuses, serviceIds: state.serviceIds }), [state.focuses, state.serviceIds]);

  // Barra flotante o cabecera: lo decide la persona en «Personalización».
  const [actionsPlacement] = useActionsPlacement();
  const railOwnsActions = actionsPlacement === "rail";
  const isDayView = state.view === "day" || state.view === "agenda";

  const railActions = React.useMemo(
    () =>
      calendarRailActions(t, {
        create: () => openPanel({ kind: "create", initial: null }),
        quickSale: () => openPanel({ kind: "quickSale" }),
        walkInSale: () => openPanel({ kind: "walkInSale" }),
        collections: () => openPanel({ kind: "collections" }),
        waitlist: () => openPanel({ kind: "waitlist" }),
        block: () => openPanel({ kind: "block", barberId: null }),
        workHours: () => navigate("/usuarios"),
        assistant: () => openPanel({ kind: "assistant" }),
        gaps: () => openPanel({ kind: "gaps" }),
      }),
    [navigate, openPanel, t]
  );

  useCalendarShortcuts({
    create: () => openPanel({ kind: "create", initial: null }),
    today: () => state.setDate(nowDate),
    agenda: () => state.setView("agenda"),
    day: () => state.setView("day"),
    week: () => state.setView("week"),
    month: () => state.setView("month"),
    previous: () => state.setDate(addDays(state.date, -1)),
    next: () => state.setDate(addDays(state.date, 1)),
    undo: () => undoRef.current?.(),
    assistant: () => openPanel({ kind: "assistant" }),
    gaps: () => openPanel({ kind: "gaps" }),
  });

  const onSlotClick = (slot: ScheduleSlot) => openPanel({ kind: "create", initial: { barberId: slot.resourceId, start: slot.start } });

  /* ------------------------------------------------------- mover y estirar */

  /** Si una tarjeta cabe donde se quiere soltar. Alargarla sobre citas que se pueden correr sí vale: se ofrece reacomodar. */
  const validateDrop = React.useCallback(
    (event: ScheduleEvent, drop: ScheduleDrop): string | null => {
      if (!enforceRules || !ctx || !day.data) return null;
      const barber = findBarber(ctx.catalog, drop.resourceId);
      if (!barber) return null;
      const from = minutesOfDay(drop.start);
      const to = minutesOfDay(drop.end);
      const problem = placementProblem(day.data, barber, state.date, from, to, event.id);
      const isResize = drop.resourceId === event.resourceId && drop.start.getTime() === event.start.getTime();
      if (isResize && problem?.kind === "appointment") {
        const anchor = day.data.appointments.find((item) => item.id === event.id);
        const plan = anchor ? reflowPlan(day.data, barber, state.date, { ...anchor, durationMin: to - from }, to) : null;
        // Si todo lo que pisa se puede correr, el plan lo resuelve; si no, no cabe.
        if (plan && clashingAppointments(day.data.appointments, barber.id, state.date, from, to, event.id).every((item) => plan.moves.some((move) => move.appointment.id === item.id))) return null;
      }
      return placementReason(problem, ctx, barber);
    },
    [ctx, day.data, enforceRules, state.date]
  );

  /** Sin reglas el cambio entra igual, pero se avisa de sobre qué quedó. */
  const overlapNote = (barberId: string, from: number, to: number, excludeId: string): string | null => {
    if (enforceRules || !ctx || !day.data) return null;
    const barber = findBarber(ctx.catalog, barberId);
    return barber ? placementReason(placementProblem(day.data, barber, state.date, from, to, excludeId), ctx, barber) : null;
  };

  const onDropRejected = (_event: ScheduleEvent, _drop: ScheduleDrop, reason: string) => toast.error(t("calendar.clash.title"), { description: reason });

  const onMove = (appointment: Appointment, drop: ScheduleDrop) => {
    if (!ctx) return;
    const barber = findBarber(ctx.catalog, drop.resourceId);
    const client = findClient(ctx.catalog, appointment.clientId);
    const note = overlapNote(drop.resourceId, minutesOfDay(drop.start), minutesOfDay(drop.end), appointment.id);
    const moved = t("calendar.movedHint", { client: client?.name ?? "", barber: barber?.name ?? "", time: formatClockRange(drop.start, drop.end, ctx.intl) });
    patchWithUndo(
      appointment,
      { start: toLocalIso(drop.start), barberId: drop.resourceId, force: !enforceRules },
      { start: appointment.start, barberId: appointment.barberId, force: true },
      t("calendar.moved"),
      note ? `${moved} ${note}.` : moved
    );
  };

  const onResize = (appointment: Appointment, drop: ScheduleDrop) => {
    if (!ctx || !day.data) return;
    const minutes = differenceInMinutes(drop.end, parseLocal(appointment.start));
    const barber = findBarber(ctx.catalog, appointment.barberId);
    const from = minutesOfDay(appointmentStart(appointment));
    const client = findClient(ctx.catalog, appointment.clientId);
    // Si al alargarse pisa a quien viene después, se propone correr la cola en vez de rechazar.
    const pisa = barber ? clashingAppointments(day.data.appointments, barber.id, state.date, from, from + minutes, appointment.id) : [];
    // Quien agenda sin reglas alarga y ya; a quien las sigue se le propone correr la cola.
    const plan = enforceRules && barber && pisa.length > 0 ? reflowPlan(day.data, barber, state.date, { ...appointment, durationMin: minutes }, from + minutes) : null;
    if (plan) {
      setReflow({ plan, anchorPatch: { durationMin: minutes } });
      return;
    }
    const note = overlapNote(appointment.barberId, from, from + minutes, appointment.id);
    const resized = t("calendar.resizedHint", { client: client?.name ?? "", minutes });
    patchWithUndo(appointment, { durationMin: minutes, force: !enforceRules }, { durationMin: appointment.durationMin, force: true }, t("calendar.resized"), note ? `${resized} ${note}.` : resized);
  };

  /* ------------------------------------------------------------ reacomodo */

  /** La cola de un barbero que va con retraso: lo que está en silla se alarga y empuja a los demás. */
  const planForBarber = (barber: Barber) => {
    if (!day.data) return;
    const seated = day.data.appointments
      .filter((item) => item.barberId === barber.id && item.status === "seated" && isSameDay(appointmentStart(item), state.date))
      .sort((a, b) => appointmentStart(b).getTime() - appointmentStart(a).getTime())[0];
    const anchor = seated ?? day.data.appointments.filter((item) => item.barberId === barber.id && item.status === "arrived").sort((a, b) => appointmentStart(a).getTime() - appointmentStart(b).getTime())[0];
    if (!anchor) {
      toast(t("calendar.reflow.nothing"));
      return;
    }
    const scheduledEnd = minutesOfDay(appointmentEnd(anchor));
    const nowMin = isSameDay(nowDate, state.date) ? minutesOfDay(nowDate) : null;
    // Quien ya está en silla termina, como pronto, en un rato; quien sigue esperando aún tiene todo su servicio por delante.
    const anchorEnd = nowMin === null ? scheduledEnd : anchor.status === "seated" ? Math.max(scheduledEnd, nowMin + RUNNING_LATE_GRACE_MINUTES) : Math.max(scheduledEnd, nowMin + anchor.durationMin);
    const plan = reflowPlan(day.data, barber, state.date, anchor, anchorEnd);
    if (!plan) {
      toast(t("calendar.reflow.nothing"));
      return;
    }
    setReflow({ plan, anchorPatch: null });
  };

  const applyReflow = async () => {
    if (!reflow || !ctx) return;
    const { plan, anchorPatch } = reflow;
    setReflow(null);
    const moved: { appointment: Appointment; previous: string }[] = [];
    try {
      // De la última a la primera: así ninguna pisa a la siguiente mientras se corren.
      for (const move of [...plan.moves].reverse()) {
        const updated = await update.mutateAsync({
          id: move.appointment.id,
          patch: { start: toLocalIso(moveStart(plan, move)), force: !enforceRules, reason: t("calendar.reflow.reason", { minutes: move.to - move.from }), actor: "assistant" },
        });
        moved.push({ appointment: updated, previous: move.appointment.start });
      }
      const anchorBefore = plan.anchor.durationMin;
      const anchorAfter = anchorPatch ? await update.mutateAsync({ id: plan.anchor.id, patch: anchorPatch }) : null;
      const undo = () => {
        undoRef.current = null;
        if (anchorAfter) patch(anchorAfter, { durationMin: anchorBefore, force: true });
        for (const item of [...moved].reverse()) patch(item.appointment, { start: item.previous, force: true });
        toast.success(t("calendar.undone"));
      };
      undoRef.current = undo;
      toast.success(t("calendar.reflow.applied"), { description: t("calendar.reflow.appliedHint", { count: moved.length }), action: { label: t("calendar.undo"), onClick: undo } });
    } catch (error) {
      toast.error(describeError(error).title, { description: describeError(error).description });
    }
  };

  /* -------------------------------------------- lo que se pinta encima */

  const reflowGhosts = React.useMemo<ScheduleEvent[]>(() => {
    if (!reflow || !ctx || !isSameDay(reflow.plan.date, state.date)) return [];
    const { plan, anchorPatch } = reflow;
    const badge = { label: t("calendar.reflow.badge"), tone: "primary" as const };
    const asGhost = (appointment: Appointment, start: Date, end: Date, note: string): ScheduleEvent => ({
      ...toEvent(appointment, ctx),
      id: `ghost-${appointment.id}`,
      start,
      end,
      ghost: true,
      badge,
      note,
      action: undefined,
      urgent: undefined,
      warning: undefined,
      markers: [],
      faded: false,
      locked: true,
    });
    const anchorStart = appointmentStart(plan.anchor);
    const anchor = anchorPatch?.durationMin ? [asGhost(plan.anchor, anchorStart, atMinutes(plan.date, plan.anchorEnd), t("calendar.resizedHint", { client: findClient(ctx.catalog, plan.anchor.clientId)?.name ?? "", minutes: anchorPatch.durationMin }))] : [];
    return [
      ...anchor,
      ...plan.moves.map((move) => asGhost(move.appointment, moveStart(plan, move), atMinutes(plan.date, move.to + move.appointment.durationMin), t("calendar.reflow.reason", { minutes: move.to - move.from }))),
    ];
  }, [reflow, ctx, state.date, t]);

  const suggestionGhosts = React.useMemo<ScheduleEvent[]>(() => {
    if (!ctx || panel?.kind !== "create") return [];
    const client = draft.clientId ? findClient(ctx.catalog, draft.clientId) : undefined;
    return suggestions.map((suggestion) => ({
      id: suggestionId(suggestion),
      resourceId: suggestion.barber.id,
      start: suggestion.start,
      end: suggestion.end,
      kind: "appointment",
      title: client?.name ?? t("calendar.suggest.slot"),
      note: t(suggestion.reasonKey, suggestion.reasonParams),
      tone: "primary",
      badge: { label: t("calendar.suggest.badge"), tone: "primary" },
      ghost: true,
      locked: true,
    }));
  }, [ctx, draft.clientId, panel?.kind, suggestions, t]);

  // «Solo huecos disponibles»: los ratos libres de quien se ve, como bloques que se tocan para agendar.
  const freeGhosts = React.useMemo<ScheduleEvent[]>(() => {
    if (!ctx || !day.data || !state.freeOnly || state.view !== "day") return [];
    return dayGaps({ day: day.data, catalog: ctx.catalog, barbers: visibleBarbers(ctx.catalog.barbers, state.team, state.date), date: state.date, now: nowDate, minMinutes: FREE_SLOT_MIN_MINUTES }).map((gap) => ({
      id: `free-${gap.id}`,
      resourceId: gap.barber.id,
      start: gap.start,
      end: gap.end,
      kind: "appointment",
      title: t("calendar.free.title"),
      note: gap.fits[0] ? (gap.fits.length > 1 ? t("calendar.gaps.fitsMore", { name: gap.fits[0].name, count: gap.fits.length - 1 }) : t("calendar.gaps.fits", { name: gap.fits[0].name })) : undefined,
      badge: { label: durationLabel(gap.minutes), tone: "primary" },
      ghost: true,
      locked: true,
    }));
  }, [ctx, day.data, nowDate, state.date, state.freeOnly, state.team, state.view, t]);

  const fadedIds = React.useMemo(
    () =>
      new Set([
        ...(reflow && isSameDay(reflow.plan.date, state.date) ? [...reflow.plan.moves.map((move) => move.appointment.id), ...(reflow.anchorPatch ? [reflow.plan.anchor.id] : [])] : []),
        // Mirando solo los huecos, todas las citas se apagan.
        ...(state.freeOnly ? (day.data?.appointments ?? []).map((item) => item.id) : []),
      ]),
    [reflow, state.date, state.freeOnly, day.data]
  );

  const extraEvents = React.useMemo(() => [...freeGhosts, ...reflowGhosts, ...suggestionGhosts], [freeGhosts, reflowGhosts, suggestionGhosts]);

  const onSuggestions = React.useCallback((next: readonly SlotSuggestion[], nextDraft: CreateAppointmentDraft) => {
    setSuggestions((current) => (sameSuggestions(current, next) ? current : next));
    setDraft((current) => (sameDraft(current, nextDraft) ? current : nextDraft));
  }, []);

  const acceptProposal = (event: ScheduleEvent) => {
    if (event.id.startsWith("ghost-")) {
      void applyReflow();
      return;
    }
    if (event.id.startsWith("free-")) {
      openPanel({ kind: "create", initial: { barberId: event.resourceId, start: event.start } });
      return;
    }
    const suggestion = suggestions.find((item) => suggestionId(item) === event.id);
    if (!suggestion) return;
    setCreateNonce((value) => value + 1);
    setPanel({ kind: "create", initial: { ...draft, serviceId: draft.serviceIds[0], barberId: suggestion.barber.id, start: suggestion.start } });
  };

  /* ------------------------------------------------ huecos que se liberan */

  /** Al anular una cita, a quién de la lista de espera le serviría ese hueco. */
  const releaseSlot = (appointment: Appointment) => {
    if (!ctx) return;
    const start = appointmentStart(appointment);
    const end = appointmentEnd(appointment);
    const barber = findBarber(ctx.catalog, appointment.barberId);
    const matches = (waitlist.data?.items ?? []).filter((entry) => {
      const minutes = ctx.catalog.services.find((service) => service.id === entry.serviceId)?.durationMin ?? 30;
      const barberOk = entry.barberId === null || entry.barberId === appointment.barberId;
      const dayOk = entry.slots.some((slot) => slot.date === state.dateKey);
      return barberOk && dayOk && minutes <= appointment.durationMin;
    });
    const offer = (entry: WaitlistEntry) => openPanel({ kind: "create", initial: { clientId: entry.clientId, serviceId: entry.serviceId, barberId: appointment.barberId, start } });
    toast(t("calendar.freed.title", { time: formatClockRange(start, end, ctx.intl), barber: barber?.name.split(" ")[0] ?? "" }), {
      description: matches.length > 0 ? t("calendar.freed.matches", { count: matches.length }) : t("calendar.freed.none"),
      action: matches[0] ? { label: t("calendar.freed.offer"), onClick: () => offer(matches[0]) } : undefined,
    });
    if (matches.length > 0) setFreed((current) => [...current, { id: appointment.id, dateKey: state.dateKey, barberId: appointment.barberId, start, end, matches }]);
  };

  const resourceAlerts = React.useMemo<Record<string, ScheduleResourceAlert>>(() => {
    if (!ctx || !day.data) return {};
    const alerts: Record<string, ScheduleResourceAlert> = {};
    for (const slot of freed) {
      // Solo mientras el hueco siga libre y se vea ese día.
      if (slot.dateKey !== state.dateKey || clashingAppointments(day.data.appointments, slot.barberId, state.date, minutesOfDay(slot.start), minutesOfDay(slot.end)).length > 0) continue;
      const entry = slot.matches[0];
      alerts[slot.barberId] = {
        label: t("calendar.freed.alert", { time: formatClock(slot.start, ctx.intl), count: slot.matches.length }),
        tone: "warning",
        onClick: () => openPanel({ kind: "create", initial: { clientId: entry.clientId, serviceId: entry.serviceId, barberId: slot.barberId, start: slot.start } }),
      };
    }
    return alerts;
  }, [ctx, day.data, freed, openPanel, state.date, state.dateKey, t]);

  /* ------------------------------------------------------------ resto */

  const onBarberReady = (appointment: Appointment) =>
    patch(appointment, { barberReady: true }, (updated) => {
      const client = ctx ? findClient(ctx.catalog, updated.clientId) : undefined;
      const barber = ctx ? findBarber(ctx.catalog, updated.barberId) : undefined;
      toast.success(t("calendar.readyMarked"), { description: t("calendar.readyMarkedHint", { barber: barber?.name ?? "", client: client?.name ?? "" }) });
    });

  const scheduleFromWaitlist = (entry: WaitlistEntry, match?: WaitlistMatch) => {
    const first = entry.slots[0];
    // Con un hueco ya encontrado, el alta abre con ese barbero y esa hora.
    const start = match?.start ?? (first ? parseLocal(`${first.date}T${first.time}:00`) : undefined);
    openPanel({ kind: "create", initial: { clientId: entry.clientId, serviceId: entry.serviceId, barberId: match?.barber.id ?? entry.barberId ?? undefined, start } });
  };

  // Las confirmaciones son diálogos encima de lo que haya; lo demás ocupa el panel lateral.
  const sidePanelOpen = panel !== null && panel.kind !== "confirm" && panel.kind !== "removeBlock";
  const confirm = panel?.kind === "confirm" ? panel : null;
  const confirmClient = confirm && ctx ? (findClient(ctx.catalog, confirm.appointment.clientId)?.name ?? "") : "";
  const showReflow = reflow !== null && ctx !== null && state.view === "day" && isSameDay(reflow.plan.date, state.date);

  return (
    // Columna flex a todo el alto: en la vista Día la rejilla se queda con lo
    // que sobra y es lo único que se desplaza —la página no suma otra barra—.
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, t("calendar.title")]} />
      </ShellHeaderSlot>

      <PageHeader
        className="pb-0"
        title={
          <span className="flex flex-wrap items-baseline gap-x-3">
            {t("calendar.title")}
            {pulse && isDayView && (
              <Text as="span" variant="muted" weight="normal" className="tabular-nums" data-testid="calendar-pulse-collected">
                {t("calendar.pulse.revenueLine", { collected: formatMoney(pulse.collected), total: formatMoney(pulse.expected) })}
              </Text>
            )}
          </span>
        }
        actions={railOwnsActions ? undefined : <ScreenHeaderActions actions={railActions} moreLabel={t("action.more")} />}
      />

      <CalendarToolbar
        date={state.date}
        isToday={state.isToday}
        view={state.view}
        team={state.team}
        barbers={barbers}
        onDateChange={state.setDate}
        onViewChange={state.setView}
        onTeamChange={state.setTeam}
        status={
          pulse && isDayView ? (
            <CalendarFilters
              pulse={pulse}
              focuses={state.focuses}
              services={serviceOptions}
              serviceIds={state.serviceIds}
              onChange={state.setFilters}
              freeOnly={state.view === "day" ? state.freeOnly : undefined}
              onFreeOnlyChange={state.view === "day" ? state.setFreeOnly : undefined}
              density={state.view === "day" ? density : undefined}
              onDensityChange={setDensity}
            />
          ) : undefined
        }
      />

      {showReflow && reflow && ctx && <ReflowBanner plan={reflow.plan} ctx={ctx} busy={update.isPending} onApply={() => void applyReflow()} onDiscard={() => setReflow(null)} />}

      <QueryBoundary query={catalog} loading={<GridSkeleton />}>
        {() =>
          ctx && (
            <>
              {state.view === "month" ? (
                <CalendarMonthView
                  branchId={branchId}
                  date={state.date}
                  team={state.team}
                  barbers={barbers}
                  onTeamChange={state.setTeam}
                  today={nowDate}
                  onSelectDay={(date) => {
                    state.setDate(date);
                    state.setView("day");
                  }}
                />
              ) : state.view === "week" ? (
                <CalendarWeekView branchId={branchId} date={state.date} team={state.team} ctx={ctx} today={nowDate} onSelectDay={(date, barberId) => state.openDay(date, barberId)} />
              ) : (
                <QueryBoundary query={day} loading={<GridSkeleton />}>
                  {(data: CalendarDay) =>
                    state.view === "agenda" ? (
                      <CalendarAgendaView
                        date={state.date}
                        team={state.team}
                        day={data}
                        ctx={ctx}
                        filters={filters}
                        onClearFocus={() => state.setFilters({ focuses: [], serviceIds: [] })}
                        onOpenAppointment={openAppointment}
                        onNextStep={(appointment) => ctx.onNextStep?.(appointment)}
                      />
                    ) : (
                      <CalendarDayView
                        date={state.date}
                        team={state.team}
                        day={data}
                        ctx={ctx}
                        now={nowDate}
                        filters={filters}
                        slotHeight={slotHeight}
                        extraEvents={extraEvents}
                        fadedIds={fadedIds}
                        alerts={resourceAlerts}
                        validateDrop={validateDrop}
                        onDropRejected={onDropRejected}
                        onSlotClick={onSlotClick}
                        onOpenAppointment={openAppointment}
                        onOpenBlock={(block) => setPanel({ kind: "removeBlock", block })}
                        onAcceptProposal={acceptProposal}
                        onMove={onMove}
                        onResize={onResize}
                        onSeeAll={() => state.setTeam("all")}
                        onConfigureHours={() => navigate("/usuarios")}
                        onViewBarber={(barber: Barber) => navigate(`/usuarios/lista?search=${encodeURIComponent(barber.name)}`)}
                        onBlockBarber={(barber: Barber) => openPanel({ kind: "block", barberId: barber.id })}
                        onReflowBarber={planForBarber}
                        onTeamChange={state.setTeam}
                      />
                    )
                  }
                </QueryBoundary>
              )}

              <AppointmentDrawer
                appointment={currentAppointment}
                open={Boolean(currentAppointment) && !sidePanelOpen}
                onOpenChange={(open) => !open && state.openAppointment(null)}
                ctx={ctx}
                branchId={branchId}
                onStatus={changeStatus}
                onBarberReady={onBarberReady}
                onPay={(appointment) => {
                  // El cobro sustituye al detalle: dos paneles apilados tapan el que importa.
                  state.openAppointment(null);
                  setPanel({ kind: "checkout", appointment });
                }}
                onPatch={(appointment, changes) =>
                  patch(appointment, changes, (updated) => {
                    toast.success(t("calendar.detail.updated"));
                    // Si la cita se fue a otro día, la agenda la sigue.
                    if (changes.start && updated.start.slice(0, 10) !== state.dateKey) state.setDate(parseLocal(updated.start));
                  })
                }
                onRebook={(initial) => {
                  state.openAppointment(null);
                  setPanel({ kind: "create", initial });
                }}
                onCancel={(appointment) => setPanel({ kind: "confirm", action: "cancel", appointment })}
                onNoShow={(appointment) => setPanel({ kind: "confirm", action: "noShow", appointment })}
                onOpenClient={(clientId) => navigate(`/clientes/${clientId}`)}
              />

              <CreateAppointmentDrawer
                key={createNonce}
                open={panel?.kind === "create"}
                onOpenChange={(open) => !open && closePanel()}
                ctx={ctx}
                initial={panel?.kind === "create" ? panel.initial : null}
                now={nowDate}
                viewDate={state.date}
                day={day.data}
                onSuggestions={onSuggestions}
                enforceRules={enforceRules}
                onCreated={(appointment) => state.setDate(parseLocal(appointment.start))}
                onCreateClient={() => navigate("/clientes")}
              />

              <CalendarAssistantDrawer
                open={panel?.kind === "assistant"}
                onOpenChange={(open) => !open && closePanel()}
                ctx={ctx}
                branchId={branchId}
                date={state.date}
                day={day.data}
                lines={brief ?? []}
                onFocus={(focus) => state.setFilters({ focuses: [focus] })}
                onBarber={state.setTeam}
                onSchedule={scheduleFromWaitlist}
                onBook={(initial) => openPanel({ kind: "create", initial })}
              />

              <CheckoutDrawer
                appointment={panel?.kind === "checkout" ? panel.appointment : null}
                open={panel?.kind === "checkout"}
                onOpenChange={(open) => !open && closePanel()}
                ctx={ctx}
                onPaid={(paid) => {
                  // Recién cobrado es el mejor momento para dejar agendada la siguiente.
                  const client = findClient(ctx.catalog, paid.clientId);
                  if (!client || client.type === "walkin") return;
                  toast(t("calendar.detail.rebook"), {
                    description: client.name,
                    action: {
                      label: t("calendar.insight.rebookAction"),
                      onClick: () => setPanel({ kind: "create", initial: { clientId: paid.clientId, serviceId: paid.serviceIds[0], barberId: paid.barberId } }),
                    },
                  });
                }}
              />

              <BlockDrawer open={panel?.kind === "block"} onOpenChange={(open) => !open && closePanel()} barbers={barbers} initialBarberId={panel?.kind === "block" ? panel.barberId : null} date={state.date} day={day.data} />

              <CollectionsDrawer
                open={panel?.kind === "collections"}
                onOpenChange={(open) => !open && closePanel()}
                branchId={branchId}
                ctx={ctx}
                initialDate={state.date}
                onPay={(appointment) => openPanel({ kind: "checkout", appointment })}
                onOpenAppointment={(appointment, date) => {
                  closePanel();
                  state.setDate(date);
                  state.openAppointment(appointment.id);
                }}
              />

              <WaitlistDrawer open={panel?.kind === "waitlist"} onOpenChange={(open) => !open && closePanel()} branchId={branchId} ctx={ctx} date={state.date} day={day.data} onSchedule={scheduleFromWaitlist} />

              <GapsDrawer
                open={panel?.kind === "gaps"}
                onOpenChange={(open) => !open && closePanel()}
                ctx={ctx}
                date={state.date}
                day={day.data}
                waitlist={waitlist.data?.items ?? []}
                onBook={(gap) => openPanel({ kind: "create", initial: { barberId: gap.barber.id, start: gap.start } })}
                onOffer={(gap, entry) => openPanel({ kind: "create", initial: { clientId: entry.clientId, serviceId: entry.serviceId, barberId: gap.barber.id, start: gap.start } })}
              />

              <QuickSaleDrawer open={panel?.kind === "quickSale"} onOpenChange={(open) => !open && closePanel()} branchId={branchId} ctx={ctx} />

              <WalkInSaleDrawer
                open={panel?.kind === "walkInSale"}
                onOpenChange={(open) => !open && closePanel()}
                ctx={ctx}
                date={state.date}
                now={nowDate}
                day={day.data}
                onCreated={(appointment) => {
                  state.setDate(parseLocal(appointment.start));
                  setPanel({ kind: "checkout", appointment });
                }}
              />

              <ConfirmDialog
                open={panel?.kind === "removeBlock"}
                onOpenChange={(open) => !open && closePanel()}
                variant="destructive"
                title={panel?.kind === "removeBlock" ? t("calendar.block.removeTitle", { name: t(BLOCK_CATEGORY_KEYS[panel.block.category]) }) : ""}
                description={
                  panel?.kind === "removeBlock"
                    ? t("calendar.block.removeHint", {
                        barber: findBarber(ctx.catalog, panel.block.barberId)?.name ?? "",
                        range: `${clockLabel(panel.block.startTime, ctx.intl)} – ${clockLabel(panel.block.endTime, ctx.intl)}`,
                      })
                    : undefined
                }
                confirmLabel={t("calendar.block.remove")}
                loading={removeBlock.isPending}
                onConfirm={() => {
                  if (panel?.kind !== "removeBlock") return;
                  removeBlock.mutate(panel.block.id, {
                    onSuccess: () => {
                      toast.success(t("calendar.block.removed"));
                      closePanel();
                    },
                    onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
                  });
                }}
              />

              <ConfirmDialog
                open={Boolean(confirm)}
                onOpenChange={(open) => !open && closePanel()}
                variant={confirm?.action === "cancel" ? "destructive" : "warning"}
                title={confirm?.action === "cancel" ? t("calendar.cancel.title", { name: confirmClient }) : t("calendar.noShow.title", { name: confirmClient })}
                description={confirm?.action === "cancel" ? t("calendar.cancel.hint") : t("calendar.noShow.hint")}
                confirmLabel={confirm?.action === "cancel" ? t("calendar.cancel.confirm") : t("calendar.noShow.confirm")}
                cancelLabel={t("calendar.cancel.keep")}
                loading={update.isPending}
                onConfirm={() => {
                  if (!confirm) return;
                  const status: AppointmentStatus = confirm.action === "cancel" ? "cancelled" : "no_show";
                  patch(confirm.appointment, { status }, (updated) => {
                    closePanel();
                    state.openAppointment(null);
                    toast.success(t("calendar.statusChanged"), { description: t("calendar.statusChangedHint", { client: confirmClient, status: t(STATUS_KEYS[status]) }) });
                    // El hueco que deja se ofrece enseguida a la lista de espera.
                    if (isSameDay(appointmentStart(updated), state.date) && appointmentEnd(updated) > nowDate) releaseSlot(updated);
                  });
                }}
              />
            </>
          )
        }
      </QueryBoundary>

      {railOwnsActions && (
        <ShellRailSlot>
          <DataListActionRail actions={railActions} selectedCount={0} onClearSelection={() => undefined} isBlocked={panel?.kind === "confirm" || panel?.kind === "removeBlock"} />
        </ShellRailSlot>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-busy="true">
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-[28rem] w-full" />
    </div>
  );
}
