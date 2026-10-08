import { db } from "../db";
import { memberName } from "../team/seed";
import { WALK_IN_CLIENT, clockOf, dateKey, parseClock, type MockAppointment, type MockClient } from "../calendar/seed";
import { appointmentsOn, barbersIn, clashMessage, hoursOn } from "../calendar/handlers";
import { profileOf } from "../customers/handlers";
import { hashOf } from "../customers/seed";
import { BLOCKED_PHONE, DEMO_PHONES, type MockReservation } from "./state";

/**
 * Las derivaciones de la reserva en línea: lo que ve el cliente sale de lo
 * mismo que usa la app —sucursales y política de Configuración, el catálogo
 * de Servicios y Productos, el equipo con sus horarios y la agenda—, así una
 * reserva hecha aquí aparece en el Calendario y una cita de la agenda
 * ocupa la hora aquí.
 */

const COVER = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&h=900&fit=crop&auto=format&q=70";
const BRANCH_PHOTOS: Readonly<Record<string, string>> = {
  ma: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=640&h=400&fit=crop&auto=format&q=70",
  nc: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=640&h=400&fit=crop&auto=format&q=70",
  ri: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=640&h=400&fit=crop&auto=format&q=70",
  ut: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=640&h=400&fit=crop&auto=format&q=70",
};

const booking = () => db.settings.sections.booking as {
  minNotice: number;
  minNoticeUnit: string;
  slotInterval: number;
  paymentMethods: { card: boolean; payAtShop: boolean };
  cancelHours: number;
  lateFeePercent: number;
  maxCancellations: number;
  policy: string;
};

export const bookingRules = () => {
  const rules = booking();
  const unit = rules.minNoticeUnit === "hours" ? 60 : rules.minNoticeUnit === "days" ? 1440 : 1;
  return { ...rules, minNoticeMinutes: rules.minNotice * unit };
};

export const taxPercent = (): number =>
  ((db.settings.lists.taxGroups[0]?.taxes as { percent: number }[] | undefined) ?? []).reduce((sum, tax) => sum + tax.percent, 0);

export const tipOptions = () => db.settings.sections.tips as { options: { id: string; type: "percent" | "amount"; value: number }[]; defaultId: string | null };

/** Los barberos que el cliente puede elegir en una sucursal, en el orden del calendario. */
export const bookableBarbers = (branchId: string) => barbersIn(branchId).filter((barber) => barber.bookingVisible !== false);

const memberOf = (id: string) => db.team.members.find((member) => member.id === id);

/** Lo que cobra un barbero por un servicio, o `null` si no lo hace. */
export function barberPrice(barberId: string, serviceId: string): number | null {
  const member = memberOf(barberId);
  const service = db.services.items.find((item) => item.id === serviceId);
  if (!member || !service) return null;
  const override = member.services.find((item) => item.serviceId === serviceId);
  if (override && !override.offered) return null;
  return override?.price ?? service.price;
}

export const publicServicesIn = (branchId: string) =>
  db.services.items.filter((item) => item.visibility === "public" && item.activeBranchIds.includes(branchId));

export const serviceName = (id: string) => db.services.items.find((item) => item.id === id)?.name ?? id;
export const durationOf = (serviceIds: readonly string[]) =>
  serviceIds.reduce((sum, id) => sum + (db.services.items.find((item) => item.id === id)?.durationMin ?? 0), 0);

function branchHoursToday(branchId: string): { opensAt: string; closesAt: string } {
  const today = dateKey(new Date());
  const ranges = bookableBarbers(branchId).flatMap((barber) => {
    const member = memberOf(barber.id);
    return member ? hoursOn(member, today) : [];
  });
  if (ranges.length === 0) {
    const business = db.settings.sections.business as { openTime: string; closeTime: string };
    return { opensAt: business.openTime, closesAt: business.closeTime };
  }
  return {
    opensAt: clockOf(Math.min(...ranges.map((range) => parseClock(range.start)))),
    closesAt: clockOf(Math.max(...ranges.map((range) => parseClock(range.end)))),
  };
}

