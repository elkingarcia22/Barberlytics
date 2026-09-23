import * as React from "react";
import { format, isSameDay, isSameMonth, isToday, setHours, setMinutes } from "date-fns";
import type { Locale } from "date-fns";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import {
  dayCellAriaLabel,
  eventAriaLabel,
  eventsForDay,
  eventEnd,
  formatTime,
  hourSlots,
  MAX_EVENTS_PER_DAY_CELL,
  monthGridDays,
  nowOffset,
  placeTimedEvents,
  resolveTone,
  TONE_BLOCK_CLASS,
  TONE_DOT_CLASS,
  weekDays,
  weekdayLabels,
  type CalendarEvent,
} from "./eventCalendarUtils";

/**
 * Las tres vistas del EventCalendar. Viven aparte del componente para que el
 * archivo principal se quede con lo que de verdad es suyo: el estado, la
 * cabecera y la navegación por teclado.
 */

const HOUR_ROW = "h-14";

interface ViewCommonProps {
  events: readonly CalendarEvent[];
  locale: Locale;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: Date) => void;
}

/* ------------------------------------------------------------------ chips */

/** Chip de una línea: punto de tono, hora y título truncado. */
function EventChip({
  event,
  locale,
  onEventClick,
  className,
}: {
  event: CalendarEvent;
  locale: Locale;
  onEventClick?: (event: CalendarEvent) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={eventAriaLabel(event, locale)}
      onClick={(nativeEvent) => {
        nativeEvent.stopPropagation();
        onEventClick?.(event);
      }}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left",
        "transition-colors duration-fast ease-out-expo hover:bg-surface-muted motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT_CLASS[resolveTone(event)])}
      />
      {!event.allDay && (
        <span className="shrink-0 text-xs tabular-nums text-text-muted">
          {formatTime(event.start, locale)}
        </span>
      )}
      <span className="truncate text-xs text-text-primary">{event.title}</span>
    </button>
  );
}

