import * as React from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfWeek,
  isSameMonth,
  startOfDay,
  startOfWeek,
} from "date-fns";
import type { Locale } from "date-fns";

import { CalendarOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/i18n";
import { calendarLocale } from "./calendarLocale";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SegmentedControl } from "@/components/selection/SegmentedControl";
import { ThemaIcon } from "@/icons/ThemaIcon";

import { DayView, MonthView, WeekView } from "./eventCalendarViews";
import {
  DEFAULT_DAY_END,
  DEFAULT_DAY_START,
  formatPeriodTitle,
  hasEventsInPeriod,
  WEEK_STARTS_ON,
  type CalendarEvent,
  type CalendarView,
} from "./eventCalendarUtils";

export type { CalendarEvent, CalendarView, EventTone } from "./eventCalendarUtils";

/**
 * EVENT CALENDAR
 *
 * El calendario de la agenda: sesiones de formación, entrevistas de una
 * vacante y fechas de cierre de encuestas sobre la misma rejilla. Tres
 * vistas —mes, semana y día— que comparten cabecera, tonos y chips, para que
 * cambiar de escala no cambie el lenguaje de la pantalla.
 *
 * `view` y `date` se pueden controlar desde fuera o dejar que el componente
 * los lleve. Los huecos vacíos son botones reales (`onSlotClick`) y cada
 * evento es un botón con su etiqueta completa, así que la agenda se puede
 * recorrer entera con el teclado.
 */

const VIEW_OPTIONS = [
  { value: "month", labelKey: "date.viewMonth" },
  { value: "week", labelKey: "date.viewWeek" },
  { value: "day", labelKey: "date.viewDay" },
] as const;

export interface EventCalendarProps {
  /** Los eventos a pintar. El componente no los ordena en origen ni los muta. */
  events: readonly CalendarEvent[];
  /** Vista controlada. */
  view?: CalendarView;
  /** Vista inicial cuando el componente lleva su propio estado. */
  defaultView?: CalendarView;
  onViewChange?: (view: CalendarView) => void;
  /** Día o mes visible, controlado. */
  date?: Date;
  /** Día o mes visible inicial cuando el componente lleva su propio estado. */
  defaultDate?: Date;
  onDateChange?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  /** Clic en un hueco libre: la fecha (y hora, en semana y día) donde crear algo. */
  onSlotClick?: (date: Date) => void;
  /** Primera hora visible en semana y día. */
  dayStart?: number;
  /** Última hora visible en semana y día. */
  dayEnd?: number;
  /** Locale de date-fns para los nombres de mes y día. */
  locale?: Locale;
  /** El «ahora» de la línea roja. Inyectable para que la doc y las pruebas no cambien cada día. */
  now?: Date;
  className?: string;
}

const dayKey = (day: Date) => startOfDay(day).toISOString();

