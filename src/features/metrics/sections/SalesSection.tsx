import * as React from "react";
import { BarList, ChartCard, MetricCard, useChartPalette, type BarListItem, type EChartsOption } from "@/components/charts";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { useMetricsFormatters, type MetricsFormatters } from "../metricsFormat";
import type { IncomeLine, MetricsBusiness } from "../types";

interface SalesSectionProps {
  data: MetricsBusiness;
}

const INCOME_LABELS: Readonly<Record<IncomeLine, AppMessageKey>> = {
  services: "metrics.income.services",
  products: "metrics.income.products",
  taxes: "metrics.income.taxes",
  tips: "metrics.income.tips",
  fees: "metrics.income.fees",
  noShow: "metrics.income.noShow",
};

/** Barras de ventas y una línea de citas sobre el mismo eje de tiempo. */
function useTrendOption(data: MetricsBusiness, format: MetricsFormatters, labels: { sales: string; appointments: string }): EChartsOption {
  const palette = useChartPalette();
  return React.useMemo(
    () => ({
      grid: { left: 8, right: 8, top: 32, bottom: 8, containLabel: true },
      legend: { top: 0, right: 0, icon: "circle" },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: (value: unknown) => (typeof value === "number" ? format.money(value) : String(value)),
      },
      xAxis: { type: "category", data: data.trend.map((point) => point.label), axisTick: { show: false } },
      yAxis: [
        { type: "value", axisLabel: { formatter: (value: number) => format.moneyRound(value) } },
        { type: "value", show: false },
      ],
      series: [
        {
          name: labels.sales,
          type: "bar",
          data: data.trend.map((point) => point.sales),
          itemStyle: { color: palette.brand, borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 28,
        },
        {
          name: labels.appointments,
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          data: data.trend.map((point) => point.appointments),
          itemStyle: { color: palette.warning },
          lineStyle: { width: 2, color: palette.warning },
          tooltip: { valueFormatter: (value: unknown) => format.count(Number(value)) },
        },
      ],
    }),
    [data.trend, format, labels.sales, labels.appointments, palette]
  );
}

/**
 * Cuánto se vendió y de dónde salió: la serie del periodo a la izquierda y el
 * desglose del ingreso a la derecha, con las tres cifras menores —propinas,
 * reembolsos, descuentos— al pie del desglose en vez de en tres tarjetas más.
 */
export function SalesSection({ data }: SalesSectionProps) {
  const t = useAppT();
  const format = useMetricsFormatters();
  const option = useTrendOption(data, format, { sales: t("metrics.trend.sales"), appointments: t("metrics.trend.appointments") });

  const incomeItems: BarListItem[] = data.income.map((line) => ({ id: line.id, label: t(INCOME_LABELS[line.id]), value: line.amount }));
  const hasTrend = data.trend.some((point) => point.sales > 0);
  const tips = format.delta(data.kpis.tipsRate, "pp");

  return (
    <div className="grid gap-stack lg:grid-cols-3">
      <ChartCard
        className="lg:col-span-2"
        title={t("metrics.trend.title")}
        description={t("metrics.trend.description", { unit: t(`metrics.trend.unit.${data.period.granularity}`) })}
        option={option}
        height={260}
        empty={!hasTrend}
        ariaLabel={t("metrics.trend.title")}
      />
      <BarList
        title={t("metrics.income.title")}
        count={format.moneyRound(data.kpis.sales.value)}
        items={incomeItems}
        formatValue={format.money}
        sorted={false}
        tone="brand"
        emptyLabel={t("metrics.empty")}
        actions={undefined}
        className="min-w-0"
      />
      {/* Las tres cifras menores del dinero, con la misma tarjeta que el pulso
          para que la fila se lea como parte del mismo tablero. */}
      <MetricCard
        label={t("metrics.kpi.tips")}
        value={format.percent(data.kpis.tipsRate.value)}
        delta={tips?.value}
        deltaLabel={tips?.label}
        caption={t("metrics.kpi.tipsCaption", { amount: format.money(data.kpis.tipsAmount) })}
        hint={t("metrics.kpi.tipsHint")}
        tone="positive"
        icon="award"
      />
      <MetricCard
        label={t("metrics.kpi.refunds")}
        value={format.money(data.kpis.refunds.amount)}
        caption={t("metrics.kpi.refundsCaption", { rate: format.percent(data.kpis.refunds.rate) })}
        tone={data.kpis.refunds.amount > 0 ? "warning" : "neutral"}
        icon="refresh"
      />
      <MetricCard
        label={t("metrics.kpi.discounts")}
        value={format.money(data.kpis.discounts.amount)}
        caption={t("metrics.kpi.discountsCaption", { rate: format.percent(data.kpis.discounts.rate) })}
        tone="neutral"
        icon="templates"
      />
    </div>
  );
}
