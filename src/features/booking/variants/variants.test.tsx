import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor, within } from "@/test/render";
import { resetBookingLimits } from "@/mocks/booking/handlers";
import { DEMO_OTP as DEMO_CODE } from "@/mocks/booking/state";
import { BookingFlow } from "../BookingFlow";
import { bookingReducer, initialBookingState } from "../bookingState";
import type { BookingBarber, BookingService, Slot } from "../types";
import { ableBarbers, barberTimes, defaultServiceId, timesByWindow, windowOf } from "./agenda/agendaModel";
import { codeFromText, parseBookingText, phoneFromText } from "./chat/parseBookingText";
import { makeQuestion, matchOption } from "./chat/chatQuestions";
import { maskCardInput, normalizeExpiry } from "./chat/chatCard";

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

  test("conversación: se conoce a un barbero o una sede antes de elegir y la conversación retoma", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow version="chat" />);
    const input = await screen.findByTestId("chat-input");
    await user.type(input, "3202172738{Enter}");
    await screen.findByText(/Te acabo de mandar un/);
    await user.type(screen.getByTestId("chat-input"), `${DEMO_CODE}{Enter}`);
    await screen.findByText(/Hola de nuevo, Marcela/);
    await user.type(screen.getByTestId("chat-input"), "quiero un corte{Enter}");
    const barbers = await screen.findByRole("group", { name: "¿Con quién quieres ir?" });
    // La opción de abajo: escribir de quién se quiere ver el perfil.
    await user.type(within(barbers).getByPlaceholderText("Escribe de quién"), "andrés{Enter}");
    expect(await screen.findByText("Lo que dicen sus clientes")).toBeInTheDocument();
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
    await user.type(await screen.findByTestId("chat-input"), "3202172738{Enter}");
    await screen.findByText(/Te acabo de mandar un/);
    await user.type(screen.getByTestId("chat-input"), `${DEMO_CODE}{Enter}`);
    await screen.findByText(/Hola de nuevo, Marcela/);
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
    // Con el catálogo ya cargado (el servicio más pedido puesto) se sabe quién puede.
    await waitFor(() => expect(screen.getByTestId("agenda-service-field")).toHaveTextContent(/min · desde/));
    const field = await screen.findByTestId("agenda-barber-field");
    expect(field).toHaveTextContent("Sin preferencia");
    await user.click(field);
    const dialog = await screen.findByRole("dialog", { name: "¿Con quién te quieres atender?" });
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

  test("conversación: el celular y el código se escriben, y cada elección llega como pregunta en lista", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow version="chat" />);
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
    expect(await screen.findByText(/Hola de nuevo, Marcela/)).toBeInTheDocument();
    // Lo que escribe se entiende: servicios y barbero de una vez; pregunta lo que falta (el día) en lista.
    await user.type(screen.getByTestId("chat-input"), "corte con Andrés{Enter}");
    const days = await screen.findByRole("group", { name: "¿Qué día te queda bien?" });
    expect(within(days).getByText("Te muestro los días de Andrés.")).toBeInTheDocument();
    // Se responde tocando una opción: queda como mensaje y llegan las horas de ese día.
    await user.click(within(days).getAllByRole("button", { name: /^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)/ })[1]);
    expect(await screen.findByRole("group", { name: /^¿A qué hora el / })).toBeInTheDocument();
  });
});
