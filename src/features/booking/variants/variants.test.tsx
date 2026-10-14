import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor, within } from "@/test/render";
import { resetBookingLimits } from "@/mocks/booking/handlers";
import { DEMO_OTP as DEMO_CODE } from "@/mocks/booking/state";
import { BookingFlow } from "../BookingFlow";
import { requestVoiceOnArrival } from "../flow/versionSwitch";
import { bookingReducer, initialBookingState } from "../bookingState";
import type { BookingBarber, BookingService, Slot } from "../types";
import { ableBarbers, defaultServiceId, timesByWindow, windowOf } from "./agenda/agendaModel";
import { codeFromText, numberWordsToDigits, parseBookingText, phoneFromText } from "./chat/parseBookingText";
import { makeQuestion, matchOption, matchOptionLoosely } from "./chat/chatQuestions";
import { expiryProblem, maskCardInput, normalizeExpiry } from "./chat/chatCard";
import { detectAside } from "./chat/chatIntents";

/** Un jueves a las 8:00. */
const NOW = new Date(2026, 9, 8, 8, 0);

/** En la Agenda con selector sin cuenta la sede viene vacía: se abre su lista y se toca la primera. */
async function chooseAgendaBranch(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByTestId("agenda-branch-field"));
  const dialog = await screen.findByRole("dialog", { name: "¿Dónde quieres que te atendamos?" });
  await user.click(within(dialog).getAllByRole("radio")[0]);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
}

