import { addMinutes, differenceInMinutes, format, isSameDay, isValid, parseISO } from "date-fns";
import type { AppMessageKey } from "@/app/i18n/types";
import type { MessageParams } from "@/i18n";
import type { ScheduleEvent, ScheduleMarker, ScheduleResource, ScheduleTone, ScheduleWorkingHours } from "@/components/scheduling";
import { atMinutes, formatClock, formatClockRange, minutesOfDay, parseClock, rangesOverlap, workingMinutes } from "@/components/scheduling";
import {
  BLOCK_CATEGORY_KEYS,
  CLIENT_TYPE_KEYS,
  type Appointment,
  type AppointmentStatus,
  type Barber,
  type CalendarCatalog,
  type CalendarDay,
  type Client,
  type ClientType,
  type Service,
  type TeamFilter,
  type TimeBlock,
} from "./types";

/**
 * Del dominio a lo que se ve: convierte barberos y citas en recursos y
 * eventos de la rejilla, decide el siguiente paso de cada cita y formatea
 * dinero y horas. Sin JSX ni estado, para que la pantalla, la agenda y las
 * pruebas hablen el mismo idioma.
 */

export type Translate = (key: AppMessageKey, params?: MessageParams) => string;

export interface ModelContext {
  t: Translate;
  intl: string;
  formatMoney: (value: number) => string;
  catalog: CalendarCatalog;
  /** El «ahora» de la sucursal: con él se sabe quién va tarde y cuál es el próximo hueco. */
  now?: Date;
  /** Qué hacer cuando la tarjeta ofrece su siguiente paso. */
  onNextStep?: (appointment: Appointment) => void;
}

/** ISO local («2026-09-25T10:30:00») a Date de la sucursal. */
export function parseLocal(value: string): Date {
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : new Date(NaN);
}

/** Date a ISO local sin zona, con minutos. */
export const toLocalIso = (date: Date): string => format(date, "yyyy-MM-dd'T'HH:mm");

export const appointmentStart = (appointment: Appointment): Date => parseLocal(appointment.start);
export const appointmentEnd = (appointment: Appointment): Date => addMinutes(appointmentStart(appointment), appointment.durationMin);

export const findClient = (catalog: CalendarCatalog, id: string): Client | undefined => catalog.clients.find((client) => client.id === id);
export const findBarber = (catalog: CalendarCatalog, id: string | null): Barber | undefined => catalog.barbers.find((barber) => barber.id === id);
export const servicesOf = (catalog: CalendarCatalog, appointment: Pick<Appointment, "serviceIds">): Service[] =>
  appointment.serviceIds.map((id) => catalog.services.find((service) => service.id === id)).filter((service): service is Service => Boolean(service));

export const servicesPrice = (services: readonly Service[]): number => services.reduce((sum, service) => sum + service.price, 0);
export const servicesMinutes = (services: readonly Service[]): number => services.reduce((sum, service) => sum + service.durationMin, 0);

/** Las franjas de un barbero para la fecha (por día de la semana). */
export const workingHoursOn = (barber: Barber, date: Date): ScheduleWorkingHours[] => barber.workingHours[String(date.getDay())] ?? [];

/** Los barberos con las franjas del día ya resueltas (las excepciones de la semana pisan el horario fijo). */
export function applyDayHours(barbers: readonly Barber[], date: Date, hours: Record<string, ScheduleWorkingHours[]> | undefined): Barber[] {
  if (!hours) return [...barbers];
  const weekday = String(date.getDay());
  return barbers.map((barber) => (barber.id in hours ? { ...barber, workingHours: { ...barber.workingHours, [weekday]: hours[barber.id] } } : barber));
}

export const isWorkingOn = (barber: Barber, date: Date): boolean => workingHoursOn(barber, date).length > 0;

/** Los barberos elegidos a mano en el filtro de equipo («id1,id2»); vacío si es «trabajando» o «todos». */
export const teamIds = (team: TeamFilter): string[] => (team === "working" || team === "all" ? [] : team.split(",").filter(Boolean));

/** Quién se ve con el filtro de equipo: los que trabajan, todos, o los elegidos. */
export function visibleBarbers(barbers: readonly Barber[], team: TeamFilter, date: Date): Barber[] {
  if (team === "all") return [...barbers];
  if (team === "working") return barbers.filter((barber) => isWorkingOn(barber, date));
  const ids = teamIds(team);
  return barbers.filter((barber) => ids.includes(barber.id));
}

