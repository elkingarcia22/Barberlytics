import {
  addDays,
  addMinutes,
  differenceInMinutes,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isSameYear,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Locale } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Las piezas sin JSX del EventCalendar: el modelo de un evento, el reparto de
 * eventos por día y las cuentas que colocan un bloque dentro de la franja
 * horaria. Se vive aparte del componente para que las vistas (mes, semana,
 * día) compartan exactamente las mismas reglas y para poder probarlas solas.
 */

/** Tono semántico de un evento. Decide el punto de color y el relleno del bloque. */
export type EventTone = "primary" | "positive" | "warning" | "negative" | "info" | "neutral";

/** Las tres vistas del calendario. */
export type CalendarView = "month" | "week" | "day";

export interface CalendarEvent {
  id: string;
  title: string;
  /** Inicio del evento. En un evento de todo el día basta con la fecha. */
  start: Date;
  /** Fin del evento. Sin él se asume una hora de duración. */
  end?: Date;
  /** Ocupa el día completo: no entra en la franja horaria, va en la tira de arriba. */
  allDay?: boolean;
  tone?: EventTone;
  /** Dónde ocurre: una sala, un enlace, una sede. */
  location?: string;
  /** Una línea extra de contexto (el equipo, la vacante, la campaña). */
  meta?: string;
}

/** Primer día de la semana en español: lunes. */
export const WEEK_STARTS_ON = 1 as const;

/** Cuántos eventos caben en una celda de mes antes de colapsar en «+N más». */
export const MAX_EVENTS_PER_DAY_CELL = 3;

/** Duración asumida cuando un evento no declara `end`. */
export const DEFAULT_EVENT_MINUTES = 60;

/** Horas visibles por defecto en semana y día. */
export const DEFAULT_DAY_START = 7;
export const DEFAULT_DAY_END = 20;

/** Punto de color del chip, por tono. */
export const TONE_DOT_CLASS: Record<EventTone, string> = {
  primary: "bg-primary",
  positive: "bg-success",
  warning: "bg-warning",
  negative: "bg-destructive",
  info: "bg-info",
  neutral: "bg-text-muted",
};

/** Relleno y borde del bloque de semana/día, por tono. */
export const TONE_BLOCK_CLASS: Record<EventTone, string> = {
  primary: "border-primary/30 bg-primary/10 text-primary",
  positive: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  negative: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-info/30 bg-info/10 text-info",
  neutral: "border-border bg-surface-muted text-text-secondary",
};

export const resolveTone = (event: CalendarEvent): EventTone => event.tone ?? "primary";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * La hora tal y como se lee en Colombia: reloj de 24 horas y sin cero a la
 * izquierda («9:00», «14:30»). Se formatea con date-fns y no con `Intl` para
 * que la doc y las pruebas den el mismo texto en cualquier máquina.
 */
export const formatTime = (date: Date, locale: Locale = es): string =>
  format(date, "H:mm", { locale });

/** Fin efectivo de un evento: el declarado o una hora después del inicio. */
export const eventEnd = (event: CalendarEvent): Date =>
  event.end ?? addMinutes(event.start, DEFAULT_EVENT_MINUTES);

/** Duración en minutos, nunca menor que 15 para que el bloque siga siendo legible. */
export const eventMinutes = (event: CalendarEvent): number =>
  Math.max(15, differenceInMinutes(eventEnd(event), event.start));

/** «9:00 a 10:30», o «todo el día» cuando el evento no tiene hora. */
export function formatEventRange(event: CalendarEvent, locale: Locale = es): string {
  if (event.allDay) return "todo el día";
  return `${formatTime(event.start, locale)} a ${formatTime(eventEnd(event), locale)}`;
}

/** El texto que lee un lector de pantalla al llegar al chip del evento. */
export function eventAriaLabel(event: CalendarEvent, locale: Locale = es): string {
  const day = format(event.start, "d 'de' MMMM", { locale });
  return `${event.title}, ${day}, ${formatEventRange(event, locale)}`;
}

/** Título accesible de una celda de día: «martes, 15 de septiembre, 2 eventos». */
export function dayCellAriaLabel(day: Date, count: number, locale: Locale = es): string {
  const label = format(day, "EEEE, d 'de' MMMM", { locale });
  const events = count === 0 ? "sin eventos" : count === 1 ? "1 evento" : `${count} eventos`;
  return `${capitalize(label)}, ${events}`;
}

/** Las 42 casillas de la rejilla de mes: 6 semanas desde el lunes anterior al día 1. */
export function monthGridDays(date: Date): Date[] {
  const gridStart = startOfWeek(startOfMonth(date), { weekStartsOn: WEEK_STARTS_ON });
  return eachDayOfInterval({ start: gridStart, end: addDays(gridStart, 41) });
}

/** Los siete días de la semana que contiene `date`, de lunes a domingo. */
export function weekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });
  return eachDayOfInterval({ start, end: endOfWeek(date, { weekStartsOn: WEEK_STARTS_ON }) });
}

/** Encabezados de la rejilla: «Lun», «Mar»… empezando en lunes. */
export function weekdayLabels(locale: Locale = es): string[] {
  const reference = startOfWeek(new Date(2024, 0, 1), { weekStartsOn: WEEK_STARTS_ON });
  return Array.from({ length: 7 }, (_, index) =>
    capitalize(format(addDays(reference, index), "EEE", { locale }))
  );
}

