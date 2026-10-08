import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test/render";
import { isApiError } from "@/lib/api";
import { db } from "@/mocks/db";
import { bookingApi } from "./api";
import { BookingFlow } from "./BookingFlow";
import { buildIcs, firstBookableDay, isTodayOver, openStateOf, toStart } from "./bookingFormat";
import { bookingReducer, defaultBranchId, initialBookingState, type BookingState } from "./bookingState";
import { cancellationTerms, computeTotals, findPromo, promoDiscount, renderPolicy, tipAmount, PROMOS } from "./pricing";
import type { BookingCustomer, BookedAppointment } from "./types";

/** Un jueves a las 8:00: antes de que abra la barbería, con toda la semana por delante. */
const NOW = new Date(2026, 9, 8, 8, 0);
const KNOWN_PHONE = "+573202172738";

const customer = (draft: Partial<BookingCustomer> = {}): BookingCustomer => ({
  id: "cli_001",
  firstName: "Marcela",
  name: "Marcela Gómez",
  phone: KNOWN_PHONE,
  email: "marcela@example.com",
  isNew: false,
  onlineOnly: false,
  guests: [],
  lastVisit: { branchId: "ma", serviceIds: ["svc_corte"], barberId: "team-04", at: "2026-09-20T10:00:00" },
  credit: 0,
  upcoming: 0,
  ...draft,
});

describe("cuentas de la reserva", () => {
  test("el impuesto va sobre lo comprado con el descuento y la propina va aparte", () => {
    const totals = computeTotals({ services: 90, products: 10, discount: 15, taxPercent: 6.25, tip: 18 });
    expect(totals).toEqual({ services: 90, products: 10, discount: 15, subtotal: 85, tax: 5.31, tip: 18, total: 108.31 });
  });

  test("un cupón nunca descuenta más que lo comprado", () => {
    expect(promoDiscount({ code: "X", type: "amount", value: 50 }, 30)).toBe(30);
    expect(promoDiscount({ code: "X", type: "percent", value: 15 }, 90)).toBe(13.5);
    expect(promoDiscount(null, 90)).toBe(0);
  });

  test("cada cupón dice por qué no aplica", () => {
    expect(findPromo("nada", { isNewClient: true, appointments: 1 })).toEqual({ problem: "unknown" });
    expect(findPromo("bienvenido10", { isNewClient: false, appointments: 1 })).toEqual({ problem: "firstVisitOnly" });
    expect(findPromo("FAMILIA15", { isNewClient: false, appointments: 1 })).toEqual({ problem: "minAppointments" });
    expect(findPromo(" familia15 ", { isNewClient: false, appointments: 2 })).toEqual({ promo: PROMOS[1] });
  });

  test("la propina es sobre los servicios, en porcentaje o en monto", () => {
    expect(tipAmount({ id: "t", type: "percent", value: 20 }, 65)).toBe(13);
    expect(tipAmount({ id: "t", type: "amount", value: 5 }, 65)).toBe(5);
    expect(tipAmount(null, 65)).toBe(0);
  });

  test("cancelar a tiempo devuelve todo; tarde, se descuenta el cargo", () => {
    const start = new Date(2026, 9, 10, 15, 0);
    const early = cancellationTerms({ start, now: new Date(2026, 9, 10, 9, 0), cancelHours: 3, lateFeePercent: 10, price: 50, paid: 50 });
    expect(early).toMatchObject({ isFree: true, isPast: false, fee: 0, refund: 50, owed: 0 });
    const late = cancellationTerms({ start, now: new Date(2026, 9, 10, 13, 0), cancelHours: 3, lateFeePercent: 10, price: 50, paid: 50 });
    expect(late).toMatchObject({ isFree: false, fee: 5, refund: 45, owed: 0 });
    const lateUnpaid = cancellationTerms({ start, now: new Date(2026, 9, 10, 13, 0), cancelHours: 3, lateFeePercent: 10, price: 50, paid: 0 });
    expect(lateUnpaid).toMatchObject({ refund: 0, owed: 5 });
  });

  test("la política se lee con los valores de Configuración", () => {
    expect(renderPolicy("Cancela con <<time_for_cancel>>; cargo <<fee_cancellation>>%; máximo <<max_cancellations>>.", { cancelHours: 3, lateFeePercent: 10, maxCancellations: 5 })).toBe("Cancela con 3 h; cargo 10%; máximo 5.");
  });
});

