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
  { id: "e1", resourceId: "andres", start: at(25, 9), end: at(25, 9, 30), title: "Marcela Gómez", subtitle: "Corte clásico · US$ 35", tone: "positive", badge: { label: "VIP", tone: "warning" }, locked: true, status: { label: "Cobrada", tone: "positive" } },
  { id: "e2", resourceId: "andres", start: at(25, 10), end: at(25, 11), title: "Santiago Rojas", subtitle: "Corte + barba · US$ 60", detail: "Sin cita previa", tone: "warning", badge: { label: "Frecuente", tone: "positive" }, action: { label: "Cobrar", onClick: noop }, status: { label: "Por cobrar", tone: "warning" } },
  { id: "e3", resourceId: "andres", start: at(25, 11, 30), end: at(25, 12, 15), title: "Mariana López", subtitle: "Fade · US$ 45", tone: "primary", badge: { label: "Nuevo", tone: "info" }, action: { label: "Ingresar", onClick: noop }, warning: "Cliente nuevo: primera visita", flexible: true, status: { label: "Agendada", tone: "neutral" } },
  { id: "e4", resourceId: "andres", start: at(25, 13), end: at(25, 14), title: "Almuerzo", kind: "block", locked: true },
  { id: "e5", resourceId: "nicolas", start: at(25, 10, 30), end: at(25, 11, 30), title: "Juan Pérez", subtitle: "Ritual premium · US$ 95", tone: "info", badge: { label: "VIP", tone: "warning" }, action: { label: "Sentar", onClick: noop }, status: { label: "Ya ingresó", tone: "info" } },
  { id: "e6", resourceId: "nicolas", start: at(25, 11), end: at(25, 11, 30), title: "Camila Torres", subtitle: "Diseño de cejas · US$ 12", tone: "primary", action: { label: "Ingresar", onClick: noop }, flexible: true, status: { label: "12 min tarde", tone: "negative" } },
  { id: "e7", resourceId: "valeria", start: at(25, 9), end: at(25, 9, 45), title: "Emilio Castro", subtitle: "Afeitado clásico · US$ 40", tone: "positive", badge: { label: "Retenido", tone: "primary" }, locked: true, status: { label: "Cobrada", tone: "positive" } },
  { id: "e8", resourceId: "valeria", start: at(25, 14, 30), end: at(25, 15, 30), title: "Diego Vargas", subtitle: "Corte + barba · US$ 60", tone: "primary", action: { label: "Ingresar", onClick: noop }, warning: "Pidió a Andrés", status: { label: "Agendada", tone: "neutral" }, markers: [{ id: "repeat", icon: "repeat", label: "Cita que se repite" }] },
  { id: "e9", resourceId: "valeria", start: at(25, 10), end: at(25, 10, 30), title: "Sara Muñoz", subtitle: "Corte niño · US$ 25", tone: "neutral", muted: true, locked: true },
];

/** Propuestas que la agenda pinta encima: un hueco sugerido y a dónde iría una cita si se reacomoda. */
export const PROPOSALS: readonly ScheduleEvent[] = [
  { id: "p1", resourceId: "nicolas", start: at(25, 12), end: at(25, 12, 45), title: "Hueco para Mariana", note: "Sin dejar hueco entre citas", badge: { label: "Sugerido", tone: "primary" }, ghost: true },
  { id: "p2", resourceId: "andres", start: at(25, 11, 45), end: at(25, 12, 30), title: "Mariana López", note: "Movida 15 min porque la anterior se alargó", badge: { label: "Propuesta", tone: "primary" }, ghost: true },
];

/** Un recurso con aviso: una cancelación dejó un hueco y hay quien lo tomaría. */
export const RESOURCES_WITH_ALERT: readonly ScheduleResource[] = RESOURCES.map((resource) =>
  resource.id === "nicolas" ? { ...resource, alert: { label: "Hueco 12:00 · 2 en espera", tone: "warning", onClick: noop } } : resource
);

/** Una visita de varios servicios (corte, barba y cejas seguidos con Andrés) y la hija de la clienta a la vez con Nicolás. */
/** Una sola cita con dos servicios, al lado de dos citas aparte del mismo cliente: los dos casos juntos. */
export const SEGMENTED_EVENTS: readonly ScheduleEvent[] = [
  {
    id: "s1",
    resourceId: "andres",
    start: at(25, 10),
    end: at(25, 11),
    title: "Mariana Rodríguez",
    tone: "primary",
    segments: [
      { id: "corte", label: "Corte clásico · 30 min", minutes: 30, color: 1 },
      { id: "barba", label: "Arreglo de barba · 30 min", minutes: 30, color: 2 },
    ],
    meta: "US$ 65",
    action: { label: "Ingresar", onClick: noop },
  },
  { id: "s2", resourceId: "nicolas", start: at(25, 10), end: at(25, 10, 45), title: "Laura Rincón", subtitle: "Fade · US$ 45", tone: "primary", status: { label: "Agendada", tone: "neutral" }, group: { id: "laura", index: 1, size: 2, color: 3 } },
  { id: "s3", resourceId: "nicolas", start: at(25, 10, 45), end: at(25, 11, 15), title: "Laura Rincón", subtitle: "Barba · US$ 25", tone: "primary", group: { id: "laura", index: 2, size: 2, color: 3 } },
];

export const GROUPED_EVENTS: readonly ScheduleEvent[] = [
  { id: "g1", resourceId: "andres", start: at(25, 10), end: at(25, 10, 45), title: "Laura Rincón", subtitle: "Corte clásico · US$ 35", tone: "primary", action: { label: "Ingresar", onClick: noop }, status: { label: "Agendada", tone: "neutral" }, group: { id: "laura", index: 1, size: 3, color: 1, highlight: true } },
  { id: "g2", resourceId: "andres", start: at(25, 10, 45), end: at(25, 11, 15), title: "Laura Rincón", subtitle: "Barba · US$ 25", tone: "primary", group: { id: "laura", index: 2, size: 3, color: 1, highlight: true } },
  { id: "g3", resourceId: "nicolas", start: at(25, 10, 30), end: at(25, 11, 15), title: "Sofía Rincón (hija)", subtitle: "Corte niña · US$ 25", tone: "primary", status: { label: "Agendada", tone: "neutral" }, group: { id: "laura", index: 3, size: 3, color: 1, highlight: true } },
  { id: "g4", resourceId: "nicolas", start: at(25, 11, 30), end: at(25, 12), title: "Pedro Gil", subtitle: "Corte clásico · US$ 35", tone: "primary", group: { id: "pedro", index: 1, size: 2, color: 2, highlight: true } },
  { id: "g5", resourceId: "andres", start: at(25, 11, 30), end: at(25, 12), title: "Pedro Gil", subtitle: "Barba · US$ 25", tone: "primary", group: { id: "pedro", index: 2, size: 2, color: 2, highlight: true } },
];
