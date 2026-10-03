import { parseISO } from "date-fns";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KpiCard } from "@/components/charts";
import { Text } from "@/components/typography";
import { MonthOccupancyGrid, type MonthOccupancyDay } from "@/components/scheduling";
import { QueryBoundary } from "@/lib/query";
import { PersonAvatar } from "./calendarShared";
import { monthKey, teamIds } from "./calendarModel";
import { useMonthQuery } from "./queries";
import type { Barber, TeamFilter } from "./types";

/**
 * La vista Mes: la ocupación de un barbero (o del equipo) día por día, con
 * tres cifras arriba —citas del mes, ocupación media, día más lleno— y la
 * rejilla debajo. Tocar un día abre esa fecha en la vista Día.
 */

export interface CalendarMonthViewProps {
  branchId: string;
  date: Date;
  team: TeamFilter;
  barbers: readonly Barber[];
  onTeamChange: (team: TeamFilter) => void;
  onSelectDay: (date: Date) => void;
  today?: Date;
}

export function CalendarMonthView({ branchId, date, team, barbers, onTeamChange, onSelectDay, today }: CalendarMonthViewProps) {
  const t = useAppT();
  const { formatNumber, formatDate } = useLocale();
  // La ocupación del mes se pide de un barbero o de todo el equipo: con varios marcados, de todos.
  const picked = teamIds(team);
  const barberId = picked.length === 1 ? picked[0] : null;
  const query = useMonthQuery(branchId, monthKey(date), barberId);

  return (
    <div className="space-y-4" data-testid="calendar-month">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={barberId ?? "all"} onValueChange={(value) => onTeamChange(value === "all" ? "all" : value)}>
          <SelectTrigger className="w-[240px]" aria-label={t("calendar.month.barber")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("calendar.team.all")}</SelectItem>
            <SelectSeparator />
            {barbers.map((barber) => (
              <SelectItem key={barber.id} value={barber.id}>
                <span className="flex items-center gap-2">
                  <PersonAvatar name={barber.name} avatarUrl={barber.avatarUrl} size="sm" />
                  {barber.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Text variant="muted">{t("calendar.month.hint")}</Text>
      </div>

      <QueryBoundary
        query={query}
        loading={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-28" />
              ))}
            </div>
            <Skeleton className="h-[32rem]" />
          </div>
        }
      >
        {(month) => {
          const days: MonthOccupancyDay[] = month.days.map((day) => ({ date: parseISO(day.date), occupancy: day.occupancy, count: day.count }));
          const working = month.days.filter((day) => day.occupancy !== null);
          const total = month.days.reduce((sum, day) => sum + day.count, 0);
          const average = working.length > 0 ? working.reduce((sum, day) => sum + (day.occupancy ?? 0), 0) / working.length : 0;
          const busiest = working.reduce<(typeof working)[number] | null>((best, day) => (best === null || (day.occupancy ?? 0) > (best.occupancy ?? 0) ? day : best), null);
          return (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <KpiCard title={t("calendar.month.totalAppointments")} value={formatNumber(total)} />
                <KpiCard title={t("calendar.month.averageOccupancy")} value={`${formatNumber(Math.round(average * 100))}%`} />
                <KpiCard
                  title={t("calendar.month.busiestDay")}
                  value={busiest ? formatDate(parseISO(busiest.date), { weekday: "short", day: "numeric" }) : "—"}
                  description={busiest ? `${formatNumber(Math.round((busiest.occupancy ?? 0) * 100))}% · ${t("calendar.meta.appointments", { count: busiest.count })}` : undefined}
                />
              </div>
              <MonthOccupancyGrid month={date} days={days} selected={date} today={today} onSelectDay={onSelectDay} />
            </div>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