describe("formatos de la reserva", () => {
  test("hoy deja de ofrecerse cuando ya cerró", () => {
    expect(isTodayOver("22:00", 30, new Date(2026, 9, 7, 21, 45))).toBe(true);
    expect(isTodayOver("22:00", 30, new Date(2026, 9, 7, 20, 0))).toBe(false);
    expect(firstBookableDay("22:00", 30, new Date(2026, 9, 7, 22, 2)).getDate()).toBe(8);
  });

  test("el archivo de calendario trae una cita por evento con su duración", () => {
    const appointment: BookedAppointment = { id: "a1", reservationId: "r1", branchId: "ma", branchName: "Massachusetts", personName: "Marcela", guestRelation: null, serviceIds: ["svc_corte"], serviceNames: ["Corte clásico", "Barba"], barberId: "b1", barberName: "Andrés", barberAvatarUrl: null, noPreference: false, start: "2026-10-09T10:30:00", durationMin: 45, price: 50, paid: 0, status: "scheduled" };
    const ics = buildIcs([appointment], "Barbería");
    expect(ics).toContain("DTSTART:20261009T103000");
    expect(ics).toContain("DTEND:20261009T111500");
    expect(ics).toContain("SUMMARY:Barbería — Corte clásico + Barba");
  });
});

describe("perfil de la sede", () => {
  const hours = [0, 1, 2, 3, 4, 5, 6].map((day) => (day === 0 ? { day, opensAt: null, closesAt: null } : { day, opensAt: "09:00", closesAt: "19:00" }));

  test("abierta, antes de abrir, tras cerrar y en un día sin horario", () => {
    expect(openStateOf(hours, new Date(2026, 9, 8, 12, 0))).toEqual({ kind: "open", closesAt: "19:00" });
    expect(openStateOf(hours, new Date(2026, 9, 8, 8, 0))).toEqual({ kind: "opensLater", opensAt: "09:00" });
    expect(openStateOf(hours, new Date(2026, 9, 8, 19, 30))).toEqual({ kind: "closed" });
    expect(openStateOf(hours, new Date(2026, 9, 11, 12, 0))).toEqual({ kind: "closed" });
  });

  test("el servidor arma el perfil con la descripción, el mapa y el horario de cada día", async () => {
    const detail = await bookingApi.branch("ma");
    expect(detail.name).toBe("Massachusetts");
    expect(detail.mapsUrl).toContain("google.com/maps");
    expect(detail.mapsUrl).toContain(encodeURIComponent("88 Newbury St"));
    expect(detail.hours).toHaveLength(7);
    expect(detail.hours.some((entry) => entry.opensAt === null)).toBe(true);
    expect(detail.gallery.length).toBeGreaterThan(1);
    // Ninguna foto repetida (rompería las claves de la tira).
    for (const id of ["ma", "nc", "ri", "ut"]) {
      const { gallery } = await bookingApi.branch(id);
      expect(new Set(gallery).size).toBe(gallery.length);
    }
    expect(detail.description.length).toBeGreaterThan(20);
    await expect(bookingApi.branch("zz")).rejects.toMatchObject({ status: 404 });
  });
});

