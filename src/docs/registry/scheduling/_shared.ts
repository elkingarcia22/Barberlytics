import type { ScheduleEvent, ScheduleResource } from "@/components/scheduling";

/**
 * Los datos de la doc de agenda salen de una fecha fija (viernes 25 de
 * septiembre de 2026): con `new Date()` el preview cambiaría cada día y los
 * ejemplos dejarían de coincidir con el código que muestran.
 */
export const YEAR = 2026;
export const SEPTEMBER = 8;
export const at = (day: number, hour = 0, minute = 0) => new Date(YEAR, SEPTEMBER, day, hour, minute);
export const DAY = at(25);
export const NOW = at(25, 11, 20);

export const RESOURCES: readonly ScheduleResource[] = [
  { id: "andres", name: "Andrés Beltrán", subtitle: "09:00–19:00 · 4 citas", workingHours: [{ start: "09:00", end: "19:00" }] },
  { id: "nicolas", name: "Nicolás Duarte", subtitle: "10:00–20:00 · 3 citas", workingHours: [{ start: "10:00", end: "20:00" }] },
  { id: "valeria", name: "Valeria Marín", subtitle: "08:00–16:00 · 2 citas", workingHours: [{ start: "08:00", end: "13:00" }, { start: "14:00", end: "16:00" }] },
  { id: "tomas", name: "Tomás Peña", subtitle: "No trabaja", workingHours: [] },
];

const noop = () => undefined;

export const EVENTS: readonly ScheduleEvent[] = [
  { id: "e1", resourceId: "andres", start: at(25, 9), end: at(25, 9, 30), title: "Laura Gómez", subtitle: "Corte clásico · US$ 35", tone: "positive", badge: { label: "VIP", tone: "warning" } },
  { id: "e2", resourceId: "andres", start: at(25, 10), end: at(25, 11), title: "Santiago Rojas", subtitle: "Corte + barba · US$ 60", detail: "Sin cita previa", tone: "warning", badge: { label: "Frecuente", tone: "positive" }, action: { label: "Cobrar", onClick: noop } },
  { id: "e3", resourceId: "andres", start: at(25, 11, 30), end: at(25, 12, 15), title: "Mariana López", subtitle: "Fade · US$ 45", tone: "primary", badge: { label: "Nuevo", tone: "info" }, action: { label: "Ingresar", onClick: noop }, warning: "Cliente nuevo: primera visita" },
  { id: "e4", resourceId: "andres", start: at(25, 13), end: at(25, 14), title: "Almuerzo", kind: "block", locked: true },
  { id: "e5", resourceId: "nicolas", start: at(25, 10, 30), end: at(25, 11, 30), title: "Juan Pérez", subtitle: "Ritual premium · US$ 95", tone: "info", badge: { label: "VIP", tone: "warning" }, action: { label: "Sentado", onClick: noop } },
  { id: "e6", resourceId: "nicolas", start: at(25, 11), end: at(25, 11, 30), title: "Camila Torres", subtitle: "Diseño de cejas · US$ 12", tone: "primary", action: { label: "Ingresar", onClick: noop } },
  { id: "e7", resourceId: "valeria", start: at(25, 9), end: at(25, 9, 45), title: "Emilio Castro", subtitle: "Afeitado clásico · US$ 40", tone: "positive", badge: { label: "Retenido", tone: "primary" } },
  { id: "e8", resourceId: "valeria", start: at(25, 14, 30), end: at(25, 15, 30), title: "Diego Vargas", subtitle: "Corte + barba · US$ 60", tone: "primary", action: { label: "Ingresar", onClick: noop }, warning: "Pidió a Andrés" },
  { id: "e9", resourceId: "valeria", start: at(25, 10), end: at(25, 10, 30), title: "Sara Muñoz", subtitle: "Corte niño · US$ 25", tone: "neutral", muted: true, locked: true },
];
