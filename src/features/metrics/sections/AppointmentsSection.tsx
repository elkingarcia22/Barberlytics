import * as React from "react";
import { ChartCard, CompositionDonut, DistributionBar, useChartPalette, type ChartTone, type EChartsOption } from "@/components/charts";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { useMetricsFormatters } from "../metricsFormat";
import type { AppointmentStatus, BookingMethod, Daypart, MetricsBusiness, PaymentMethod } from "../types";

interface AppointmentsSectionProps {
  data: MetricsBusiness;
}

const STATUS: Readonly<Record<AppointmentStatus, { labelKey: AppMessageKey; tone: ChartTone }>> = {
  completed: { labelKey: "metrics.status.completed", tone: "positive" },
  pendingCollection: { labelKey: "metrics.status.pendingCollection", tone: "warning" },
  cancelled: { labelKey: "metrics.status.cancelled", tone: "negative" },
  noShow: { labelKey: "metrics.status.noShow", tone: "neutral" },
};

const METHOD: Readonly<Record<BookingMethod, { labelKey: AppMessageKey; tone: ChartTone }>> = {
  internal: { labelKey: "metrics.method.internal", tone: "brand" },
  online: { labelKey: "metrics.method.online", tone: "positive" },
  walkIn: { labelKey: "metrics.method.walkIn", tone: "neutral" },
};

const PAYMENT: Readonly<Record<PaymentMethod, { labelKey: AppMessageKey; tone: ChartTone }>> = {
  card: { labelKey: "metrics.payment.card", tone: "brand" },
  cash: { labelKey: "metrics.payment.cash", tone: "positive" },
  transfer: { labelKey: "metrics.payment.transfer", tone: "warning" },
  giftCard: { labelKey: "metrics.payment.giftCard", tone: "neutral" },
};

const DAYPART: Readonly<Record<Daypart, { labelKey: AppMessageKey; hintKey: AppMessageKey; tone: ChartTone }>> = {
  morning: { labelKey: "metrics.daypart.morning", hintKey: "metrics.daypart.morningHint", tone: "warning" },
  afternoon: { labelKey: "metrics.daypart.afternoon", hintKey: "metrics.daypart.afternoonHint", tone: "brand" },
  evening: { labelKey: "metrics.daypart.evening", hintKey: "metrics.daypart.eveningHint", tone: "neutral" },
};

const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

/** Citas por hora, con la hora pico en el color de marca y el resto apagado. */
function useTrafficOption(data: MetricsBusiness, seriesName: string): { option: EChartsOption; peak: { hour: number; count: number } | undefined } {
  const palette = useChartPalette();
  return React.useMemo(() => {
    const rows = data.appointments.byHour;
    const peak = rows.reduce<{ hour: number; count: number } | undefined>(
      (best, row) => (row.count > 0 && (!best || row.count > best.count) ? { hour: row.hour, count: row.count } : best),
      undefined
    );
    return {
      peak,
      option: {
        grid: { left: 8, right: 8, top: 16, bottom: 8, containLabel: true },
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        xAxis: { type: "category", data: rows.map((row) => hourLabel(row.hour)), axisTick: { show: false }, axisLabel: { interval: 1 } },
        yAxis: { type: "value", minInterval: 1 },
        series: [
          {
            name: seriesName,
            type: "bar",
            barMaxWidth: 22,
            data: rows.map((row) => ({
              value: row.count,
              itemStyle: {
                color: peak && row.hour === peak.hour ? palette.brand : palette.neutral,
                opacity: peak && row.hour === peak.hour ? 1 : 0.35,
                borderRadius: [4, 4, 0, 0],
              },
            })),
          },
        ],
      },
    };
  }, [data.appointments.byHour, palette, seriesName]);
}

/**
 * Las citas del periodo: en qué acabaron, cómo se pagaron y por dónde
 * entraron (tres repartos), y cuándo llegan (por hora y por franja). El
 * tráfico por hora es una gráfica de verdad con la hora pico marcada; en
 * producción era una lista de veintiuna líneas.
 */
export function AppointmentsSection({ data }: AppointmentsSectionProps) {
  const t = useAppT();
  const format = useMetricsFormatters();
  const { option, peak } = useTrafficOption(data, t("metrics.traffic.series"));
  const { appointments, payments } = data;
  const paid = payments.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="grid gap-stack lg:grid-cols-3">
      <CompositionDonut
        title={t("metrics.appointments.title")}
        center={{ value: format.count(appointments.clients), label: t("metrics.appointments.clients") }}
        slices={appointments.byStatus.map((row) => ({ id: row.id, label: t(STATUS[row.id].labelKey), value: row.count, tone: STATUS[row.id].tone }))}
        formatValue={format.count}
        showShare
        emptyLabel={t("metrics.empty")}
      />
      <CompositionDonut
        title={t("metrics.payments.title")}
        center={{ value: format.moneyRound(paid), label: t("metrics.payments.income") }}
        slices={payments.map((row) => ({ id: row.id, label: t(PAYMENT[row.id].labelKey), value: row.amount, tone: PAYMENT[row.id].tone }))}
        formatValue={format.money}
        showShare
        emptyLabel={t("metrics.empty")}
      />
      <CompositionDonut
        title={t("metrics.method.title")}
        center={{ value: format.count(appointments.total), label: t("metrics.method.appointments") }}
        slices={appointments.byMethod.map((row) => ({ id: row.id, label: t(METHOD[row.id].labelKey), value: row.count, tone: METHOD[row.id].tone }))}
        formatValue={format.count}
        showShare
        emptyLabel={t("metrics.empty")}
      />

      <ChartCard
        className="lg:col-span-2"
        title={t("metrics.traffic.title")}
        description={t("metrics.traffic.description")}
        option={option}
        height={240}
        empty={!peak}
        ariaLabel={t("metrics.traffic.title")}
        summary={peak ? t("metrics.traffic.peak", { hour: hourLabel(peak.hour), count: peak.count }) : undefined}
      />
      <DistributionBar
        title={t("metrics.daypart.title")}
        unit={t("metrics.daypart.unit")}
        segments={appointments.byDaypart.map((row) => ({
          id: row.id,
          label: t(DAYPART[row.id].labelKey),
          hint: t(DAYPART[row.id].hintKey),
          value: row.count,
          tone: DAYPART[row.id].tone,
        }))}
        formatValue={format.count}
        emptyLabel={t("metrics.empty")}
      />
    </div>
  );
}