/** Las horas dibujadas en semana y día, de `dayStart` a `dayEnd` inclusive. */
export function hourSlots(dayStart: number, dayEnd: number): number[] {
  const from = Math.max(0, Math.min(23, Math.trunc(dayStart)));
  const to = Math.max(from + 1, Math.min(24, Math.trunc(dayEnd)));
  return Array.from({ length: to - from }, (_, index) => from + index);
}

/** Un evento pertenece a un día si empieza ahí o si su tramo lo atraviesa. */
export function occursOnDay(event: CalendarEvent, day: Date): boolean {
  if (isSameDay(event.start, day)) return true;
  const end = eventEnd(event);
  if (end <= event.start) return false;
  return isWithinInterval(startOfDay(day), { start: event.start, end });
}

/** Eventos de un día, con los de todo el día primero y el resto por hora de inicio. */
export function eventsForDay(
  events: readonly CalendarEvent[],
  day: Date
): CalendarEvent[] {
  return events
    .filter((event) => occursOnDay(event, day))
    .sort((a, b) => {
      if (Boolean(a.allDay) !== Boolean(b.allDay)) return a.allDay ? -1 : 1;
      return a.start.getTime() - b.start.getTime();
    });
}

/** Los días que cubre la vista actual; sirve para saber si el periodo está vacío. */
export function visibleDays(view: CalendarView, date: Date): Date[] {
  if (view === "month") return monthGridDays(date);
  if (view === "week") return weekDays(date);
  return [date];
}

/** ¿Hay algún evento en el periodo que se está viendo? */
export function hasEventsInPeriod(
  events: readonly CalendarEvent[],
  view: CalendarView,
  date: Date
): boolean {
  const days = view === "month" ? monthGridDays(date).filter((day) => isSameMonth(day, date)) : visibleDays(view, date);
  return days.some((day) => events.some((event) => occursOnDay(event, day)));
}

export interface EventPlacement {
  /** Porcentaje desde el borde superior de la franja. */
  top: number;
  /** Alto en porcentaje de la franja. */
  height: number;
  /** Columna dentro del día cuando dos eventos se solapan. */
  column: number;
  /** Cuántas columnas comparte ese solape. */
  columns: number;
}

/** Minutos transcurridos desde `dayStart` hasta la hora de `date`. */
const minutesFromDayStart = (date: Date, dayStart: number) =>
  date.getHours() * 60 + date.getMinutes() - dayStart * 60;

/**
 * Coloca los eventos con hora de un día dentro de la franja visible: arriba y
 * alto en porcentaje, y una columna por cada grupo de eventos que se pisan,
 * para que dos entrevistas a la misma hora no queden una encima de la otra.
 */
export function placeTimedEvents(
  events: readonly CalendarEvent[],
  dayStart: number,
  dayEnd: number
): { event: CalendarEvent; placement: EventPlacement }[] {
  const totalMinutes = (dayEnd - dayStart) * 60;
  if (totalMinutes <= 0) return [];

  const timed = events
    .filter((event) => !event.allDay)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // Grupos de eventos encadenados por solape: cada grupo reparte su ancho.
  const groups: CalendarEvent[][] = [];
  let current: CalendarEvent[] = [];
  let groupEnd = Number.NEGATIVE_INFINITY;

  for (const event of timed) {
    const start = event.start.getTime();
    if (current.length > 0 && start < groupEnd) {
      current.push(event);
      groupEnd = Math.max(groupEnd, eventEnd(event).getTime());
      continue;
    }
    if (current.length > 0) groups.push(current);
    current = [event];
    groupEnd = eventEnd(event).getTime();
  }
  if (current.length > 0) groups.push(current);

  return groups.flatMap((group) =>
    group.map((event, index) => {
      const offset = minutesFromDayStart(event.start, dayStart);
      const top = (Math.max(0, offset) / totalMinutes) * 100;
      const rawHeight = (eventMinutes(event) / totalMinutes) * 100;
      return {
        event,
        placement: {
          top: Math.min(top, 100),
          height: Math.max(4, Math.min(rawHeight, 100 - top)),
          column: index,
          columns: group.length,
        },
      };
    })
  );
}

/** Posición en porcentaje de la línea de «ahora», o `null` si cae fuera de la franja. */
export function nowOffset(now: Date, dayStart: number, dayEnd: number): number | null {
  const totalMinutes = (dayEnd - dayStart) * 60;
  if (totalMinutes <= 0) return null;
  const offset = minutesFromDayStart(now, dayStart);
  if (offset < 0 || offset > totalMinutes) return null;
  return (offset / totalMinutes) * 100;
}

/**
 * El título del periodo en español: «Septiembre 2026», «15–21 de septiembre»,
 * «Martes, 15 de septiembre de 2026». La semana a caballo entre dos meses o
 * dos años se escribe completa en ambos extremos.
 */
export function formatPeriodTitle(
  view: CalendarView,
  date: Date,
  locale: Locale = es
): string {
  if (view === "month") return capitalize(format(date, "LLLL yyyy", { locale }));
  if (view === "day") return capitalize(format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale }));

  const start = startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });
  const end = endOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });

  if (isSameMonth(start, end)) {
    return `${format(start, "d", { locale })}–${format(end, "d 'de' MMMM", { locale })}`;
  }
  if (isSameYear(start, end)) {
    return `${format(start, "d 'de' MMMM", { locale })} – ${format(end, "d 'de' MMMM", { locale })}`;
  }
  return `${format(start, "d 'de' MMMM 'de' yyyy", { locale })} – ${format(end, "d 'de' MMMM 'de' yyyy", { locale })}`;
}
