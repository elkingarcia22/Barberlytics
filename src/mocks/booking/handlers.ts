import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { db } from "../db";
import { localIso, parseClock, type MockAppointment, type MockClient } from "../calendar/seed";
import { appointmentsOn } from "../calendar/handlers";
import { profileOf, saveProfile } from "../customers/handlers";
import { cancellationTerms, computeTotals, findPromo, promoDiscount, tipAmount } from "@/features/booking/pricing";
import {
  availability,
  barberFree,
  branchDetail,
  barberPrice,
  bookableBarbers,
  bookedOf,
  bookingRules,
  catalog,
  clientByPhone,
  customerOf,
  durationOf,
  findReservationLine,
  isBlockedPhone,
  myAppointments,
  reservationView,
  serviceName,
  shop,
  taxPercent,
  tipOptions,
  visitSuggestion,
} from "./logic";
import { DECLINED_CARD, DEMO_GUESTS, DEMO_GUESTS_CLIENT, DEMO_OTP, type MockBookingLine, type MockReservation } from "./state";

/**
 * La reserva en línea del backend simulado (docs/API_CONTRACT.md, «Reserva en
 * línea»). Pública: no pide la sesión de la app. «Mis citas» pide un código
 * por SMS y responde con un token propio en `x-booking-token`; sin él, 403
 * (no 401: un 401 cerraría la sesión de quien esté dentro de la app).
 */

const BASE = "*/api/booking";
const LATENCY_MS = 250;
const PAY_LATENCY_MS = 900;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const START = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const error = (status: number, code: string, message: string, extra?: Record<string, unknown>) => HttpResponse.json({ code, message, ...extra }, { status });
const asRecord = (body: DefaultBodyType): Record<string, unknown> => (body && typeof body === "object" ? (body as Record<string, unknown>) : {});
const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);
const findClient = (id: string) => db.calendar.clients.find((client) => client.id === id);

function sessionClient(request: Request): MockClient | null {
  const token = request.headers.get("x-booking-token");
  const clientId = token ? db.bookingSessions.get(token) : undefined;
  return clientId ? findClient(clientId) ?? null : null;
}

/** Luhn: la misma comprobación que hace la pasarela antes de hablar con el banco. */
function validCard(number: string): boolean {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  [...digits].reverse().forEach((char, index) => {
    let value = Number(char);
    if (index % 2 === 1) value = value * 2 > 9 ? value * 2 - 9 : value * 2;
    sum += value;
  });
  return sum % 10 === 0;
}

const brandOf = (number: string): string => (number.startsWith("4") ? "Visa" : number.startsWith("5") ? "Mastercard" : number.startsWith("3") ? "Amex" : "Tarjeta");

interface PlannedItem {
  guestName: string | null;
  guestRelation: string | null;
  serviceIds: string[];
  barberId: string;
  noPreference: boolean;
  day: string;
  time: string;
  durationMin: number;
  price: number;
}