export function shop() {
  const rules = bookingRules();
  const tips = tipOptions();
  const company = db.settings.sections.company as { name: string; phone: string };
  const branches = (db.settings.lists.branches as unknown as { id: string; name: string; address: string; city: string; phone: string; status: string }[])
    .filter((branch) => branch.status === "active")
    .map((branch) => ({
      id: branch.id,
      name: branch.name,
      address: branch.address,
      city: branch.city,
      phone: branch.phone,
      ...branchHoursToday(branch.id),
      imageUrl: BRANCH_PHOTOS[branch.id] ?? null,
      barbers: bookableBarbers(branch.id).length,
    }));
  return {
    name: db.branding.name ?? company.name,
    logoUrl: db.branding.logo,
    coverUrl: COVER,
    phone: company.phone,
    currency: (db.settings.sections.pricing as { currency: string }).currency,
    taxPercent: taxPercent(),
    minNoticeMinutes: rules.minNoticeMinutes,
    slotMinutes: rules.slotInterval,
    cancelHours: rules.cancelHours,
    lateFeePercent: rules.lateFeePercent,
    maxCancellations: rules.maxCancellations,
    policy: rules.policy,
    tipOptions: tips.options,
    defaultTipId: tips.defaultId,
    payment: rules.paymentMethods,
    branches,
  };
}

const POPULAR = new Set(["svc_corte", "svc_combo", "svc_fade"]);

export function catalog(branchId: string) {
  const services = publicServicesIn(branchId);
  const barbers = bookableBarbers(branchId).map((barber) => {
    const member = memberOf(barber.id);
    const prices = Object.fromEntries(services.flatMap((service) => {
      const price = barberPrice(barber.id, service.id);
      return price === null ? [] : [[service.id, price]];
    }));
    const h = hashOf(barber.id, 3);
    return {
      id: barber.id,
      name: barber.name,
      avatarUrl: barber.avatarUrl,
      level: barber.level,
      description: member?.description ?? "",
      gallery: member?.gallery ?? [],
      rating: Math.round((4.6 + (h % 5) / 10) * 10) / 10,
      reviews: 24 + (h % 180),
      prices,
    };
  });
  const products = db.products.items
    .filter((item) => item.visibility === "public" && item.sellable && item.activeBranchIds.includes(branchId))
    .map((item) => ({ id: item.id, name: item.name, description: item.description, category: db.products.categories.find((category) => category.id === item.categoryId)?.name ?? "", price: item.price, imageUrl: item.imageUrl }));
  return {
    services: services.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: db.services.categories.find((category) => category.id === item.categoryId)?.name ?? "",
      durationMin: item.durationMin,
      price: item.price,
      imageUrl: item.imageUrl,
      isCombo: item.kind === "combo",
      popular: POPULAR.has(item.id),
    })),
    barbers,
    products,
  };
}

const isClosed = (branchId: string, day: string): boolean =>
  (db.settings.lists.closures as unknown as { startDate: string; endDate: string; branchIds: string[] }[]).some(
    (closure) => closure.branchIds.includes(branchId) && closure.startDate <= day && day <= closure.endDate
  );

/** ¿Puede este barbero atender a esa hora, todo el tramo, sin pisar nada? */
export function barberFree(branchId: string, barberId: string, day: string, startMinute: number, durationMin: number, excludeId?: string): boolean {
  const member = memberOf(barberId);
  if (!member) return false;
  const fits = hoursOn(member, day).some((range) => parseClock(range.start) <= startMinute && startMinute + durationMin <= parseClock(range.end));
  return fits && clashMessage(branchId, barberId, day, startMinute, durationMin, excludeId) === null;
}

/** Las horas del día con quién puede atender en cada una. */
export function availability(branchId: string, day: string, serviceIds: readonly string[], barberId: string | null, excludeId?: string) {
  if (isClosed(branchId, day)) return [];
  const rules = bookingRules();
  const durationMin = Math.max(rules.slotInterval, durationOf(serviceIds));
  appointmentsOn(branchId, day);
  const candidates = bookableBarbers(branchId).filter((barber) => (barberId ? barber.id === barberId : true) && serviceIds.every((id) => barberPrice(barber.id, id) !== null));
  const now = new Date();
  const earliest = day === dateKey(now) ? now.getHours() * 60 + now.getMinutes() + rules.minNoticeMinutes : day < dateKey(now) ? Number.MAX_SAFE_INTEGER : 0;
  const { opensAt, closesAt } = branchHoursToday(branchId);
  const slots: { time: string; barberIds: string[] }[] = [];
  for (let minute = parseClock(opensAt); minute + durationMin <= parseClock(closesAt); minute += rules.slotInterval) {
    if (minute < earliest) continue;
    const free = candidates.filter((barber) => barberFree(branchId, barber.id, day, minute, durationMin, excludeId)).map((barber) => barber.id);
    if (free.length > 0) slots.push({ time: clockOf(minute), barberIds: free });
  }
  return slots;
}

