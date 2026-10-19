import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { cartTotals } from "@/features/branches/tax";
import { ACCOUNTS, db } from "../db";
import { withRisk } from "./risk";
import { moveStock, releaseAppointmentStock, syncAppointmentStock } from "../inventory/stock";
import { itemTaxPercent, taxInclusive } from "../settings/branchRules";
import { appointmentAccount } from "./account";
import { cancelMessages, newConfirmToken, offerFreedSlot, rescheduleMessages, scheduleMessages } from "../booking/reminders";
import { productPriceIn, servicePriceIn } from "../catalogPrices";
import { barbersOf, isBarberRole, memberName, type MockTeamMember } from "../team/seed";
import type { MockCatalogService } from "../services/seed";
import type { MockCatalogProduct } from "../products/seed";
import {
  WALK_IN_CLIENT,
  blockAppliesOn,
  clockOf,
  dateKey,
  localIso,
  parseClock,
  seedDay,
  type MockAppointment,
  type MockAppointmentStatus,
  type MockBarber,
  type MockBlockCategory,
  type MockBlockRepeat,
  type MockClientNote,
  type MockHistoryEntry,
  type MockPaymentMethod,
  type MockProduct,
  type MockService,
  type MockRepeatRule,
  type MockTimeBlock,
  type MockWaitlistEntry,
} from "./seed";

/**
 * Los endpoints del calendario del backend simulado. Reproducen
 * docs/API_CONTRACT.md (sección «Calendario»): el día de una sucursal, la
 * ocupación del mes, el catálogo, y las mutaciones de una cita desde que se
 * agenda hasta que se cobra.
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY = /^\d{4}-\d{2}$/;
const CLOCK = /^\d{2}:\d{2}$/;
const STATUSES: readonly MockAppointmentStatus[] = ["scheduled", "arrived", "seated", "paid", "no_show", "cancelled"];
const REPEATS: readonly MockRepeatRule[] = ["none", "weekly", "biweekly", "triweekly", "monthly", "bimonthly", "quarterly"];
const BLOCK_CATEGORIES: readonly MockBlockCategory[] = ["sick", "vacation", "holiday", "lunch", "meeting", "business", "personal"];
const BLOCK_REPEATS: readonly MockBlockRepeat[] = ["none", "daily", "weekly", "monthly"];
const METHODS: readonly MockPaymentMethod[] = ["cash", "card", "link", "mixed"];
/** Cuántas citas crea una serie repetida. */
const SERIES_LENGTH = 12;
const REPEAT_DAYS: Record<Exclude<MockRepeatRule, "none">, { days?: number; months?: number }> = {
  weekly: { days: 7 },
  biweekly: { days: 14 },
  triweekly: { days: 21 },
  monthly: { months: 1 },
  bimonthly: { months: 2 },
  quarterly: { months: 3 },
};

function error(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return HttpResponse.json({ code, message, ...extra }, { status });
}

