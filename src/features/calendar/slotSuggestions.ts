import { isSameDay } from "date-fns";
import type { AppMessageKey } from "@/app/i18n/types";
import { atMinutes, minutesOfDay, parseClock } from "@/components/scheduling";
import { clashingAppointments, clashingBlocks, isWorkingOn, workingHoursOn } from "./calendarModel";
import type { Barber, CalendarDay } from "./types";

/**
 * Los huecos que conviene ofrecer para una cita: dónde cabe el servicio y, de
 * esos sitios, cuáles dejan la agenda mejor. Son reglas, no un modelo, y cada
 * sugerencia dice por qué se propone para que quien agenda pueda discrepar.
 *
 * El orden: primero el barbero que el cliente pidió; después el hueco que
 * queda pegado a otra cita o al borde de la jornada (no deja un rato muerto
 * que nadie va a reservar); por último, el más cercano a la hora que se
 * pidió. Es la idea de «precision scheduling» de los calendarios de salón.
 */

export interface SlotSuggestion {
  barber: Barber;
  start: Date;
  end: Date;
  /** La razón principal por la que se propone, para decirla al lado del hueco. */
  reasonKey: AppMessageKey;
  reasonParams: Record<string, string | number>;
}

export interface SuggestSlotsOptions {
  day: Pick<CalendarDay, "appointments" | "blocks">;
  barbers: readonly Barber[];
  date: Date;
  durationMin: number;
  /** El barbero que el cliente pidió, si pidió. */
  preferredBarberId?: string | null;
  /** La hora que se pidió, en minutos del día; sin ella se prefiere lo más temprano. */
  wantedMinute?: number | null;
  /** Ahora: hoy no se proponen huecos que ya pasaron. */
  now?: Date;
  /** Cuántas devolver. */
  limit?: number;
  /** Una cita que ya existe y se está moviendo: su hueco actual no cuenta como ocupado. */
  excludeId?: string;
  /** Si un hueco choca con algo que no es del barbero (un recurso especial completo). */
  isTaken?: (barberId: string, startMinute: number) => boolean;
}

/** Cada cuántos minutos puede empezar una cita. */
export const SUGGESTION_STEP_MINUTES = 15;
const DEFAULT_LIMIT = 3;
/** Un rato muerto más corto que esto no se considera «hueco perdido». */
const DEAD_GAP_MINUTES = 15;

interface Candidate {
  barber: Barber;
  start: number;
  end: number;
  score: number;
  reasonKey: AppMessageKey;
  reasonParams: Record<string, string | number>;
}

/** Los tramos ocupados de un barbero ese día, ordenados, en minutos del día. */
function busyOf(options: SuggestSlotsOptions, barber: Barber): [number, number][] {
  const taken = clashingAppointments(options.day.appointments, barber.id, options.date, 0, 24 * 60, options.excludeId).map((item): [number, number] => {
    const start = minutesOfDay(new Date(item.start));
    return [start, start + item.durationMin];
  });
  const blocked = clashingBlocks(options.day.blocks, barber.id, 0, 24 * 60).map((block): [number, number] => [parseClock(block.startTime), parseClock(block.endTime)]);
  return [...taken, ...blocked].sort((a, b) => a[0] - b[0]);
}

export function suggestSlots(options: SuggestSlotsOptions): SlotSuggestion[] {
  const { barbers, date, durationMin, preferredBarberId = null, wantedMinute = null, now, limit = DEFAULT_LIMIT } = options;
  const earliest = now && isSameDay(now, date) ? minutesOfDay(now) : 0;
  const candidates: Candidate[] = [];

  for (const barber of barbers.filter((item) => isWorkingOn(item, date))) {
    const busy = busyOf(options, barber);
    for (const range of workingHoursOn(barber, date)) {
      const open = parseClock(range.start);
      const close = parseClock(range.end);
      for (let start = Math.max(open, Math.ceil(earliest / SUGGESTION_STEP_MINUTES) * SUGGESTION_STEP_MINUTES); start + durationMin <= close; start += SUGGESTION_STEP_MINUTES) {
        const end = start + durationMin;
        if (busy.some(([from, to]) => start < to && from < end)) continue;
        if (options.isTaken?.(barber.id, start)) continue;
        const before = Math.max(open, ...busy.filter(([, to]) => to <= start).map(([, to]) => to));
        const after = Math.min(close, ...busy.filter(([from]) => from >= end).map(([from]) => from));
        const gapBefore = start - before;
        const gapAfter = after - end;
        const tight = gapBefore < DEAD_GAP_MINUTES || gapAfter < DEAD_GAP_MINUTES;
        const preferred = preferredBarberId !== null && barber.id === preferredBarberId;
        const distance = wantedMinute === null ? start - earliest : Math.abs(start - wantedMinute);
        // Puntos: el barbero pedido pesa más que todo; pegado a otra cita, más que la hora exacta.
        const score = (preferred ? 1000 : 0) + (tight ? 300 : 0) - Math.min(gapBefore, 120) - Math.min(gapAfter, 120) - distance;
        const reason: Pick<Candidate, "reasonKey" | "reasonParams"> = preferred
          ? { reasonKey: "calendar.suggest.why.preferred", reasonParams: { name: barber.name.split(" ")[0] } }
          : tight
            ? { reasonKey: "calendar.suggest.why.tight", reasonParams: {} }
            : wantedMinute !== null
              ? { reasonKey: "calendar.suggest.why.closest", reasonParams: {} }
              : { reasonKey: "calendar.suggest.why.first", reasonParams: {} };
        candidates.push({ barber, start, end, score, ...reason });
      }
    }
  }

  // Un hueco por barbero y hora: el mejor; y nunca dos sugerencias a la misma hora con el mismo barbero.
  const chosen: Candidate[] = [];
  for (const candidate of candidates.sort((a, b) => b.score - a.score)) {
    if (chosen.length >= limit) break;
    // Variedad: como mucho dos huecos del mismo barbero, para que se vea otra opción.
    if (chosen.filter((item) => item.barber.id === candidate.barber.id).length >= 2) continue;
    // Y separados: dos huecos casi iguales no ayudan a decidir.
    if (chosen.some((item) => item.barber.id === candidate.barber.id && Math.abs(item.start - candidate.start) < durationMin)) continue;
    chosen.push(candidate);
  }

  return chosen
    .sort((a, b) => a.start - b.start)
    .map((candidate) => ({ barber: candidate.barber, start: atMinutes(date, candidate.start), end: atMinutes(date, candidate.end), reasonKey: candidate.reasonKey, reasonParams: candidate.reasonParams }));
}
