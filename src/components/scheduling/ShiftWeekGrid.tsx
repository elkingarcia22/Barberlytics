import * as React from "react";
import { format, isSameDay } from "date-fns";
import type { Locale } from "date-fns";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ScheduleResourceAction, ScheduleWorkingHours } from "./scheduleTypes";
import { formatClock, initialsOf, parseClock } from "./scheduleUtils";

/**
 * SHIFT WEEK GRID
 *
 * Las horas de trabajo del equipo: una fila por persona y una columna por
 * día, con el turno de cada casilla («9:00 – 18:00») o «No trabaja». Un
 * turno cambiado solo esa semana lleva su marca. Cada casilla es un botón
 * que abre las acciones que le pase quien monta la rejilla (editar el día,
 * borrar el turno, volver al horario fijo).
 */

export interface ShiftDay {
  date: Date;
  range: ScheduleWorkingHours | null;
  /** El turno de ese día se cambió aparte del horario fijo. */
  overridden?: boolean;
}

export interface ShiftRow {
  id: string;
  name: string;
  avatarUrl?: string | null;
  days: readonly ShiftDay[];
}

export interface ShiftWeekGridProps {
  days: readonly Date[];
  rows: readonly ShiftRow[];
  today?: Date;
  /** Las acciones de una casilla. Sin ellas la casilla es solo lectura. */
  shiftActions?: (row: ShiftRow, day: ShiftDay) => readonly ScheduleResourceAction[];
  /** Acciones al tocar el nombre de la persona. */
  rowActions?: (row: ShiftRow) => readonly ScheduleResourceAction[];
  locale?: Locale;
  className?: string;
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** Horas de la semana de una fila, con un decimal. */
export function weekHours(row: Pick<ShiftRow, "days">): number {
  const minutes = row.days.reduce((sum, day) => sum + (day.range ? Math.max(0, parseClock(day.range.end) - parseClock(day.range.start)) : 0), 0);
  return Math.round((minutes / 60) * 10) / 10;
}

export function ShiftWeekGrid({ days, rows, today, shiftActions, rowActions, locale, className }: ShiftWeekGridProps) {
  const t = useT();
  const { locale: activeLocale, current, formatNumber } = useLocale();
  const dateLocale = locale ?? calendarLocale(activeLocale);
  const todayDate = React.useMemo(() => today ?? new Date(), [today]);

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-surface", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-subtle">
              <th scope="col" className="sticky left-0 z-raised w-56 bg-surface-subtle px-3 py-2 text-left text-xs font-semibold text-text-secondary">
                {t("schedule.team")}
              </th>
              {days.map((day) => {
                const isToday = isSameDay(day, todayDate);
                return (
                  <th key={day.toISOString()} scope="col" className={cn("px-2 py-2 text-center text-xs font-semibold", isToday ? "text-primary" : "text-text-secondary")}>
                    <span className="block">{capitalize(format(day, "EEE", { locale: dateLocale }))}</span>
                    <span className={cn("mt-0.5 inline-flex size-6 items-center justify-center rounded-full tabular-nums", isToday && "bg-primary text-primary-foreground")}>{format(day, "d")}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const hours = weekHours(row);
              const identity = (
                <>
                  <Avatar size="default">
                    {row.avatarUrl && <AvatarImage src={row.avatarUrl} alt="" />}
                    <AvatarFallback>{initialsOf(row.name)}</AvatarFallback>
                  </Avatar>
                  <span className="flex min-w-0 flex-col text-left">
                    <span className="truncate font-semibold text-text-primary">{row.name}</span>
                    <span className="text-xs tabular-nums text-text-muted">{t("schedule.weekHours", { hours: formatNumber(hours) })}</span>
                  </span>
                </>
              );
              const actions = rowActions?.(row) ?? [];
              return (
                <tr key={row.id} className="border-b border-border/60 last:border-b-0">
                  <th scope="row" className="sticky left-0 z-raised bg-surface px-2 py-1.5 text-left font-normal">
                    {actions.length > 0 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={t("schedule.resourceMenu", { name: row.name })}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-lg px-1.5 py-1",
                              "transition-colors duration-fast ease-out-expo hover:bg-surface-subtle motion-reduce:transition-none",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                            )}
                          >
                            {identity}
                            <ChevronDown className="ml-auto size-4 shrink-0 text-text-muted" aria-hidden="true" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {actions.map((action) => (
                            <DropdownMenuItem key={action.id} onSelect={() => action.onSelect()}>
                              {action.icon}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <div className="flex items-center gap-2 px-1.5 py-1">{identity}</div>
                    )}
                  </th>
                  {row.days.map((day) => (
                    <td key={day.date.toISOString()} className={cn("px-1.5 py-1.5 text-center", isSameDay(day.date, todayDate) && "bg-primary/5")}>
                      <ShiftCell row={row} day={day} intl={current.intl} dateLocale={dateLocale} actions={shiftActions?.(row, day) ?? []} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ShiftCell({ row, day, intl, dateLocale, actions }: { row: ShiftRow; day: ShiftDay; intl: string; dateLocale: Locale; actions: readonly ScheduleResourceAction[] }) {
  const t = useT();
  const label = day.range
    ? `${formatClock(new Date(2000, 0, 1, Math.floor(parseClock(day.range.start) / 60), parseClock(day.range.start) % 60), intl)} – ${formatClock(new Date(2000, 0, 1, Math.floor(parseClock(day.range.end) / 60), parseClock(day.range.end) % 60), intl)}`
    : t("schedule.notWorking");
  const dayLabel = capitalize(format(day.date, "EEEE d 'de' MMMM", { locale: dateLocale }));
  const chip = (
    <span
      className={cn(
        "inline-flex w-full items-center justify-center gap-1 rounded-full border px-2 py-1 text-xs tabular-nums",
        "transition-colors duration-fast ease-out-expo motion-reduce:transition-none",
        day.range ? "border-border bg-surface text-text-primary" : "border-dashed border-border bg-surface-muted/60 text-text-muted",
        day.overridden && "border-warning/60 bg-warning/10 text-text-primary",
        actions.length > 0 && "cursor-pointer hover:bg-surface-subtle"
      )}
    >
      {day.overridden && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-warning" />}
      <span className="truncate">{label}</span>
      {actions.length > 0 && <ChevronDown className="size-3 shrink-0 text-text-muted" aria-hidden="true" />}
    </span>
  );

  if (actions.length === 0) return chip;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${t("schedule.shiftOf", { name: row.name, date: dayLabel })}: ${label}${day.overridden ? ` (${t("schedule.thisWeekOnly")})` : ""}`}
          className="block w-full rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {chip}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        {actions.map((action) => (
          <DropdownMenuItem key={action.id} onSelect={() => action.onSelect()}>
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