const digits = (value: string) => value.replace(/\D/g, "");

/** El cliente de la agenda con ese celular, o nada. */
export function clientByPhone(phone: string): MockClient | undefined {
  const demo = DEMO_PHONES[`+${digits(phone)}`];
  if (demo) return db.calendar.clients.find((client) => client.id === demo);
  return db.calendar.clients.find((client) => client.id !== WALK_IN_CLIENT.id && digits(client.phone) === digits(phone) && !profileOf(client).deleted);
}

export const isBlockedPhone = (phone: string, client?: MockClient): boolean =>
  `+${digits(phone)}` === BLOCKED_PHONE || (client ? profileOf(client).blocked : false);

const reservationOf = (appointmentId: string): { reservation: MockReservation; line: MockReservation["lines"][number] } | null => {
  for (const reservation of db.booking.reservations) {
    const line = reservation.lines.find((item) => item.appointmentId === appointmentId);
    if (line) return { reservation, line };
  }
  return null;
};

const isLive = (item: MockAppointment) => item.status !== "cancelled" && item.status !== "no_show";

export function customerOf(client: MockClient) {
  const profile = profileOf(client);
  const mine = db.calendar.appointments.filter((item) => item.clientId === client.id);
  const now = Date.now();
  const last = [...mine].filter((item) => item.status === "paid" || new Date(item.start).getTime() < now).sort((a, b) => b.start.localeCompare(a.start))[0];
  const barberId = last?.barberId ?? client.preferredBarberId;
  const lastVisit = last
    ? { branchId: last.branchId, serviceIds: last.serviceIds, barberId, at: last.start }
    : client.visits > 0
      ? { branchId: profile.branchId, serviceIds: ["svc_corte"], barberId, at: client.lastVisitAt ?? new Date().toISOString() }
      : null;
  return {
    id: client.id,
    firstName: client.name.split(" ")[0] ?? client.name,
    name: client.name,
    phone: client.phone,
    email: profile.email,
    isNew: client.visits === 0 && !last,
    onlineOnly: profile.onlineOnly,
    guests: profile.guests.map((guest) => ({ id: guest.id, name: guest.name, relation: guest.relation })),
    lastVisit,
    credit: db.booking.credits[client.id] ?? 0,
    upcoming: mine.filter((item) => isLive(item) && item.status === "scheduled" && new Date(item.start).getTime() >= now).length,
  };
}

/** Una cita de la agenda como la ve el cliente. */
export function bookedOf(item: MockAppointment) {
  const link = reservationOf(item.id);
  const member = memberOf(item.barberId);
  const branch = (db.settings.lists.branches as unknown as { id: string; name: string }[]).find((entry) => entry.id === item.branchId);
  const price = link?.line.price ?? item.serviceIds.reduce((sum, id) => sum + (barberPrice(item.barberId, id) ?? 0), 0);
  const status = item.status === "cancelled" ? "cancelled" : item.status === "no_show" ? "no_show" : item.status === "paid" ? "completed" : new Date(item.start).getTime() + item.durationMin * 60_000 < Date.now() ? "completed" : "scheduled";
  return {
    id: item.id,
    reservationId: link?.reservation.id ?? null,
    branchId: item.branchId,
    branchName: branch?.name ?? item.branchId,
    personName: link?.line.guestName ?? db.calendar.clients.find((client) => client.id === item.clientId)?.name ?? "",
    guestRelation: link?.line.guestRelation ?? null,
    serviceIds: item.serviceIds,
    serviceNames: item.serviceIds.map(serviceName),
    barberId: item.barberId,
    barberName: member ? memberName(member) : "",
    barberAvatarUrl: member?.avatarUrl ?? null,
    noPreference: link?.line.noPreference ?? false,
    start: item.start,
    durationMin: item.durationMin,
    price,
    paid: link?.line.paid ?? 0,
    status,
  } as const;
}

export function reservationView(reservation: MockReservation) {
  const client = db.calendar.clients.find((item) => item.id === reservation.customerId);
  const appointments = reservation.lines
    .map((line) => db.calendar.appointments.find((item) => item.id === line.appointmentId))
    .filter((item): item is MockAppointment => item !== undefined)
    .map(bookedOf);
  return {
    id: reservation.id,
    number: reservation.number,
    createdAt: reservation.createdAt,
    customerId: reservation.customerId,
    customerName: client?.name ?? "",
    email: client ? profileOf(client).email : "",
    phone: client?.phone ?? "",
    appointments,
    products: reservation.products,
    promoCode: reservation.promoCode,
    totals: reservation.totals,
    payment: reservation.payment,
  };
}