describe("recorrido de la reserva", () => {
  const known = (): BookingState => bookingReducer(initialBookingState(), { type: "customerFound", customer: customer() });

  test("repetir la última visita salta directo a la hora con el mismo servicio y barbero", () => {
    const state = bookingReducer(known(), { type: "repeatLastVisit", lastVisit: customer().lastVisit! });
    expect(state.step).toBe("time");
    expect(state.branchId).toBe("ma");
    expect(state.draft).toMatchObject({ serviceIds: ["svc_corte"], barberId: "team-04", person: { kind: "self" } });
  });

  test("elegir la hora guarda la cita en el carrito; otra cita para un hijo se suma", () => {
    let state = bookingReducer(known(), { type: "repeatLastVisit", lastVisit: customer().lastVisit! });
    state = bookingReducer(state, { type: "chooseTime", start: "2026-10-09T10:00" });
    expect(state.step).toBe("review");
    state = bookingReducer(state, { type: "addAnother", person: { kind: "new", name: "Santi", relation: "Hijo o hija" } });
    state = bookingReducer(state, { type: "toggleService", serviceId: "svc_nino" });
    state = bookingReducer(state, { type: "chooseBarber", barberId: null });
    state = bookingReducer(state, { type: "chooseTime", start: "2026-10-09T10:00" });
    expect(state.items).toHaveLength(2);
    expect(state.items[1]).toMatchObject({ person: { kind: "new", name: "Santi" }, serviceIds: ["svc_nino"], barberId: null });
  });

  test("cambiar una cita la reemplaza en su sitio y quitarla se puede deshacer", () => {
    let state = bookingReducer(known(), { type: "repeatLastVisit", lastVisit: customer().lastVisit! });
    state = bookingReducer(state, { type: "chooseTime", start: "2026-10-09T10:00" });
    state = bookingReducer(state, { type: "editItem", index: 0 });
    state = bookingReducer(state, { type: "chooseBarber", barberId: "team-05" });
    state = bookingReducer(state, { type: "chooseTime", start: "2026-10-09T11:00" });
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toMatchObject({ barberId: "team-05", start: "2026-10-09T11:00" });
    const item = state.items[0];
    state = bookingReducer(state, { type: "removeItem", index: 0 });
    expect(state.items).toHaveLength(0);
    state = bookingReducer(state, { type: "restoreItem", index: 0, item });
    expect(state.items).toEqual([item]);
  });

  test("quien ya es cliente da por hecha su sede; el cliente nuevo con varias sedes la elige", () => {
    const branches = ["ma", "nc", "ri"];
    expect(defaultBranchId(customer(), branches)).toBe("ma");
    expect(defaultBranchId(customer({ isNew: true, lastVisit: null }), branches)).toBeNull();
    expect(defaultBranchId(customer({ lastVisit: { branchId: "zz", serviceIds: [], barberId: null, at: "2026-09-20T10:00:00" } }), branches)).toBeNull();
    expect(defaultBranchId(null, ["ma"])).toBe("ma");
    // «Reservar algo diferente» salta directo a los servicios de esa sede.
    const state = bookingReducer(known(), { type: "startFresh", onlyBranchId: defaultBranchId(customer(), branches) });
    expect(state).toMatchObject({ step: "services", branchId: "ma" });
  });

  test("aceptar la hora propuesta arma la cita y va directo al resumen", () => {
    const state = bookingReducer(known(), { type: "acceptSuggestion", branchId: "ma", serviceIds: ["svc_corte"], barberId: "team-04", start: "2026-10-12T10:00" });
    expect(state.step).toBe("review");
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toMatchObject({ serviceIds: ["svc_corte"], barberId: "team-04", start: "2026-10-12T10:00", person: { kind: "self" } });
  });

  test("otra sede vacía el carrito; reservar otra vez conserva quién es", () => {
    let state = bookingReducer(known(), { type: "repeatLastVisit", lastVisit: customer().lastVisit! });
    state = bookingReducer(state, { type: "chooseTime", start: "2026-10-09T10:00" });
    state = bookingReducer(state, { type: "setProduct", productId: "prd_cera", qty: 2 });
    const moved = bookingReducer(state, { type: "chooseBranch", branchId: "nc" });
    expect(moved.items).toEqual([]);
    expect(moved.products).toEqual({});
    const again = bookingReducer(state, { type: "bookAgain" });
    expect(again).toMatchObject({ step: "services", customer: state.customer, branchId: "ma", items: [] });
  });
});

