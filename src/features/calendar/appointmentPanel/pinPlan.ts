import { addWeeks, isSameDay, setHours, setMinutes, startOfDay } from "date-fns";
import { isWorkingAt, minutesOfDay } from "@/components/scheduling";
import { appointmentStart, clashingAppointments, clashingBlocks, isActive, workingHoursOn } from "../calendarModel";
import type { Barber, CalendarDay } from "../types";

/**
 * El plan de «Fijar la cita» antes de confirmar: para cada fecha que toca,
 * si el barbero está libre a la misma hora queda ahí; si no, se propone la
 * hora libre más cercana de ese día; si el día no tiene ninguna, o el
 * cliente ya tiene cita ese día, se dice y no se agenda. Así nadie se
 * entera de un choque después de tocar el botón.
 */

/** Cada cuánto se prueba una hora alternativa. */
const SLOT_STEP_MIN = 15;
const MINUTES_PER_DAY = 24 * 60;

export type PinStop =
  | { kind: "same"; date: Date }
  | { kind: "moved"; date: Date; from: Date }
  | { kind: "full"; date: Date }
  /** El cliente ya tiene cita ese día; `date` es la que ya tiene. */
  | { kind: "taken"; date: Date }
  /** Aún no llega la agenda de ese día. */
  | { kind: "unknown"; date: Date };

export function pinDates(start: Date, weeks: number, count: number): Date[] {
  return Array.from({ length: count }, (_, index) => addWeeks(start, (index + 1) * weeks));
}

function atMinute(day: Date, minute: number): Date {
  return setMinutes(setHours(startOfDay(day), Math.floor(minute / 60)), minute % 60);
}

function isFree(day: CalendarDay, barber: Barber, date: Date, from: number, durationMin: number): boolean {
  const to = from + durationMin;
  const hours = day.hours?.[barber.id] ?? workingHoursOn(barber, date);
  if (!isWorkingAt(hours, from) || !isWorkingAt(hours, to - 1)) return false;
  if (clashingAppointments(day.appointments, barber.id, date, from, to).length > 0) return false;
  return clashingBlocks(day.blocks, barber.id, from, to).length === 0;
}

/** Una fecha: la misma hora si está libre; si no, la más cercana (a igual distancia, la más temprana). */
export function planStop({ date, day, barber, durationMin, clientId }: { date: Date; day: CalendarDay | undefined; barber: Barber; durationMin: number; clientId: string | null }): PinStop {
  if (!day) return { kind: "unknown", date };
  const own = clientId ? day.appointments.find((item) => item.clientId === clientId && isActive(item) && isSameDay(appointmentStart(item), date)) : undefined;
  if (own) return { kind: "taken", date: appointmentStart(own) };
  const target = minutesOfDay(date);
  if (isFree(day, barber, date, target, durationMin)) return { kind: "same", date };
  let best: number | null = null;
  for (let minute = 0; minute + durationMin <= MINUTES_PER_DAY; minute += SLOT_STEP_MIN) {
    if (!isFree(day, barber, date, minute, durationMin)) continue;
    if (best === null || Math.abs(minute - target) < Math.abs(best - target)) best = minute;
  }
  return best === null ? { kind: "full", date } : { kind: "moved", date: atMinute(date, best), from: date };
}

/** Las que sí se pueden agendar, en el orden en que se agendan. */
export const bookableStops = (stops: readonly PinStop[]): Date[] => stops.flatMap((stop) => (stop.kind === "same" || stop.kind === "moved" ? [stop.date] : []));
