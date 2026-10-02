import { differenceInMinutes, isSameDay, startOfDay } from "date-fns";
import type { ScheduleEvent, ScheduleResource, ScheduleWorkingHours } from "./scheduleTypes";

/**
 * Las cuentas sin JSX de la agenda: minutos del día, franjas de trabajo,
 * solapes y ocupación. Viven aparte para que la rejilla de día, la de mes y
 * la pantalla compartan exactamente las mismas reglas y se puedan probar solas.
 */

/** Alto de una franja de `slotMinutes` en la rejilla, en píxeles. */
export const SLOT_HEIGHT_PX = 56;

/** Minutos desde la medianoche. */
export const minutesOfDay = (date: Date): number => date.getHours() * 60 + date.getMinutes();

/** La misma fecha con la hora puesta en `minutes` desde la medianoche. */
export function atMinutes(day: Date, minutes: number): Date {
  const next = startOfDay(day);
  next.setMinutes(minutes);
  return next;
}

/** «09:30» → 570. Una cadena que no cuadra vale 0. */
export function parseClock(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Redondea a la franja más cercana. */
export const snapMinutes = (minutes: number, step: number): number => Math.round(minutes / step) * step;

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** Las franjas de la rejilla, en minutos desde la medianoche. */
export function slotMinutes(startHour: number, endHour: number, step: number): number[] {
  const from = clamp(Math.trunc(startHour), 0, 23) * 60;
  const to = clamp(Math.trunc(endHour), 1, 24) * 60;
  const count = Math.max(1, Math.floor((to - from) / step));
  return Array.from({ length: count }, (_, index) => from + index * step);
}

/** Si el recurso trabaja en el minuto dado. Sin franjas, no trabaja. */
export function isWorkingAt(hours: readonly ScheduleWorkingHours[] | undefined, minute: number): boolean {
  if (!hours || hours.length === 0) return false;
  return hours.some((range) => minute >= parseClock(range.start) && minute < parseClock(range.end));
}

/** Minutos de jornada de un recurso ese día. */
export function workingMinutes(hours: readonly ScheduleWorkingHours[] | undefined): number {
  if (!hours) return 0;
  return hours.reduce((total, range) => total + Math.max(0, parseClock(range.end) - parseClock(range.start)), 0);
}

/** El primer minuto en que alguien de la lista trabaja, o `null` si nadie. */
export function earliestWorkingMinute(resources: readonly ScheduleResource[]): number | null {
  const starts = resources.flatMap((resource) => (resource.workingHours ?? []).map((range) => parseClock(range.start)));
  return starts.length > 0 ? Math.min(...starts) : null;
}

export const eventMinutes = (event: ScheduleEvent): number => Math.max(5, differenceInMinutes(event.end, event.start));

/** Los eventos que caen en un día y en una columna, por hora de inicio. */
export function eventsForResource(events: readonly ScheduleEvent[], day: Date, resourceId: string): ScheduleEvent[] {
  return events
    .filter((event) => event.resourceId === resourceId && isSameDay(event.start, day))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

export interface EventLayout {
  event: ScheduleEvent;
  /** Porcentaje desde arriba de la columna. */
  top: number;
  /** Alto en porcentaje de la columna. */
  height: number;
  column: number;
  columns: number;
}

/**
 * Coloca los eventos de una columna: arriba y alto en porcentaje del día
 * visible y, cuando dos se pisan, una subcolumna para cada uno. Los bloqueos
 * no reparten sitio: se pintan detrás, a todo el ancho.
 */
export function layoutEvents(events: readonly ScheduleEvent[], dayStart: number, dayEnd: number): EventLayout[] {
  const total = dayEnd - dayStart;
  if (total <= 0) return [];
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());

  const groups: ScheduleEvent[][] = [];
  let current: ScheduleEvent[] = [];
  let groupEnd = Number.NEGATIVE_INFINITY;
  for (const event of sorted) {
    if (event.kind === "block") {
      groups.push([event]);
      continue;
    }
    const start = event.start.getTime();
    if (current.length > 0 && start < groupEnd) {
      current.push(event);
      groupEnd = Math.max(groupEnd, event.end.getTime());
      continue;
    }
    if (current.length > 0) groups.push(current);
    current = [event];
    groupEnd = event.end.getTime();
  }
  if (current.length > 0) groups.push(current);

  return groups.flatMap((group) =>
    group.map((event, index) => {
      const offset = minutesOfDay(event.start) - dayStart;
      const top = (clamp(offset, 0, total) / total) * 100;
      const height = (clamp(eventMinutes(event), 0, total - clamp(offset, 0, total)) / total) * 100;
      return { event, top, height: Math.max(height, 2), column: index, columns: event.kind === "block" ? 1 : group.length };
    })
  );
}

/** Minutos reservados con citas (no bloqueos) sobre minutos de jornada; `null` sin jornada. */
export function occupancyRate(events: readonly ScheduleEvent[], hours: readonly ScheduleWorkingHours[] | undefined): number | null {
  const capacity = workingMinutes(hours);
  if (capacity === 0) return null;
  const booked = events.filter((event) => event.kind !== "block" && !event.muted).reduce((sum, event) => sum + eventMinutes(event), 0);
  return clamp(booked / capacity, 0, 1);
}

/** Porcentaje de la columna al que cae la línea de «ahora», o `null` si queda fuera. */
export function nowPercent(now: Date, day: Date, dayStart: number, dayEnd: number): number | null {
  if (!isSameDay(now, day)) return null;
  const minute = minutesOfDay(now);
  if (minute < dayStart || minute > dayEnd) return null;
  return ((minute - dayStart) / (dayEnd - dayStart)) * 100;
}

/** «10:30» en el idioma indicado. */
export function formatClock(date: Date, intlLocale: string): string {
  return new Intl.DateTimeFormat(intlLocale, { hour: "numeric", minute: "2-digit" }).format(date);
}

/** «10:30 – 11:00». */
export function formatClockRange(start: Date, end: Date, intlLocale: string): string {
  return `${formatClock(start, intlLocale)} – ${formatClock(end, intlLocale)}`;
}

/** Iniciales para el avatar: «Andrés Beltrán» → «AB». */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