/** Comprueba cada cita y, sin preferencia, le asigna el primer barbero libre (en el orden del calendario). */
function planItems(branchId: string, items: unknown[], client: MockClient): { planned: PlannedItem[] } | { problem: string } {
  const planned: PlannedItem[] = [];
  const taken: { barberId: string; day: string; start: number; end: number }[] = [];
  const minNotice = bookingRules().minNoticeMinutes;
  for (const raw of items) {
    const item = asRecord(raw as DefaultBodyType);
    const serviceIds = strings(item.serviceIds);
    const start = text(item.start);
    if (serviceIds.length === 0) return { problem: "Cada cita necesita al menos un servicio." };
    if (!START.test(start)) return { problem: "Elige fecha y hora para cada cita." };
    const day = start.slice(0, 10);
    const time = start.slice(11, 16);
    const minute = parseClock(time);
    if (new Date(start).getTime() < Date.now() + minNotice * 60_000) return { problem: "Esa hora ya no se puede reservar. Elige otra." };
    const durationMin = durationOf(serviceIds);
    appointmentsOn(branchId, day);
    const overlapsTaken = (barberId: string) => taken.some((slot) => slot.barberId === barberId && slot.day === day && minute < slot.end && slot.start < minute + durationMin);
    const wanted = text(item.barberId);
    const candidates = bookableBarbers(branchId).filter((barber) => (wanted ? barber.id === wanted : true) && serviceIds.every((id) => barberPrice(barber.id, id) !== null));
    const chosen = candidates.find((barber) => !overlapsTaken(barber.id) && barberFree(branchId, barber.id, day, minute, durationMin));
    if (!chosen) return { problem: wanted ? "El barbero no está disponible a esa hora. Por favor elige otra." : "Ese horario acaba de ser tomado. Por favor elige otro." };
    taken.push({ barberId: chosen.id, day, start: minute, end: minute + durationMin });
    const guestId = text(item.guestId);
    const guest = guestId ? profileOf(client).guests.find((entry) => entry.id === guestId) : undefined;
    const guestName = guest?.name ?? (text(item.guestName) || null);
    planned.push({
      guestName,
      guestRelation: guest?.relation ?? (guestName ? text(item.guestRelation) || null : null),
      serviceIds,
      barberId: chosen.id,
      noPreference: !wanted,
      day,
      time,
      durationMin,
      price: serviceIds.reduce((sum, id) => sum + (barberPrice(chosen.id, id) ?? 0), 0),
    });
  }
  return { planned };
}

/** Los invitados nuevos quedan guardados en la ficha del cliente para la próxima vez. */
function rememberGuests(client: MockClient, planned: readonly PlannedItem[]) {
  const profile = profileOf(client);
  const known = new Set(profile.guests.map((guest) => guest.name.toLowerCase()));
  const fresh = planned.filter((item) => item.guestName && !known.has(item.guestName.toLowerCase()));
  if (fresh.length === 0) return;
  const guests = [...profile.guests, ...fresh.map((item, index) => ({ id: `gst_${Date.now().toString(36)}_${index}`, name: item.guestName as string, relation: item.guestRelation ?? "", visits: 0 }))];
  saveProfile(client.id, { ...profile, guests });
}

/** La clienta de la demo llega con su hijo y su pareja guardados en la ficha (una sola vez). */
function seedDemoGuests(client: MockClient | undefined) {
  if (!client || client.id !== DEMO_GUESTS_CLIENT || db.booking.demoGuestsSeeded) return;
  const profile = profileOf(client);
  if (profile.guests.length === 0) saveProfile(client.id, { ...profile, guests: DEMO_GUESTS.map((guest) => ({ ...guest })) });
  db.booking = { ...db.booking, demoGuestsSeeded: true };
  db.persist();
}