/** Una cita cuenta para la agenda mientras no esté anulada. */
export const isActive = (appointment: Appointment): boolean => appointment.status !== "cancelled" && appointment.status !== "no_show";

export const isUnpaid = (appointment: Appointment): boolean => isActive(appointment) && appointment.status !== "paid";

const STATUS_TONE: Record<AppointmentStatus, ScheduleTone> = {
  scheduled: "primary",
  arrived: "info",
  seated: "warning",
  paid: "positive",
  no_show: "negative",
  cancelled: "neutral",
};

export const statusTone = (status: AppointmentStatus): ScheduleTone => STATUS_TONE[status];

const CLIENT_TYPE_TONE: Record<ClientType, ScheduleTone> = {
  walkin: "neutral",
  new: "info",
  retained: "primary",
  frequent: "positive",
  vip: "warning",
};

export const clientTypeTone = (type: ClientType): ScheduleTone => CLIENT_TYPE_TONE[type];

/** El orden de la escalera Nuevo → Retenido → Frecuente → VIP. */
export const JOURNEY: readonly ClientType[] = ["new", "retained", "frequent", "vip"];

export interface NextStep {
  labelKey: AppMessageKey;
  status: AppointmentStatus;
}

/** Lo que toca hacer ahora con la cita; `null` cuando ya no hay camino. */
export function nextStep(status: AppointmentStatus): NextStep | null {
  if (status === "scheduled") return { labelKey: "calendar.step.checkIn", status: "arrived" };
  if (status === "arrived") return { labelKey: "calendar.step.seat", status: "seated" };
  if (status === "seated") return { labelKey: "calendar.step.pay", status: "paid" };
  return null;
}

/** Algo que cambia cómo se atiende —una alergia, otro barbero que el pedido—. Lo demás no merece alerta. */
export function appointmentWarning(appointment: Appointment, ctx: ModelContext): string | undefined {
  const client = findClient(ctx.catalog, appointment.clientId);
  if (client?.notes.some((note) => note.kind === "allergy")) return ctx.t("calendar.card.warning.allergy");
  if (appointment.requestedBarberId && appointment.requestedBarberId !== appointment.barberId) {
    const requested = findBarber(ctx.catalog, appointment.requestedBarberId);
    if (requested) return ctx.t("calendar.card.warning.notRequested", { name: requested.name });
  }
  return undefined;
}

/** Desde cuántos minutos de retraso una cita sin ingresar cuenta como tarde. */
export const LATE_AFTER_MINUTES = 5;

/** Minutos que lleva de retraso una cita que aún no llega; `null` si no va tarde. */
export function lateMinutes(appointment: Appointment, now: Date | undefined): number | null {
  if (!now || appointment.status !== "scheduled") return null;
  const start = appointmentStart(appointment);
  if (!isSameDay(start, now)) return null;
  const minutes = differenceInMinutes(now, start);
  return minutes >= LATE_AFTER_MINUTES ? minutes : null;
}

/** «42 min» o «2 h 41 min»: nadie lee «161 minutos». */
export function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return rest === 0 ? `${Math.floor(minutes / 60)} h` : `${Math.floor(minutes / 60)} h ${rest} min`;
}

const FREE_SLOT_MINUTES = 30;

/** Los tramos ocupados de un barbero ese día, en minutos del día. */
function busyRanges(barberId: string, date: Date, appointments: readonly Appointment[], blocks: readonly TimeBlock[]): [number, number][] {
  const taken = appointments
    .filter((item) => item.barberId === barberId && isActive(item) && isSameDay(appointmentStart(item), date))
    .map((item): [number, number] => [minutesOfDay(appointmentStart(item)), minutesOfDay(appointmentStart(item)) + item.durationMin]);
  const blocked = blocks.filter((block) => block.barberId === barberId).map((block): [number, number] => [parseClock(block.startTime), parseClock(block.endTime)]);
  return [...taken, ...blocked];
}

