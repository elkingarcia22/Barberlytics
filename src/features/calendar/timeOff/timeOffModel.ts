import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { workingHoursOn } from "../calendarModel";
import type { Barber, TimeBlock } from "../types";

/**
 * Lo que la agenda necesita saber de las ausencias y los bloqueos para
 * decidir si se aprueban: los días que toca, cuántos de esos días trabaja,
 * y cómo queda el equipo cada día (quién trabaja y quién más falta). Sin
 * interfaz, para la lista, la revisión y las pruebas.
 */

/** Una ausencia como la ve la agenda (la de Equipo trae más campos). */
export interface TimeOffAbsence {
  id: string;
  memberId: string;
  memberName: string;
  kind: "vacation" | "sick" | "personal";
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected";
}

/** Los días de un rango (AAAA-MM-DD, ambos incluidos). */
export function daysOf(startDate: string, endDate: string): Date[] {
  const start = parseISO(startDate);
  const count = Math.max(0, differenceInCalendarDays(parseISO(endDate), start)) + 1;
  return Array.from({ length: count }, (_, index) => addDays(start, index));
}

const keyOf = (date: Date) => format(date, "yyyy-MM-dd");
const covers = (item: { startDate: string; endDate: string }, day: string) => item.startDate <= day && day <= item.endDate;

export interface DayCoverage {
  date: Date;
  /** Si quien pide trabaja ese día (si no, la ausencia no le quita nada). */
  works: boolean;
  /** Cuántos del equipo trabajan ese día sin contar ausencias. */
  scheduled: number;
  /** Cuántos quedarían trabajando si se aprueba (sin quien pide ni los que ya faltan). */
  available: number;
  /** Quién más falta ese día (aprobado o pendiente), sin contar a quien pide. */
  alsoOff: { name: string; kind: TimeOffAbsence["kind"]; pending: boolean }[];
}

/** Cómo queda el equipo cada día de una ausencia, si se aprueba. */
export function coverageFor(absence: Pick<TimeOffAbsence, "id" | "memberId" | "startDate" | "endDate">, barbers: readonly Barber[], absences: readonly TimeOffAbsence[]): DayCoverage[] {
  return daysOf(absence.startDate, absence.endDate).map((date) => {
    const day = keyOf(date);
    const working = barbers.filter((barber) => workingHoursOn(barber, date).length > 0);
    const others = absences.filter((item) => item.id !== absence.id && item.memberId !== absence.memberId && item.status !== "rejected" && covers(item, day));
    const offIds = new Set([absence.memberId, ...others.filter((item) => item.status === "approved").map((item) => item.memberId)]);
    return {
      date,
      works: working.some((barber) => barber.id === absence.memberId),
      scheduled: working.length,
      available: working.filter((barber) => !offIds.has(barber.id)).length,
      alsoOff: others.map((item) => ({ name: item.memberName.split(" ")[0], kind: item.kind, pending: item.status === "pending" })),
    };
  });
}

/** Menos de la mitad del equipo: el día queda corto. */
export const isShortHanded = (coverage: Pick<DayCoverage, "scheduled" | "available">): boolean => coverage.scheduled > 0 && coverage.available / coverage.scheduled < 0.5;

/** Si un bloqueo (con su repetición) cae en un día. */
export function blockAppliesOn(block: Pick<TimeBlock, "startDate" | "endDate" | "repeat">, date: Date): boolean {
  const day = keyOf(date);
  if (day < block.startDate || day > block.endDate) return false;
  if (block.repeat === "weekly") return parseISO(block.startDate).getDay() === date.getDay();
  if (block.repeat === "monthly") return parseISO(block.startDate).getDate() === date.getDate();
  return true;
}
