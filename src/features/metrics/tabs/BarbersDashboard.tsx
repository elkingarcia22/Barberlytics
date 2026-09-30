import { BarList, MetricCard } from "@/components/charts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableShell } from "@/components/data-display/TableShell";
import { useAppT } from "@/app/i18n";
import { useMetricsFormatters } from "../metricsFormat";
import type { MetricsBarbers } from "../types";

/**
 * Barberos: lo que ganó el equipo y cómo se reparte, con la ocupación, la
 * cancelación y las propinas de cada uno en una tabla. Producción solo tenía
 * el neto por barbero; aquí cada fila cuenta cómo trabaja esa persona.
 */
export function BarbersDashboard({ data }: { data: MetricsBarbers }) {
  const t = useAppT();
  const format = useMetricsFormatters();
  const net = format.delta(data.kpis.totalNet);
  const loyalty = format.delta(data.kpis.loyalty, "pp");
  const occupancy = format.delta(data.kpis.avgOccupancy, "pp");
  const ticket = format.delta(data.kpis.avgTicket);
  const active = data.barbers.filter((row) => row.services > 0);

  return (
    <div className="flex flex-col space-y-section">
      <section aria-label={t("metrics.pulseAria")} className="grid gap-stack md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t("metrics.barbers.totalNet")}
          value={format.moneyRound(data.kpis.totalNet.value)}
          delta={net?.value}
          deltaLabel={net?.label}
          caption={t("metrics.barbers.totalNetCaption", { count: data.barbers.length })}
          hint={t("metrics.barbers.totalNetHint")}
          tone="positive"
          icon="analytics"
        />
        <MetricCard
          label={t("metrics.barbers.loyalty")}
          value={format.percent(data.kpis.loyalty.value)}
          delta={loyalty?.value}
          deltaLabel={loyalty?.label}
          caption={t("metrics.barbers.loyaltyCaption")}
          hint={t("metrics.barbers.loyaltyHint")}
          tone="brand"
          icon="award"
        />
        <MetricCard
          label={t("metrics.barbers.occupancy")}
          value={format.percent(data.kpis.avgOccupancy.value)}
          delta={occupancy?.value}
          deltaLabel={occupancy?.label}
          caption={t("metrics.barbers.occupancyCaption")}
          hint={t("metrics.barbers.occupancyHint")}
          tone={data.kpis.avgOccupancy.value < 50 ? "warning" : "neutral"}
          icon="calendar"
        />
        <MetricCard
          label={t("metrics.barbers.ticket")}
          value={format.money(data.kpis.avgTicket.value)}
          delta={ticket?.value}
          deltaLabel={ticket?.label}
          caption={t("metrics.barbers.ticketCaption")}
          tone="neutral"
          icon="scissors"
        />
      </section>

      <div className="grid gap-stack lg:grid-cols-2">
        <BarList
          title={t("metrics.barbers.netByBarber")}
          count={format.moneyRound(data.kpis.totalNet.value)}
          items={active.map((row) => ({ id: row.id, label: row.name, value: row.net, meta: `${format.count(row.services)} ${t("metrics.barbers.services")}` }))}
          formatValue={format.money}
          tone="positive"
          emptyLabel={t("metrics.barbers.empty")}
        />
        <BarList
          title={t("metrics.barbers.servicesByBarber")}
          count={format.count(active.reduce((sum, row) => sum + row.services, 0))}
          items={active.map((row) => ({ id: row.id, label: row.name, value: row.services, meta: format.percent(row.occupancy) }))}
          formatValue={format.count}
          tone="brand"
          emptyLabel={t("metrics.barbers.empty")}
        />
      </div>

      <TableShell title={t("metrics.barbers.table")} description={t("metrics.barbers.tableHint")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("metrics.barbers.colName")}</TableHead>
              <TableHead className="text-right">{t("metrics.barbers.colNet")}</TableHead>
              <TableHead className="text-right">{t("metrics.barbers.colServices")}</TableHead>
              <TableHead className="text-right">{t("metrics.barbers.colOccupancy")}</TableHead>
              <TableHead className="text-right">{t("metrics.barbers.colCancellation")}</TableHead>
              <TableHead className="text-right">{t("metrics.barbers.colTips")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.barbers.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium text-text-primary">{row.name}</TableCell>
                <TableCell className="text-right tabular-nums">{format.money(row.net)}</TableCell>
                <TableCell className="text-right tabular-nums">{format.count(row.services)}</TableCell>
                <TableCell className="text-right tabular-nums">{format.percent(row.occupancy)}</TableCell>
                <TableCell className={row.cancellationRate >= 25 ? "text-right tabular-nums text-status-negative" : "text-right tabular-nums"}>
                  {format.percent(row.cancellationRate)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{format.percent(row.tipsRate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableShell>
    </div>
  );
}