function requireAuth(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const accountId = token ? db.sessions.get(token) : undefined;
  return ACCOUNTS.find((item) => item.id === accountId) ?? null;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;
const asRecord = (body: DefaultBodyType): Record<string, unknown> => (body && typeof body === "object" ? (body as Record<string, unknown>) : {});
const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/** El horario fijo de una persona, como franjas por día de la semana. */
function fixedHours(member: MockTeamMember): MockBarber["workingHours"] {
  return Object.fromEntries(
    Object.entries(member.schedule)
      .filter(([, range]) => range !== null)
      .map(([day, range]) => [Number(day), [range as { start: string; end: string }]])
  );
}

/** Las franjas de una persona un día concreto: la excepción de esa fecha o su horario fijo. */
export function hoursOn(member: MockTeamMember, day: string): { start: string; end: string }[] {
  const override = db.team.overrides.find((item) => item.memberId === member.id && item.date === day);
  if (override) return override.range ? [override.range] : [];
  const range = member.schedule[String(new Date(`${day}T00:00:00`).getDay())];
  return range ? [range] : [];
}

/** Los barberos activos de la sucursal, en su orden de calendario, como los ve la agenda. */
export function barbersIn(branchId: string): MockBarber[] {
  const order = db.team.orders.find((item) => item.branchId === branchId);
  return barbersOf(db.team.members, db.team.orders, branchId).map((member) => ({
    id: member.id,
    branchId,
    name: memberName(member),
    avatarUrl: member.avatarUrl,
    level: db.team.levels.find((level) => level.id === member.levelId)?.name ?? null,
    workingHours: fixedHours(member),
    acceptsWalkIns: order?.walkIn.find((entry) => entry.memberId === member.id)?.enabled ?? isBarberRole(member.role),
    bookingVisible: member.bookingVisible,
    // Lo que cobra cada barbero: la cuenta de la cita va a su precio, como en la reserva en línea.
    prices: Object.fromEntries(member.services.flatMap((item) => (item.price === null ? [] : [[item.serviceId, item.price]]))),
  }));
}

const findBarber = (id: string) => db.team.members.find((member) => member.id === id && (isBarberRole(member.role) || member.isAlsoBarber));

/** Las citas de un día de una sucursal, generándolas la primera vez que se piden. */
export function appointmentsOn(branchId: string, day: string): MockAppointment[] {
  const key = `${branchId}:${day}`;
  if (!db.calendar.seededDays.includes(key)) {
    const weekday = new Date(`${day}T00:00:00`).getDay();
    const barbers = barbersIn(branchId).map((barber) => {
      const member = db.team.members.find((item) => item.id === barber.id);
      return { ...barber, workingHours: { [weekday]: member ? hoursOn(member, day) : [] } };
    });
    db.calendar.appointments.push(...seedDay({ branchId, day, barbers, clients: db.calendar.clients, now: new Date(), blocks: db.calendar.blocks.filter((block) => block.branchId === branchId && blockAppliesOn(block, day)) }));
    db.calendar.seededDays.push(key);
    db.persist();
  }
  return db.calendar.appointments.filter((item) => item.branchId === branchId && item.start.startsWith(day));
}

export const blocksOn = (branchId: string, day: string): MockTimeBlock[] =>
  db.calendar.blocks.filter((block) => block.branchId === branchId && blockAppliesOn(block, day));

const findAppointment = (id: string | readonly string[] | undefined) => db.calendar.appointments.find((item) => item.id === id);

function entry(actor: string, event: string): MockHistoryEntry {
  return { id: `h_${Math.random().toString(36).slice(2, 9)}`, at: new Date().toISOString(), actor, event };
}

/** Quien firma un cambio: la persona de la sesión o, si lo decidió el asistente, él. */
const ASSISTANT_ACTOR = "Asistente";
const actorOf = (accountName: string, input: Record<string, unknown>): string => (input.actor === "assistant" ? ASSISTANT_ACTOR : accountName);

/**
 * Por qué una cita no cabe donde se pide: otra cita viva del mismo barbero o
 * un bloqueo en el mismo tramo. La misma regla que aplica la agenda antes de
 * soltar; aquí es la última puerta, por si llega por otro camino.
 */
export function clashMessage(branchId: string, barberId: string, day: string, startMinute: number, durationMin: number, excludeId?: string): string | null {
  const end = startMinute + durationMin;
  const clash = appointmentsOn(branchId, day).find((item) => {
    if (item.id === excludeId || item.barberId !== barberId || item.status === "cancelled" || item.status === "no_show") return false;
    const start = parseClock(item.start.slice(11, 16));
    return startMinute < start + item.durationMin && start < end;
  });
  if (clash) return `Se pisa con la cita de ${db.calendar.clients.find((client) => client.id === clash.clientId)?.name ?? "otro cliente"}.`;
  const block = blocksOn(branchId, day).find((item) => item.barberId === barberId && startMinute < parseClock(item.endTime) && parseClock(item.startTime) < end);
  return block ? "Se pisa con un bloqueo del barbero." : null;
}

function replaceAppointment(updated: MockAppointment) {
  db.calendar.appointments = db.calendar.appointments.map((item) => (item.id === updated.id ? updated : item));
  db.persist();
  return HttpResponse.json(updated);
}

function addDaysIso(day: string, spec: { days?: number; months?: number }, times: number): string {
  const date = new Date(`${day}T00:00:00`);
  if (spec.days) date.setDate(date.getDate() + spec.days * times);
  if (spec.months) date.setMonth(date.getMonth() + spec.months * times);
  return dateKey(date);
}

/** Minutos de jornada de un barbero un día, y minutos reservados ese día. */
function occupancyFor(barberIds: readonly string[], branchId: string, day: string) {
  const capacity = barberIds.reduce((sum, id) => {
    const member = db.team.members.find((item) => item.id === id);
    return sum + (member ? hoursOn(member, day) : []).reduce((total, range) => total + parseClock(range.end) - parseClock(range.start), 0);
  }, 0);
  const appointments = appointmentsOn(branchId, day).filter((item) => barberIds.includes(item.barberId) && item.status !== "cancelled" && item.status !== "no_show");
  const booked = appointments.reduce((sum, item) => sum + item.durationMin, 0);
  return { occupancy: capacity === 0 ? null : Math.min(1, booked / capacity), count: appointments.length };
}

function validateAppointmentInput(body: DefaultBodyType) {
  const input = asRecord(body);
  const fields: Record<string, string[]> = {};
  const clientId = text(input.clientId);
  const barberId = text(input.barberId);
  const start = text(input.start);
  const serviceIds = Array.isArray(input.serviceIds) ? input.serviceIds.filter((id): id is string => typeof id === "string") : [];
  const repeat = (text(input.repeat) || "none") as MockRepeatRule;
  if (!db.calendar.clients.some((client) => client.id === clientId)) fields.clientId = ["Elige un cliente."];
  if (!findBarber(barberId)) fields.barberId = ["Elige un barbero."];
  if (serviceIds.length === 0 || !serviceIds.every((id) => catalogServices().some((service) => service.id === id))) fields.serviceIds = ["Elige al menos un servicio."];
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(start)) fields.start = ["Elige fecha y hora."];
  if (!REPEATS.includes(repeat)) fields.repeat = ["Repetición inválida."];
  return { fields, values: { clientId, barberId, start: start.slice(0, 16) + ":00", serviceIds, repeat, walkIn: input.walkIn === true, requestedBarberId: input.requestedBarberId === null ? null : text(input.requestedBarberId) || barberId, notes: text(input.notes) || null } };
}

