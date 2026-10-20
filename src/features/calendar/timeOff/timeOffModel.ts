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

/**
 * Si un bloqueo es en realidad una ausencia: la que deja en la agenda una
 * ausencia aprobada (`blk_abs_…`) o uno puesto a mano como vacaciones o
 * incapacidad. Lo demás (almuerzo, reunión, un permiso de una hora) es un
 * bloqueo. Así los filtros «Vacaciones y ausencias» y «Bloqueos» no se pisan.
 */
/** El prefijo del bloqueo que deja en la agenda una ausencia aprobada (`blk_abs_<id de la ausencia>`). */
export const ABSENCE_BLOCK_PREFIX = "blk_abs_";

export const isAbsenceBlock = (block: Pick<TimeBlock, "id" | "category">): boolean => block.id.startsWith(ABSENCE_BLOCK_PREFIX) || block.category === "vacation" || block.category === "sick";

/** Si un bloqueo (con su repetición) cae en un día. */
export function blockAppliesOn(block: Pick<TimeBlock, "startDate" | "endDate" | "repeat">, date: Date): boolean {
  const day = keyOf(date);
  if (day < block.startDate || day > block.endDate) return false;
  if (block.repeat === "weekly") return parseISO(block.startDate).getDay() === date.getDay();
  if (block.repeat === "monthly") return parseISO(block.startDate).getDate() === date.getDate();
  return true;
}

/**
 * Lo que se está creando en el panel de ausencias y bloqueos, para marcarlo en
 * la agenda mientras se arma (como la cita en «Crear cita»): de quién, qué
 * (el rótulo ya traducido), qué días y, si es un bloqueo, a qué horas. Una
 * ausencia ocupa la jornada entera de cada día.
 */
export interface TimeOffPreview {
  barberId: string;
  label: string;
  startDate: string;
  endDate: string;
  repeat?: TimeBlock["repeat"];
  /** Solo los bloqueos: «13:00» – «14:00». Sin ellos, la jornada de ese día. */
  startTime?: string;
  endTime?: string;
}

/** El tramo (en «HH:mm») que ocupa en un día, o `null` si ese día no le toca o no trabaja. */
export function previewSpanOn(preview: TimeOffPreview, date: Date, hours: readonly { start: string; end: string }[]): { start: string; end: string } | null {
  if (!blockAppliesOn({ startDate: preview.startDate, endDate: preview.endDate, repeat: preview.repeat ?? "none" }, date)) return null;
  if (preview.startTime && preview.endTime) return preview.startTime < preview.endTime ? { start: preview.startTime, end: preview.endTime } : null;
  if (hours.length === 0) return null;
  return { start: hours[0].start, end: hours[hours.length - 1].end };
}
