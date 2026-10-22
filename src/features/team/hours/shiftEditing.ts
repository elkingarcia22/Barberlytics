import type { Access } from "@/features/access";
import { MAX_BREAKS, validBreaks, workedMinutes } from "../shiftRanges";
import type { WorkingRange } from "../types";

/**
 * Lo que sabe el editor de un turno, sin pantalla (docs/WORK_HOURS_RESEARCH.md): los atajos que más se
 * usan en el mostrador («entra tarde», «sale antes», «almuerzo», «día libre»), si el turno es válido y
 * quién puede cambiar qué. Lo usan el drawer del calendario y la semana del equipo.
 */

export type ShiftPreset = "late" | "early" | "lunch" | "off";
export const SHIFT_PRESETS: readonly ShiftPreset[] = ["late", "early", "lunch", "off"];

/** El paso de las horas del editor: los barberos agendan de a 15 minutos. */
export const STEP_MINUTES = 15;
/** Cuánto mueve «entra tarde» o «sale antes». */
const SHIFT_MINUTES = 60;
const LUNCH: WorkingRange = { start: "13:00", end: "14:00" };
/** El turno que se propone al marcar que sí trabaja un día que tenía libre. */
export const DEFAULT_SHIFT: WorkingRange = { start: "09:00", end: "18:00" };

export const minutesOf = (clock: string): number => {
  const [hours, mins] = clock.split(":").map(Number);
  return hours * 60 + (mins || 0);
};
export const clockOf = (minutes: number): string => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** Las horas que se pueden elegir, de 5:00 a 23:45. */
export function clockOptions(from = 5 * 60, to = 24 * 60): string[] {
  const options: string[] = [];
  for (let minute = from; minute < to; minute += STEP_MINUTES) options.push(clockOf(minute));
  return options;
}

/** El turno con un atajo aplicado; `null` si el atajo no cabe (sale antes de lo que entra, almuerzo fuera de la franja). */
export function applyPreset(range: WorkingRange | null, preset: ShiftPreset): WorkingRange | null | undefined {
  if (preset === "off") return null;
  if (!range) return undefined;
  if (preset === "late") {
    const start = minutesOf(range.start) + SHIFT_MINUTES;
    return start < minutesOf(range.end) ? withoutLostBreaks({ ...range, start: clockOf(start) }) : undefined;
  }
  if (preset === "early") {
    const end = minutesOf(range.end) - SHIFT_MINUTES;
    return end > minutesOf(range.start) ? withoutLostBreaks({ ...range, end: clockOf(end) }) : undefined;
  }
  const breaks = range.breaks ?? [];
  if (breaks.length >= MAX_BREAKS) return undefined;
  const next = { ...range, breaks: [...breaks, LUNCH].sort((a, b) => minutesOf(a.start) - minutesOf(b.start)) };
  return validBreaks(next) ? next : undefined;
}

/** Al acortar la franja, los descansos que quedaron fuera se van. */
function withoutLostBreaks(range: WorkingRange): WorkingRange {
  const breaks = (range.breaks ?? []).filter((pause) => minutesOf(pause.start) > minutesOf(range.start) && minutesOf(pause.end) < minutesOf(range.end));
  return breaks.length > 0 ? { ...range, breaks } : { start: range.start, end: range.end };
}

/** Un descanso nuevo: una hora a mitad de la franja (el almuerzo de quien no lo tiene a la una). */
export function newBreak(range: WorkingRange): { start: string; end: string } {
  const middle = Math.floor((minutesOf(range.start) + minutesOf(range.end)) / 2 / STEP_MINUTES) * STEP_MINUTES;
  return { start: clockOf(middle), end: clockOf(middle + 60) };
}

export type ShiftProblem = "endBeforeStart" | "breaks";

/** Qué le falta al turno para guardarse, o `null` si está bien. Un día libre siempre está bien. */
export function shiftProblem(range: WorkingRange | null): ShiftProblem | null {
  if (!range) return null;
  if (minutesOf(range.end) <= minutesOf(range.start)) return "endBeforeStart";
  return validBreaks(range) ? null : "breaks";
}

/** Si dos turnos son el mismo (para no guardar una excepción igual al horario fijo). */
export function sameShift(a: WorkingRange | null, b: WorkingRange | null): boolean {
  if (!a || !b) return a === b;
  const breaks = (range: WorkingRange) => (range.breaks ?? []).map((pause) => `${pause.start}-${pause.end}`).join(",");
  return a.start === b.start && a.end === b.end && breaks(a) === breaks(b);
}

/** Las horas trabajadas del turno (sin descansos), para el total. */
export const shiftHours = (range: WorkingRange | null): number => (range ? workedMinutes(range) / 60 : 0);

export interface HoursAccess {
  /** Cambiar el turno de una fecha (una excepción). */
  canEditDay: (memberId: string) => boolean;
  /** Cambiar el horario fijo («este y los siguientes»). */
  canEditPattern: (memberId: string) => boolean;
}

/**
 * Quién cambia horarios (lo mismo que valida el servidor): dueño y administrador, todo; recepción, el
 * turno de un día; el barbero de renta, el suyo; el de comisión, nada (pide la ausencia).
 */
export function hoursAccess(access: Pick<Access, "role" | "member">): HoursAccess {
  const own = (memberId: string) => access.member?.id === memberId;
  const manages = access.role === "owner" || access.role === "admin";
  return {
    canEditDay: (memberId) => manages || access.role === "recepcion" || (access.role === "barbero-renta" && own(memberId)),
    canEditPattern: (memberId) => manages || (access.role === "barbero-renta" && own(memberId)),
  };
}
