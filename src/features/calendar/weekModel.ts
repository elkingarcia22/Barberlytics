import { startOfWeek } from "date-fns";
import { applyDayHours, barberLoad, isActive, isWorkingOn } from "./calendarModel";
import type { Barber, CalendarDay } from "./types";

/** Las cuentas de la vista Semana, sin interfaz. */

export const WEEK_DAYS = 7;

/** Lunes de la semana que contiene la fecha. */
export const weekStartOf = (date: Date): Date => startOfWeek(date, { weekStartsOn: 1 });

export interface WeekCell {
  /** `null`: ese día no trabaja. */
  load: number | null;
  count: number;
}

/** Lo que un barbero tiene reservado un día de la semana, con las excepciones de horario ya aplicadas. */
export function weekCell(barber: Barber, date: Date, day: CalendarDay): WeekCell {
  const [resolved] = applyDayHours([barber], date, day.hours);
  if (!isWorkingOn(resolved, date)) return { load: null, count: 0 };
  return { load: barberLoad(resolved, date, day.appointments), count: day.appointments.filter((item) => item.barberId === barber.id && isActive(item)).length };
}