/** El próximo hueco de un barbero desde `from` (minutos del día) en el que caben `length` minutos, o `null`. */
export function nextFreeMinute(barber: Barber, date: Date, appointments: readonly Appointment[], blocks: readonly TimeBlock[], from: number, length: number = FREE_SLOT_MINUTES): number | null {
  const busy = busyRanges(barber.id, date, appointments, blocks);
  for (const range of workingHoursOn(barber, date)) {
    const end = parseClock(range.end);
    let minute = Math.max(parseClock(range.start), Math.ceil(from / FREE_SLOT_MINUTES) * FREE_SLOT_MINUTES);
    for (; minute + length <= end; minute += FREE_SLOT_MINUTES) {
      const candidate = minute;
      if (!busy.some(([start, stop]) => candidate < stop && candidate + length > start)) return candidate;
    }
  }
  return null;
}

/** Las citas vivas de un barbero que se pisan con un tramo (minutos del día), sin contar `excludeId`. */
export function clashingAppointments(appointments: readonly Appointment[], barberId: string, date: Date, from: number, to: number, excludeId?: string): Appointment[] {
  return appointments.filter((item) => {
    if (item.id === excludeId || item.barberId !== barberId || !isActive(item)) return false;
    const start = appointmentStart(item);
    if (!isSameDay(start, date)) return false;
    const minute = minutesOfDay(start);
    return rangesOverlap(minute, minute + item.durationMin, from, to);
  });
}

/** Los bloqueos de un barbero que se pisan con un tramo (minutos del día). */
export const clashingBlocks = (blocks: readonly TimeBlock[], barberId: string, from: number, to: number): TimeBlock[] =>
  blocks.filter((block) => block.barberId === barberId && rangesOverlap(parseClock(block.startTime), parseClock(block.endTime), from, to));

export type PlacementProblem = { kind: "appointment"; appointment: Appointment } | { kind: "block"; block: TimeBlock } | { kind: "offHours" } | null;

/**
 * Por qué una cita no cabe en un sitio: se pisa con otra cita, con un
 * bloqueo o cae fuera del horario del barbero. `null` cuando cabe. Es la
 * misma regla para arrastrar, para crear y para el servidor simulado.
 */
export function placementProblem(
  day: Pick<CalendarDay, "appointments" | "blocks">,
  barber: Barber,
  date: Date,
  from: number,
  to: number,
  excludeId?: string
): PlacementProblem {
  const appointment = clashingAppointments(day.appointments, barber.id, date, from, to, excludeId)[0];
  if (appointment) return { kind: "appointment", appointment };
  const block = clashingBlocks(day.blocks, barber.id, from, to)[0];
  if (block) return { kind: "block", block };
  const hours = workingHoursOn(barber, date);
  // Cabe si cada minuto del tramo cae dentro de alguna franja de trabajo.
  const inside = hours.some((range) => from >= parseClock(range.start) && to <= parseClock(range.end));
  return inside ? null : { kind: "offHours" };
}

/** El problema en una frase, para un toast o para la sombra de arrastre. */
export function placementReason(problem: PlacementProblem, ctx: ModelContext, barber: Barber): string | null {
  if (!problem) return null;
  if (problem.kind === "appointment") return ctx.t("calendar.clash.appointment", { name: findClient(ctx.catalog, problem.appointment.clientId)?.name ?? "" });
  if (problem.kind === "block") return ctx.t("calendar.clash.block", { name: ctx.t(BLOCK_CATEGORY_KEYS[problem.block.category]) });
  return ctx.t("calendar.clash.offHours", { name: barber.name.split(" ")[0] });
}

/** Cuántas citas vivas de un barbero caen dentro de una franja (minutos del día). */
export function blockClashes(appointments: readonly Appointment[], barberId: string, from: number, to: number): number {
  return appointments.filter((item) => {
    if (item.barberId !== barberId || !isUnpaid(item)) return false;
    const start = minutesOfDay(appointmentStart(item));
    return start < to && start + item.durationMin > from;
  }).length;
}

/** Qué parte de la jornada de un barbero está reservada, de 0 a 1. */
export function barberLoad(barber: Barber, date: Date, appointments: readonly Appointment[]): number {
  const total = workingMinutes(workingHoursOn(barber, date));
  if (total === 0) return 0;
  const booked = appointments.filter((item) => item.barberId === barber.id && isActive(item)).reduce((sum, item) => sum + item.durationMin, 0);
  return Math.min(1, booked / total);
}