export const bookingHandlers = [
  http.get(`${BASE}/shop`, async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json(shop());
  }),

  http.get(`${BASE}/branches/:id`, async ({ params }) => {
    await delay(LATENCY_MS);
    const detail = branchDetail(String(params.id));
    return detail ? HttpResponse.json(detail) : error(404, "not_found", "Esa sede no existe.");
  }),

  http.get(`${BASE}/catalog`, async ({ request }) => {
    await delay(LATENCY_MS);
    const branchId = new URL(request.url).searchParams.get("branchId") ?? "";
    if (!shop().branches.some((branch) => branch.id === branchId)) return error(404, "not_found", "Esa sede no existe.");
    return HttpResponse.json(catalog(branchId));
  }),

  http.get(`${BASE}/availability`, async ({ request }) => {
    await delay(LATENCY_MS);
    const url = new URL(request.url);
    const branchId = url.searchParams.get("branchId") ?? "";
    const date = url.searchParams.get("date") ?? "";
    const serviceIds = (url.searchParams.get("serviceIds") ?? "").split(",").filter(Boolean);
    const barberId = url.searchParams.get("barberId");
    const exclude = url.searchParams.get("exclude") ?? undefined;
    if (!DAY_KEY.test(date)) return error(422, "validation", "La fecha debe ser AAAA-MM-DD.");
    if (serviceIds.length === 0) return error(422, "validation", "Elige al menos un servicio.");
    return HttpResponse.json({ date, slots: availability(branchId, date, serviceIds, barberId, exclude) });
  }),

  http.post(`${BASE}/lookup`, async ({ request }) => {
    await delay(LATENCY_MS);
    const phone = text(asRecord(await request.json().catch(() => ({}))).phone);
    if (phone.replace(/\D/g, "").length < 8) return error(422, "validation", "Escribe un celular válido.", { fields: { phone: ["Escribe un celular válido."] } });
    const client = clientByPhone(phone);
    if (isBlockedPhone(phone, client)) return HttpResponse.json({ status: "blocked" });
    seedDemoGuests(client);
    return HttpResponse.json(client ? { status: "known", customer: customerOf(client) } : { status: "new" });
  }),

  http.get(`${BASE}/customers/:id/suggestion`, async ({ params }) => {
    await delay(LATENCY_MS);
    const client = findClient(String(params.id));
    if (!client) return error(404, "not_found", "Ese cliente no existe.");
    // Sin ritmo de visitas todavía (cliente nuevo) no hay nada que proponer.
    return HttpResponse.json({ suggestion: visitSuggestion(client) });
  }),

  http.post(`${BASE}/customers`, async ({ request }) => {
    await delay(LATENCY_MS);
    const input = asRecord(await request.json().catch(() => ({})));
    const phone = text(input.phone);
    const firstName = text(input.firstName);
    const lastName = text(input.lastName);
    const email = text(input.email);
    const fields: Record<string, string[]> = {};
    if (firstName.length < 2) fields.firstName = ["Escribe tu nombre."];
    if (lastName.length < 2) fields.lastName = ["Escribe tu apellido."];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = ["Revisa el correo."];
    if (phone.replace(/\D/g, "").length < 8) fields.phone = ["Escribe un celular válido."];
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const existing = clientByPhone(phone);
    if (existing) return HttpResponse.json(customerOf(existing));
    const client: MockClient = { id: `cli_web_${Date.now().toString(36)}`, name: `${firstName} ${lastName}`, phone, type: "new", visits: 0, cancellations: 0, noShows: 0, lastVisitAt: null, preferredBarberId: null, visitEveryDays: null, notes: [], avatarUrl: null };
    db.calendar.clients = [...db.calendar.clients, client];
    saveProfile(client.id, { ...profileOf(client), email, onlineOnly: false, blocked: false, guests: [], createdAt: new Date().toISOString() });
    return HttpResponse.json(customerOf(client), { status: 201 });
  }),

  http.post(`${BASE}/promo`, async ({ request }) => {
    await delay(LATENCY_MS);
    const input = asRecord(await request.json().catch(() => ({})));
    const client = findClient(text(input.customerId));
    const result = findPromo(text(input.code), { isNewClient: client ? customerOf(client).isNew : true, appointments: Number(input.appointments) || 1 });
    if ("problem" in result) return error(422, "promo_invalid", "Ese cupón no aplica.", { problem: result.problem });
    return HttpResponse.json(result.promo);
  }),

  http.post(`${BASE}/reservations`, async ({ request }) => {
    await delay(PAY_LATENCY_MS);
    const input = asRecord(await request.json().catch(() => ({})));
    const client = findClient(text(input.customerId));
    if (!client) return error(404, "not_found", "No encontramos tu perfil. Empieza de nuevo.");
    const branchId = text(input.branchId);
    const items = Array.isArray(input.items) ? input.items : [];
    if (items.length === 0) return error(422, "validation", "Aún no hay citas.");
    const plan = planItems(branchId, items, client);
    if ("problem" in plan) return error(409, "conflict", plan.problem);
    const productLines = (Array.isArray(input.products) ? input.products : []).map((raw) => asRecord(raw as DefaultBodyType)).flatMap((line) => {
      const product = db.products.items.find((item) => item.id === text(line.productId));
      const qty = Math.max(0, Math.floor(Number(line.qty) || 0));
      return product && qty > 0 ? [{ productId: product.id, name: product.name, qty, price: product.price }] : [];
    });
    const servicesTotal = plan.planned.reduce((sum, item) => sum + item.price, 0);
    const productsTotal = productLines.reduce((sum, line) => sum + line.price * line.qty, 0);
    const customer = customerOf(client);
    const promoResult = text(input.promoCode) ? findPromo(text(input.promoCode), { isNewClient: customer.isNew, appointments: plan.planned.length }) : null;
    const promo = promoResult && "promo" in promoResult ? promoResult.promo : null;
    const tip = tipOptions().options.find((option) => option.id === text(input.tipId)) ?? null;
    const totals = computeTotals({ services: servicesTotal, products: productsTotal, discount: promoDiscount(promo, servicesTotal + productsTotal), taxPercent: taxPercent(), tip: tipAmount(tip, servicesTotal) });

    const method = text(input.method) as MockReservation["payment"]["method"];
    const rules = bookingRules();
    let payment: MockReservation["payment"];
    if (method === "shop") {
      if (!rules.paymentMethods.payAtShop || customer.onlineOnly) return error(422, "validation", "Esta reserva se paga en línea.");
      payment = { method, status: "pending", last4: null, brand: null, paid: 0 };
    } else if (method === "credit") {
      if (customer.credit < totals.total) return error(422, "validation", "Tu saldo a favor no alcanza para esta reserva.");
      db.booking.credits = { ...db.booking.credits, [client.id]: Math.round((customer.credit - totals.total) * 100) / 100 };
      payment = { method, status: "paid", last4: null, brand: null, paid: totals.total };
    } else if (method === "card" || method === "wallet") {
      if (!rules.paymentMethods.card) return error(422, "validation", "Esta barbería no cobra en línea.");
      const card = asRecord(input.card as DefaultBodyType);
      const number = method === "wallet" ? "4242424242424242" : text(card.number).replace(/\D/g, "");
      if (!validCard(number)) return error(422, "card_invalid", "Revisa el número de la tarjeta.", { fields: { card: ["Revisa el número de la tarjeta."] } });
      if (number === DECLINED_CARD) return error(402, "card_declined", "El banco rechazó la tarjeta. Prueba con otra o paga en la barbería.");
      payment = { method, status: "paid", last4: number.slice(-4), brand: method === "wallet" ? "Wallet" : brandOf(number), paid: totals.total };
    } else {
      return error(422, "validation", "Elige cómo vas a pagar.");
    }

    const reservationId = `rsv_${Date.now().toString(36)}`;
    const paidShare = payment.paid === 0 ? 0 : payment.paid / Math.max(1, totals.total);
    const notes = text(input.notes) || null;
    const created: MockAppointment[] = plan.planned.map((item, index) => ({
      id: `apt_web_${Date.now().toString(36)}_${index}`,
      branchId,
      clientId: client.id,
      barberId: item.barberId,
      requestedBarberId: item.noPreference ? null : item.barberId,
      serviceIds: item.serviceIds,
      products: index === 0 ? productLines.map((line) => ({ productId: line.productId, qty: line.qty })) : [],
      start: localIso(item.day, item.time),
      durationMin: item.durationMin,
      status: "scheduled",
      barberReady: false,
      walkIn: false,
      source: "online",
      repeat: "none",
      seriesId: null,
      notes: [item.guestName ? `Para ${item.guestName}${item.guestRelation ? ` (${item.guestRelation})` : ""}` : null, notes].filter(Boolean).join(" · ") || null,
      createdAt: new Date().toISOString(),
      createdBy: "Reserva en línea",
      history: [{ id: `h_${Math.random().toString(36).slice(2, 9)}`, at: new Date().toISOString(), actor: client.name, event: "created" }],
      payment: null,
    }));
    const lines: MockBookingLine[] = plan.planned.map((item, index) => ({ appointmentId: created[index].id, guestName: item.guestName, guestRelation: item.guestRelation, price: item.price, paid: Math.round(item.price * paidShare * 100) / 100, noPreference: item.noPreference }));
    const reservation: MockReservation = {
      id: reservationId,
      number: `BL-${String(1000 + db.booking.reservations.length + 1)}`,
      createdAt: new Date().toISOString(),
      customerId: client.id,
      branchId,
      lines,
      products: productLines,
      promoCode: promo?.code ?? null,
      totals,
      payment,
    };
    db.calendar.appointments = [...created, ...db.calendar.appointments];
    db.booking.reservations = [reservation, ...db.booking.reservations];
    rememberGuests(client, plan.planned);
    db.persist();
    return HttpResponse.json(reservationView(reservation), { status: 201 });
  }),

  http.post(`${BASE}/otp/request`, async ({ request }) => {
    await delay(LATENCY_MS);
    const phone = text(asRecord(await request.json().catch(() => ({}))).phone);
    const client = clientByPhone(phone);
    if (!client) return error(404, "not_found", "No encontramos citas con ese celular.");
    return HttpResponse.json({ sentTo: client.phone.replace(/\d(?=\d{4})/g, "•") });
  }),

  http.post(`${BASE}/otp/verify`, async ({ request }) => {
    await delay(LATENCY_MS);
    const input = asRecord(await request.json().catch(() => ({})));
    const client = clientByPhone(text(input.phone));
    if (!client) return error(404, "not_found", "No encontramos citas con ese celular.");
    if (text(input.code) !== DEMO_OTP) return error(422, "otp_invalid", "Ese código no es. Revisa el SMS e inténtalo otra vez.", { fields: { code: ["Código incorrecto."] } });
    const token = `bk_${Math.random().toString(36).slice(2)}`;
    db.bookingSessions.set(token, client.id);
    return HttpResponse.json({ token, customer: customerOf(client) });
  }),

  http.get(`${BASE}/me/appointments`, async ({ request }) => {
    await delay(LATENCY_MS);
    const client = sessionClient(request);
    if (!client) return error(403, "booking_session", "Vuelve a pedir el código para ver tus citas.");
    return HttpResponse.json(myAppointments(client.id));
  }),

  http.patch(`${BASE}/appointments/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const client = sessionClient(request);
    if (!client) return error(403, "booking_session", "Vuelve a pedir el código para cambiar tus citas.");
    const existing = db.calendar.appointments.find((item) => item.id === params.id && item.clientId === client.id);
    if (!existing) return error(404, "not_found", "Esa cita no existe.");
    const input = asRecord(await request.json().catch(() => ({})));
    const start = text(input.start);
    if (!START.test(start)) return error(422, "validation", "Elige fecha y hora.");
    const terms = cancellationTerms({ start: new Date(existing.start), now: new Date(), cancelHours: bookingRules().cancelHours, lateFeePercent: 0, price: 0, paid: 0 });
    if (!terms.isFree) return error(409, "too_late", `Ya no se puede cambiar en línea: faltan menos de ${bookingRules().cancelHours} h. Llama a la barbería.`);
    const day = start.slice(0, 10);
    const minute = parseClock(start.slice(11, 16));
    const wanted = text(input.barberId);
    const candidates = bookableBarbers(existing.branchId).filter((barber) => (wanted ? barber.id === wanted : true) && existing.serviceIds.every((id) => barberPrice(barber.id, id) !== null));
    appointmentsOn(existing.branchId, day);
    const chosen = candidates.find((barber) => barberFree(existing.branchId, barber.id, day, minute, existing.durationMin, existing.id));
    if (!chosen) return error(409, "conflict", "Ese horario ya no está disponible. Por favor elige otro.");
    const updated: MockAppointment = { ...existing, start: localIso(day, start.slice(11, 16)), barberId: chosen.id, history: [...existing.history, { id: `h_${Math.random().toString(36).slice(2, 9)}`, at: new Date().toISOString(), actor: client.name, event: `moved:${start}` }] };
    db.calendar.appointments = db.calendar.appointments.map((item) => (item.id === updated.id ? updated : item));
    db.persist();
    return HttpResponse.json(bookedOf(updated));
  }),

  http.post(`${BASE}/appointments/:id/cancel`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const client = sessionClient(request);
    if (!client) return error(403, "booking_session", "Vuelve a pedir el código para cancelar.");
    const existing = db.calendar.appointments.find((item) => item.id === params.id && item.clientId === client.id);
    if (!existing || existing.status !== "scheduled") return error(404, "not_found", "Esa cita ya no se puede cancelar.");
    const rules = bookingRules();
    const done = db.booking.cancellations[client.id] ?? 0;
    if (done >= rules.maxCancellations) return error(409, "limit", "Llegaste al límite de cancelaciones en línea. Llama a la barbería.");
    const view = bookedOf(existing);
    const terms = cancellationTerms({ start: new Date(existing.start), now: new Date(), cancelHours: rules.cancelHours, lateFeePercent: rules.lateFeePercent, price: view.price, paid: view.paid });
    if (terms.isPast) return error(409, "too_late", "Esa cita ya empezó.");
    const wantsCredit = text(asRecord(await request.json().catch(() => ({}))).refundTo) === "credit";
    const refundTo = terms.refund === 0 ? "none" : wantsCredit ? "credit" : "card";
    if (refundTo === "credit") db.booking.credits = { ...db.booking.credits, [client.id]: Math.round(((db.booking.credits[client.id] ?? 0) + terms.refund) * 100) / 100 };
    db.booking.cancellations = { ...db.booking.cancellations, [client.id]: done + 1 };
    const link = findReservationLine(existing.id);
    if (link) {
      const reservation = { ...link.reservation, lines: link.reservation.lines.map((line) => (line.appointmentId === existing.id ? { ...line, paid: 0 } : line)) };
      db.booking.reservations = db.booking.reservations.map((item) => (item.id === reservation.id ? reservation : item));
    }
    const updated: MockAppointment = { ...existing, status: "cancelled", history: [...existing.history, { id: `h_${Math.random().toString(36).slice(2, 9)}`, at: new Date().toISOString(), actor: client.name, event: "status:cancelled" }] };
    db.calendar.appointments = db.calendar.appointments.map((item) => (item.id === updated.id ? updated : item));
    db.persist();
    return HttpResponse.json({ appointment: bookedOf(updated), fee: terms.fee, refund: terms.refund, refundTo });
  }),

  http.post(`${BASE}/reservations/:id/receipt`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const reservation = db.booking.reservations.find((item) => item.id === params.id);
    if (!reservation) return error(404, "not_found", "Ese recibo no existe.");
    const input = asRecord(await request.json().catch(() => ({})));
    const channel = text(input.channel) === "sms" ? "sms" : "email";
    const to = text(input.to);
    if (channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return error(422, "validation", "Revisa el correo.", { fields: { to: ["Revisa el correo."] } });
    if (channel === "sms" && to.replace(/\D/g, "").length < 8) return error(422, "validation", "Revisa el celular.", { fields: { to: ["Revisa el celular."] } });
    return HttpResponse.json({ channel, to });
  }),
];

/** Para las pruebas: el nombre de un servicio tal como sale en el recibo. */
export const bookingServiceName = serviceName;