/** Las citas de un cliente, las que vienen y las que ya pasaron. */
export function myAppointments(clientId: string) {
  const now = Date.now();
  const mine = db.calendar.appointments.filter((item) => item.clientId === clientId).map(bookedOf);
  const upcoming = mine.filter((item) => item.status === "scheduled" && new Date(item.start).getTime() >= now).sort((a, b) => a.start.localeCompare(b.start));
  const past = mine.filter((item) => !upcoming.includes(item)).sort((a, b) => b.start.localeCompare(a.start)).slice(0, 12);
  const reservations = db.booking.reservations.filter((item) => item.customerId === clientId).map(reservationView);
  return { upcoming, past, reservations };
}

export const findReservationLine = reservationOf;

const DAY_MS = 86_400_000;
/** Cuántos días a partir de la fecha que le toca se buscan horas para proponer. */
const SUGGESTION_SEARCH_DAYS = 10;
const SUGGESTION_OPTIONS = 3;
/** Horas habituales de quien aún no tiene historial de horas en la agenda. */
const USUAL_FALLBACK = [600, 660, 900, 1020];

/** La hora a la que suele venir: la mediana de sus citas pasadas, o una estable por cliente. */
function usualMinute(client: MockClient): number {
  const past = db.calendar.appointments
    .filter((item) => item.clientId === client.id && isLive(item) && new Date(item.start).getTime() < Date.now())
    .map((item) => parseClock(item.start.slice(11, 16)))
    .sort((a, b) => a - b);
  if (past.length > 0) return past[Math.floor(past.length / 2)];
  return USUAL_FALLBACK[hashOf(client.id, 7) % USUAL_FALLBACK.length];
}

/**
 * La próxima cita que le toca según su frecuencia de visita (FOV): la fecha
 * es la última visita más su ritmo, y la hora, la que suele elegir, con su
 * barbero de siempre. Si ese día no hay hueco se mira hacia delante; si su
 * barbero no tiene sitio en días, con cualquiera.
 */
export function visitSuggestion(client: MockClient) {
  const customer = customerOf(client);
  const last = customer.lastVisit;
  if (!last || !client.visitEveryDays) return null;
  const lastDay = new Date(`${last.at.slice(0, 10)}T00:00:00`);
  const due = new Date(lastDay.getTime() + client.visitEveryDays * DAY_MS);
  const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const from = due.getTime() < today.getTime() ? today : due;
  const usual = usualMinute(client);
  const byCloseness = (a: { time: string }, b: { time: string }) => Math.abs(parseClock(a.time) - usual) - Math.abs(parseClock(b.time) - usual);

  const search = (barberId: string | null) => {
    const options: { start: string; barberId: string; sameBarber: boolean }[] = [];
    for (let offset = 0; offset < SUGGESTION_SEARCH_DAYS && options.length < SUGGESTION_OPTIONS; offset += 1) {
      const day = dateKey(new Date(from.getTime() + offset * DAY_MS));
      const slots = availability(last.branchId, day, last.serviceIds, barberId).sort(byCloseness);
      // Del primer día con sitio, las dos horas más cercanas a la suya; de los siguientes, una.
      const take = options.length === 0 ? 2 : 1;
      for (const slot of slots.slice(0, take)) {
        const chosen = barberId ?? (last.barberId && slot.barberIds.includes(last.barberId) ? last.barberId : slot.barberIds[0]);
        options.push({ start: `${day}T${slot.time}`, barberId: chosen, sameBarber: chosen === last.barberId });
      }
    }
    return options.slice(0, SUGGESTION_OPTIONS);
  };

  const sameBarber = last.barberId ? search(last.barberId) : [];
  const options = sameBarber.length > 0 ? sameBarber : search(null);
  if (options.length === 0) return null;
  return {
    everyDays: client.visitEveryDays,
    lastVisitAt: last.at,
    dueDate: dateKey(due),
    isOverdue: due.getTime() < today.getTime(),
    usualTime: clockOf(usual),
    branchId: last.branchId,
    serviceIds: last.serviceIds,
    options,
  };
}
