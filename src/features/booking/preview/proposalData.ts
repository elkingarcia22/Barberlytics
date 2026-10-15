/*
 * Los datos de demo de las propuestas de la tarjeta de cada parte (solo en la vista previa): la
 * parte 2 de 3 de una visita, con el corte ya apartado.
 */

export type PartState = "done" | "current" | "pending";

export interface DemoPart {
  service: string;
  state: PartState;
  /** Lo apartado: hora y barbero. */
  detail?: string;
}

export const PARTS: readonly DemoPart[] = [
  { service: "Corte clásico", state: "done", detail: "10:00 a. m. · Emilio · Para mí" },
  { service: "Fade", state: "current" },
  { service: "Corte niño", state: "pending" },
];
export const CURRENT = PARTS.findIndex((part) => part.state === "current");
export const PEOPLE = ["Para mí", "Santiago · Hijo"] as const;