/**
 * Lo que la agenda puede agendar sale del catálogo de servicios
 * (`mocks/services`): servicios y combos, con el nombre de su categoría. Para
 * validar una cita valen todos —una ya agendada conserva su servicio aunque
 * luego se desactive—; el catálogo que se ofrece solo trae los activos.
 */
const toAgenda = (item: MockCatalogService): MockService => ({ id: item.id, name: item.name, category: db.services.categories.find((category) => category.id === item.categoryId)?.name ?? "", durationMin: item.durationMin, price: item.price, imageUrl: item.imageUrl });
export const catalogServices = (): MockService[] => db.services.items.map(toAgenda);

/* Lo mismo con los productos (`mocks/products`): para cobrar vale cualquiera
   que exista; el catálogo que se ofrece solo trae los activos y vendibles. */
const toSale = (item: MockCatalogProduct): MockProduct => ({ id: item.id, name: item.name, category: db.products.categories.find((category) => category.id === item.categoryId)?.name ?? "", price: item.price, imageUrl: item.imageUrl });
const catalogProducts = (): MockProduct[] => db.products.items.map(toSale);
// El catálogo de una sucursal lleva la tasa con la que se cobra ahí: la del artículo o la de la sucursal.
const sellableIn = (branchId: string): MockProduct[] => db.products.items.filter((item) => item.sellable && item.activeBranchIds.includes(branchId)).map((item) => ({ ...toSale(item), price: productPriceIn(item.id, branchId), taxPercent: itemTaxPercent(item.taxRate, branchId) }));
const bookableIn = (branchId: string): MockService[] => db.services.items.filter((item) => item.activeBranchIds.includes(branchId)).map((item) => ({ ...toAgenda(item), price: servicePriceIn(item.id, branchId), taxPercent: itemTaxPercent(item.taxRate, branchId) }));