describe("backend de la reserva", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  test("el celular dice si es alguien que vuelve, alguien nuevo o un número bloqueado", async () => {
    await expect(bookingApi.lookup(KNOWN_PHONE)).resolves.toMatchObject({ status: "known", customer: { firstName: "Marcela" } });
    await expect(bookingApi.lookup("+573001112233")).resolves.toEqual({ status: "new" });
    await expect(bookingApi.lookup("+573009999999")).resolves.toEqual({ status: "blocked" });
  });

  test("si el barbero no tiene horas, propone otros que hacen lo mismo, con lo que saben y sus horas", async () => {
    // Valeria (team-06) está de vacaciones hasta el 9 de octubre.
    const { items } = await bookingApi.alternatives({ branchId: "ma", date: "2026-10-09", serviceIds: ["svc_corte"], barberId: "team-06" });
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(3);
    expect(items.some((item) => item.barberId === "team-06")).toBe(false);
    for (const item of items) {
      expect(item.times.length).toBeGreaterThan(0);
      expect(item.skills).toContain("Corte clásico");
    }
    // Los que tienen hora ese mismo día van antes que los que solo tienen otro día.
    const firstOther = items.findIndex((item) => item.date !== "2026-10-09");
    if (firstOther >= 0) expect(items.slice(firstOther).every((item) => item.date !== "2026-10-09")).toBe(true);
  });

  test("la lista de espera cae en la del Calendario y solo quien se apuntó puede salir", async () => {
    const joined = await bookingApi.joinWaitlist({ branchId: "ma", customerId: "cli_001", date: "2026-10-09", serviceIds: ["svc_corte"], barberId: "team-06", window: "afternoon" });
    const entry = db.calendar.waitlist.find((item) => item.id === joined.id);
    expect(entry).toMatchObject({ clientId: "cli_001", serviceId: "svc_corte", barberId: "team-06" });
    expect(entry?.slots.every((slot) => slot.date === "2026-10-09" && slot.time >= "12:00")).toBe(true);
    await expect(bookingApi.leaveWaitlist(joined.id, "cli_002")).rejects.toMatchObject({ status: 404 });
    await bookingApi.leaveWaitlist(joined.id, "cli_001");
    expect(db.calendar.waitlist.some((item) => item.id === joined.id)).toBe(false);
    // La noche va desde las 18 hasta que cierra la sede; la tarde se queda en 12–18.
    const night = await bookingApi.joinWaitlist({ branchId: "ma", customerId: "cli_001", date: "2026-10-09", serviceIds: ["svc_corte"], barberId: null, window: "evening" });
    expect(db.calendar.waitlist.find((item) => item.id === night.id)?.slots.every((slot) => slot.time >= "18:00")).toBe(true);
    await expect(bookingApi.joinWaitlist({ branchId: "ma", customerId: "nadie", date: "2026-10-09", serviceIds: ["svc_corte"], barberId: null, window: "any" })).rejects.toMatchObject({ status: 422 });
  });

  test("dos citas a la misma hora sin preferencia quedan con barberos distintos y salen en la agenda", async () => {
    const day = toStart(new Date(2026, 9, 9, 11, 0));
    const reservation = await bookingApi.reserve({
      customerId: "cli_001",
      branchId: "ma",
      items: [
        { guestId: null, serviceIds: ["svc_corte"], barberId: null, start: day },
        { guestId: null, guestName: "Santi", guestRelation: "Hijo o hija", serviceIds: ["svc_nino"], barberId: null, start: day },
      ],
      products: [{ productId: "prd_cera", qty: 1 }],
      tipId: null,
      promoCode: "FAMILIA15",
      method: "card",
      card: { number: "4242 4242 4242 4242", name: "Marcela Gómez" },
    });
    expect(reservation.appointments).toHaveLength(2);
    expect(reservation.appointments[0].barberId).not.toBe(reservation.appointments[1].barberId);
    expect(reservation.appointments[1]).toMatchObject({ personName: "Santi", guestRelation: "Hijo o hija", noPreference: true });
    expect(reservation.totals.discount).toBeGreaterThan(0);
    expect(reservation.payment).toMatchObject({ status: "paid", last4: "4242" });
    expect(db.calendar.appointments.filter((item) => item.createdBy === "Reserva en línea" && item.clientId === "cli_001")).toHaveLength(2);
  });

  test("la tarjeta rechazada no reserva nada", async () => {
    // Al pedir la hora se generan las citas de ese día de la agenda: solo cuentan las de la reserva en línea.
    const fromBooking = () => db.calendar.appointments.filter((item) => item.createdBy === "Reserva en línea").length;
    const error = await bookingApi
      .reserve({ customerId: "cli_001", branchId: "ma", items: [{ guestId: null, serviceIds: ["svc_corte"], barberId: null, start: toStart(new Date(2026, 9, 9, 12, 0)) }], products: [], tipId: null, promoCode: null, method: "card", card: { number: "4000000000000002", name: "M" } })
      .catch((caught: unknown) => caught);
    expect(isApiError(error) && error.status).toBe(402);
    expect(fromBooking()).toBe(0);
    expect(db.booking.reservations).toHaveLength(0);
  });

  test("con el código se ven las citas, se mueven y se cancelan con reembolso a saldo a favor", async () => {
    const reservation = await bookingApi.reserve({ customerId: "cli_001", branchId: "ma", items: [{ guestId: null, serviceIds: ["svc_corte"], barberId: null, start: toStart(new Date(2026, 9, 10, 15, 0)) }], products: [], tipId: null, promoCode: null, method: "card", card: { number: "4242424242424242", name: "M" } });
    const appointment = reservation.appointments[0];
    await expect(bookingApi.verifyOtp(KNOWN_PHONE, "000000")).rejects.toMatchObject({ status: 422 });
    const { token } = await bookingApi.verifyOtp(KNOWN_PHONE, "246810");
    const mine = await bookingApi.myAppointments(token);
    expect(mine.upcoming.some((item) => item.id === appointment.id)).toBe(true);

    const moved = await bookingApi.reschedule(token, appointment.id, { start: toStart(new Date(2026, 9, 10, 16, 0)), barberId: null });
    expect(moved.start).toBe("2026-10-10T16:00:00");

    const cancelled = await bookingApi.cancel(token, appointment.id, "credit");
    expect(cancelled).toMatchObject({ refund: appointment.paid, refundTo: "credit", fee: 0 });
    expect(cancelled.appointment.status).toBe("cancelled");
    expect(db.booking.credits.cli_001).toBe(appointment.paid);
  });

  test("con su frecuencia de visita se propone el día que le toca y horas libres", async () => {
    const { suggestion } = await bookingApi.suggestion("cli_001");
    expect(suggestion).not.toBeNull();
    const client = db.calendar.clients.find((item) => item.id === "cli_001")!;
    expect(suggestion!.everyDays).toBe(client.visitEveryDays);
    expect(suggestion!.options.length).toBeGreaterThan(0);
    const first = suggestion!.options[0];
    // Nunca antes de lo que le toca (o de hoy, si ya le tocaba) y siempre una hora libre de verdad.
    expect(first.start.slice(0, 10) >= (suggestion!.isOverdue ? "2026-10-08" : suggestion!.dueDate)).toBe(true);
    const slots = await bookingApi.availability({ branchId: suggestion!.branchId, date: first.start.slice(0, 10), serviceIds: suggestion!.serviceIds, barberId: first.barberId });
    expect(slots.slots.some((slot) => slot.time === first.start.slice(11, 16))).toBe(true);
  });

  test("sin código no se ven ni se tocan las citas", async () => {
    await expect(bookingApi.myAppointments("inventado")).rejects.toMatchObject({ status: 403 });
  });
});

describe("pantalla de la reserva", () => {
  // Embla (el carrusel de productos) lo pide al montar; jsdom no lo trae.
  beforeEach(() => {
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

  test("quien vuelve ve el día y la hora que le tocan y reserva en un toque", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow />);
    const phone = await screen.findByRole("textbox", { name: /celular/i });
    await user.type(phone, "3202172738");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText("Hola de nuevo, Marcela")).toBeInTheDocument();
    // Viene cada tantas semanas: se le propone ya el día que le toca y una hora libre.
    expect(await screen.findByText("Tu próxima visita")).toBeInTheDocument();
    expect(screen.getByText(/^Te toca el|^Ya te toca/)).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /^Reservar .+·/ }));
    expect(await screen.findByText("Revisa tu reserva")).toBeInTheDocument();
  });

  test("un número nuevo pide nombre, apellido y correo", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow />);
    await user.type(await screen.findByRole("textbox", { name: /celular/i }), "3001112233");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText("Conozcámonos")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /crear perfil/i }));
    expect(screen.getByText("Escribe tu nombre.")).toBeInTheDocument();
    expect(screen.getByText("Revisa el correo.")).toBeInTheDocument();
  });
});