/** Tampoco viene servicio: con la sede ya puesta se abre «Servicios», se marca uno y se aplica. */
async function chooseAgendaService(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  await chooseAgendaBranch(user);
  await user.click(await screen.findByTestId("agenda-service-field"));
  const dialog = await screen.findByRole("dialog", { name: "¿Qué te vas a hacer?" });
  await user.click(await within(dialog).findByRole("checkbox", { name }));
  await user.click(within(dialog).getByRole("button", { name: "Ver horas" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
}

const service = (id: string, name: string, extra: Partial<BookingService> = {}): BookingService => ({ id, name, description: "", category: "", durationMin: 30, price: 30, imageUrl: null, isCombo: false, popular: false, ...extra });
const SERVICES: BookingService[] = [
  service("svc_corte", "Corte clásico", { popular: true }),
  service("svc_fade", "Fade"),
  service("svc_nino", "Corte niño"),
  service("svc_barba", "Arreglo de barba", { popular: true }),
  service("svc_afeitado", "Afeitado clásico"),
  service("svc_combo", "Corte + barba", { isCombo: true, popular: true }),
  service("svc_cejas", "Diseño de cejas"),
  service("svc_tinte", "Tinte de cabello"),
];
const barber = (id: string, name: string, rating = 4.8, prices: Record<string, number> = { svc_corte: 35, svc_barba: 30 }): BookingBarber => ({
  id,
  name,
  avatarUrl: null,
  level: null,
  description: "",
  skills: [],
  instagram: "",
  facebook: "",
  gallery: [],
  rating,
  reviews: 10,
  prices,
});
const BARBERS = [barber("team-04", "Andrés Molina", 4.9), barber("team-05", "Camilo Rey", 4.6), barber("team-08", "Daniela Osorio", 5, { svc_corte: 40 })];
/** Las conversaciones de punta a punta (identidad, cita, pago, recibo) tardan más con toda la suite en paralelo. */
const LONG_CONVERSATION_MS = 15_000;
const parse = (text: string) => parseBookingText(text, { services: SERVICES, barbers: BARBERS, now: NOW });

describe("números dichos en voz alta", () => {
  test("un celular dicho con palabras, cifra por cifra o mezclado, queda en cifras", () => {
    expect(numberWordsToDigits("trescientos ciento veintitrés cuarenta y cinco sesenta y siete", "es")).toBe("3001234567");
    expect(numberWordsToDigits("tres cero cero uno dos tres cuatro cinco seis siete", "es")).toBe("3001234567");
    expect(numberWordsToDigits("mi número es trescientos 123 45 67", "es")).toBe("mi número es 3001234567");
    expect(numberWordsToDigits("300 123 45 67", "es")).toBe("3001234567");
    expect(numberWordsToDigits("three zero zero one two three forty five sixty seven", "en")).toBe("3001234567");
  });

  test("un código de seis y una hora dichos con palabras", () => {
    expect(numberWordsToDigits("veinticuatro sesenta y ocho diez", "es")).toBe("246810");
    expect(numberWordsToDigits("corte a las tres de la tarde", "es")).toBe("corte a las 3 de la tarde");
  });

  test("las palabras que no son un número se quedan como están", () => {
    expect(numberWordsToDigits("quiero un corte", "es")).toBe("quiero un corte");
    expect(numberWordsToDigits("a los dos", "es")).toBe("a los dos");
    expect(numberWordsToDigits("dos cortes para mañana", "es")).toBe("dos cortes para mañana");
  });

  test("el celular y el código se leen en cualquier formato", () => {
    expect(phoneFromText("300-123-4567")).toBe("+573001234567");
    expect(phoneFromText("(300) 123 45 67")).toBe("+573001234567");
    expect(codeFromText("24 68 10")).toBe("246810");
    expect(codeFromText("2-4-6-8-1-0")).toBe("246810");
    expect(codeFromText("246810")).toBe("246810");
    expect(codeFromText("es el 246 810")).toBe("246810");
  });
});

describe("lo que entiende la conversación", () => {
  test("servicios por su nombre de a pie, con el combo cuando se piden juntos", () => {
    expect(parse("quiero un corte").serviceIds).toEqual(["svc_corte"]);
    expect(parse("corte y barba").serviceIds).toEqual(["svc_combo"]);
    expect(parse("me arreglo la barba").serviceIds).toEqual(["svc_barba"]);
    expect(parse("un degradado y las cejas").serviceIds.sort()).toEqual(["svc_cejas", "svc_fade"]);
    expect(parse("corte para mi hijo").serviceIds).toContain("svc_nino");
  });

  test("como lo dice la gente: «corte de cabello» es un corte, no un tinte; «cortarme el pelo», «motilarme»", () => {
    expect(parse("quiero un corte de cabello").serviceIds).toEqual(["svc_corte"]);
    expect(parse("un corte de pelo").serviceIds).toEqual(["svc_corte"]);
    expect(parse("quiero cortarme el pelo").serviceIds).toEqual(["svc_corte"]);
    expect(parse("me quiero motilar").serviceIds).toEqual(["svc_corte"]);
    expect(parse("pintarme el cabello").serviceIds).toEqual(["svc_tinte"]);
    expect(parse("tinte").serviceIds).toEqual(["svc_tinte"]);
  });

  test("con un error de escritura o de dictado (una letra de más, de menos o cambiada)", () => {
    expect(parse("quiero cita cortee clasico").serviceIds).toEqual(["svc_corte"]);
    expect(parse("un corrte").serviceIds).toEqual(["svc_corte"]);
    expect(parse("arreglo de barva").serviceIds).toEqual(["svc_barba"]);
    // Las palabras cortas no se adivinan: «fase» no es «fade».
    expect(parse("fase").serviceIds).toEqual([]);
  });

  test("el barbero por su nombre, o «cualquiera»", () => {
    expect(parse("con Andrés").barberId).toBe("team-04");
    expect(parse("con daniela el viernes").barberId).toBe("team-08");
    expect(parse("me da igual quién").barberId).toBeNull();
    expect(parse("un corte").barberId).toBeUndefined();
  });

  test("días: hoy, mañana, pasado mañana, un día de la semana y una fecha", () => {
    expect(parse("hoy").date).toBe("2026-10-08");
    expect(parse("corte mañana").date).toBe("2026-10-09");
    expect(parse("pasado mañana").date).toBe("2026-10-10");
    expect(parse("el lunes").date).toBe("2026-10-12");
    expect(parse("el jueves").date).toBe("2026-10-08");
    expect(parse("el 20 de octubre").date).toBe("2026-10-20");
    expect(parse("el 3").date).toBe("2026-11-03");
  });

  test("«en la mañana» es una franja, no mañana", () => {
    const parsed = parse("corte en la mañana");
    expect(parsed.date).toBeUndefined();
    expect(parsed.window).toBe("morning");
  });

  test("horas como se dicen: sin «pm» una hora de barbería de 1 a 7 es de la tarde", () => {
    expect(parse("a las 5").time).toBe("17:00");
    expect(parse("a las 10").time).toBe("10:00");
    expect(parse("a las 10 y media").time).toBe("10:30");
    expect(parse("17:15").time).toBe("17:15");
    expect(parse("5pm").time).toBe("17:00");
    expect(parse("a las 4 de la tarde").time).toBe("16:00");
    expect(parse("al mediodía").time).toBe("12:00");
  });

  test("una frase entera trae todo de una vez", () => {
    expect(parse("Corte y barba mañana a las 5 con Andrés")).toEqual({ serviceIds: ["svc_combo"], barberId: "team-04", date: "2026-10-09", time: "17:00" });
  });

  test("intenciones sueltas", () => {
    expect(parse("quiero ver mis citas").intent).toBe("manage");
    expect(parse("¿dónde quedan?").intent).toBe("info");
    expect(parse("sí, dale").intent).toBe("yes");
    expect(parse("empezar de nuevo").intent).toBe("restart");
    expect(parse("eso es todo, quiero pagar").intent).toBe("pay");
  });

  test("el celular y el código escritos en el chat", () => {
    expect(phoneFromText("320 217 2738")).toBe("+573202172738");
    expect(phoneFromText("+57 320 217 2738")).toBe("+573202172738");
    expect(phoneFromText("123")).toBeNull();
    expect(codeFromText("es 246 810")).toBe("246810");
    expect(codeFromText("hola")).toBeNull();
  });
});

describe("preguntas de la conversación", () => {
  const question = makeQuestion("barber", "¿Con quién?", [
    { label: "Con quien esté libre", value: "any" },
    { label: "Andrés Molina", value: "team-04", image: null },
    { label: "Andrés Molina", value: "team-99" },
    { label: "Camilo Rey", value: "team-05" },
  ]);

  test("cada opción es única y guarda lo que vale", () => {
    expect(question.options).toEqual(["Con quien esté libre", "Andrés Molina", "Andrés Molina (2)", "Camilo Rey"]);
    expect(question.values["Andrés Molina (2)"]).toBe("team-99");
    expect(question.details?.["Andrés Molina"]).toEqual({ image: null });
  });

  test("lo escrito responde por número, por texto o por un trozo que solo está en una", () => {
    expect(matchOption(question, "4")).toBe("Camilo Rey");
    expect(matchOption(question, "camilo rey")).toBe("Camilo Rey");
    expect(matchOption(question, "libre")).toBe("Con quien esté libre");
    expect(matchOption(question, "andrés")).toBeNull();
    expect(matchOption(question, "9")).toBeNull();
  });

  test("dicho con otras palabras, gana la opción que comparte más («mándame el recibo»)", () => {
    const after = makeQuestion("after", "¿Algo más?", [
      { label: "Agregar al calendario", value: "ics" },
      { label: "Enviarme el recibo por correo", value: "receipt" },
      { label: "Reservar otra cita", value: "again" },
      { label: "Mis citas", value: "manage" },
    ]);
    expect(matchOptionLoosely(after, "mándame el recibo")).toBe("Enviarme el recibo por correo");
    expect(matchOptionLoosely(after, "ponlo en mi calendario porfa")).toBe("Agregar al calendario");
    expect(matchOptionLoosely(after, "quiero reservar otra cita")).toBe("Reservar otra cita");
    expect(matchOptionLoosely(after, "cita")).toBeNull();
    expect(matchOptionLoosely(after, "hola")).toBeNull();
    const receipt = makeQuestion("receiptTo", "¿A dónde?", [{ label: "Sí, a marcela@correo.com", value: "email" }]);
    expect(matchOptionLoosely(receipt, "ana@correo.com")).toBeNull();
  });
});

describe("lo que se pide de pasada en la conversación", () => {
  const kind = (text: string) => detectAside(text)?.kind ?? null;

  test("volver y cambiar algo ya elegido, dicho de varias formas", () => {
    expect(kind("volver")).toBe("back");
    expect(kind("me equivoqué")).toBe("back");
    expect(kind("espera, quiero volver")).toBe("back");
    expect(kind("me devuelvo un paso")).toBe("back");
    expect(kind("quiero volver a reservar")).toBeNull();
    expect(kind("quiero cambiar de barbero")).toBe("changeBarber");
    expect(kind("mejor con otro barbero")).toBe("changeBarber");
    expect(kind("elegir otro barbero")).toBe("changeBarber");
    expect(kind("cambiar el servicio")).toBe("changeServices");
    expect(kind("agregar barba")).toBe("changeServices");
    expect(kind("mejor otra hora")).toBe("changeTime");
    expect(kind("cambiar el día")).toBe("changeTime");
    expect(kind("prefiero otra sede")).toBe("changeBranch");
  });

  test("preguntas en cualquier momento", () => {
    expect(kind("muéstrame el perfil del barbero que elegí")).toBe("myBarber");
    expect(kind("¿con quién quedé?")).toBe("myBarber");
    expect(kind("info de la sede")).toBe("myBranch");
    expect(kind("¿cuál es la dirección?")).toBe("address");
    expect(kind("¿cómo llego?")).toBe("address");
    expect(kind("¿a qué hora cierran?")).toBe("hours");
    expect(kind("¿cuánto llevo?")).toBe("summary");
    expect(kind("¿cuánto cuesta un fade?")).toBe("price");
    expect(kind("¿a qué hora es mi cita?")).toBe("when");
    expect(kind("gracias")).toBe("thanks");
    expect(kind("¿eres un bot?")).toBe("who");
  });

  test("una respuesta normal no se toma como pregunta de pasada", () => {
    expect(kind("corte mañana a las 5")).toBeNull();
    expect(kind("3202172738")).toBeNull();
    expect(kind("Juan Pérez")).toBeNull();
  });
});

describe("tarjeta nueva en la conversación", () => {
  test("el número y el CVC nunca se ven enteros en el hilo", () => {
    expect(maskCardInput("cardNumber", "4242 4242 4242 4242")).toBe("•••• 4242");
    expect(maskCardInput("cardCvc", "123")).toBe("•••");
    expect(maskCardInput("cardCvc", "1234")).toBe("••••");
    expect(maskCardInput("cardName", " Marcela Gómez ")).toBe("Marcela Gómez");
  });

  test("el vencimiento se entiende como se escriba", () => {
    expect(normalizeExpiry("0829")).toBe("08/29");
    expect(normalizeExpiry("08 29")).toBe("08/29");
    expect(normalizeExpiry("08/2029")).toBe("08/29");
    expect(normalizeExpiry("829")).toBe("08/29");
  });

  test("un vencimiento mal escrito dice qué está mal: el mes, solo el año, vencida o el formato", () => {
    expect(expiryProblem("0829", NOW)).toBeNull();
    expect(expiryProblem("3030", NOW)).toEqual({ key: "booking.chat.cardBadMonth", params: { month: "30" } });
    expect(expiryProblem("13/28", NOW)).toEqual({ key: "booking.chat.cardBadMonth", params: { month: "13" } });
    expect(expiryProblem("2030", NOW)).toEqual({ key: "booking.chat.cardOnlyYear", params: { year: "2030", short: "30" } });
    expect(expiryProblem("0825", NOW)).toEqual({ key: "booking.chat.cardExpired", params: { date: "08/25" } });
    expect(expiryProblem("12", NOW)).toEqual({ key: "booking.chat.cardBadExpiryFormat" });
    expect(expiryProblem("0899", NOW)).toEqual({ key: "booking.chat.cardTooFar", params: { date: "08/99" } });
  });
});

describe("cuentas de la agenda", () => {
  const slots: Slot[] = [
    { time: "09:00", barberIds: ["team-04", "team-05"] },
    { time: "12:30", barberIds: ["team-04"] },
    { time: "18:00", barberIds: ["team-05"] },
  ];

  test("abre con el servicio más pedido que no es combo", () => {
    expect(defaultServiceId(SERVICES)).toBe("svc_corte");
    expect(defaultServiceId([])).toBeNull();
  });

  test("solo quien hace todo lo elegido, con el de siempre primero", () => {
    expect(ableBarbers(BARBERS, ["svc_corte", "svc_barba"], null).map((item) => item.id)).toEqual(["team-04", "team-05"]);
    expect(ableBarbers(BARBERS, ["svc_corte"], "team-05").map((item) => item.id)).toEqual(["team-05", "team-08", "team-04"]);
  });

  test("por hora: cada cita sin preferencia ocupa a un barbero; sin nadie libre la hora sale", () => {
    const items = [{ key: "a", person: { kind: "self" as const }, serviceIds: ["svc_corte"], barberId: null, start: "2026-10-09T12:30" }];
    const groups = timesByWindow(slots, "2026-10-09", items, null);
    expect(groups.map((group) => group.window)).toEqual(["morning", "afternoon", "evening"]);
    expect(groups[1]?.options).toEqual([{ time: "12:30", barberIds: [], taken: true }]);
    expect(windowOf("11:59")).toBe("morning");
    expect(windowOf("18:00")).toBe("evening");
  });
});

describe("estado compartido por las tres versiones", () => {
  test("abrir un borrador no cambia de paso y conserva el carrito", () => {
    let state = bookingReducer(initialBookingState(), { type: "chooseBranch", branchId: "ma" });
    state = bookingReducer(state, { type: "chooseTime", start: "2026-10-09T10:00" });
    state = bookingReducer(state, { type: "openDraft", person: { kind: "self" }, serviceIds: ["svc_corte"], barberId: null });
    expect(state.items).toHaveLength(1);
    expect(state.draft).toMatchObject({ serviceIds: ["svc_corte"], barberId: null, start: null });
    expect(state.step).toBe("review");
  });

  test("las fotos para el barbero llegan hasta tres y cada una se puede quitar", () => {
    let state = initialBookingState();
    for (const photo of ["a", "b", "c", "d"]) state = bookingReducer(state, { type: "addReferencePhoto", photo });
    expect(state.referencePhotos).toEqual(["a", "b", "c"]);
    state = bookingReducer(state, { type: "removeReferencePhoto", index: 1 });
    expect(state.referencePhotos).toEqual(["a", "c"]);
  });

  test("«No soy yo» olvida al cliente pero no las citas apartadas", () => {
    let state = bookingReducer(initialBookingState(), { type: "customerIsNew", token: "bk" });
    state = bookingReducer(state, { type: "chooseBranch", branchId: "ma" });
    state = bookingReducer(state, { type: "chooseTime", start: "2026-10-09T10:00" });
    state = bookingReducer(state, { type: "signOut" });
    expect(state.token).toBeNull();
    expect(state.customer).toBeNull();
    expect(state.items).toHaveLength(1);
  });
});

describe("las otras dos experiencias", () => {
  // jsdom no mide trazos SVG; el borde que recorre la caja del chat (MovingBorderBeam) los necesita.
  beforeAll(() => {
    Object.assign(SVGElement.prototype, {
      getTotalLength: () => 100,
      getPointAtLength: () => ({ x: 0, y: 0 }),
    });
  });
  beforeEach(() => {
    // Un jueves a las 8:00: con el día entero por delante, haya la hora que haya al correr la prueba.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    resetBookingLimits();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
      }
    );
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test("agenda con selector: sin cuenta, sede y servicio abren sin nada elegido, el barbero en «Sin preferencia», y la sede va primero", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow version="agenda-select" />);
    expect(await screen.findByTestId("agenda-branch-field")).toHaveTextContent("Elige la sede");
    expect(screen.getByTestId("agenda-service-field")).toHaveTextContent("Elige uno o varios servicios");
    expect(screen.getByTestId("agenda-barber-field")).toHaveTextContent("Sin preferencia");
    expect(screen.queryAllByRole("button", { name: /^Apartar a las / })).toHaveLength(0);
    // Sin sede no se puede elegir barbero ni servicios: los dos esperan apagados.
    expect(screen.getByTestId("agenda-service-field")).toBeDisabled();
    expect(screen.getByTestId("agenda-barber-field")).toBeDisabled();
    // La sede se elige primero, sin ninguna marcada.
    await user.click(screen.getByTestId("agenda-branch-field"));
    const dialog = await screen.findByRole("dialog", { name: "¿Dónde quieres que te atendamos?" });
    expect(within(dialog).getAllByRole("radio").every((radio) => radio.getAttribute("aria-checked") === "false")).toBe(true);
    await user.click(within(dialog).getAllByRole("radio")[0]);
    // Con sede, barbero y servicios se encienden; el día sigue apagado hasta elegir un servicio.
    await waitFor(() => expect(screen.getByTestId("agenda-service-field")).toBeEnabled());
  });

  test("agenda en lista: un paso a la vez (sede, servicios, barbero) y luego las horas", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow version="agenda-list" />);
    await screen.findByText("Arma tu cita");
    // Un paso a la vez: sin sede no hay servicios; sin servicio, no hay barbero.
    expect(screen.queryByTestId("agenda-service-field")).toBeNull();
    await chooseAgendaBranch(user);
    expect(screen.queryByTestId("agenda-barber-field")).toBeNull();
    await user.click(await screen.findByTestId("agenda-service-field"));
    const services = await screen.findByRole("dialog", { name: "¿Qué te vas a hacer?" });
    await user.click(await within(services).findByRole("checkbox", { name: /^Corte clásico/ }));
    await user.click(within(services).getByRole("button", { name: "Ver horas" }));
    // El barbero aparece ya en «Sin preferencia» y las horas con él.
    expect(await screen.findByTestId("agenda-barber-field")).toHaveTextContent("Sin preferencia");
    await waitFor(() => expect(screen.queryAllByRole("button", { name: /^Apartar a las / }).length + screen.queryAllByRole("button", { name: /^Ir al / }).length).toBeGreaterThan(0));
  });

  test("agenda con selector: los servicios se eligen en un modal y se aplican con «Ver horas»", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow version="agenda-select" />);
    await chooseAgendaBranch(user);
    const field = await screen.findByTestId("agenda-service-field");
    await user.click(field);
    const dialog = await screen.findByRole("dialog", { name: "¿Qué te vas a hacer?" });
    // Sin cuenta no viene ninguno marcado.
    expect(within(dialog).getAllByRole("checkbox").every((box) => box.getAttribute("aria-checked") === "false")).toBe(true);
    await user.click(within(dialog).getByRole("checkbox", { name: /^Arreglo de barba/ }));
    expect(within(dialog).getByRole("checkbox", { name: /^Arreglo de barba/ })).toHaveAttribute("aria-checked", "true");
    // Hasta aplicar, el tablero sigue con lo de antes.
    expect(field).not.toHaveTextContent("Arreglo de barba");
    await user.click(within(dialog).getByRole("button", { name: "Ver horas" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(field).toHaveTextContent("Arreglo de barba");
  });

  test("agenda con selector: sin cuenta no pregunta para quién, una sola hora (la nueva reemplaza) y el cierre no repite la cita", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow version="agenda-select" />);
    expect(await screen.findByText("Arma tu cita")).toBeInTheDocument();
    expect(screen.queryByText("¿Para quién es la cita?")).toBeNull();
    await chooseAgendaService(user, /^Corte clásico/);
    // De noche hoy ya no quedan horas: se salta al siguiente día con horas.
    await waitFor(() => expect(screen.queryAllByRole("button", { name: /^Apartar a las / }).length + screen.queryAllByRole("button", { name: /^Ir al / }).length).toBeGreaterThan(0));
    const jump = screen.queryByRole("button", { name: /^Ir al / });
    if (jump) await user.click(jump);
    const picks = await screen.findAllByRole("button", { name: /^Apartar a las / });
    await user.click(picks[0]);
    await user.click(screen.getAllByRole("button", { name: /^Apartar a las / })[1]);
    // La segunda reemplaza a la primera y queda marcada, a la vista.
    await waitFor(() => expect(screen.getAllByRole("button", { name: /^Apartar a las /, pressed: true })).toHaveLength(1));
    expect(screen.getAllByRole("button", { name: /^Apartar a las / })[1]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("1 cita")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText("Tu cita")).toBeInTheDocument();
    expect(screen.queryByText("Tus citas")).toBeNull();
    expect(screen.queryByRole("button", { name: "Volver a la agenda" })).toBeNull();
  });

  test("agenda con selector: «Confirma tu cita» es solo la cita (sin pago) y permite sumar otra", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow version="agenda-select" />);
    await screen.findByText("Arma tu cita");
    await chooseAgendaService(user, /^Corte clásico/);
    await waitFor(() => expect(screen.queryAllByRole("button", { name: /^Apartar a las / }).length + screen.queryAllByRole("button", { name: /^Ir al / }).length).toBeGreaterThan(0));
    const jump = screen.queryByRole("button", { name: /^Ir al / });
    if (jump) await user.click(jump);
    await user.click((await screen.findAllByRole("button", { name: /^Apartar a las / }))[0]);
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByRole("heading", { name: "Confirma tu cita" })).toBeInTheDocument();
    // El pago es la pantalla siguiente: aquí no hay propina ni formas de pago.
    expect(screen.queryByText("Propina para tu barbero")).toBeNull();
    // Sumar otra: vuelve a la agenda con las de ahora guardadas y empieza de cero (servicio y hora otra vez).
    await user.click(screen.getByRole("button", { name: /Agregar otra cita/ }));
    expect(await screen.findByText(/Ya tienes 1 cita lista/)).toBeInTheDocument();
    expect(screen.getByText("Elige uno o varios servicios")).toBeInTheDocument();
    await chooseAgendaService(user, /^Corte clásico/);
    await user.click((await screen.findAllByRole("button", { name: /^Apartar a las / }))[1]);
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText("Tus citas")).toBeInTheDocument();
  });

  test("conversación: se conoce a un barbero o una sede antes de elegir y la conversación retoma", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow version="chat" />);
    // La portada primero: «Ir a la conversación» entra sin decir nada.
    await user.click(await screen.findByRole("button", { name: /Ir a la conversación/ }));
    const input = await screen.findByTestId("chat-input");
    await user.type(input, "3202172738{Enter}");
    await screen.findByText(/Te acabo de mandar un/);
    await user.type(screen.getByTestId("chat-input"), `${DEMO_CODE}{Enter}`);
    await screen.findByText(/Hola, Marcela/);
    await user.type(screen.getByTestId("chat-input"), "quiero un corte{Enter}");
    const barbers = await screen.findByRole("group", { name: "¿Con quién quieres ir?" });
    // La opción de abajo: escribir de quién se quiere ver el perfil.
    await user.type(within(barbers).getByPlaceholderText("Escribe de quién"), "andrés{Enter}");
    expect(await screen.findByText(/Lo que cobra:/)).toBeInTheDocument();
    const confirm = await screen.findByRole("group", { name: "¿Te agendo con Andrés?" });
    // Una sede, escrita en la caja: su detalle y la pregunta pendiente otra vez.
    await user.type(screen.getByTestId("chat-input"), "cómo es la sede massachusetts{Enter}");
    expect(await screen.findByText("Horario de la semana")).toBeInTheDocument();
    // Quién atiende en la sede, con su nivel y su nota.
    expect(screen.getByText(/^Quién atiende \(\d+\)$/)).toBeInTheDocument();
    expect(await screen.findByText("¿Seguimos donde íbamos?")).toBeInTheDocument();
    // La pregunta que quedó pendiente vuelve, y se responde como cualquier otra.
    expect(confirm).not.toBeInTheDocument();
    const again = await screen.findByRole("group", { name: "¿Te agendo con Andrés?" });
    await user.click(within(again).getByRole("button", { name: /Sí, con Andrés/ }));
    expect(await screen.findByRole("group", { name: "¿Qué día te queda bien?" })).toBeInTheDocument();
  });

  test("agenda con selector: la sede también se elige en la lista y sin citas cambia al tocarla", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow version="agenda-select" />);
    const field = await screen.findByTestId("agenda-branch-field");
    const before = field.textContent ?? "";
    await user.click(field);
    const dialog = await screen.findByRole("dialog", { name: "¿Dónde quieres que te atendamos?" });
    const other = within(dialog).getAllByRole("radio").find((radio) => radio.getAttribute("aria-checked") === "false");
    expect(other).toBeDefined();
    const name = (other?.getAttribute("aria-label") ?? "").split(",")[0];
    await user.click(other as HTMLElement);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(field).toHaveTextContent(name);
    expect(field.textContent).not.toBe(before);
  });

  test("conversación: si el barbero no tiene horas, recomienda otros que hacen lo mismo y las demás opciones", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow version="chat" />);
    // La portada primero: «Ir a la conversación» entra sin decir nada.
    await user.click(await screen.findByRole("button", { name: /Ir a la conversación/ }));
    await user.type(await screen.findByTestId("chat-input"), "3202172738{Enter}");
    await screen.findByText(/Te acabo de mandar un/);
    await user.type(screen.getByTestId("chat-input"), `${DEMO_CODE}{Enter}`);
    await screen.findByText(/Hola, Marcela/);
    // Valeria está de vacaciones hasta el viernes en la demo.
    await user.type(screen.getByTestId("chat-input"), "corte con valeria el viernes{Enter}");
    expect(await screen.findByText(/Te recomiendo estos barberos/)).toBeInTheDocument();
    const options = await screen.findByRole("group", { name: "¿Qué hacemos?" });
    expect(within(options).getByRole("button", { name: /Con quien esté libre/ })).toBeInTheDocument();
    expect(within(options).getByRole("button", { name: /Ver otro día con Valeria/ })).toBeInTheDocument();
    expect(within(options).getByRole("button", { name: /Avísame si se libera/ })).toBeInTheDocument();
    // Un recomendado: se sigue con sus horas.
    const recommended = within(options).getAllByRole("button").find((button) => /★/.test(button.textContent ?? ""));
    expect(recommended).toBeDefined();
    await user.click(recommended as HTMLElement);
    expect(await screen.findByRole("group", { name: /^¿A qué hora el / })).toBeInTheDocument();
  });

  test("agenda con selector: el barbero se elige en su tarjeta, su perfil se abre dentro y las horas quedan con él", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow version="agenda-select" />);
    // Con un servicio elegido se sabe quién puede; el barbero viene en «Sin preferencia».
    await chooseAgendaService(user, /^Corte clásico/);
    const field = await screen.findByTestId("agenda-barber-field");
    expect(field).toHaveTextContent("Sin preferencia");
    await user.click(field);
    const dialog = await screen.findByRole("dialog", { name: "¿Con quién te quieres atender?" });
    expect(within(dialog).getByRole("radio", { name: "Sin preferencia" })).toHaveAttribute("aria-checked", "true");
    const profile = within(dialog).getAllByRole("button", { name: /^Ver perfil: / })[0];
    const name = (profile.getAttribute("aria-label") ?? "").replace("Ver perfil: ", "");
    const first = name.split(" ")[0];
    // El perfil se abre en la misma ventana y se vuelve a la lista.
    await user.click(profile);
    expect(await within(dialog).findByRole("heading", { name: `Sobre ${first}` })).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Volver" }));
    expect(await within(dialog).findByRole("radio", { name: "Sin preferencia" })).toBeInTheDocument();
    await user.click(within(dialog).getAllByRole("button", { name: /^Ver perfil: / })[0]);
    await user.click(await within(dialog).findByRole("button", { name: `Elegir a ${first}` }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(field).toHaveTextContent(name);
    // Las horas son solo las suyas (de noche hoy ya no quedan: se salta al siguiente día con horas).
    await waitFor(() => expect(screen.queryAllByRole("button", { name: /^Apartar a las / }).length + screen.queryAllByRole("button", { name: /^Ir al / }).length).toBeGreaterThan(0));
    const jump = screen.queryByRole("button", { name: /^Ir al / });
    if (jump) await user.click(jump);
    const picks = await screen.findAllByRole("button", { name: /^Apartar a las / });
    picks.forEach((pick) => expect(pick).toHaveAccessibleName(new RegExp(`con ${first}$`)));
  });

  test("conversación: se vuelve atrás, se cambia el barbero y se pregunta de pasada sin perder el hilo", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow version="chat" />);
    // La portada primero: «Ir a la conversación» entra sin decir nada.
    await user.click(await screen.findByRole("button", { name: /Ir a la conversación/ }));
    const write = async (text: string) => user.type(screen.getByTestId("chat-input"), `${text}{Enter}`);
    await screen.findByTestId("chat-input");
    await write("3202172738");
    await screen.findByText(/Te acabo de mandar un/);
    await write(DEMO_CODE);
    await screen.findByText(/Hola, Marcela/);
    await write("quiero un corte");
    await screen.findByRole("group", { name: "¿Con quién quieres ir?" });
    // «Volver»: la pregunta anterior otra vez (los servicios).
    await write("volver");
    expect(await screen.findByRole("group", { name: "¿Qué te vas a hacer?" })).toBeInTheDocument();
    await write("corte con andrés");
    await screen.findByRole("group", { name: "¿Qué día te queda bien?" });
    // Una pregunta de pasada: responde y retoma la pregunta abierta.
    await write("¿cuál es la dirección?");
    expect(await screen.findByText(/Cómo llegar/)).toBeInTheDocument();
    expect(await screen.findByRole("group", { name: "¿Qué día te queda bien?" })).toBeInTheDocument();
    // El perfil del barbero que eligió, sin decir su nombre.
    await write("muéstrame el perfil del barbero que elegí");
    expect(await screen.findByText(/Lo que cobra:/)).toBeInTheDocument();
    // Cambiar de barbero en cualquier momento.
    await write("mejor con otro barbero");
    expect(await screen.findByText(/cambiemos de/)).toBeInTheDocument();
    expect(await screen.findByRole("group", { name: "¿Con quién quieres ir?" })).toBeInTheDocument();
  });

  test("conversación: productos con su cantidad, el recibo a varios destinos (otro número también) y no dejarla fija", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow version="chat" />);
    // La portada primero: «Ir a la conversación» entra sin decir nada.
    await user.click(await screen.findByRole("button", { name: /Ir a la conversación/ }));
    const write = async (text: string) => user.type(screen.getByTestId("chat-input"), `${text}{Enter}`);
    await screen.findByTestId("chat-input");
    await write("3202172738");
    await screen.findByText(/Te acabo de mandar un/);
    await write(DEMO_CODE);
    await screen.findByText(/Hola, Marcela/);
    await write("corte mañana a las 11 con quien sea");
    await screen.findByRole("group", { name: "¿Algo más?" });
    // Productos: cada uno con su − cantidad +.
    await write("productos");
    const products = await screen.findByRole("group", { name: "¿Qué te llevas de la tienda?" });
    const [first] = within(products).getAllByRole("button", { pressed: undefined }).filter((button) => /US\$/.test(button.textContent ?? ""));
    await user.click(first);
    await user.click(within(products).getByRole("button", { name: "Sumar" }));
    await user.click(within(products).getByRole("button", { name: /Agregar · 2/ }));
    expect(await screen.findByText(/× 2 a tu pedido/)).toBeInTheDocument();
    // Pagar en la barbería y reservar.
    await write("confirmar y pagar");
    await screen.findByRole("group", { name: "¿Le dejas propina a tu barbero?" });
    await write("sin propina");
    await screen.findByRole("group", { name: "¿Tienes un cupón o una tarjeta de regalo?" });
    await write("no");
    await screen.findByRole("group", { name: "¿Cómo quieres pagar?" });
    await write("en la barbería");
    await screen.findByRole("group", { name: "¿Confirmo tu reserva?" });
    await write("1");
    await screen.findByText(/está confirmada/);
    // El recibo: varios destinos a la vez; «A otro número» se pide en la caja.
    await write("enviar recibo");
    const receipt = await screen.findByRole("group", { name: "¿A dónde te mando el recibo?" });
    await user.click(within(receipt).getByRole("button", { name: /SMS a mi celular/ }));
    await user.click(within(receipt).getByRole("button", { name: /A otro número/ }));
    await user.click(within(receipt).getByRole("button", { name: /Enviar recibo · 2/ }));
    await screen.findByText(/A qué/);
    await write("300 12");
    expect(await screen.findByText(/no se ve completo/)).toBeInTheDocument();
    await write("3001234567");
    expect(await screen.findByText(/te mandé el recibo: SMS al •••• 2738, SMS al •••• 4567/)).toBeInTheDocument();
    // Dejarla fija tiene su «no».
    await write("dejarla fija");
    const repeat = await screen.findByRole("group", { name: "¿Cada cuánto?" });
    await user.click(within(repeat).getByRole("button", { name: /No, solo esta cita/ }));
    expect(await screen.findByText("Listo, queda solo esta cita.")).toBeInTheDocument();
  }, LONG_CONVERSATION_MS);

  test("conversación: pedir una hora confirma si está libre o propone lo más cercano y a otro barbero a esa hora", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow version="chat" />);
    await user.click(await screen.findByRole("button", { name: /Ir a la conversación/ }));
    await user.type(await screen.findByTestId("chat-input"), "3202172738{Enter}");
    await screen.findByText(/Te acabo de mandar un/);
    await user.type(screen.getByTestId("chat-input"), `${DEMO_CODE}{Enter}`);
    await screen.findByText(/Hola, Marcela/);
    // Una hora en la mañana y otra en la tarde: una de las dos está libre y la otra no, o ambas; nunca el «no hay hueco» seco.
    for (const phrase of ["corte con Andrés mañana a las 10 de la mañana", "corte con Andrés mañana a las 3"]) {
      await user.type(screen.getByTestId("chat-input"), `${phrase}{Enter}`);
      await waitFor(() => expect(screen.queryAllByText(/¡Sí está libre!|ya está ocupado/).length).toBeGreaterThan(0));
    }
    expect(screen.queryByText(/A esa hora no hay hueco/)).toBeNull();
    const near = screen.queryAllByRole("group", { name: "¿Cuál te queda mejor?" }).at(-1);
    if (near) expect(within(near).getByRole("button", { name: /Ver todas las horas/ })).toBeInTheDocument();
  }, LONG_CONVERSATION_MS);

  test("conversación desde la Agenda con selector: se arma la cita primero y el celular se pide al pagar", async () => {
    const user = userEvent.setup();
    // Llegó con «Agenda con Clipper» desde la Agenda con selector: la voz se abre; aquí se sigue escribiendo.
    requestVoiceOnArrival("agenda-select");
    renderWithProviders(<BookingFlow version="chat" />);
    await user.click(await screen.findByRole("button", { name: "Volver al chat" }));
    await user.type(await screen.findByPlaceholderText(/Corte mañana en la tarde con Andrés/), "corte con Andrés{Enter}");
    // No pide el celular al empezar: va directo a la cita (sede, si hay varias, y los días de Andrés).
    await screen.findByRole("group", { name: /^(¿A cuál sede vas a ir\?|¿Qué día te queda bien\?)$/ });
    expect(screen.queryByText(/número de celular/)).toBeNull();
    const branches = screen.queryByRole("group", { name: "¿A cuál sede vas a ir?" });
    if (branches) await user.click(within(branches).getAllByRole("button")[1]);
    const days = await screen.findByRole("group", { name: "¿Qué día te queda bien?" });
    await user.click(within(days).getAllByRole("button", { name: /^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)/ })[1]);
    const times = await screen.findByRole("group", { name: /^¿A qué hora el / });
    await user.click(within(times).getAllByRole("button", { name: /\d:\d\d/ })[0]);
    // Al pagar, recién ahí: quién eres.
    const more = await screen.findByRole("group", { name: /Algo más/ });
    await user.click(within(more).getByRole("button", { name: /pagar/i }));
    expect(await screen.findByText(/para reservarla necesito saber quién eres/)).toBeInTheDocument();
    await user.type(screen.getByTestId("chat-input"), "3202172738{Enter}");
    await screen.findByText(/Te acabo de mandar un/);
    await user.type(screen.getByTestId("chat-input"), `${DEMO_CODE}{Enter}`);
    // Ya con quien reserva, sigue al pago con lo armado (sin volver a empezar).
    expect(await screen.findByRole("group", { name: /propina/i })).toBeInTheDocument();
  }, LONG_CONVERSATION_MS);

  test("conversación: lo pedido en la portada sigue en pie después de elegir la sede", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow version="chat" />);
    // Desde la portada, un cliente nuevo pide barbero; la sede se pregunta después de crear su ficha.
    await user.type(await screen.findByPlaceholderText(/Corte mañana en la tarde con Andrés/), "corte con Andrés{Enter}");
    await user.type(await screen.findByTestId("chat-input"), "3001234567{Enter}");
    await screen.findByText(/Te acabo de mandar un/);
    await user.type(screen.getByTestId("chat-input"), `${DEMO_CODE}{Enter}`);
    await screen.findByText(/Cómo te llamas/);
    await user.type(screen.getByTestId("chat-input"), "Carlos{Enter}");
    await screen.findByText(/Gracias, Carlos/);
    await user.type(screen.getByTestId("chat-input"), "Pérez{Enter}");
    await screen.findByText(/Perfecto, Carlos/);
    await user.type(screen.getByTestId("chat-input"), "carlos@correo.com{Enter}");
    const promos = await screen.findByRole("group", { name: /promociones/ });
    await user.click(within(promos).getByRole("button", { name: /^Sí/ }));
    // Con varias sedes se pregunta cuál; con una, se elige sola.
    await screen.findByRole("group", { name: /^(¿A cuál sede vas a ir\?|¿Qué día te queda bien\?)$/ });
    const branches = screen.queryByRole("group", { name: "¿A cuál sede vas a ir?" });
    // El primer botón es el título (pliega la lista); la primera sede va después.
    if (branches) await user.click(within(branches).getAllByRole("button")[1]);
    // Lo pedido (corte con Andrés) se retoma: no vuelve a preguntar el servicio.
    expect(await screen.findByRole("group", { name: "¿Qué día te queda bien?" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "¿Qué te vas a hacer?" })).toBeNull();
  }, LONG_CONVERSATION_MS);

  test("conversación: el celular y el código se escriben, y cada elección llega como pregunta en lista", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow version="chat" />);
    // La portada primero: «Ir a la conversación» entra sin decir nada.
    await user.click(await screen.findByRole("button", { name: /Ir a la conversación/ }));
    expect(await screen.findByText(/Te ayudo a reservar tu cita/)).toBeInTheDocument();
    // Sin formularios dentro del chat: el celular va en la caja, solo números.
    expect(screen.queryByRole("textbox", { name: /celular/i })).toBeNull();
    await user.type(await screen.findByTestId("chat-input"), "320-217{Enter}");
    expect(await screen.findByText(/ese número no se ve bien/)).toBeInTheDocument();
    await user.type(screen.getByTestId("chat-input"), "3202172738{Enter}");
    expect(await screen.findByText(/Te acabo de mandar un/)).toBeInTheDocument();
    // El código no se repite en el hilo.
    await user.type(screen.getByTestId("chat-input"), `${DEMO_CODE}{Enter}`);
    expect(screen.queryByText(DEMO_CODE)).toBeNull();
    expect(await screen.findByText(/Hola, Marcela/)).toBeInTheDocument();
    // Lo que escribe se entiende: servicios y barbero de una vez; pregunta lo que falta (el día) en lista.
    await user.type(screen.getByTestId("chat-input"), "corte con Andrés{Enter}");
    const days = await screen.findByRole("group", { name: "¿Qué día te queda bien?" });
    expect(within(days).getByText("Te muestro los días de Andrés.")).toBeInTheDocument();
    // Se responde tocando una opción: queda como mensaje y llegan las horas de ese día.
    await user.click(within(days).getAllByRole("button", { name: /^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)/ })[1]);
    expect(await screen.findByRole("group", { name: /^¿A qué hora el / })).toBeInTheDocument();
  });
});
