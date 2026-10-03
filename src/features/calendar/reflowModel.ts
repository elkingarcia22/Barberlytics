import { isSameDay } from "date-fns";
import { atMinutes, minutesOfDay, parseClock } from "@/components/scheduling";
import { appointmentStart, isActive, workingHoursOn } from "./calendarModel";
import type { Appointment, Barber, CalendarDay, TimeBlock } from "./types";

/**
 * Reacomodar la cola de un barbero cuando algo se alarga: la cita que viene
 * después se corre hasta donde termina la anterior, la siguiente hasta donde
 * termina esa, y así. Nada se aplica aquí: se devuelve el plan para que la
 * agenda lo enseñe en preview y la persona lo apruebe o lo descarte.
 *
 * Reglas, en orden de las lecciones de Reclaim y Akiflow:
 * - Solo se mueven citas del mismo barbero que aún no han empezado (agendadas
 *   o con el cliente esperando). Lo que está en silla o cobrado no se toca.
 * - El orden relativo se conserva: nadie adelanta a nadie.
 * - Una cita se mueve lo justo: si ya tenía hueco por delante, lo absorbe y
 *   la cadena se corta ahí.
 * - Nadie cae sobre un bloqueo (el almuerzo, una reunión): la cita salta a
 *   cuando termina.
 * - Lo que quedaría después del cierre se marca: es el momento de pasar esa
 *   cita a otro barbero o a la lista de espera, no de moverla a ciegas.
 */

export interface ReflowMove {
  appointment: Appointment;
  /** Dónde empezaba y dónde empezaría, en minutos del día. */
  from: number;
  to: number;
  /** Terminaría después de la jornada del barbero. */
  overflow: boolean;
}

export interface ReflowPlan {
  barber: Barber;
  date: Date;
  /** La cita que se alarga o se atrasa y empuja a las demás. */
  anchor: Appointment;
  /** Hasta qué minuto ocupa ahora la cita ancla. */
  anchorEnd: number;
  moves: ReflowMove[];
}

/** Las citas de un barbero que todavía se pueden correr. */
export const isMovable = (appointment: Appointment): boolean => isActive(appointment) && (appointment.status === "scheduled" || appointment.status === "arrived");

/**
 * El plan para que, con `anchor` terminando en `anchorEnd`, nadie se pise.
 * Devuelve `null` si no hace falta mover nada.
 */
export function reflowPlan(day: Pick<CalendarDay, "appointments"> & { blocks?: readonly TimeBlock[] }, barber: Barber, date: Date, anchor: Appointment, anchorEnd: number): ReflowPlan | null {
  const blocks = (day.blocks ?? []).filter((block) => block.barberId === barber.id).map((block): [number, number] => [parseClock(block.startTime), parseClock(block.endTime)]);
  /** El primer minuto desde `from` en el que caben `length` minutos sin tocar un bloqueo. */
  const clearOfBlocks = (from: number, length: number): number => {
    let start = from;
    for (const [blockStart, blockEnd] of [...blocks].sort((a, b) => a[0] - b[0])) {
      if (start < blockEnd && blockStart < start + length) start = blockEnd;
    }
    return start;
  };
  const close = Math.max(0, ...workingHoursOn(barber, date).map((range) => parseClock(range.end)));
  const queue = day.appointments
    .filter((item) => item.id !== anchor.id && item.barberId === barber.id && isMovable(item) && isSameDay(appointmentStart(item), date))
    .map((item) => ({ item, start: minutesOfDay(appointmentStart(item)) }))
    .filter(({ start }) => start >= minutesOfDay(appointmentStart(anchor)))
    .sort((a, b) => a.start - b.start);

  const moves: ReflowMove[] = [];
  let cursor = anchorEnd;
  for (const { item, start } of queue) {
    if (start >= cursor) break; // Ya tenía hueco por delante: la cadena se corta aquí.
    const to = clearOfBlocks(cursor, item.durationMin);
    moves.push({ appointment: item, from: start, to, overflow: close > 0 && to + item.durationMin > close });
    cursor = to + item.durationMin;
  }
  return moves.length > 0 ? { barber, date, anchor, anchorEnd, moves } : null;
}

/** Cuántos minutos se corre la primera cita del plan: lo que se le dice a la persona. */
export const planShiftMinutes = (plan: ReflowPlan): number => (plan.moves[0] ? plan.moves[0].to - plan.moves[0].from : 0);

/** La hora nueva de una cita del plan. */
export const moveStart = (plan: ReflowPlan, move: ReflowMove): Date => atMinutes(plan.date, move.to);
