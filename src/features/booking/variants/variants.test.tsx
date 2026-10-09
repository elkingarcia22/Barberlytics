import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor, within } from "@/test/render";
import { resetBookingLimits } from "@/mocks/booking/handlers";
import { DEMO_OTP as DEMO_CODE } from "@/mocks/booking/state";
import { BookingFlow } from "../BookingFlow";
import { bookingReducer, initialBookingState } from "../bookingState";
import type { BookingBarber, BookingService, Slot } from "../types";
import { ableBarbers, barberTimes, defaultServiceId, timesByWindow, windowOf } from "./agenda/agendaModel";
import { codeFromText, parseBookingText, phoneFromText } from "./chat/parseBookingText";

/** Un jueves a las 8:00. */
const NOW = new Date(2026, 9, 8, 8, 0);

const service = (id: string, name: string, extra: Partial<BookingService> = {}): BookingService => ({ id, name, description: "", category: "", durationMin: 30, price: 30, imageUrl: null, isCombo: false, popular: false, ...extra });
const SERVICES: BookingService[] = [
  service("svc_corte", "Corte clásico", { popular: true }),
  service("svc_fade", "Fade"),
  service("svc_nino", "Corte niño"),
  service("svc_barba", "Arreglo de barba", { popular: true }),
  service("svc_afeitado", "Afeitado clásico"),
  service("svc_combo", "Corte + barba", { isCombo: true, popular: true }),
  service("svc_cejas", "Diseño de cejas"),
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
const parse = (text: string) => parseBookingText(text, { services: SERVICES, barbers: BARBERS, now: NOW });

describe("lo que entiende la conversación", () => {
  test("servicios por su nombre de a pie, con el combo cuando se piden juntos", () => {
    expect(parse("quiero un corte").serviceIds).toEqual(["svc_corte"]);
    expect(parse("corte y barba").serviceIds).toEqual(["svc_combo"]);
    expect(parse("me arreglo la barba").serviceIds).toEqual(["svc_barba"]);
    expect(parse("un degradado y las cejas").serviceIds.sort()).toEqual(["svc_cejas", "svc_fade"]);
    expect(parse("corte para mi hijo").serviceIds).toContain("svc_nino");
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

describe("cuentas de la agenda abierta", () => {
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

  test("las horas de cada barbero marcan lo que ya apartó con él", () => {
    const items = [{ key: "a", person: { kind: "self" as const }, serviceIds: ["svc_corte"], barberId: "team-04", start: "2026-10-09T09:00" }];
    expect(barberTimes(slots, "team-04", "2026-10-09", items, null)).toEqual([
      { time: "09:00", taken: true },
      { time: "12:30", taken: false },
    ]);
    // Si se está cambiando esa misma cita, su hora vuelve a estar libre.
    expect(barberTimes(slots, "team-04", "2026-10-09", items, 0)[0]).toEqual({ time: "09:00", taken: false });
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
  afterEach(() => vi.unstubAllGlobals());

  test("agenda abierta: se ven horas sin dar el celular, se aparta una y el celular se pide al confirmar", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow version="agenda" />);
    expect(await screen.findByText("¿Cuándo puedes venir?")).toBeInTheDocument();
    // Sin preguntar nada: ya hay horas libres con su barbero. De noche hoy ya no quedan: se salta al siguiente día con horas.
    const pickName = /^Apartar a las .+ con /;
    await waitFor(() => expect(screen.queryAllByRole("button", { name: pickName }).length + screen.queryAllByRole("button", { name: /^Ir al / }).length).toBeGreaterThan(0));
    const jump = screen.queryByRole("button", { name: /^Ir al / });
    if (jump) await user.click(jump);
    const pick = (await screen.findAllByRole("button", { name: pickName }))[0];
    expect(screen.queryByRole("textbox", { name: /celular/i })).toBeNull();
    await user.click(pick);
    await user.click(await screen.findByRole("button", { name: "Continuar" }));
    expect(await screen.findByText("Confirma y paga")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /celular/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirma tu celular para pagar" })).toBeDisabled();
  });

  test("agenda con selector: los servicios se eligen en un modal y se aplican con «Ver horas»", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow version="agenda-select" />);
    const field = await screen.findByTestId("agenda-service-field");
    await waitFor(() => expect(field).toHaveTextContent(/min · desde/));
    await user.click(field);
    const dialog = await screen.findByRole("dialog", { name: "¿Qué te vas a hacer?" });
    await user.click(within(dialog).getByRole("checkbox", { name: /^Arreglo de barba/ }));
    expect(within(dialog).getByRole("checkbox", { name: /^Arreglo de barba/ })).toHaveAttribute("aria-checked", "true");
    // Hasta aplicar, el tablero sigue con lo de antes.
    expect(field).not.toHaveTextContent("Arreglo de barba");
    await user.click(within(dialog).getByRole("button", { name: "Ver horas" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(field).toHaveTextContent("Arreglo de barba");
  });

  test("conversación: saluda, pide el celular y con el código reconoce a quien vuelve", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow version="chat" />);
    expect(await screen.findByText(/Te consigo turno en un minuto/)).toBeInTheDocument();
    const composer = await screen.findByTestId("chat-input");
    await user.type(composer, "320 217 2738{Enter}");
    expect(await screen.findByText(/Te envié un código de 6 números/)).toBeInTheDocument();
    // El código también se puede escribir en el chat, como se respondería en WhatsApp.
    await user.type(screen.getByTestId("chat-input"), `${DEMO_CODE}{Enter}`);
    expect(await screen.findByText(/Hola de nuevo, Marcela/)).toBeInTheDocument();
    // Lo que escribe se entiende: servicios y barbero de una vez, y pregunta lo que falta (la hora).
    await user.type(screen.getByTestId("chat-input"), "corte con Andrés{Enter}");
    expect(await screen.findByText(/Estas son las horas libres de Andrés/)).toBeInTheDocument();
    const log = screen.getByRole("log");
    expect(within(log).getByText("corte con Andrés")).toBeInTheDocument();
  });
});
