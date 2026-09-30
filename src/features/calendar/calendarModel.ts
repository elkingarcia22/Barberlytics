import { addMinutes, format, isValid, parseISO } from "date-fns";
import type { AppMessageKey } from "@/app/i18n/types";
import type { MessageParams } from "@/i18n";
import type { ScheduleEvent, ScheduleResource, ScheduleTone, ScheduleWorkingHours } from "@/components/scheduling";
import { formatClockRange } from "@/components/scheduling";
import {
  BLOCK_CATEGORY_KEYS,
  CLIENT_TYPE_KEYS,
  type Appointment,
  type AppointmentStatus,
  type Barber,
  type CalendarCatalog,
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

/** Quién se ve con el filtro de equipo: los que trabajan, todos o uno. */
export function visibleBarbers(barbers: readonly Barber[], team: TeamFilter, date: Date): Barber[] {
  if (team === "all") return [...barbers];
  if (team === "working") return barbers.filter((barber) => isWorkingOn(barber, date));
  return barbers.filter((barber) => barber.id === team);
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

/** Algo que revisar en la tarjeta, si lo hay. */
export function appointmentWarning(appointment: Appointment, ctx: ModelContext): string | undefined {
  const client = findClient(ctx.catalog, appointment.clientId);
  if (client?.notes.some((note) => note.kind === "allergy")) return ctx.t("calendar.card.warning.allergy");
  if (appointment.requestedBarberId && appointment.requestedBarberId !== appointment.barberId) {
    const requested = findBarber(ctx.catalog, appointment.requestedBarberId);
    if (requested) return ctx.t("calendar.card.warning.notRequested", { name: requested.name });
  }
  if (!appointment.requestedBarberId && !appointment.walkIn) return ctx.t("calendar.card.warning.noPreference");
  if (client?.type === "new") return ctx.t("calendar.card.warning.newClient");
  return undefined;
}

export function toResource(barber: Barber, date: Date, appointments: readonly Appointment[], ctx: ModelContext): ScheduleResource {
  const hours = workingHoursOn(barber, date);
  const count = appointments.filter((item) => item.barberId === barber.id && isActive(item)).length;
  const range = hours.length > 0 ? hours.map((item) => `${item.start}–${item.end}`).join(" · ") : ctx.t("calendar.meta.notWorking");
  return {
    id: barber.id,
    name: barber.name,
    avatarUrl: barber.avatarUrl,
    workingHours: hours,
    subtitle: `${range} · ${ctx.t("calendar.meta.appointments", { count })}`,
  };
}

export function toEvent(appointment: Appointment, ctx: ModelContext, options: { showBarber?: boolean } = {}): ScheduleEvent {
  const client = findClient(ctx.catalog, appointment.clientId);
  const barber = findBarber(ctx.catalog, appointment.barberId);
  const services = servicesOf(ctx.catalog, appointment);
  const step = nextStep(appointment.status);
  const details = [options.showBarber ? barber?.name : null, appointment.walkIn ? ctx.t("calendar.card.walkIn") : null].filter(Boolean);
  return {
    id: appointment.id,
    resourceId: appointment.barberId,
    start: appointmentStart(appointment),
    end: appointmentEnd(appointment),
    kind: "appointment",
    title: client?.name ?? ctx.t("calendar.clientType.walkin"),
    subtitle: `${services.map((service) => service.name).join(" + ") || "—"} · ${ctx.formatMoney(servicesPrice(services))}`,
    detail: details.length > 0 ? details.join(" · ") : undefined,
    tone: statusTone(appointment.status),
    badge: client && client.type !== "walkin" ? { label: ctx.t(CLIENT_TYPE_KEYS[client.type]), tone: clientTypeTone(client.type) } : undefined,
    action: step && ctx.onNextStep ? { label: ctx.t(step.labelKey), onClick: () => ctx.onNextStep?.(appointment) } : undefined,
    warning: isActive(appointment) ? appointmentWarning(appointment, ctx) : undefined,
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
