import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test/render";
import { isApiError } from "@/lib/api";
import { db } from "@/mocks/db";
import { resetBookingLimits } from "@/mocks/booking/handlers";
import { funnelSummary } from "@/mocks/booking/funnel";
import { utmFrom } from "./funnel";
import { DEMO_OTP as DEMO_CODE } from "@/mocks/booking/state";
import { bookingApi } from "./api";
import { BookingFlow } from "./BookingFlow";
import { brandFromName, cardBrandOf, isCvcComplete } from "./flow/cardValidation";
import { fitWithin } from "./flow/referencePhoto";
import { buildIcs, firstBookableDay, isTodayOver, openStateOf, parseStart, toStart } from "./bookingFormat";
import { bookingReducer, defaultBranchId, initialBookingState, progressIndex, progressSteps, type BookingState } from "./bookingState";
import { cancellationTerms, chargesCardFee, computeTotals, coverByPackages, findPromo, promoDiscount, renderPolicy, tipAmount, PROMOS } from "./pricing";
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
  cards: [],
  depositRequired: false,
  loyalty: null,
  packages: [],
  ...draft,
});

describe("cuentas de la reserva", () => {
  test("el impuesto va sobre lo comprado con el descuento y la propina va aparte", () => {
    const totals = computeTotals({ services: 90, products: 10, discount: 15, taxPercent: 6.25, tip: 18 });
    expect(totals).toEqual({ services: 90, products: 10, discount: 15, subtotal: 85, tax: 5.31, tip: 18, fee: 0, feeName: null, gift: 0, reward: 0, prepaid: 0, total: 108.31 });
  });

  test("el recargo por tarjeta sale del subtotal, suma al total y solo lo llevan tarjeta y billetera", () => {
    const rule = { name: "Recargo por tarjeta", rate: 3, type: "percent" as const };
    const totals = computeTotals({ services: 90, products: 10, discount: 0, taxPercent: 0, tip: 0, cardFee: rule });
    expect(totals).toMatchObject({ fee: 3, feeName: "Recargo por tarjeta", total: 103 });
    expect(computeTotals({ services: 90, products: 0, discount: 0, taxPercent: 0, tip: 0, cardFee: { ...rule, type: "amount", rate: 2 } }).fee).toBe(2);
    expect(chargesCardFee("card") && chargesCardFee("wallet")).toBe(true);
    expect(chargesCardFee("shop") || chargesCardFee("credit")).toBe(false);
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

describe("tarjetas", () => {
  test("la marca sale de los primeros dígitos y Amex pide 4 de CVC", () => {
    expect(cardBrandOf("4242 4242")).toBe("visa");
    expect(cardBrandOf("5105 1051")).toBe("mastercard");
    expect(cardBrandOf("2221 0000")).toBe("mastercard");
    expect(cardBrandOf("3782 822463")).toBe("amex");
    expect(cardBrandOf("6011")).toBe("other");
    expect(isCvcComplete("123", "visa")).toBe(true);
    expect(isCvcComplete("123", "amex")).toBe(false);
    expect(brandFromName("Mastercard")).toBe("mastercard");
  });
});

describe("foto de referencia", () => {
  test("se reduce a 1024 px por el lado largo sin deformarla; si ya es chica no se agranda", () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1024, height: 768 });
    expect(fitWithin(1080, 1920)).toEqual({ width: 576, height: 1024 });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});

describe("embudo de la reserva", () => {
  test("la UTM del enlace dice de dónde vino", () => {
    expect(utmFrom("?utm_source=instagram&utm_medium=bio&utm_campaign=octubre")).toEqual({ source: "instagram", medium: "bio", campaign: "octubre" });
    expect(utmFrom("?vista=phone")).toBeNull();
  });

  test("cuenta las sesiones que llegan a cada paso y de dónde vienen; la vista previa no cuenta", async () => {
    db.booking.funnel = [];
    const steps = ["phone", "verify", "services", "barber", "time", "review", "payment", "confirmed"];
    for (const step of steps) await bookingApi.trackEvent({ sessionId: "s1", step, surface: "link", source: "instagram" });
    for (const step of steps.slice(0, 3)) await bookingApi.trackEvent({ sessionId: "s2", step, surface: "widget", source: "" });
    await bookingApi.trackEvent({ sessionId: "s3", step: "phone", surface: "preview", source: "" });
    const summary = funnelSummary(30);
    expect(summary).toMatchObject({ demo: false, started: 2, bookings: 1, conversion: 50 });
    expect(summary.steps.find((item) => item.step === "services")?.rate).toBe(100);
    expect(summary.steps.find((item) => item.step === "barber")?.rate).toBe(50);
    expect(summary.sources).toEqual(expect.arrayContaining([{ source: "instagram", sessions: 1, bookings: 1 }, { source: "directo", sessions: 1, bookings: 0 }]));
  });
});

describe("formatos de la reserva", () => {
  test("hoy deja de ofrecerse cuando ya cerró", () => {
    expect(isTodayOver("22:00", 30, new Date(2026, 9, 7, 21, 45))).toBe(true);
    expect(isTodayOver("22:00", 30, new Date(2026, 9, 7, 20, 0))).toBe(false);
    expect(firstBookableDay("22:00", 30, new Date(2026, 9, 7, 22, 2)).getDate()).toBe(8);
  });

  test("el archivo de calendario trae una cita por evento con su duración", () => {
    const appointment: BookedAppointment = { id: "a1", reservationId: "r1", branchId: "ma", branchName: "Massachusetts", personName: "Marcela", guestRelation: null, serviceIds: ["svc_corte"], serviceNames: ["Corte clásico", "Barba"], barberId: "b1", barberName: "Andrés", barberAvatarUrl: null, noPreference: false, start: "2026-10-09T10:30:00", durationMin: 45, price: 50, paid: 0, status: "scheduled", review: null };
    const ics = buildIcs([appointment], "Barbería");
    expect(ics).toContain("DTSTART:20261009T103000");
    expect(ics).toContain("DTEND:20261009T111500");
    expect(ics).toContain("SUMMARY:Barbería — Corte clásico + Barba");
    // El calendario avisa el día antes y dos horas antes.
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2);
    expect(ics).toContain("TRIGGER:-P1D");
    expect(ics).toContain("TRIGGER:-PT2H");
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
  const known = (): BookingState => bookingReducer(initialBookingState(), { type: "customerFound", customer: customer(), token: "bk_test" });

  test("lista de espera sin hora: apuntarse lleva a su confirmación y salir de ella vuelve a buscar hora", () => {
    const entry = { id: "wl_1", date: "2026-10-09", window: "afternoon" as const, branchId: "ma", serviceIds: ["svc_corte"], barberId: "team-04" };
    let state = bookingReducer(known(), { type: "repeatLastVisit", lastVisit: customer().lastVisit! });
    state = bookingReducer(state, { type: "waitlistJoined", entry });
    state = bookingReducer(state, { type: "waitlistJoined", entry });
    expect(state).toMatchObject({ waitlist: [entry], step: "waitlisted" });
    state = bookingReducer(state, { type: "waitlistLeft", id: "wl_1" });
    expect(state).toMatchObject({ waitlist: [], step: "time" });
  });

  test("con una reserva armada, apuntarse también lleva a la confirmación y se puede volver a la reserva", () => {
    const entry = { id: "wl_2", date: "2026-10-09", window: "any" as const, branchId: "ma", serviceIds: ["svc_corte"], barberId: null };
    let state = bookingReducer(known(), { type: "repeatLastVisit", lastVisit: customer().lastVisit! });
    state = bookingReducer(state, { type: "chooseTime", start: "2026-10-30T13:30" });
    state = bookingReducer(state, { type: "addAnother", person: { kind: "self" } });
    state = bookingReducer(state, { type: "waitlistJoined", entry });
    expect(state.step).toBe("waitlisted");
    state = bookingReducer(state, { type: "discardDraft" });
    expect(state).toMatchObject({ step: "review", draft: null, items: [expect.objectContaining({ start: "2026-10-30T13:30" })] });
  });

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

  test("atrás desde el resumen retoca la última cita y sigue hacia atrás, sin volver al resumen", () => {
    let state = bookingReducer(known(), { type: "repeatLastVisit", lastVisit: customer().lastVisit! });
    state = bookingReducer(state, { type: "chooseTime", start: "2026-10-09T10:00" });
    state = bookingReducer(state, { type: "reopenLast" });
    expect(state).toMatchObject({ step: "time", editingIndex: 0, fromReview: false, draft: { serviceIds: ["svc_corte"] } });
    // Elegir otra hora reemplaza la cita, no la duplica.
    state = bookingReducer(state, { type: "chooseTime", start: "2026-10-09T11:00" });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].start).toBe("2026-10-09T11:00");
  });

  test("sumar o cambiar una cita desde el resumen recuerda que hay que volver allí", () => {
    let state = bookingReducer(known(), { type: "repeatLastVisit", lastVisit: customer().lastVisit! });
    expect(state.fromReview).toBe(false);
    state = bookingReducer(state, { type: "chooseTime", start: "2026-10-09T10:00" });
    expect(bookingReducer(state, { type: "addAnother", person: { kind: "self" } }).fromReview).toBe(true);
    expect(bookingReducer(state, { type: "editItem", index: 0 }).fromReview).toBe(true);
    expect(bookingReducer(bookingReducer(state, { type: "editItem", index: 0 }), { type: "discardDraft" })).toMatchObject({ step: "review", fromReview: false });
  });

  test("la sede solo cuenta como paso para quien la elige", () => {
    expect(progressSteps(true)).toHaveLength(6);
    expect(progressSteps(false)).toEqual(["services", "barber", "time", "review", "payment"]);
    expect(progressIndex("services", progressSteps(false))).toBe(0);
    expect(progressIndex("review", progressSteps(false))).toBe(3);
    expect(progressIndex("branch", progressSteps(false))).toBe(-1);
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

/** Entra con el código de la demo y devuelve la sesión (y el perfil, si ya es cliente). */
async function signIn(phone = KNOWN_PHONE): Promise<{ token: string; customer: BookingCustomer | null }> {
  await bookingApi.requestOtp(phone);
  const result = await bookingApi.verifyOtp(phone, DEMO_CODE);
  if (!result.token) throw new Error(`sin sesión para ${phone}`);
  return { token: result.token, customer: result.customer };
}

describe("backend de la reserva", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    resetBookingLimits();
  });
  afterEach(() => vi.useRealTimers());

  test("el código dice si es alguien que vuelve, alguien nuevo o un número bloqueado; el celular solo no revela nada", async () => {
    // Pedir el código responde igual para cualquier número: no dice si es cliente ni da datos.
    await expect(bookingApi.requestOtp(KNOWN_PHONE)).resolves.toEqual({ sentTo: expect.stringContaining("2738"), channel: "whatsapp" });
    await expect(bookingApi.requestOtp("+573001112233")).resolves.toEqual({ sentTo: expect.stringContaining("2233"), channel: "whatsapp" });
    await expect(bookingApi.verifyOtp(KNOWN_PHONE, DEMO_CODE)).resolves.toMatchObject({ status: "known", customer: { firstName: "Marcela" } });
    await expect(bookingApi.verifyOtp("+573001112233", DEMO_CODE)).resolves.toMatchObject({ status: "new", customer: null });
    await expect(bookingApi.verifyOtp("+573009999999", DEMO_CODE)).resolves.toEqual({ status: "blocked", token: null, customer: null });
  });

  test("sin la sesión del código no se reserva, ni se cobra una tarjeta guardada, ni se ve la propuesta", async () => {
    const items = [{ guestId: null, serviceIds: ["svc_corte"], barberId: null, start: toStart(new Date(2026, 9, 9, 10, 0)) }];
    const input = { branchId: "ma", items, products: [], tipId: null, promoCode: null, method: "card" as const, savedCardId: "card_demo_visa" };
    await expect(bookingApi.reserve("bk_inventado", input)).rejects.toMatchObject({ status: 403 });
    await expect(bookingApi.suggestion("bk_inventado")).rejects.toMatchObject({ status: 403 });
    await expect(bookingApi.joinWaitlist("bk_inventado", { branchId: "ma", date: "2026-10-09", serviceIds: ["svc_corte"], barberId: null, window: "any" })).rejects.toMatchObject({ status: 403 });
    await expect(bookingApi.createCustomer("bk_inventado", { firstName: "Ana", lastName: "Ruiz", email: "ana@correo.com", marketing: false })).rejects.toMatchObject({ status: 403 });
  });

  test("los códigos tienen límite: 5 pedidos cada 10 minutos y 5 intentos fallidos", async () => {
    for (let index = 0; index < 5; index += 1) await bookingApi.requestOtp("+573004445566");
    await expect(bookingApi.requestOtp("+573004445566")).rejects.toMatchObject({ status: 429 });
    resetBookingLimits();
    await bookingApi.requestOtp("+573004445566");
    for (let index = 0; index < 5; index += 1) await expect(bookingApi.verifyOtp("+573004445566", "000000")).rejects.toMatchObject({ status: 422 });
    // Ni el código bueno entra hasta pedir uno nuevo.
    await expect(bookingApi.verifyOtp("+573004445566", DEMO_CODE)).rejects.toMatchObject({ status: 429 });
  });

  test("pagar en la barbería no pide anticipo mientras esté apagado en Configuración", async () => {
    const items = [{ guestId: null, serviceIds: ["svc_corte"], barberId: null, start: toStart(new Date(2026, 9, 9, 15, 0)) }];
    const base = { branchId: "ma", items, products: [], tipId: null, promoCode: null, method: "shop" as const };
    // Marcela viene seguido y no ha faltado: reserva en la barbería sin anticipo.
    const regular = await signIn();
    expect(regular.customer?.depositRequired).toBe(false);
    const free = await bookingApi.reserve(regular.token, base);
    expect(free.payment).toMatchObject({ method: "shop", status: "pending", paid: 0 });

    // Con el anticipo apagado en Configuración (como viene), un cliente nuevo también reserva sin tarjeta.
    const { token } = await signIn("+573006667788");
    const created = await bookingApi.createCustomer(token, { firstName: "Leo", lastName: "Mora", email: "leo@correo.com", marketing: false });
    expect(created.depositRequired).toBe(false);
    const later = { ...base, items: [{ ...items[0], start: toStart(new Date(2026, 9, 9, 16, 0)) }] };
    const held = await bookingApi.reserve(token, later);
    expect(held.payment).toMatchObject({ method: "shop", status: "pending", paid: 0 });
  });

  test("solo se califica una cita que ocurrió, una vez, y la nota cuenta en el promedio del barbero", async () => {
    const { token } = await signIn();
    // El primer hueco con quien esté libre: la cita existe de verdad.
    const slot = (await bookingApi.earliest({ branchId: "ma", serviceIds: ["svc_corte"], barberId: null })).slot;
    if (!slot) throw new Error("debería haber un hueco");
    const booked = await bookingApi.reserve(token, { branchId: "ma", items: [{ guestId: null, serviceIds: ["svc_corte"], barberId: slot.barberId, start: `${slot.date}T${slot.time}` }], products: [], tipId: null, promoCode: null, method: "shop" });
    const upcomingId = booked.appointments[0].id;
    // Una cita que aún no pasa no se califica.
    await expect(bookingApi.review(token, upcomingId, { rating: 5, comment: "" })).rejects.toMatchObject({ status: 409 });
    // La barbería la cobra al terminar: ya ocurrió.
    db.calendar.appointments = db.calendar.appointments.map((item) => (item.id === upcomingId ? { ...item, status: "paid" } : item));
    const done = (await bookingApi.myAppointments(token)).past.find((item) => item.id === upcomingId);
    if (!done) throw new Error("la cita cobrada debería estar en el historial");
    expect(done).toMatchObject({ status: "completed", review: null });
    const before = (await bookingApi.catalog("ma")).barbers.find((barber) => barber.id === done.barberId);
    await expect(bookingApi.review(token, done.id, { rating: 0, comment: "" })).rejects.toMatchObject({ status: 422 });
    await bookingApi.review(token, done.id, { rating: 5, comment: "Impecable" });
    await expect(bookingApi.review(token, done.id, { rating: 4, comment: "" })).rejects.toMatchObject({ status: 409 });
    const after = (await bookingApi.catalog("ma")).barbers.find((barber) => barber.id === done.barberId);
    expect(after?.reviews).toBe((before?.reviews ?? 0) + 1);
    const latest = await bookingApi.barberReviews(done.barberId);
    expect(latest.items[0]).toMatchObject({ clientName: "Marcela G.", rating: 5, comment: "Impecable" });
  });

  test("la tarjeta de regalo paga primero, deja el saldo que sobra y si cubre todo no hay nada que cobrar", async () => {
    const { token } = await signIn();
    await expect(bookingApi.checkGift("NO-EXISTE")).rejects.toMatchObject({ status: 404 });
    const gift = await bookingApi.checkGift("regalo 50");
    expect(gift).toEqual({ code: "REGALO-50", balance: 50 });
    const slot = async () => (await bookingApi.earliest({ branchId: "ma", serviceIds: ["svc_corte"], barberId: null })).slot;
    // Un corte (US$ 35 + impuesto) cabe en los 50: no se cobra nada y queda saldo.
    const first = await slot();
    if (!first) throw new Error("debería haber hueco");
    const covered = await bookingApi.reserve(token, { branchId: "ma", items: [{ guestId: null, serviceIds: ["svc_corte"], barberId: first.barberId, start: `${first.date}T${first.time}` }], products: [], tipId: null, promoCode: null, method: "card", giftCode: "REGALO-50" });
    expect(covered.totals.total).toBe(0);
    expect(covered.payment).toMatchObject({ method: "gift", status: "paid" });
    const left = (await bookingApi.checkGift("REGALO-50")).balance;
    expect(left).toBeCloseTo(50 - covered.totals.gift, 2);

    // Comprar una para alguien: se paga con tarjeta y queda con su saldo completo.
    await expect(bookingApi.buyGift(token, { amount: 5, recipientName: "Mateo", recipientContact: "+573004441122", message: "" })).rejects.toMatchObject({ status: 422 });
    const bought = await bookingApi.buyGift(token, { amount: 60, recipientName: "Mateo", recipientContact: "+573004441122", message: "Feliz cumple", savedCardId: "card_demo_visa" });
    expect(bought).toMatchObject({ amount: 60, sentTo: "•••• 1122", paidWith: "Visa •••• 4242" });
    await expect(bookingApi.checkGift(bought.code)).resolves.toEqual({ code: bought.code, balance: 60 });
  });

  test("las fotos de referencia (hasta 3) llegan a la cita de la agenda; una que no es imagen se rechaza", async () => {
    const { token } = await signIn();
    const slot = (await bookingApi.earliest({ branchId: "ma", serviceIds: ["svc_corte"], barberId: null })).slot;
    if (!slot) throw new Error("debería haber hueco");
    const base = { branchId: "ma", items: [{ guestId: null, serviceIds: ["svc_corte"], barberId: slot.barberId, start: `${slot.date}T${slot.time}` }], products: [], tipId: null, promoCode: null, method: "shop" as const };
    await expect(bookingApi.reserve(token, { ...base, referencePhotos: ["data:text/html;base64,PHNjcmlwdD4="] })).rejects.toMatchObject({ status: 422 });
    const photo = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==";
    await expect(bookingApi.reserve(token, { ...base, referencePhotos: [photo, photo, photo, photo] })).rejects.toMatchObject({ status: 422 });
    const booked = await bookingApi.reserve(token, { ...base, referencePhotos: [photo, photo] });
    const inAgenda = db.calendar.appointments.find((item) => item.id === booked.appointments[0].id);
    expect(inAgenda?.referencePhotos).toEqual([photo, photo]);
    expect(inAgenda?.notes).toContain("foto de referencia");
  });

  test("cuando alguien cancela, la hora se ofrece por WhatsApp a quien espera esa franja", async () => {
    const marcela = await signIn();
    const slot = (await bookingApi.earliest({ branchId: "ma", serviceIds: ["svc_corte"], barberId: null })).slot;
    if (!slot) throw new Error("debería haber hueco");
    const booked = await bookingApi.reserve(marcela.token, { branchId: "ma", items: [{ guestId: null, serviceIds: ["svc_corte"], barberId: slot.barberId, start: `${slot.date}T${slot.time}` }], products: [], tipId: null, promoCode: null, method: "shop" });
    // Otra clienta espera ese día, a cualquier hora y con cualquier barbero.
    const other = await signIn("+573005550102");
    await bookingApi.joinWaitlist(other.token, { branchId: "ma", date: slot.date, serviceIds: ["svc_corte"], barberId: null, window: "any" });
    await bookingApi.cancel(marcela.token, booked.appointments[0].id, "credit");
    const offer = (db.booking.outbox ?? []).find((message) => message.kind === "slotFreed" && message.appointmentId === booked.appointments[0].id);
    expect(offer).toMatchObject({ clientId: "cli_003", channel: "whatsapp", offer: { barberId: slot.barberId } });
  });

  test("la cortesía de cliente frecuente se descuenta al pagar y queda una menos por usar", async () => {
    const { token, customer } = await signIn();
    // Marcela tiene muchas visitas: arranca con una cortesía por usar.
    expect(customer?.loyalty).toMatchObject({ every: 10, available: 1, rewardServiceId: "svc_corte" });
    const slot = (await bookingApi.earliest({ branchId: "ma", serviceIds: ["svc_corte"], barberId: null })).slot;
    if (!slot) throw new Error("debería haber hueco");
    const booked = await bookingApi.reserve(token, { branchId: "ma", items: [{ guestId: null, serviceIds: ["svc_corte"], barberId: slot.barberId, start: `${slot.date}T${slot.time}` }], products: [], tipId: null, promoCode: null, method: "shop", useReward: true });
    expect(booked.totals.reward).toBeGreaterThan(0);
    expect(booked.totals.subtotal).toBe(0);
    const { customer: after } = await signIn();
    expect(after?.loyalty?.available).toBe(0);
  });

  test("un paquete prepagado se compra con tarjeta y paga los servicios que cubre, una visita por cita", async () => {
    const { token } = await signIn("+573005550102");
    const shop = await bookingApi.shop();
    expect(shop.packages.map((item) => item.id)).toContain("pkg_cortes4");
    await expect(bookingApi.buyPackage(token, { packageId: "no-existe", savedCardId: "card_demo_visa" })).rejects.toMatchObject({ status: 404 });
    await expect(bookingApi.buyPackage(token, { packageId: "pkg_cortes4" })).rejects.toMatchObject({ status: 422 });
    const bought = await bookingApi.buyPackage(token, { packageId: "pkg_cortes4", card: { number: "4242424242424242", name: "Ana Pérez", expiry: "12/29", save: false } });
    expect(bought.package).toMatchObject({ serviceId: "svc_corte", remaining: 4, total: 4 });
    const slot = (await bookingApi.earliest({ branchId: "ma", serviceIds: ["svc_corte"], barberId: null })).slot;
    if (!slot) throw new Error("debería haber hueco");
    const booked = await bookingApi.reserve(token, { branchId: "ma", items: [{ guestId: null, serviceIds: ["svc_corte"], barberId: slot.barberId, start: `${slot.date}T${slot.time}` }], products: [], tipId: null, promoCode: null, method: "shop", usePackages: true });
    expect(booked.totals.prepaid).toBe(booked.totals.services);
    expect(booked.totals.subtotal).toBe(0);
    const { customer } = await signIn("+573005550102");
    expect(customer?.packages[0]?.remaining).toBe(3);
    // Varias llamadas de pago simulan la espera del banco.
  }, 15_000);

  test("coverByPackages gasta una visita por servicio cubierto y no más de las que quedan", () => {
    const owned = [{ id: "p1", serviceId: "svc_corte", remaining: 1 }];
    const result = coverByPackages([[{ serviceId: "svc_corte", price: 30 }], [{ serviceId: "svc_corte", price: 35 }, { serviceId: "svc_barba", price: 20 }]], owned);
    expect(result).toEqual({ amount: 30, used: { p1: 1 } });
    expect(computeTotals({ services: 85, products: 0, discount: 0, taxPercent: 0, tip: 0, prepaid: 30 })).toMatchObject({ prepaid: 30, subtotal: 55 });
  });

  test("dejar fija una cita agenda las próximas cada tantas semanas con el mismo barbero, en serie", async () => {
    const { token } = await signIn();
    const start = new Date(2026, 9, 12, 10, 0);
    const reservation = await bookingApi.reserve(token, { branchId: "ma", items: [{ guestId: null, serviceIds: ["svc_corte"], barberId: "team-04", start: toStart(start) }], products: [], tipId: null, promoCode: null, method: "shop" });
    const original = reservation.appointments[0];
    const result = await bookingApi.repeat(token, original.id, { everyWeeks: 3, count: 3 });
    expect(result.created.length + result.skipped.length).toBe(3);
    for (const item of result.created) {
      expect(item.barberId).toBe("team-04");
      // Cada una cae 3, 6 y 9 semanas después (a la misma hora, o la más cercana ese día).
      const weeksAfter = Math.round((parseStart(item.start).getTime() - start.getTime()) / (7 * 86_400_000));
      expect([3, 6, 9]).toContain(weeksAfter);
    }
    const series = db.calendar.appointments.filter((item) => item.seriesId === `ser_web_${original.id}`);
    expect(series.length).toBe(result.created.length + 1);
    expect(series.every((item) => item.repeat === "triweekly")).toBe(true);
    await expect(bookingApi.repeat(token, original.id, { everyWeeks: 5, count: 3 })).rejects.toMatchObject({ status: 422 });
    await expect(bookingApi.repeat("bk_inventado", original.id, { everyWeeks: 3, count: 1 })).rejects.toMatchObject({ status: 403 });
  });

  test("reservar programa la confirmación y los recordatorios; mover la cita los mueve y cancelarla los anula", async () => {
    const { token } = await signIn();
    const start = new Date(2026, 9, 10, 15, 0);
    const reservation = await bookingApi.reserve(token, { branchId: "ma", items: [{ guestId: null, serviceIds: ["svc_corte"], barberId: null, start: toStart(start) }], products: [], tipId: null, promoCode: null, method: "shop" });
    const id = reservation.appointments[0].id;
    const pending = () => (db.booking.outbox ?? []).filter((message) => message.appointmentId === id && message.status === "scheduled");
    expect(pending().map((message) => message.kind).sort()).toEqual(["confirmation", "reminder24h", "reminder2h"]);
    expect(pending().find((message) => message.kind === "reminder2h")?.sendAt).toBe(new Date(start.getTime() - 2 * 3_600_000).toISOString());

    const later = new Date(2026, 9, 10, 17, 0);
    await bookingApi.reschedule(token, id, { start: toStart(later), barberId: null });
    expect(pending().find((message) => message.kind === "reminder2h")?.sendAt).toBe(new Date(later.getTime() - 2 * 3_600_000).toISOString());
    expect(pending().some((message) => message.kind === "rescheduled")).toBe(true);

    await bookingApi.cancel(token, id, "credit");
    expect(pending()).toHaveLength(0);
  });

  test("el perfil nuevo usa el celular verificado y guarda el permiso de promociones con fecha", async () => {
    const { token } = await signIn("+573007778899");
    const created = await bookingApi.createCustomer(token, { firstName: "Ana", lastName: "Ruiz", email: "ana@correo.com", marketing: false });
    expect(created.phone).toBe("+573007778899");
    expect(db.customers.profiles[created.id]?.marketingConsent).toMatchObject({ accepted: false, source: "booking" });
    // La misma sesión ya es la del cliente: puede reservar.
    await expect(bookingApi.suggestion(token)).resolves.toMatchObject({ suggestion: null });
  });

  test("«Lo antes posible» da el primer hueco desde hoy, con el barbero elegido o con quien esté libre", async () => {
    const any = await bookingApi.earliest({ branchId: "ma", serviceIds: ["svc_corte"], barberId: null });
    expect(any.slot).not.toBeNull();
    expect((any.slot?.date ?? "") >= "2026-10-08").toBe(true);
    // Ese hueco existe de verdad en la disponibilidad de ese día y con ese barbero.
    const day = await bookingApi.availability({ branchId: "ma", date: any.slot?.date ?? "", serviceIds: ["svc_corte"], barberId: any.slot?.barberId ?? null });
    expect(day.slots.some((slot) => slot.time === any.slot?.time)).toBe(true);
    // Valeria está de vacaciones hasta el 9: su primer hueco es después.
    const valeria = await bookingApi.earliest({ branchId: "ma", serviceIds: ["svc_corte"], barberId: "team-06" });
    expect(valeria.slot === null || valeria.slot.date > "2026-10-09").toBe(true);
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
    const { token } = await signIn();
    const joined = await bookingApi.joinWaitlist(token, { branchId: "ma", date: "2026-10-09", serviceIds: ["svc_corte"], barberId: "team-06", window: "afternoon" });
    const entry = db.calendar.waitlist.find((item) => item.id === joined.id);
    expect(entry).toMatchObject({ clientId: "cli_001", serviceId: "svc_corte", barberId: "team-06" });
    expect(entry?.slots.every((slot) => slot.date === "2026-10-09" && slot.time >= "12:00")).toBe(true);
    const other = await signIn("+573005550102");
    await expect(bookingApi.leaveWaitlist(other.token, joined.id)).rejects.toMatchObject({ status: 404 });
    await bookingApi.leaveWaitlist(token, joined.id);
    expect(db.calendar.waitlist.some((item) => item.id === joined.id)).toBe(false);
    // La noche va desde las 18 hasta que cierra la sede; la tarde se queda en 12–18.
    const night = await bookingApi.joinWaitlist(token, { branchId: "ma", date: "2026-10-09", serviceIds: ["svc_corte"], barberId: null, window: "evening" });
    expect(db.calendar.waitlist.find((item) => item.id === night.id)?.slots.every((slot) => slot.time >= "18:00")).toBe(true);
    await expect(bookingApi.joinWaitlist(token, { branchId: "ma", date: "2026-10-09", serviceIds: [], barberId: null, window: "any" })).rejects.toMatchObject({ status: 422 });
  });

  test("dos citas a la misma hora sin preferencia quedan con barberos distintos y salen en la agenda", async () => {
    const day = toStart(new Date(2026, 9, 9, 11, 0));
    const reservation = await bookingApi.reserve((await signIn()).token, {
      branchId: "ma",
      items: [
        { guestId: null, serviceIds: ["svc_corte"], barberId: null, start: day },
        { guestId: null, guestName: "Santi", guestRelation: "Hijo o hija", serviceIds: ["svc_nino"], barberId: null, start: day },
      ],
      products: [{ productId: "prd_cera", qty: 1 }],
      tipId: null,
      promoCode: "FAMILIA15",
      method: "card",
      card: { number: "4242 4242 4242 4242", name: "Marcela Gómez", expiry: "12/30", save: false },
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
      .reserve((await signIn()).token, { branchId: "ma", items: [{ guestId: null, serviceIds: ["svc_corte"], barberId: null, start: toStart(new Date(2026, 9, 9, 12, 0)) }], products: [], tipId: null, promoCode: null, method: "card", card: { number: "4000000000000002", name: "M", expiry: "12/30", save: false } })
      .catch((caught: unknown) => caught);
    expect(isApiError(error) && error.status).toBe(402);
    expect(fromBooking()).toBe(0);
    expect(db.booking.reservations).toHaveLength(0);
  });

  test("se paga con una tarjeta guardada (solo su token) y una nueva se guarda sin número completo", async () => {
    const item = (hour: number) => [{ guestId: null, serviceIds: ["svc_corte"], barberId: null, start: toStart(new Date(2026, 9, 9, hour, 0)) }];
    const base = { branchId: "ma", products: [], tipId: null, promoCode: null, method: "card" as const };
    const { token, customer: before } = await signIn();
    if (!before) throw new Error("Marcela debería ser cliente");
    expect(before.cards.map((card) => `${card.brand} ${card.last4}`)).toEqual(["Visa 4242", "Mastercard 4444"]);

    const withSaved = await bookingApi.reserve(token, { ...base, items: item(10), savedCardId: "card_demo_mc" });
    expect(withSaved.payment).toMatchObject({ status: "paid", brand: "Mastercard", last4: "4444" });
    await expect(bookingApi.reserve(token, { ...base, items: item(11), savedCardId: "card_que_no_existe" })).rejects.toMatchObject({ status: 422 });

    await bookingApi.reserve(token, { ...base, items: item(12), card: { number: "5105 1051 0510 5100", name: "Marcela Gómez", expiry: "08/29", save: true } });
    const { customer: after } = await signIn();
    if (!after) throw new Error("Marcela debería ser cliente");
    expect(after.cards.at(-1)).toMatchObject({ brand: "Mastercard", last4: "5100", expMonth: 8, expYear: 2029 });
    // Lo guardado no lleva el número completo.
    expect(JSON.stringify(after.cards)).not.toContain("5105105105105100");
  });

  test("una tarjeta guardada se edita (titular y vencimiento) y se elimina", async () => {
    const { token } = await signIn();
    const edited = await bookingApi.updateCard(token, "card_demo_mc", { holder: "Marcela G. Ruiz", expMonth: 3, expYear: 2031 });
    expect(edited.cards.find((card) => card.id === "card_demo_mc")).toMatchObject({ holder: "Marcela G. Ruiz", expMonth: 3, expYear: 2031, last4: "4444" });
    await expect(bookingApi.updateCard(token, "card_demo_mc", { holder: "Marcela", expMonth: 1, expYear: 2020 })).rejects.toMatchObject({ status: 422 });
    await expect(bookingApi.updateCard(token, "card_demo_mc", { holder: "M", expMonth: 3, expYear: 2031 })).rejects.toMatchObject({ status: 422 });
    await expect(bookingApi.updateCard(token, "card_que_no_existe", { holder: "Marcela", expMonth: 3, expYear: 2031 })).rejects.toMatchObject({ status: 404 });

    const removed = await bookingApi.removeCard(token, "card_demo_visa");
    expect(removed.cards.map((card) => card.id)).toEqual(["card_demo_mc"]);
    // Ya no se puede pagar con la que se quitó.
    const item = [{ guestId: null, serviceIds: ["svc_corte"], barberId: null, start: toStart(new Date(2026, 9, 9, 10, 0)) }];
    await expect(bookingApi.reserve(token, { branchId: "ma", items: item, products: [], tipId: null, promoCode: null, method: "card", savedCardId: "card_demo_visa" })).rejects.toMatchObject({ status: 422 });
    const { customer } = await signIn();
    expect(customer?.cards.map((card) => card.id)).toEqual(["card_demo_mc"]);
  });

  test("con el código se ven las citas, se mueven y se cancelan con reembolso a saldo a favor", async () => {
    const session = await signIn();
    const reservation = await bookingApi.reserve(session.token, { branchId: "ma", items: [{ guestId: null, serviceIds: ["svc_corte"], barberId: null, start: toStart(new Date(2026, 9, 10, 15, 0)) }], products: [], tipId: null, promoCode: null, method: "card", card: { number: "4242424242424242", name: "M", expiry: "12/30", save: false } });
    const appointment = reservation.appointments[0];
    await expect(bookingApi.verifyOtp(KNOWN_PHONE, "000000")).rejects.toMatchObject({ status: 422 });
    const { token } = await signIn();
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
    const { suggestion } = await bookingApi.suggestion((await signIn()).token);
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

/** Escribe el código de la demo en las casillas (como al pegarlo desde el mensaje). */
async function typeCode(user: ReturnType<typeof userEvent.setup>) {
  const cells = await screen.findAllByRole("textbox");
  await user.click(cells[0]);
  await user.paste(DEMO_CODE);
}

describe("pantalla de la reserva", () => {
  // Embla (el carrusel de productos) lo pide al montar; jsdom no lo trae.
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

  test("quien vuelve ve el día y la hora que le tocan y reserva en un toque", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow />);
    const phone = await screen.findByRole("textbox", { name: /celular/i });
    await user.type(phone, "3202172738");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    // Antes del código no se ve nada de su perfil.
    expect(await screen.findByText("Escribe el código")).toBeInTheDocument();
    expect(screen.queryByText(/Marcela/)).toBeNull();
    await typeCode(user);
    expect(await screen.findByText("Hola de nuevo, Marcela")).toBeInTheDocument();
    // Viene cada tantas semanas: se le propone ya el día que le toca y una hora libre.
    expect(await screen.findByText("Lo de siempre")).toBeInTheDocument();
    expect(await screen.findByText(/^Te toca el|^Ya te toca/)).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /^Reservar .+·/ }));
    expect(await screen.findByText("Revisa tu reserva")).toBeInTheDocument();
  });

  test("un número nuevo no pide código al entrar: arma la cita y el código va al pagar", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFlow />);
    await user.type(await screen.findByRole("textbox", { name: /celular/i }), "3001112233");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    // Nuevo: va directo a elegir la sede, sin código ni bienvenida.
    expect(await screen.findByText("¿A qué sede vas?")).toBeInTheDocument();
    expect(screen.queryByText("Escribe el código")).toBeNull();
  });

  test("con el celular anotado, el código se pide al llegar al pago", () => {
    const started = bookingReducer(initialBookingState(), { type: "startWithPhone", phone: "+573202172738", onlyBranchId: null });
    expect(started).toMatchObject({ step: "branch", phone: "+573202172738", token: null, customer: null, codeSentTo: null });
    // Con una sola sede se elige sola y empieza en los servicios.
    expect(bookingReducer(initialBookingState(), { type: "startWithPhone", phone: "+573202172738", onlyBranchId: "br_1" })).toMatchObject({ step: "services", branchId: "br_1" });
    // Al verificar el código en el pago se sabe quién es sin moverse de pantalla.
    const atPayment = bookingReducer(started, { type: "goTo", step: "payment" });
    expect(bookingReducer(atPayment, { type: "signedIn", customer: { phone: "+57 320 217 2738" } as BookingCustomer, token: "t" })).toMatchObject({ step: "payment", token: "t" });
  });
});
