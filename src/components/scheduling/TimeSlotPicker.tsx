import * as React from "react";
import { addDays, format, isSameDay, isSameMonth, startOfDay } from "date-fns";
import type { Locale } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { Button } from "@/components/ui/button";
import { atMinutes, formatClock, minutesOfDay, slotMinutes } from "./scheduleUtils";

/**
 * TIME SLOT PICKER
 *
 * Elegir cuándo: una tira de días para la fecha y, debajo, las horas
 * repartidas en mañana, tarde y noche como chips. Es el selector de
 * «Fecha & Hora» al crear una cita: se ve el día y la hora de una vez, sin
 * abrir un calendario y luego un reloj.
 *
 * Las horas que no sirven —fuera del horario del barbero, ya ocupadas— se
 * apagan con `isSlotDisabled`; el componente no sabe por qué, solo las pinta.
 */

export interface TimeSlotPickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  /** Primer día de la tira; por defecto, hoy. */
  startDate?: Date;
  /** Cuántos días se pueden recorrer hacia delante. */
  daysCount?: number;
  /** Primera y última hora ofrecidas (la última exclusiva). */
  startHour?: number;
  endHour?: number;
  slotMinutes?: number;
  isSlotDisabled?: (date: Date) => boolean;
  locale?: Locale;
  className?: string;
}

const DEFAULT_DAYS = 28;
const VISIBLE_DAYS = 7;
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 24;
const DEFAULT_STEP = 30;
/** Dónde empieza la tarde y la noche, en horas. */
const AFTERNOON_FROM = 12;
const EVENING_FROM = 18;

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function TimeSlotPicker({
  value,
  onChange,
  startDate,
  daysCount = DEFAULT_DAYS,
  startHour = DEFAULT_START_HOUR,
  endHour = DEFAULT_END_HOUR,
  slotMinutes: step = DEFAULT_STEP,
  isSlotDisabled,
  locale,
  className,
}: TimeSlotPickerProps) {
  const t = useT();
  const { locale: activeLocale, current } = useLocale();
  const dateLocale = locale ?? calendarLocale(activeLocale);
  const first = React.useMemo(() => startOfDay(startDate ?? new Date()), [startDate]);
  const days = React.useMemo(() => Array.from({ length: daysCount }, (_, index) => addDays(first, index)), [first, daysCount]);
  const [day, setDay] = React.useState<Date>(() => (value ? startOfDay(value) : first));
  const [page, setPage] = React.useState(() => Math.floor(Math.max(0, days.findIndex((item) => isSameDay(item, day))) / VISIBLE_DAYS));
  const pages = Math.ceil(days.length / VISIBLE_DAYS);
  const visible = days.slice(page * VISIBLE_DAYS, page * VISIBLE_DAYS + VISIBLE_DAYS);

  const slots = React.useMemo(() => slotMinutes(startHour, endHour, step), [startHour, endHour, step]);
  const groups = [
    { id: "morning", label: t("schedule.morning"), slots: slots.filter((minute) => minute < AFTERNOON_FROM * 60) },
    { id: "afternoon", label: t("schedule.afternoon"), slots: slots.filter((minute) => minute >= AFTERNOON_FROM * 60 && minute < EVENING_FROM * 60) },
    { id: "evening", label: t("schedule.evening"), slots: slots.filter((minute) => minute >= EVENING_FROM * 60) },
  ].filter((group) => group.slots.length > 0);

  const monthLabel = capitalize(format(visible[0] ?? day, "LLLL yyyy", { locale: dateLocale }));
  const monthMixed = visible.length > 0 && !isSameMonth(visible[0], visible[visible.length - 1]);
  const selectedMinute = value && isSameDay(value, day) ? minutesOfDay(value) : null;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-text-primary">
            {monthLabel}
            {monthMixed && ` – ${capitalize(format(visible[visible.length - 1], "LLLL", { locale: dateLocale }))}`}
          </span>
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="icon-sm" aria-label={t("schedule.previousWeek")} disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>
              <ChevronLeft />
            </Button>
            <Button type="button" variant="outline" size="icon-sm" aria-label={t("schedule.nextWeek")} disabled={page >= pages - 1} onClick={() => setPage((current) => Math.min(pages - 1, current + 1))}>
              <ChevronRight />
            </Button>
          </div>
        </div>
        <div role="radiogroup" aria-label={t("schedule.pickDay")} className="grid grid-cols-7 gap-1.5">
          {visible.map((item) => {
            const active = isSameDay(item, day);
            return (
              <button
                key={item.toISOString()}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={capitalize(format(item, "EEEE d 'de' MMMM", { locale: dateLocale }))}
                onClick={() => setDay(item)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg border px-1 py-2",
                  "transition-colors duration-fast ease-out-expo motion-reduce:transition-none",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-text-secondary hover:bg-surface-subtle",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                )}
              >
                <span className="text-xs">{format(item, "EEE", { locale: dateLocale })}</span>
                <span className="text-sm font-semibold tabular-nums">{format(item, "d")}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div role="radiogroup" aria-label={t("schedule.pickTime")} className="flex flex-col gap-3">
        {groups.map((group) => {
          const options = group.slots.map((minute) => ({ minute, date: atMinutes(day, minute) }));
          const enabled = options.filter((option) => !isSlotDisabled?.(option.date));
          return (
            <div key={group.id} className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{group.label}</span>
              {enabled.length === 0 ? (
                <span className="text-xs text-text-muted">{t("schedule.noSlots")}</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {options.map(({ minute, date }) => {
                    const disabled = Boolean(isSlotDisabled?.(date));
                    const active = selectedMinute === minute;
                    return (
                      <button
                        key={minute}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={disabled}
                        onClick={() => onChange(date)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs tabular-nums",
                          "transition-colors duration-fast ease-out-expo motion-reduce:transition-none",
                          active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-text-primary hover:bg-surface-subtle",
                          disabled && "cursor-not-allowed opacity-40 line-through hover:bg-surface",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        )}
                      >
                        {formatClock(date, current.intl)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
