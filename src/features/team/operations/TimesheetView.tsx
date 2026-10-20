import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { QueryBoundary } from "@/lib/query";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { EmptyState } from "@/components/feedback";
import { Text } from "@/components/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTimesheet } from "./operationsApi";

const DAY: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric" };
const TIME: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };

/**
 * Los fichajes de la semana: por persona, lo fichado contra lo de su horario, los días que llegó tarde (más de 10 minutos
 * después de su hora) y los que tenía turno y no fichó. Solo empleados: el barbero de renta no ficha.
 */
export function TimesheetView({ branchId, from, to }: { branchId: string; from: string; to: string }) {
  const t = useAppT();
  const { formatDate, formatNumber } = useLocale();
  const query = useTimesheet(branchId, from, to);
  const hours = (minutes: number) => formatNumber(Math.round((minutes / 60) * 10) / 10, { maximumFractionDigits: 1 });
  const day = (value: string) => formatDate(new Date(`${value}T12:00:00`), DAY);

  return (
    <QueryBoundary query={query} loading={<Skeleton className="h-72 w-full rounded-2xl" />} empty={{ when: (data) => data.rows.length === 0, render: <EmptyState icon="clock" title={t("team.timesheet.emptyTitle")} description={t("team.timesheet.emptyHint")} /> }}>
      {(data) => (
        <div className="space-y-3" data-testid="timesheet">
          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("team.timesheet.person")}</TableHead>
                  <TableHead className="text-right">{t("team.timesheet.worked")}</TableHead>
                  <TableHead className="text-right">{t("team.timesheet.scheduled")}</TableHead>
                  <TableHead>{t("team.timesheet.late")}</TableHead>
                  <TableHead>{t("team.timesheet.absent")}</TableHead>
                  <TableHead>{t("team.timesheet.now")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row) => {
                  const diff = row.workedMinutes - row.scheduledMinutes;
                  return (
                    <TableRow key={row.memberId}>
                      <TableCell className="font-medium text-text-primary">{row.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {t("team.timesheet.hours", { hours: hours(row.workedMinutes) })}
                        {row.scheduledMinutes > 0 && <span className={diff < -30 ? "block text-xs text-status-warning" : "block text-xs text-text-muted"}>{`${diff >= 0 ? "+" : "−"}${hours(Math.abs(diff))} h`}</span>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-text-secondary">{t("team.timesheet.hours", { hours: hours(row.scheduledMinutes) })}</TableCell>
                      <TableCell className={row.lateDays.length > 0 ? "text-status-warning" : "text-text-muted"}>{row.lateDays.length > 0 ? row.lateDays.map(day).join(", ") : "—"}</TableCell>
                      <TableCell className={row.absentDays.length > 0 ? "text-status-negative" : "text-text-muted"}>{row.absentDays.length > 0 ? row.absentDays.map(day).join(", ") : "—"}</TableCell>
                      <TableCell>{row.open ? <StatusBadge status="active" label={t("team.timesheet.since", { time: formatDate(new Date(row.open.clockIn), TIME) })} /> : <span className="text-text-muted">—</span>}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <Text size="xs" tone="muted">
            {t("team.timesheet.note")}
          </Text>
        </div>
      )}
    </QueryBoundary>
  );
}
