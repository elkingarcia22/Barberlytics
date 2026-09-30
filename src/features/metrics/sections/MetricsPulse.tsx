import * as React from "react";
import { MetricCard, MetricRing, SparklineChart, useChartPalette } from "@/components/charts";
import { useAppT } from "@/app/i18n";
import { useMetricsFormatters } from "../metricsFormat";
import type { MetricsBusiness } from "../types";

interface MetricsPulseProps {
  data: MetricsBusiness;
}

/**
 * Las cuatro lecturas de arriba: cuánto se vendió, a cuánto el ticket, cuántas
 * citas y cuántas se perdieron. Cada una con su variación frente al periodo
 * anterior, que es lo que producción no tenía y lo primero que se pregunta.
 *
 * La cancelación es una métrica invertida: si sube, la píldora va en rojo
 * aunque el signo sea positivo.
 */
export function MetricsPulse({ data }: MetricsPulseProps) {
  const t = useAppT();
  const format = useMetricsFormatters();
  const palette = useChartPalette();
  /* El anillo pinta en canvas, así que el índigo del tono neutro —el que
     lleva la tarjeta— se resuelve aquí; el gris de la paleta de series no es
     el mismo color. */
  const ringColor = React.useMemo(
    () => getComputedStyle(document.documentElement).getPropertyValue("--color-indigo").trim() || palette.brand,
    [palette.brand]
  );
  const { kpis, appointments, trend } = data;

  const completed = appointments.byStatus.find((row) => row.id === "completed")?.count ?? 0;
  const pending = appointments.byStatus.find((row) => row.id === "pendingCollection")?.count ?? 0;
  const completionShare = appointments.total ? Math.round((completed / appointments.total) * 100) : 0;
  const trendSeries = React.useMemo(() => trend.map((point) => ({ label: point.label, value: point.sales })), [trend]);

  const sales = format.delta(kpis.sales);
  const ticket = format.delta(kpis.averageTicket);
  const bookings = format.delta(kpis.transactions);
  const cancellation = format.delta(kpis.cancellationRate, "pp");

  return (
    <section aria-label={t("metrics.pulseAria")} className="grid gap-stack md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label={t("metrics.kpi.sales")}
        value={format.moneyRound(kpis.sales.value)}
        delta={sales?.value}
        deltaLabel={sales?.label}
        caption={t("metrics.kpi.salesCaption", { count: kpis.transactions.value })}
        hint={t("metrics.kpi.salesHint")}
        tone="brand"
        icon="analytics"
        chartPlacement="bottom"
        chart={<SparklineChart data={trendSeries} height={44} trend={sales && sales.value < 0 ? "negative" : "positive"} ariaLabel={t("metrics.trend.title")} />}
      />
      <MetricCard
        label={t("metrics.kpi.ticket")}
        value={format.money(kpis.averageTicket.value)}
        delta={ticket?.value}
        deltaLabel={ticket?.label}
        caption={t("metrics.kpi.ticketCaption")}
        hint={t("metrics.kpi.ticketHint")}
        tone="positive"
        icon="award"
      />
      <MetricCard
        label={t("metrics.kpi.appointments")}
        value={format.count(appointments.total)}
        delta={bookings?.value}
        deltaLabel={bookings?.label}
        caption={t("metrics.kpi.appointmentsCaption", { completed, pending })}
        hint={t("metrics.kpi.appointmentsHint")}
        tone="neutral"
        icon="calendar"
        chart={<MetricRing value={completionShare} color={ringColor} ariaLabel={`${completionShare} % ${t("metrics.status.completed")}`} />}
      />
      <MetricCard
        label={t("metrics.kpi.cancellation")}
        value={format.percent(kpis.cancellationRate.value)}
        delta={cancellation?.value}
        deltaLabel={cancellation?.label}
        deltaTone={cancellation && cancellation.value > 0.5 ? "negative" : cancellation && cancellation.value < -0.5 ? "positive" : "neutral"}
        caption={t("metrics.kpi.cancellationCaption")}
        hint={t("metrics.kpi.cancellationHint")}
        tone={kpis.cancellationRate.value >= 25 ? "negative" : "warning"}
        icon="warning"
      />
    </section>
  );
}