export function toResource(barber: Barber, date: Date, appointments: readonly Appointment[], ctx: ModelContext, blocks: readonly TimeBlock[] = []): ScheduleResource {
  const hours = workingHoursOn(barber, date);
  const count = appointments.filter((item) => item.barberId === barber.id && isActive(item)).length;
  const range = hours.length > 0 ? hours.map((item) => `${item.start}–${item.end}`).join(" · ") : ctx.t("calendar.meta.notWorking");
  // Hoy importa cuándo se desocupa; otro día, de qué hora a qué hora trabaja.
  const today = ctx.now && isSameDay(ctx.now, date) && hours.length > 0;
  const free = today && ctx.now ? nextFreeMinute(barber, date, appointments, blocks, minutesOfDay(ctx.now)) : null;
  const lead = today ? (free === null ? ctx.t("calendar.resource.full") : ctx.t("calendar.resource.free", { time: formatClock(atMinutes(date, free), ctx.intl) })) : range;
  return {
    id: barber.id,
    name: barber.name,
    avatarUrl: barber.avatarUrl,
    workingHours: hours,
    subtitle: `${lead} · ${ctx.t("calendar.meta.appointments", { count })}`,
    progress: hours.length > 0 ? barberLoad(barber, date, appointments) : undefined,
  };
}

/** En qué va una cita ahora mismo, de lo más urgente a lo ya cerrado. */
export const STAGES = ["late", "toCollect", "waiting", "seated", "upcoming", "paid"] as const;
export type AppointmentStage = (typeof STAGES)[number];

/** El momento de una cita; `null` si está anulada. */
export function appointmentStage(appointment: Appointment, now: Date | undefined): AppointmentStage | null {
  if (!isActive(appointment)) return null;
  if (appointment.status === "paid") return "paid";
  if (appointment.status === "seated") {
    // En silla y con el servicio ya terminado: solo falta cobrarla.
    return now !== undefined && appointmentEnd(appointment) <= now ? "toCollect" : "seated";
  }
  if (appointment.status === "arrived") return "waiting";
  return lateMinutes(appointment, now) === null ? "upcoming" : "late";
}

const STAGE_KEY: Record<AppointmentStage, AppMessageKey> = {
  late: "calendar.live.late",
  toCollect: "calendar.live.toCollect",
  waiting: "calendar.live.waiting",
  seated: "calendar.live.seated",
  upcoming: "calendar.live.upcoming",
  paid: "calendar.live.paid",
};

const STAGE_TONE: Record<AppointmentStage, ScheduleTone> = {
  late: "negative",
  toCollect: "warning",
  waiting: "info",
  seated: "primary",
  upcoming: "neutral",
  paid: "positive",
};

/** El estado que se lee en la tarjeta: «Ya ingresó», «En silla», «Por cobrar», «12 min tarde»… */
export function stageBadge(appointment: Appointment, ctx: ModelContext): { label: string; tone: ScheduleTone } | undefined {
  const stage = appointmentStage(appointment, ctx.now);
  // Agendada y por cobrar no llevan píldora: el botón de la tarjeta («Check-in», «Cobrar») ya lo dice.
  if (!stage || stage === "upcoming" || stage === "toCollect") return undefined;
  const late = stage === "late" ? lateMinutes(appointment, ctx.now) : null;
  // Una cita cobrada lo dice con su importe: es lo primero que se busca al repasar el día.
  const label = stage === "paid" ? ctx.t("calendar.live.paidAmount", { amount: ctx.formatMoney(appointmentTotal(ctx.catalog, appointment)) }) : late === null ? ctx.t(STAGE_KEY[stage]) : ctx.t("calendar.card.late", { time: durationLabel(late) });
  return { label, tone: STAGE_TONE[stage] };
}

export interface AgendaFilters {
  stages: readonly AppointmentStage[];
  serviceIds: readonly string[];
}

/** Si una cita pasa los filtros: su momento está entre los marcados y lleva alguno de los servicios marcados. Sin marcas, pasa todo. */
export function matchesFilters(appointment: Appointment, filters: AgendaFilters, now: Date | undefined): boolean {
  if (filters.stages.length > 0) {
    const stage = appointmentStage(appointment, now);
    if (!stage || !filters.stages.includes(stage)) return false;
  }
  return filters.serviceIds.length === 0 || appointment.serviceIds.some((id) => filters.serviceIds.includes(id));
}

