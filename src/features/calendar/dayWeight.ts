import type { DayRhythm } from "./types";

/**
 * Si un día suele ser suave o pesado, según el historial de la barbería: el
 * promedio de citas de ese día de la semana frente al de un día cualquiera.
 * Es un pronóstico, no lo que ya hay agendado: un sábado sigue siendo pesado
 * aunque hoy todavía tenga pocas reservas. Sin interfaz, para la semana, el
 * mes, la lista y el panel del día.
 */

export type DayWeightLevel = "light" | "normal" | "heavy";

/** Un día con un 10 % más de citas que el promedio es pesado; con un 10 % menos, suave. */
export const HEAVY_FROM = 1.1;
export const LIGHT_UNTIL = 0.9;

export interface DayWeight {
  level: DayWeightLevel;
  /** Cuántas citas suele tener ese día de la semana. */
  expected: number;
  /** Cuántas tiene un día cualquiera, para comparar. */
  average: number;
  /** `expected / average`: 1 es un día normal. */
  ratio: number;
}

/** El peso de una fecha por su día de la semana; `null` si ese día no se abre o aún no hay historia. */
export function dayWeightOf(rhythm: DayRhythm | undefined, date: Date): DayWeight | null {
  if (!rhythm || rhythm.average <= 0) return null;
  const weekday = rhythm.weekdays.find((item) => item.weekday === date.getDay());
  if (!weekday || weekday.samples === 0 || weekday.average <= 0) return null;
  const ratio = weekday.average / rhythm.average;
  const level: DayWeightLevel = ratio >= HEAVY_FROM ? "heavy" : ratio <= LIGHT_UNTIL ? "light" : "normal";
  return { level, expected: Math.round(weekday.average), average: Math.round(rhythm.average), ratio };
}

/** Cuánto de lo habitual lleva agendado el día (0–1+), para «lleva 12 de unas 30». */
export const bookedShare = (booked: number, weight: Pick<DayWeight, "expected"> | null): number | null => (weight && weight.expected > 0 ? booked / weight.expected : null);