export const calendarHandlers = [
  http.get(`${BASE}/calendar/catalog`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const branchId = new URL(request.url).searchParams.get("branchId") ?? "ma";
    return HttpResponse.json({
      barbers: barbersIn(branchId),
      clients: db.calendar.clients,
      services: bookableIn(branchId),
      products: sellableIn(branchId),
      taxInclusive: taxInclusive(),
    });
  }),

  http.get(`${BASE}/calendar/day`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const url = new URL(request.url);
    const day = url.searchParams.get("date") ?? "";
    const branchId = url.searchParams.get("branchId") ?? "ma";
    if (!DAY_KEY.test(day)) return error(422, "validation", "La fecha debe ser AAAA-MM-DD.", { fields: { date: ["Fecha inválida."] } });
    const hours = Object.fromEntries(barbersIn(branchId).map((barber) => [barber.id, hoursOn(db.team.members.find((member) => member.id === barber.id)!, day)]));
    // Cada cita por atender lleva su riesgo de no venir (ver risk.ts).
    const now = new Date();
    return HttpResponse.json({ date: day, appointments: appointmentsOn(branchId, day).map((item) => withRisk(item, now)), blocks: blocksOn(branchId, day), hours });
  }),

  http.get(`${BASE}/calendar/month`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const url = new URL(request.url);
    const month = url.searchParams.get("month") ?? "";
    const branchId = url.searchParams.get("branchId") ?? "ma";
    const barberId = url.searchParams.get("barberId");
    if (!MONTH_KEY.test(month)) return error(422, "validation", "El mes debe ser AAAA-MM.", { fields: { month: ["Mes inválido."] } });
    const barberIds = barberId ? [barberId] : barbersIn(branchId).map((barber) => barber.id);
    const [year, monthIndex] = month.split("-").map(Number);
    const daysInMonth = new Date(year, monthIndex, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, index) => {
      const day = `${month}-${String(index + 1).padStart(2, "0")}`;
      return { date: day, ...occupancyFor(barberIds, branchId, day) };
    });
    return HttpResponse.json({ month, days });
  }),

  http.post(`${BASE}/appointments`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    const rawBody = (await request.json().catch(() => ({}))) as DefaultBodyType;
    const { fields, values } = validateAppointmentInput(rawBody);
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const barberMember = findBarber(values.barberId)!;
    const barber = { id: barberMember.id, branchId: barberMember.branchIds[0] ?? "ma", name: memberName(barberMember) };
    const durationMin = values.serviceIds.reduce((sum, id) => sum + (catalogServices().find((service) => service.id === id)?.durationMin ?? 0), 0);
    const day = values.start.slice(0, 10);
    const time = values.start.slice(11, 16);
    appointmentsOn(barber.branchId, day);
    const body = asRecord(rawBody);
    const clash = body.force === true ? null : clashMessage(barber.branchId, values.barberId, day, parseClock(time), durationMin);
    if (clash) return error(409, "conflict", clash, { fields: { start: [clash] } });
    const seriesId = values.repeat === "none" ? null : `ser_${Date.now().toString(36)}`;
    const occurrences = values.repeat === "none" ? 1 : SERIES_LENGTH;
    const created: MockAppointment[] = [];
    for (let index = 0; index < occurrences; index += 1) {
      const occurrenceDay = index === 0 ? day : addDaysIso(day, REPEAT_DAYS[values.repeat as Exclude<MockRepeatRule, "none">], index);
      appointmentsOn(barber.branchId, occurrenceDay);
      const id = `apt_${Date.now().toString(36)}_${index}`;
      created.push({
        id,
        branchId: barber.branchId,
        clientId: values.clientId,
        barberId: values.barberId,
        requestedBarberId: values.requestedBarberId,
        serviceIds: values.serviceIds,
        products: [],
        start: localIso(occurrenceDay, time),
        durationMin,
        status: "scheduled",
        barberReady: false,
        walkIn: values.walkIn,
        source: values.walkIn ? "walkin" : "internal",
        repeat: values.repeat,
        seriesId,
        notes: values.notes,
        createdAt: new Date().toISOString(),
        createdBy: account.user.name,
        history: [entry(account.user.name, values.walkIn ? "walkin" : "created")],
        payment: null,
        confirmToken: newConfirmToken(),
      });
    }
    db.calendar.appointments = [...created, ...db.calendar.appointments];
    // Como la reserva en línea: confirmación y recordatorios por WhatsApp. Un cliente sin cita (ya está aquí) no los necesita.
    const phone = db.calendar.clients.find((client) => client.id === values.clientId)?.phone;
    if (!values.walkIn && phone) for (const appointment of created) scheduleMessages(appointment, phone);
    db.persist();
    return HttpResponse.json(created[0], { status: 201 });
  }),

  http.patch(`${BASE}/appointments/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    const existing = findAppointment(params.id);
    if (!existing) return error(404, "not_found", "Esa cita no existe.");
    const input = asRecord(await request.json().catch(() => ({})));
    const actor = actorOf(account.user.name, input);
    const fields: Record<string, string[]> = {};
    const history = [...existing.history];
    let next: MockAppointment = { ...existing };

    if (typeof input.status === "string") {
      if (!STATUSES.includes(input.status as MockAppointmentStatus)) fields.status = ["Estado inválido."];
      else if (existing.status === "paid" && input.status !== "paid") fields.status = ["Una cita cobrada no cambia de estado."];
      else {
        next = { ...next, status: input.status as MockAppointmentStatus };
        history.push(entry(actor, `status:${input.status}`));
      }
    }
    if (typeof input.barberReady === "boolean") {
      next = { ...next, barberReady: input.barberReady };
      if (input.barberReady) history.push(entry(actor, "barber_ready"));
    }
    if (typeof input.start === "string") {
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(input.start)) fields.start = ["Fecha inválida."];
      else {
        next = { ...next, start: input.start.slice(0, 16) + ":00" };
        history.push(entry(actor, `moved:${input.start.slice(0, 16)}`));
      }
    }
    if (typeof input.barberId === "string" && input.barberId !== existing.barberId) {
      const barber = findBarber(input.barberId);
      if (!barber) fields.barberId = ["Ese barbero no existe."];
      else {
        next = { ...next, barberId: barber.id };
        history.push(entry(actor, `barber:${memberName(barber)}`));
      }
    }
    if (typeof input.durationMin === "number") {
      if (input.durationMin < 15 || input.durationMin > 480) fields.durationMin = ["La duración va de 15 minutos a 8 horas."];
      else {
        next = { ...next, durationMin: input.durationMin };
        history.push(entry(actor, `duration:${input.durationMin}`));
      }
    }
    if (Array.isArray(input.serviceIds)) {
      const serviceIds = input.serviceIds.filter((id): id is string => typeof id === "string" && catalogServices().some((service) => service.id === id));
      if (serviceIds.length === 0) fields.serviceIds = ["Elige al menos un servicio."];
      else next = { ...next, serviceIds, durationMin: serviceIds.reduce((sum, id) => sum + (catalogServices().find((service) => service.id === id)?.durationMin ?? 0), 0) };
    }
    if (input.notes !== undefined) next = { ...next, notes: text(input.notes) || null };
    if (input.linkId !== undefined) {
      const linkId = typeof input.linkId === "string" && input.linkId.trim() !== "" ? input.linkId.trim() : null;
      if ((existing.linkId ?? null) !== linkId) {
        next = { ...next, linkId };
        history.push(entry(actor, linkId ? "linked" : "unlinked"));
      }
    }
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    // Si cambió de sitio, de barbero o de duración, no puede pisar a nadie.
    const moved = next.start !== existing.start || next.barberId !== existing.barberId || next.durationMin !== existing.durationMin;
    if (moved && input.force !== true && next.status !== "cancelled" && next.status !== "no_show") {
      const clash = clashMessage(existing.branchId, next.barberId, next.start.slice(0, 10), parseClock(next.start.slice(11, 16)), next.durationMin, existing.id);
      if (clash) return error(409, "conflict", clash, { fields: { start: [clash] } });
    }
    // Recepción marca la confirmación (por teléfono, en persona) o la deja sin confirmar.
    if (input.confirmation === "confirmed" || input.confirmation === "pending") {
      next = { ...next, confirmation: input.confirmation === "confirmed" ? { status: "confirmed", at: new Date().toISOString(), via: "reception" } : null };
      history.push(entry(actor, input.confirmation === "confirmed" ? "confirmed" : "unconfirmed"));
    }
    const reason = text(input.reason);
    if (reason) history.push(entry(actor, `reason:${reason}`));
    // Los mensajes siguen a la cita: moverla los reprograma; cancelarla los anula y ofrece el hueco a la lista de espera.
    const phone = db.calendar.clients.find((client) => client.id === existing.clientId)?.phone;
    if ((next.status === "cancelled" || next.status === "no_show") && existing.status !== next.status) {
      cancelMessages(existing.id);
      if (next.status === "cancelled") offerFreedSlot(existing);
      // Lo que tenía apartado del inventario vuelve a la estantería.
      next = releaseAppointmentStock(next, actor);
    } else if (next.start !== existing.start && next.status === "scheduled" && phone) rescheduleMessages({ ...next, confirmToken: next.confirmToken ?? newConfirmToken() }, phone);
    return replaceAppointment({ ...next, confirmToken: next.confirmToken ?? newConfirmToken(), history });
  }),

  http.post(`${BASE}/appointments/:id/checkout`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    const existing = findAppointment(params.id);
    if (!existing) return error(404, "not_found", "Esa cita no existe.");
    if (existing.status === "paid") return error(409, "conflict", "Esta cita ya está cobrada.");
    if (existing.status === "cancelled" || existing.status === "no_show") return error(409, "conflict", "Una cita cancelada o a la que no asistió no se cobra.");
    const input = asRecord(await request.json().catch(() => ({})));
    const method = text(input.method) as MockPaymentMethod;
    if (!METHODS.includes(method)) return error(422, "validation", "Elige cómo paga el cliente.", { fields: { method: ["Elige un método de pago."] } });
    const serviceIds = Array.isArray(input.serviceIds) ? input.serviceIds.filter((id): id is string => typeof id === "string" && catalogServices().some((service) => service.id === id)) : existing.serviceIds;
    if (serviceIds.length === 0) return error(422, "validation", "Una cuenta necesita al menos un servicio.", { fields: { serviceIds: ["Añade un servicio."] } });
    const products = Array.isArray(input.products)
      ? input.products
          .map((item) => asRecord(item as DefaultBodyType))
          .filter((item) => typeof item.productId === "string" && catalogProducts().some((product) => product.id === item.productId))
          .map((item) => ({ productId: item.productId as string, qty: Math.max(1, Number(item.qty) || 1) }))
      : existing.products;
    const tip = Math.max(0, Number(input.tip) || 0);
    const surcharge = method === "card" || method === "mixed" ? Math.max(0, Number(input.surcharge) || 0) : 0;
    // Lo pagado en la reserva en línea ya está cobrado: aquí entra solo lo que falta, con el impuesto de la sucursal.
    const bill = appointmentAccount(existing, serviceIds, products);
    const paidAt = new Date().toISOString();
    // Pago mixto: lo que entra en caja ahora se reparte entre efectivo y tarjeta, y tiene que cuadrar.
    const dueNow = round2(bill.due + tip + surcharge);
    const splitInput = asRecord(input.split as DefaultBodyType);
    const split = method === "mixed" ? { cash: round2(Math.max(0, Number(splitInput.cash) || 0)), card: round2(Math.max(0, Number(splitInput.card) || 0)) } : undefined;
    if (split && Math.abs(split.cash + split.card - dueNow) > 0.01) return error(422, "validation", "El efectivo y la tarjeta tienen que sumar lo que se cobra.", { fields: { split: ["El efectivo y la tarjeta tienen que sumar lo que se cobra."] } });
    // Lo vendido sale del inventario de la sucursal (si se reservó en línea, solo la diferencia con lo apartado).
    return replaceAppointment(
      syncAppointmentStock(
        {
          ...existing,
          serviceIds,
          products,
          status: "paid",
          payment: { method, tip: round2(bill.prepaidTip + tip), tax: bill.tax, total: round2(bill.total + bill.prepaidTip + tip + surcharge), prepaid: round2(bill.prepaid + bill.prepaidTip), paidAt, ...(split ? { split } : {}) },
          history: [...existing.history, entry(account.user.name, `paid:${method}`)],
        },
        "sale",
        account.user.name
      )
    );
  }),

  // Devolver una cuenta cobrada, entera o en parte, a efectivo o a la tarjeta.
  http.post(`${BASE}/appointments/:id/refund`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    const existing = findAppointment(params.id);
    if (!existing) return error(404, "not_found", "Esa cita no existe.");
    if (existing.status !== "paid" || !existing.payment) return error(409, "conflict", "Solo se devuelve una cuenta cobrada.");
    const input = asRecord(await request.json().catch(() => ({})));
    const amount = round2(Number(input.amount));
    const reason = text(input.reason);
    const to = text(input.to);
    // Lo que se puede devolver: lo que vale la cuenta más la propina, menos lo ya devuelto (igual que en Transacciones).
    const bill = appointmentAccount(existing);
    const refundable = round2(bill.total + existing.payment.tip - bill.refunded);
    const fields: Record<string, string[]> = {};
    if (!Number.isFinite(amount) || amount <= 0) fields.amount = ["Escribe cuánto se devuelve."];
    else if (amount > refundable) fields.amount = [`Se puede devolver hasta ${refundable}.`];
    if (reason.length < 3) fields.reason = ["Di por qué se devuelve."];
    if (to !== "cash" && to !== "card") fields.to = ["Elige a dónde vuelve el dinero."];
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const refund = { id: `rf_${Date.now().toString(36)}`, amount, to: to as "cash" | "card", reason, at: new Date().toISOString(), by: account.user.name };
    return replaceAppointment({ ...existing, refunds: [...(existing.refunds ?? []), refund], history: [...existing.history, entry(account.user.name, `refund:${amount}`)] });
  }),

  http.post(`${BASE}/clients/:id/notes`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const client = db.calendar.clients.find((item) => item.id === params.id);
    if (!client || client.id === WALK_IN_CLIENT.id) return error(404, "not_found", "Ese cliente no existe.");
    const input = asRecord(await request.json().catch(() => ({})));
    const kind = text(input.kind) as MockClientNote["kind"];
    const body = text(input.text);
    const fields: Record<string, string[]> = {};
    if (!["note", "medication", "allergy"].includes(kind)) fields.kind = ["Elige el tipo de nota."];
    if (body.length < 3) fields.text = ["Escribe la nota."];
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const note: MockClientNote = { id: `note_${Date.now().toString(36)}`, kind, text: body, createdAt: new Date().toISOString() };
    const updated = { ...client, notes: [note, ...client.notes] };
    db.calendar.clients = db.calendar.clients.map((item) => (item.id === updated.id ? updated : item));
    db.persist();
    return HttpResponse.json(updated, { status: 201 });
  }),

  // Corregir una nota: cambia su texto o su tipo; conserva la fecha en que se escribió.
  http.patch(`${BASE}/clients/:id/notes/:noteId`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const client = db.calendar.clients.find((item) => item.id === params.id);
    const current = client?.notes.find((note) => note.id === params.noteId);
    if (!client || !current) return error(404, "not_found", "Esa nota no existe.");
    const input = asRecord(await request.json().catch(() => ({})));
    const kind = (input.kind === undefined ? current.kind : text(input.kind)) as MockClientNote["kind"];
    const body = input.text === undefined ? current.text : text(input.text);
    const fields: Record<string, string[]> = {};
    if (!["note", "medication", "allergy"].includes(kind)) fields.kind = ["Elige el tipo de nota."];
    if (body.length < 3) fields.text = ["Escribe la nota."];
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const updated = { ...client, notes: client.notes.map((note) => (note.id === current.id ? { ...note, kind, text: body } : note)) };
    db.calendar.clients = db.calendar.clients.map((item) => (item.id === updated.id ? updated : item));
    db.persist();
    return HttpResponse.json(updated);
  }),

  http.delete(`${BASE}/clients/:id/notes/:noteId`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const client = db.calendar.clients.find((item) => item.id === params.id);
    if (!client || !client.notes.some((note) => note.id === params.noteId)) return error(404, "not_found", "Esa nota no existe.");
    const updated = { ...client, notes: client.notes.filter((note) => note.id !== params.noteId) };
    db.calendar.clients = db.calendar.clients.map((item) => (item.id === updated.id ? updated : item));
    db.persist();
    return HttpResponse.json(updated);
  }),

  http.post(`${BASE}/blocks`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const fields: Record<string, string[]> = {};
    const barber = findBarber(text(input.barberId));
    const category = text(input.category) as MockBlockCategory;
    const repeat = (text(input.repeat) || "none") as MockBlockRepeat;
    const startDate = text(input.startDate);
    const endDate = text(input.endDate) || startDate;
    const startTime = text(input.startTime);
    const endTime = text(input.endTime);
    if (!barber) fields.barberId = ["Elige un barbero."];
    if (!BLOCK_CATEGORIES.includes(category)) fields.category = ["Elige una categoría."];
    if (!BLOCK_REPEATS.includes(repeat)) fields.repeat = ["Repetición inválida."];
    if (!DAY_KEY.test(startDate)) fields.startDate = ["Elige la fecha de inicio."];
    if (!DAY_KEY.test(endDate) || endDate < startDate) fields.endDate = ["La fecha fin no puede ser anterior al inicio."];
    if (!CLOCK.test(startTime)) fields.startTime = ["Elige la hora de inicio."];
    if (!CLOCK.test(endTime) || parseClock(endTime) <= parseClock(startTime)) fields.endTime = ["La hora de cierre debe ser posterior a la de inicio."];
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const block: MockTimeBlock = { id: `blk_${Date.now().toString(36)}`, branchId: barber!.branchIds[0] ?? "ma", barberId: barber!.id, category, repeat, startDate, endDate, startTime, endTime, description: text(input.description) || null };
    db.calendar.blocks = [...db.calendar.blocks, block];
    db.persist();
    return HttpResponse.json(block, { status: 201 });
  }),

  http.delete(`${BASE}/blocks/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!db.calendar.blocks.some((block) => block.id === params.id)) return error(404, "not_found", "Ese bloqueo no existe.");
    db.calendar.blocks = db.calendar.blocks.filter((block) => block.id !== params.id);
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE}/waitlist`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const url = new URL(request.url);
    const branchId = url.searchParams.get("branchId") ?? "ma";
    const day = url.searchParams.get("date");
    const items = db.calendar.waitlist.filter((item) => item.branchId === branchId && (!day || item.slots.some((slot) => slot.date === day)));
    return HttpResponse.json({ items });
  }),

  http.post(`${BASE}/waitlist`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const fields: Record<string, string[]> = {};
    const clientId = text(input.clientId);
    const serviceId = text(input.serviceId);
    const barberId = text(input.barberId) || null;
    const branchId = text(input.branchId) || "ma";
    const slots = Array.isArray(input.slots)
      ? input.slots.map((slot) => asRecord(slot as DefaultBodyType)).filter((slot) => DAY_KEY.test(text(slot.date)) && CLOCK.test(text(slot.time))).map((slot) => ({ date: text(slot.date), time: text(slot.time) }))
      : [];
    if (!db.calendar.clients.some((client) => client.id === clientId)) fields.clientId = ["Elige un cliente."];
    if (!catalogServices().some((service) => service.id === serviceId)) fields.serviceId = ["Elige un servicio."];
    if (barberId && !findBarber(barberId)) fields.barberId = ["Ese barbero no existe."];
    if (slots.length === 0) fields.slots = ["Añade al menos una fecha y hora."];
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const item: MockWaitlistEntry = { id: `wl_${Date.now().toString(36)}`, branchId, clientId, serviceId, barberId, slots, createdAt: new Date().toISOString() };
    db.calendar.waitlist = [...db.calendar.waitlist, item];
    db.persist();
    return HttpResponse.json(item, { status: 201 });
  }),

  http.delete(`${BASE}/waitlist/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!db.calendar.waitlist.some((item) => item.id === params.id)) return error(404, "not_found", "Esa entrada no existe.");
    db.calendar.waitlist = db.calendar.waitlist.filter((item) => item.id !== params.id);
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${BASE}/sales`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const method = text(input.method) as MockPaymentMethod;
    const items = Array.isArray(input.items)
      ? input.items.map((item) => asRecord(item as DefaultBodyType)).filter((item) => catalogProducts().some((product) => product.id === item.productId)).map((item) => ({ productId: item.productId as string, qty: Math.max(1, Number(item.qty) || 1) }))
      : [];
    const fields: Record<string, string[]> = {};
    if (items.length === 0) fields.items = ["Elige al menos un producto."];
    if (!METHODS.includes(method)) fields.method = ["Elige un método de pago."];
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const branchId = text(input.branchId) || "ma";
    // La venta de mostrador lleva el impuesto de la sucursal donde se hace, como una cita.
    const { tax, total } = cartTotals(
      items.map((item) => {
        const product = db.products.items.find((row) => row.id === item.productId);
        return { amount: productPriceIn(item.productId, branchId) * item.qty, percent: itemTaxPercent(product?.taxRate, branchId) };
      }),
      0,
      taxInclusive()
    );
    const sale = { id: `sale_${Date.now().toString(36)}`, branchId, items, method, tax, total, paidAt: new Date().toISOString() };
    db.calendar.sales = [...db.calendar.sales, sale];
    for (const item of items) moveStock({ branchId, productId: item.productId, delta: -item.qty, reason: "sale", ref: sale.id, by: account.user.name });
    db.persist();
    return HttpResponse.json(sale, { status: 201 });
  }),
];

/** Expuesto para las pruebas: cuántos minutos dura la jornada de alguien un día. */
export const workingClock = clockOf;
