import { isSameDay } from "date-fns";
import { atMinutes, minutesOfDay, parseClock, workingMinutes } from "@/components/scheduling";
import type { AppMessageKey } from "@/app/i18n/types";
import { barberLoad, findClient, isActive, isWorkingOn, lateMinutes, nextFreeMinute, workingHoursOn } from "./calendarModel";
import { pulseGroup } from "./pulseModel";
import type { Appointment, Barber, CalendarCatalog, CalendarDay, WaitlistEntry } from "./types";

/**
 * Lo que el día pide mirar, en pocas líneas: quién va tarde, a quién le sobra
 * agenda, quién ya no da abasto y a qué clientes hay que cuidar. Y, para la
 * lista de espera, a quién se le puede ofrecer un hueco hoy. Todo son reglas
 * sobre las citas del día; no hay modelo detrás.
 */

export interface BriefLine {
  id: "late" | "toCollect" | "idle" | "full" | "vip" | "allergy" | "new";
  tone: "negative" | "warning" | "positive" | "info";
  textKey: AppMessageKey;
  params: Record<string, string | number>;
  /** El barbero del que habla la línea, para abrir su agenda. */
  barberId?: string;
}

/** Por debajo de esta carga a un barbero le sobra agenda; por encima de la otra, no le cabe más. */
export const IDLE_LOAD = 0.4;
export const FULL_LOAD = 0.85;
const MAX_LINES = 6;

export function dayBrief(day: CalendarDay, catalog: CalendarCatalog, date: Date, now: Date | undefined): BriefLine[] {
  const lines: BriefLine[] = [];
  const active = day.appointments.filter(isActive);
  const open = active.filter((item) => item.status !== "paid");
  const working = catalog.barbers.filter((barber) => isWorkingOn(barber, date));

  const late = active.filter((item) => lateMinutes(item, now) !== null).length;
  if (late > 0) lines.push({ id: "late", tone: "negative", textKey: "calendar.brief.late", params: { count: late } });

  const toCollect = active.filter((item) => pulseGroup(item, now) === "toCollect").length;
  if (toCollect > 0) lines.push({ id: "toCollect", tone: "warning", textKey: "calendar.brief.toCollect", params: { count: toCollect } });

  const allergic = new Set(open.filter((item) => findClient(catalog, item.clientId)?.notes.some((note) => note.kind === "allergy")).map((item) => item.clientId)).size;
  if (allergic > 0) lines.push({ id: "allergy", tone: "warning", textKey: "calendar.brief.allergy", params: { count: allergic } });

  const loads = working.map((barber) => ({ barber, load: barberLoad(barber, date, day.appointments) })).sort((a, b) => a.load - b.load);
  const idle = loads[0];
  if (idle && idle.load < IDLE_LOAD) {
    const freeHours = Math.round(((1 - idle.load) * workingMinutes(workingHoursOn(idle.barber, date))) / 30) / 2;
    lines.push({ id: "idle", tone: "info", textKey: "calendar.brief.idle", params: { name: idle.barber.name.split(" ")[0], hours: freeHours }, barberId: idle.barber.id });
  }
  const full = loads[loads.length - 1];
  if (full && full !== idle && full.load >= FULL_LOAD) {
    lines.push({ id: "full", tone: "warning", textKey: "calendar.brief.full", params: { name: full.barber.name.split(" ")[0], percent: Math.round(full.load * 100) } });
  }

  const typeCount = (type: "vip" | "new") => new Set(open.filter((item) => findClient(catalog, item.clientId)?.type === type).map((item) => item.clientId)).size;
  const vips = typeCount("vip");
  if (vips > 0) lines.push({ id: "vip", tone: "positive", textKey: "calendar.brief.vip", params: { count: vips } });
  const fresh = typeCount("new");
  if (fresh > 0) lines.push({ id: "new", tone: "info", textKey: "calendar.brief.new", params: { count: fresh } });

  return lines.slice(0, MAX_LINES);
}

export interface WaitlistMatch {
  barber: Barber;
  start: Date;
}

/**
 * El hueco que se le puede ofrecer hoy a alguien de la lista de espera: el
 * primero en que cabe su servicio, con el barbero que pidió (o con cualquiera
 * que trabaje), desde la hora que dijo que le servía.
 */
export function waitlistMatch(entry: WaitlistEntry, day: Pick<CalendarDay, "appointments" | "blocks">, catalog: CalendarCatalog, date: Date, now: Date | undefined): WaitlistMatch | null {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const wanted = entry.slots.filter((slot) => slot.date === key).map((slot) => parseClock(slot.time));
  if (wanted.length === 0) return null;
  const minutes = catalog.services.find((service) => service.id === entry.serviceId)?.durationMin ?? 30;
  const from = Math.max(Math.min(...wanted), now && isSameDay(now, date) ? minutesOfDay(now) : 0);
  const candidates = catalog.barbers.filter((barber) => (entry.barberId ? barber.id === entry.barberId : isWorkingOn(barber, date)));
  let best: { barber: Barber; minute: number } | null = null;
  for (const barber of candidates) {
    const minute = nextFreeMinute(barber, date, day.appointments as readonly Appointment[], day.blocks, from, minutes);
    if (minute !== null && (!best || minute < best.minute)) best = { barber, minute };
  }
  return best ? { barber: best.barber, start: atMinutes(date, best.minute) } : null;
}