export const hasFilters = (filters: AgendaFilters): boolean => filters.stages.length + filters.serviceIds.length > 0;

/** Cuántos productos lleva la cuenta de una cita. */
export const productCount = (appointment: Pick<Appointment, "products">): number => appointment.products.reduce((sum, line) => sum + line.qty, 0);

/** Lo que suma la cita: lo cobrado si ya se cobró; si no, sus servicios y sus productos. */
export function appointmentTotal(catalog: CalendarCatalog, appointment: Appointment): number {
  if (appointment.payment) return appointment.payment.total;
  const products = appointment.products.reduce((sum, line) => sum + (catalog.products.find((product) => product.id === line.productId)?.price ?? 0) * line.qty, 0);
  return servicesPrice(servicesOf(catalog, appointment)) + products;
}

/**
 * Los colores de las tarjetas: uno por categoría de servicio, en el orden en
 * que aparecen en el catálogo. El rojo se queda fuera: es de lo que va mal.
 */
const SERVICE_TONES: readonly ScheduleTone[] = ["primary", "info", "positive", "warning", "neutral"];

/** Las categorías de servicio del catálogo, sin repetir y en su orden. */
export const serviceCategories = (catalog: CalendarCatalog): string[] => [...new Set(catalog.services.map((service) => service.category).filter(Boolean))];

export function categoryTone(catalog: CalendarCatalog, category: string | undefined): ScheduleTone {
  const index = category ? serviceCategories(catalog).indexOf(category) : -1;
  return index === -1 ? "neutral" : SERVICE_TONES[index % SERVICE_TONES.length];
}

/** El color de un servicio en la paleta de la agenda: uno distinto por servicio, según su sitio en el catálogo. */
export function serviceColor(catalog: CalendarCatalog, serviceId: string | undefined): number | undefined {
  const index = serviceId ? catalog.services.findIndex((service) => service.id === serviceId) : -1;
  return index === -1 ? undefined : index + 1;
}

/** La categoría que da color a una cita: la de su primer servicio. */
export const appointmentCategory = (catalog: CalendarCatalog, appointment: Pick<Appointment, "serviceIds">): string | undefined => servicesOf(catalog, appointment)[0]?.category;

/**
 * Quién agenda con reglas. Dueño, administrador, recepción y el barbero de
 * renta —que lleva su propia silla— hacen lo que necesiten: pisar una cita,
 * agendar fuera de horario. El barbero de comisión trabaja con las reglas de
 * la casa: nada se pisa y nada cae fuera de la jornada.
 */
export const RULE_BOUND_ROLES: readonly string[] = ["barbero-comision"];
export const followsAgendaRules = (roleId: string | undefined): boolean => roleId !== undefined && RULE_BOUND_ROLES.includes(roleId);

/**
 * Los iconos de la esquina de la tarjeta: de dónde vino la cita y qué tiene
 * de particular. Se leen de un vistazo y el tooltip los explica.
 */
export function appointmentMarkers(appointment: Appointment, client: Client | undefined, ctx: ModelContext): ScheduleMarker[] {
  const markers: ScheduleMarker[] = [];
  if (appointment.source === "online") markers.push({ id: "online", icon: "online", label: ctx.t("calendar.marker.online") });
  if (appointment.walkIn) markers.push({ id: "walkIn", icon: "walkIn", label: ctx.t("calendar.marker.walkIn") });
  if (client?.type === "new") markers.push({ id: "new", icon: "new", label: ctx.t("calendar.marker.new") });
  if (appointment.requestedBarberId && appointment.requestedBarberId === appointment.barberId) markers.push({ id: "requested", icon: "requested", label: ctx.t("calendar.marker.requested") });
  if (appointment.repeat !== "none") markers.push({ id: "repeat", icon: "repeat", label: ctx.t("calendar.marker.repeat") });
  if (appointment.notes) markers.push({ id: "note", icon: "note", label: ctx.t("calendar.marker.note") });
  if (appointment.status === "paid") markers.push({ id: "paid", icon: "paid", label: ctx.t("calendar.marker.paid") });
  return markers;
}

/**
 * Una cita que nadie fijó se puede mover sin preguntar: sigue agendada (no
 * ha llegado nadie), el cliente no pidió barbero y no la hizo él mismo online.
 */
