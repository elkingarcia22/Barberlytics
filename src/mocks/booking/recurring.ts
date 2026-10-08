import { db } from "../db";
import { clockOf, dateKey, localIso, parseClock, type MockAppointment } from "../calendar/seed";
import { appointmentsOn } from "../calendar/handlers";
import { barberFree, bookingRules } from "./logic";
import { scheduleMessages } from "./reminders";

/**
 * Dejar una cita fija («cada 3 semanas»): las próximas con el mismo barbero y a la misma hora. Si
 * esa hora ya no está, se busca la más cercana ese día con él (hasta una hora antes o después);
 * si no hay, ese día se salta y se dice. Las nuevas se pagan en la barbería y entran en la agenda
 * como una serie (`seriesId`), con sus recordatorios.
 */

export const REPEAT_WEEKS = [1, 2, 3, 4] as const;
export type RepeatWeeks = (typeof REPEAT_WEEKS)[number];
const RULES: Record<RepeatWeeks, MockAppointment["repeat"]> = { 1: "weekly", 2: "biweekly", 3: "triweekly", 4: "monthly" };
export const MAX_REPEATS = 6;
const NEARBY_MINUTES = 60;
const DAY_MS = 86_400_000;

export function repeatAppointment(original: MockAppointment, everyWeeks: RepeatWeeks, count: number, phone: string): { created: MockAppointment[]; skipped: string[] } {
  const seriesId = original.seriesId ?? `ser_web_${original.id}`;
  const rule = RULES[everyWeeks];
  const step = bookingRules().slotInterval;
  const startMinute = parseClock(original.start.slice(11, 16));
  const created: MockAppointment[] = [];
  const skipped: string[] = [];
  for (let index = 1; index <= count; index += 1) {
    const day = dateKey(new Date(new Date(original.start).getTime() + index * everyWeeks * 7 * DAY_MS));
    appointmentsOn(original.branchId, day);
    // La misma hora primero; si no, la más cercana alternando antes y después.
    const offsets = [0];
    for (let delta = step; delta <= NEARBY_MINUTES; delta += step) offsets.push(delta, -delta);
    const minute = offsets.map((offset) => startMinute + offset).find((candidate) => candidate >= 0 && barberFree(original.branchId, original.barberId, day, candidate, original.durationMin));
    if (minute === undefined) {
      skipped.push(day);
      continue;
    }
    const id = `${original.id}_r${index}`;
    const appointment: MockAppointment = {
      ...original,
      id,
      start: localIso(day, clockOf(minute)),
      status: "scheduled",
      barberReady: false,
      repeat: rule,
      seriesId,
      products: [],
      payment: null,
      createdAt: new Date().toISOString(),
      history: [{ id: `${id}_h0`, at: new Date().toISOString(), actor: "Reserva en línea", event: "created" }],
    };
    db.calendar.appointments = [appointment, ...db.calendar.appointments];
    scheduleMessages(appointment, phone);
    created.push(appointment);
  }
  db.calendar.appointments = db.calendar.appointments.map((item) => (item.id === original.id ? { ...item, repeat: rule, seriesId } : item));
  return { created, skipped };
}
