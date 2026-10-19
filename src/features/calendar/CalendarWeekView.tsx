import * as React from "react";
import { addDays, format, isSameDay } from "date-fns";
import { useQueries } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorState } from "@/lib/query";
import { Text } from "@/components/typography";
import { calendarApi } from "./api";
import { calendarKeys } from "./queries";
import { PersonAvatar } from "./calendarShared";
import { isActive, servicesOf, servicesPrice, type ModelContext, teamIds } from "./calendarModel";
import { FULL_LOAD } from "./dayBrief";
import { FULL_CALENDAR_ACCESS, scopeDay } from "./calendarAccess";
import { WEEK_DAYS, weekCell, weekStartOf } from "./weekModel";
import { dayWeightOf } from "./dayWeight";
import { DayWeightBadge } from "./DayWeightBadge";
import type { CalendarDay, DayRhythm, TeamFilter } from "./types";

/**
 * La vista Semana: una fila por barbero y una columna por día, con cuánto de
 * su jornada tiene reservado y cuántas citas. Sirve para ver de un vistazo
 * dónde sobra agenda y dónde no cabe nadie más. Cada día dice si suele ser
 * pesado o suave; tocar un día (o una celda) abre su panel al lado.
 */

export interface CalendarWeekViewProps {
  branchId: string;
  date: Date;
  team: TeamFilter;
  ctx: ModelContext;
  today?: Date;
  /** El día abierto en el panel, resaltado. */
  selectedDay?: Date | null;
  /** El ritmo de la barbería, para marcar los días pesados y suaves. */
  rhythm?: DayRhythm;
  onSelectDay: (date: Date, barberId: string | null) => void;
}


export function CalendarWeekView({ branchId, date, team, ctx, today, selectedDay = null, rhythm, onSelectDay }: CalendarWeekViewProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const days = React.useMemo(() => Array.from({ length: WEEK_DAYS }, (_, index) => addDays(weekStartOf(date), index)), [date]);
  const results = useQueries({
    queries: days.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      return { queryKey: calendarKeys.day(branchId, key), queryFn: ({ signal }: { signal: AbortSignal }) => calendarApi.day(branchId, key, signal) };
    }),
  });

  const failed = results.find((result) => result.isError);
  if (failed) return <ErrorState error={failed.error} onRetry={() => results.forEach((result) => void result.refetch())} />;
  if (results.some((result) => !result.data)) return <Skeleton className="h-[28rem] w-full" role="status" aria-busy="true" />;
  // Un barbero ve la semana suya: sus citas y lo que suman, no las del local.
  const access = ctx.access ?? FULL_CALENDAR_ACCESS;
  const week = results.map((result) => scopeDay(result.data as CalendarDay, access.ownBarberId));

  const picked = teamIds(team);
  const barbers = ctx.catalog.barbers.filter((barber) => {
    if (picked.length > 0) return picked.includes(barber.id);
    if (team === "all") return true;
    return days.some((day, index) => weekCell(barber, day, week[index]).load !== null);
  });

  return (
    <div className="space-y-2" data-testid="calendar-week">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <Table aria-label={t("calendar.week.aria")}>
          <TableHeader>
            <TableRow>
              <TableHead>{t("calendar.field.barber")}</TableHead>
              {days.map((day, index) => {
                const active = week[index].appointments.filter(isActive);
                const expected = active.reduce((sum, item) => sum + (item.payment?.total ?? servicesPrice(servicesOf(ctx.catalog, item))), 0);
                const isToday = today ? isSameDay(day, today) : false;
                const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
                return (
                  <TableHead key={day.toISOString()} className={cn("text-center", isToday && "bg-primary/10", isSelected && "bg-primary/15")}>
                    <Button variant="ghost" size="sm" className="h-auto flex-col gap-0 py-1" onClick={() => onSelectDay(day, null)} aria-pressed={isSelected} aria-label={formatDate(day, { weekday: "long", day: "numeric", month: "long" })} data-testid={`calendar-week-day-${format(day, "yyyy-MM-dd")}`}>
                      <span className="flex items-center gap-1">
                        <Text as="span" weight="semibold" className="capitalize">
                          {formatDate(day, { weekday: "short", day: "numeric" })}
                        </Text>
                        <DayWeightBadge weight={dayWeightOf(rhythm, day)} booked={active.length} compact />
                      </span>
                      <Text as="span" variant="caption" className="tabular-nums">
                        {t("calendar.meta.appointments", { count: active.length })}
                        {access.showTotals && ` · ${ctx.formatMoney(expected)}`}
                      </Text>
                    </Button>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {barbers.map((barber) => (
              <TableRow key={barber.id}>
                <TableHead scope="row">
                  <span className="flex min-w-0 items-center gap-2">
                    <PersonAvatar name={barber.name} avatarUrl={barber.avatarUrl} size="sm" />
                    <Text as="span" weight="medium" className="truncate">
                      {barber.name}
                    </Text>
                  </span>
                </TableHead>
                {days.map((day, index) => {
                  const cell = weekCell(barber, day, week[index]);
                  if (cell.load === null) {
                    return (
                      <TableCell key={day.toISOString()} className="bg-surface-muted/60 text-center">
                        <Text as="span" variant="caption">
                          {t("calendar.meta.notWorking")}
                        </Text>
                      </TableCell>
                    );
                  }
                  const percent = Math.round(cell.load * 100);
                  return (
                    <TableCell key={day.toISOString()} className={cn("p-1", selectedDay && isSameDay(day, selectedDay) && "bg-primary/5")}>
                      <Button
                        variant="ghost"
                        className="h-auto w-full flex-col items-stretch gap-1 px-2 py-1.5"
                        onClick={() => onSelectDay(day, barber.id)}
                        aria-label={t("calendar.week.cell", { name: barber.name, day: formatDate(day, { weekday: "long", day: "numeric" }), percent, count: cell.count })}
                      >
                        <span className="flex items-baseline justify-between gap-1">
                          <Text as="span" weight="semibold" className="tabular-nums">
                            {percent}%
                          </Text>
                          <Text as="span" variant="caption" className="tabular-nums">
                            {cell.count}
                          </Text>
                        </span>
                        <Progress value={percent} color={cell.load >= FULL_LOAD ? "warning" : "primary"} className="h-1" aria-hidden="true" />
                      </Button>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Text variant="caption">{t("calendar.week.hint")}</Text>
    </div>
  );
}