export function EventCalendar({
  events,
  view: viewProp,
  defaultView = "month",
  onViewChange,
  date: dateProp,
  defaultDate,
  onDateChange,
  onEventClick,
  onSlotClick,
  dayStart = DEFAULT_DAY_START,
  dayEnd = DEFAULT_DAY_END,
  locale,
  now,
  className,
}: EventCalendarProps) {
  const t = useT();
  const { locale: activeLocale } = useLocale();
  // Sin `locale` propio, los nombres de mes y de día los pone el idioma de la
  // aplicación: date-fns los trae traducidos, no hay que escribirlos aquí.
  const dateLocale = locale ?? calendarLocale(activeLocale);
  const [internalView, setInternalView] = React.useState<CalendarView>(defaultView);
  const [internalDate, setInternalDate] = React.useState<Date>(() => defaultDate ?? new Date());

  const view = viewProp ?? internalView;
  const date = dateProp ?? internalDate;

  const [focusedDate, setFocusedDate] = React.useState<Date>(date);
  const cellRefs = React.useRef(new Map<string, HTMLDivElement>());
  const pendingFocus = React.useRef<string | null>(null);

  // El día con foco sigue al periodo visible mientras nadie navegue con el
  // teclado; si no, volver de «Hoy» dejaría el tabindex en un mes que ya no
  // está en pantalla.
  React.useEffect(() => {
    setFocusedDate((current) => (isSameMonth(current, date) ? current : date));
  }, [date]);

  React.useEffect(() => {
    const key = pendingFocus.current;
    if (!key) return;
    pendingFocus.current = null;
    cellRefs.current.get(key)?.focus();
  });

  const changeView = (next: CalendarView) => {
    if (viewProp === undefined) setInternalView(next);
    onViewChange?.(next);
  };

  const changeDate = React.useCallback(
    (next: Date) => {
      if (dateProp === undefined) setInternalDate(next);
      onDateChange?.(next);
    },
    [dateProp, onDateChange]
  );

  const step = (direction: 1 | -1) => {
    if (view === "month") return changeDate(addMonths(date, direction));
    if (view === "week") return changeDate(addWeeks(date, direction));
    return changeDate(addDays(date, direction));
  };

  const registerCell = React.useCallback((day: Date, node: HTMLDivElement | null) => {
    const key = dayKey(day);
    if (node) cellRefs.current.set(key, node);
    else if (cellRefs.current.get(key) === node) cellRefs.current.delete(key);
  }, []);

  const moveFocus = React.useCallback(
    (next: Date) => {
      setFocusedDate(next);
      pendingFocus.current = dayKey(next);
      if (!isSameMonth(next, date)) changeDate(next);
    },
    [changeDate, date]
  );

  const handleGridKeyDown = (nativeEvent: React.KeyboardEvent<HTMLDivElement>) => {
    const { key } = nativeEvent;

    if (key === "Enter" || key === " ") {
      if (nativeEvent.target !== nativeEvent.currentTarget) return;
      nativeEvent.preventDefault();
      onSlotClick?.(focusedDate);
      return;
    }

    const next = (() => {
      if (key === "ArrowLeft") return addDays(focusedDate, -1);
      if (key === "ArrowRight") return addDays(focusedDate, 1);
      if (key === "ArrowUp") return addDays(focusedDate, -7);
      if (key === "ArrowDown") return addDays(focusedDate, 7);
      if (key === "Home") return startOfWeek(focusedDate, { weekStartsOn: WEEK_STARTS_ON });
      if (key === "End") return endOfWeek(focusedDate, { weekStartsOn: WEEK_STARTS_ON });
      if (key === "PageUp") return addMonths(focusedDate, -1);
      if (key === "PageDown") return addMonths(focusedDate, 1);
      return null;
    })();

    if (!next) return;
    nativeEvent.preventDefault();
    moveFocus(startOfDay(next));
  };

  const title = formatPeriodTitle(view, date, dateLocale);
  const isEmpty = !hasEventsInPeriod(events, view, date);
  // Sin `now` explícito la línea roja sigue al reloj real; la doc y las
  // pruebas pasan una fecha fija para que el preview no cambie cada día.
  const nowDate = React.useMemo(() => now ?? new Date(), [now]);

  return (
    <section className={cn("flex flex-col gap-4", className)} aria-label={t("date.calendar")}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => step(-1)}
            aria-label={t("date.previousPeriod")}
          >
            <ThemaIcon name="chevronLeft" size="sm" decorative />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => step(1)}
            aria-label={t("date.nextPeriod")}
          >
            <ThemaIcon name="chevronRight" size="sm" decorative />
          </Button>
          <Button variant="outline" size="sm" onClick={() => changeDate(startOfDay(nowDate))}>
            {t("date.today")}
          </Button>
          <h2 className="ml-1 text-base font-semibold text-text-primary">{title}</h2>
        </div>

        <SegmentedControl
          className="w-auto"
          options={VIEW_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
          value={view}
          onChange={(value) => changeView(value as CalendarView)}
          size="sm"
          ariaLabel={t("date.changeView")}
        />
      </header>

      <p aria-live="polite" className="sr-only">
        {title}
      </p>

      {isEmpty ? (
        <EmptyState
          icon={CalendarOff}
          title={t("date.nothingScheduled")}
          description={`No encontramos eventos en ${title.toLowerCase()}. Cambia de periodo o crea el primero desde un hueco del calendario.`}
        />
      ) : view === "month" ? (
        <MonthView
          date={date}
          events={events}
          locale={dateLocale}
          focusedDate={focusedDate}
          onEventClick={onEventClick}
          onSlotClick={onSlotClick}
          onKeyDown={handleGridKeyDown}
          onFocusDay={setFocusedDate}
          registerCell={registerCell}
        />
      ) : view === "week" ? (
        <WeekView
          date={date}
          events={events}
          locale={dateLocale}
          dayStart={dayStart}
          dayEnd={dayEnd}
          now={nowDate}
          onEventClick={onEventClick}
          onSlotClick={onSlotClick}
        />
      ) : (
        <DayView
          date={date}
          events={events}
          locale={dateLocale}
          dayStart={dayStart}
          dayEnd={dayEnd}
          now={nowDate}
          onEventClick={onEventClick}
          onSlotClick={onSlotClick}
        />
      )}
    </section>
  );
}