export const isFlexible = (appointment: Appointment): boolean => appointment.status === "scheduled" && appointment.requestedBarberId === null && appointment.source !== "online";

export function toEvent(appointment: Appointment, ctx: ModelContext, options: { showBarber?: boolean; faded?: boolean } = {}): ScheduleEvent {
  const client = findClient(ctx.catalog, appointment.clientId);
  const barber = findBarber(ctx.catalog, appointment.barberId);
  const services = servicesOf(ctx.catalog, appointment);
  const step = nextStep(appointment.status);
  const sold = productCount(appointment);
  const details = [options.showBarber ? barber?.name : null, appointment.walkIn ? ctx.t("calendar.card.walkIn") : null].filter(Boolean);
  return {
    id: appointment.id,
    resourceId: appointment.barberId,
    start: appointmentStart(appointment),
    end: appointmentEnd(appointment),
    kind: "appointment",
    title: client?.name ?? ctx.t("calendar.clientType.walkin"),
    subtitle: [services.map((service) => service.name).join(" + ") || "—", sold > 0 ? ctx.t("calendar.card.products", { count: sold }) : null, ctx.formatMoney(appointmentTotal(ctx.catalog, appointment))].filter(Boolean).join(" · "),
    detail: details.length > 0 ? details.join(" · ") : undefined,
    // El color es del servicio —uno distinto por servicio—; el estado se lee en su píldora.
    tone: "neutral",
    color: isActive(appointment) ? serviceColor(ctx.catalog, services[0]?.id) : undefined,
    badge: client && client.type !== "walkin" ? { label: ctx.t(CLIENT_TYPE_KEYS[client.type]), tone: clientTypeTone(client.type) } : undefined,
    status: stageBadge(appointment, ctx),
    action: step && ctx.onNextStep ? { label: ctx.t(step.labelKey), onClick: () => ctx.onNextStep?.(appointment) } : undefined,
    warning: isActive(appointment) ? appointmentWarning(appointment, ctx) : undefined,
    flexible: isFlexible(appointment),
    faded: options.faded,
    muted: !isActive(appointment),
    locked: !isUnpaid(appointment),
  };
}

export function blockToEvent(block: TimeBlock, date: Date, ctx: ModelContext): ScheduleEvent {
  const day = format(date, "yyyy-MM-dd");
  return {
    id: block.id,
    resourceId: block.barberId,
    start: parseLocal(`${day}T${block.startTime}:00`),
    end: parseLocal(`${day}T${block.endTime}:00`),
    kind: "block",
    title: ctx.t(BLOCK_CATEGORY_KEYS[block.category]),
    subtitle: block.description ?? undefined,
    tone: "neutral",
    locked: true,
  };
}

/** «10:30 – 11:00» de una cita. */
export const appointmentRange = (appointment: Appointment, intl: string): string =>
  formatClockRange(appointmentStart(appointment), appointmentEnd(appointment), intl);

/** Lo que dice cada línea del historial. */
export function historyLabel(event: string, ctx: ModelContext): string {
  const [kind, value = ""] = event.split(":");
  if (kind === "status") {
    const map: Record<string, AppMessageKey> = {
      arrived: "calendar.history.arrived",
      seated: "calendar.history.seated",
      paid: "calendar.history.paid",
      no_show: "calendar.history.noShow",
      cancelled: "calendar.history.cancelled",
      scheduled: "calendar.history.created",
    };
    return ctx.t(map[value] ?? "calendar.history.created");
  }
  // «reason:…» trae el porqué de un cambio tal cual se escribió («movida 15 min porque la anterior se alargó»).
  if (kind === "reason") return event.slice("reason:".length);
  const map: Record<string, AppMessageKey> = {
    created: "calendar.history.created",
    walkin: "calendar.history.walkIn",
    barber_ready: "calendar.history.barberReady",
    moved: "calendar.history.moved",
    barber: "calendar.history.barber",
    duration: "calendar.history.duration",
    paid: "calendar.history.paidWith",
  };
  const key = map[kind] ?? "calendar.history.created";
  return ctx.t(key, { value: kind === "moved" ? value.replace("T", " ") : value });
}

/** Los meses del selector de mes: «2026-09». */
export const monthKey = (date: Date): string => format(date, "yyyy-MM");