/** Bloque con cuerpo: el formato de la franja horaria en semana y día. */
function EventBlock({
  event,
  locale,
  onEventClick,
  detailed = false,
  style,
}: {
  event: CalendarEvent;
  locale: Locale;
  onEventClick?: (event: CalendarEvent) => void;
  detailed?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      style={style}
      aria-label={eventAriaLabel(event, locale)}
      onClick={(nativeEvent) => {
        nativeEvent.stopPropagation();
        onEventClick?.(event);
      }}
      className={cn(
        "pointer-events-auto absolute overflow-hidden rounded-md border px-2 py-1 text-left",
        "transition-transform duration-fast ease-out-expo hover:-translate-y-px motion-reduce:transform-none motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        TONE_BLOCK_CLASS[resolveTone(event)]
      )}
    >
      <span className="block truncate text-xs font-semibold">{event.title}</span>
      <span className="block truncate text-xs tabular-nums opacity-80">
        {formatTime(event.start, locale)}–{formatTime(eventEnd(event), locale)}
      </span>
      {detailed && event.location && (
        <span className="block truncate text-xs opacity-80">{event.location}</span>
      )}
      {detailed && event.meta && (
        <span className="block truncate text-xs opacity-70">{event.meta}</span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------- mes */

export interface MonthViewProps extends ViewCommonProps {
  date: Date;
  /** Día que tiene el foco de la rejilla (tabindex móvil). */
  focusedDate: Date;
  onKeyDown: (nativeEvent: React.KeyboardEvent<HTMLDivElement>) => void;
  onFocusDay: (day: Date) => void;
  registerCell: (day: Date, node: HTMLDivElement | null) => void;
}

export function MonthView({
  date,
  events,
  locale,
  focusedDate,
  onEventClick,
  onSlotClick,
  onKeyDown,
  onFocusDay,
  registerCell,
}: MonthViewProps) {
  const days = React.useMemo(() => monthGridDays(date), [date]);
  const labels = React.useMemo(() => weekdayLabels(locale), [locale]);
  const weeks = React.useMemo(
    () => Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7)),
    [days]
  );

  return (
    <div
      role="grid"
      aria-label="Calendario mensual de eventos"
      className="overflow-hidden rounded-lg border border-border bg-surface"
    >
      <div role="row" className="grid grid-cols-7 border-b border-border bg-surface-subtle">
        {labels.map((label) => (
          <div
            key={label}
            role="columnheader"
            className="px-2 py-2 text-center text-xs font-semibold text-text-secondary"
          >
            {label}
          </div>
        ))}
      </div>

      {weeks.map((week) => (
        <div key={week[0].toISOString()} role="row" className="grid grid-cols-7">
          {week.map((day) => (
            <MonthCell
              key={day.toISOString()}
              day={day}
              month={date}
              events={eventsForDay(events, day)}
              locale={locale}
              isFocused={isSameDay(day, focusedDate)}
              onEventClick={onEventClick}
              onSlotClick={onSlotClick}
              onKeyDown={onKeyDown}
              onFocusDay={onFocusDay}
              registerCell={registerCell}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function MonthCell({
  day,
  month,
  events,
  locale,
  isFocused,
  onEventClick,
  onSlotClick,
  onKeyDown,
  onFocusDay,
  registerCell,
}: {
  day: Date;
  month: Date;
  events: CalendarEvent[];
  locale: Locale;
  isFocused: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: Date) => void;
  onKeyDown: (nativeEvent: React.KeyboardEvent<HTMLDivElement>) => void;
  onFocusDay: (day: Date) => void;
  registerCell: (day: Date, node: HTMLDivElement | null) => void;
}) {
  const outside = !isSameMonth(day, month);
  const today = isToday(day);
  const visible = events.slice(0, MAX_EVENTS_PER_DAY_CELL);
  const hidden = events.length - visible.length;

  return (
    <div
      role="gridcell"
      ref={(node) => registerCell(day, node)}
      tabIndex={isFocused ? 0 : -1}
      aria-label={dayCellAriaLabel(day, events.length, locale)}
      data-today={today ? "" : undefined}
      data-outside={outside ? "" : undefined}
      onKeyDown={onKeyDown}
      onFocus={() => onFocusDay(day)}
      onClick={(nativeEvent) => {
        if (nativeEvent.target !== nativeEvent.currentTarget) return;
        onSlotClick?.(day);
      }}
      className={cn(
        "flex min-h-[7rem] cursor-default flex-col gap-1 border-b border-r border-border p-1.5 last:border-r-0",
        "transition-colors duration-fast ease-out-expo motion-reduce:transition-none",
        outside ? "bg-surface-subtle" : "bg-surface hover:bg-surface-subtle",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex size-6 shrink-0 items-center justify-center self-start rounded-full text-xs tabular-nums",
          outside && "text-text-muted",
          !outside && !today && "text-text-secondary",
          today && "bg-primary font-semibold text-primary-foreground"
        )}
      >
        {format(day, "d")}
      </span>

      <div className="flex flex-col gap-0.5">
        {visible.map((event) => (
          <EventChip key={event.id} event={event} locale={locale} onEventClick={onEventClick} />
        ))}
      </div>

      {hidden > 0 && (
        <DayOverflowPopover
          day={day}
          events={events}
          locale={locale}
          hidden={hidden}
          onEventClick={onEventClick}
        />
      )}
    </div>
  );
}

/** «+N más»: abre la lista completa del día en un popover del sistema. */
function DayOverflowPopover({
  day,
  events,
  locale,
  hidden,
  onEventClick,
}: {
  day: Date;
  events: CalendarEvent[];
  locale: Locale;
  hidden: number;
  onEventClick?: (event: CalendarEvent) => void;
}) {
  const dayLabel = format(day, "d 'de' MMMM", { locale });
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Ver los ${events.length} eventos del ${dayLabel}`}
          onClick={(nativeEvent) => nativeEvent.stopPropagation()}
          className={cn(
            "self-start rounded-md px-1.5 py-0.5 text-xs font-medium text-primary",
            "transition-colors duration-fast ease-out-expo hover:bg-primary/10 motion-reduce:transition-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          )}
        >
          +{hidden} más
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-1">
        <p className="px-1.5 text-xs font-semibold text-text-primary">{dayLabel}</p>
        <div className="flex flex-col gap-0.5">
          {events.map((event) => (
            <EventChip key={event.id} event={event} locale={locale} onEventClick={onEventClick} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------- semana y día */

interface TimeGridProps extends ViewCommonProps {
  days: Date[];
  dayStart: number;
  dayEnd: number;
  /** El «ahora» que dibuja la línea; se inyecta para que la doc sea estable. */
  now?: Date;
  detailed?: boolean;
}

/**
 * La franja horaria compartida por semana y día: una columna de horas a la
 * izquierda y una columna por día con los eventos colocados por hora y
 * duración. La vista de día es la misma rejilla con `days` de un elemento.
 */
function TimeGrid({
  days,
  events,
  locale,
  dayStart,
  dayEnd,
  now,
  detailed = false,
  onEventClick,
  onSlotClick,
}: TimeGridProps) {
  const hours = React.useMemo(() => hourSlots(dayStart, dayEnd), [dayStart, dayEnd]);
  const from = hours[0];
  const to = hours[hours.length - 1] + 1;
  const allDay = days.map((day) => eventsForDay(events, day).filter((event) => event.allDay));
  const hasAllDay = allDay.some((list) => list.length > 0);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div
        className="grid border-b border-border bg-surface-subtle"
        style={{ gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <div aria-hidden="true" />
        {days.map((day) => (
          <div key={day.toISOString()} className="border-l border-border px-2 py-2 text-center">
            <p className="text-xs uppercase text-text-muted">{format(day, "EEE", { locale })}</p>
            <p
              className={cn(
                "mx-auto mt-0.5 inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                isToday(day) ? "bg-primary text-primary-foreground" : "text-text-primary"
              )}
            >
              {format(day, "d")}
            </p>
          </div>
        ))}
      </div>

      {hasAllDay && (
        <div
          className="grid border-b border-border"
          style={{ gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))` }}
        >
          <div className="px-2 py-1.5 text-right text-xs text-text-muted">Todo el día</div>
          {days.map((day, index) => (
            <div key={day.toISOString()} className="flex flex-col gap-0.5 border-l border-border p-1">
              {allDay[index].map((event) => (
                <EventChip key={event.id} event={event} locale={locale} onEventClick={onEventClick} />
              ))}
            </div>
          ))}
        </div>
      )}

      <div
        className="grid"
        style={{ gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <div>
          {hours.map((hour) => (
            <div
              key={hour}
              className={cn(HOUR_ROW, "relative border-b border-border/60 pr-2 text-right")}
            >
              <span className="text-xs tabular-nums text-text-muted">{hour}:00</span>
            </div>
          ))}
        </div>

        {days.map((day) => (
          <DayColumn
            key={day.toISOString()}
            day={day}
            hours={hours}
            events={eventsForDay(events, day)}
            locale={locale}
            dayStart={from}
            dayEnd={to}
            now={now}
            detailed={detailed}
            onEventClick={onEventClick}
            onSlotClick={onSlotClick}
          />
        ))}
      </div>
    </div>
  );
}

function DayColumn({
  day,
  hours,
  events,
  locale,
  dayStart,
  dayEnd,
  now,
  detailed,
  onEventClick,
  onSlotClick,
}: {
  day: Date;
  hours: number[];
  events: CalendarEvent[];
  locale: Locale;
  dayStart: number;
  dayEnd: number;
  now?: Date;
  detailed: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: Date) => void;
}) {
  const placed = React.useMemo(
    () => placeTimedEvents(events, dayStart, dayEnd),
    [events, dayStart, dayEnd]
  );
  const marker = now && isSameDay(now, day) ? nowOffset(now, dayStart, dayEnd) : null;
  const dayLabel = format(day, "EEEE d 'de' MMMM", { locale });

  return (
    <div className="relative border-l border-border">
      {hours.map((hour) => (
        <button
          key={hour}
          type="button"
          aria-label={`Crear un evento el ${dayLabel} a las ${hour}:00`}
          onClick={() => onSlotClick?.(setMinutes(setHours(day, hour), 0))}
          className={cn(
            HOUR_ROW,
            "block w-full border-b border-border/60",
            "transition-colors duration-fast ease-out-expo hover:bg-surface-subtle motion-reduce:transition-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
          )}
        />
      ))}

      <div className="pointer-events-none absolute inset-0 px-0.5">
        {placed.map(({ event, placement }) => (
          <EventBlock
            key={event.id}
            event={event}
            locale={locale}
            detailed={detailed}
            onEventClick={onEventClick}
            style={{
              top: `${placement.top}%`,
              height: `${placement.height}%`,
              left: `${(placement.column / placement.columns) * 100}%`,
              width: `${100 / placement.columns}%`,
            }}
          />
        ))}

        {marker !== null && (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 flex items-center"
            style={{ top: `${marker}%` }}
          >
            <span className="size-2 shrink-0 rounded-full bg-destructive" />
            <span className="h-px flex-1 bg-destructive" />
          </div>
        )}
      </div>
    </div>
  );
}

export interface WeekViewProps extends ViewCommonProps {
  date: Date;
  dayStart: number;
  dayEnd: number;
  now?: Date;
}

export function WeekView({ date, now, ...rest }: WeekViewProps) {
  const days = React.useMemo(() => weekDays(date), [date]);
  return <TimeGrid days={days} now={now} {...rest} />;
}

export interface DayViewProps extends ViewCommonProps {
  date: Date;
  dayStart: number;
  dayEnd: number;
  now?: Date;
}

export function DayView({ date, now, ...rest }: DayViewProps) {
  return <TimeGrid days={[date]} now={now} detailed {...rest} />;
}
