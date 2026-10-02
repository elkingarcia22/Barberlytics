import { BarList, CompositionDonut, DistributionBar, MetricCard } from "@/components/charts";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { useMetricsFormatters } from "../metricsFormat";
import type { ClientType, MetricsCustomers, VisitFrequency } from "../types";

const CLIENT_TYPE: Readonly<Record<ClientType, { labelKey: AppMessageKey; tone: "brand" | "positive" | "neutral" | "warning" }>> = {
  new: { labelKey: "metrics.clientType.new", tone: "brand" },
  retainedNew: { labelKey: "metrics.clientType.retainedNew", tone: "positive" },
  repeat: { labelKey: "metrics.clientType.repeat", tone: "neutral" },
  recovered: { labelKey: "metrics.clientType.recovered", tone: "warning" },
};

const FREQUENCY: Readonly<Record<VisitFrequency, AppMessageKey>> = {
  weekly: "metrics.frequency.weekly",
  biweekly: "metrics.frequency.biweekly",
  monthly: "metrics.frequency.monthly",
  occasional: "metrics.frequency.occasional",
};

/**
 * Clientes: cuántos vuelven, cuánto deja cada uno, por dónde reservan y qué
 * tipo de cliente llena la agenda. Cada cifra con su variación frente al
 * periodo anterior.
 */
export function CustomersDashboard({ data }: { data: MetricsCustomers }) {
  const t = useAppT();
  const format = useMetricsFormatters();
  const retention = format.delta(data.kpis.retentionRate, "pp");
  const income = format.delta(data.kpis.avgIncomePerClient);
  const online = format.delta(data.kpis.onlineBookings, "pp");
  const walkIn = format.delta(data.kpis.walkInRate, "pp");

  return (
    <div className="flex flex-col space-y-section">
      <section aria-label={t("metrics.pulseAria")} className="grid gap-stack md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t("metrics.customers.retention")}
          value={format.percent(data.kpis.retentionRate.value)}
          delta={retention?.value}
          deltaLabel={retention?.label}
          caption={t("metrics.customers.retentionCaption", { count: data.newVsReturning.returning })}
          hint={t("metrics.customers.retentionHint")}
          tone="positive"
          icon="refresh"
        />
        <MetricCard
          label={t("metrics.customers.incomePerClient")}
          value={format.money(data.kpis.avgIncomePerClient.value)}
          delta={income?.value}
          deltaLabel={income?.label}
          caption={t("metrics.customers.incomePerClientCaption", { count: data.clients })}
          hint={t("metrics.customers.incomePerClientHint")}
          tone="brand"
          icon="users"
        />
        <MetricCard
          label={t("metrics.customers.online")}
          value={format.percent(data.kpis.onlineBookings.value)}
          delta={online?.value}
          deltaLabel={online?.label}
          caption={t("metrics.customers.onlineCaption")}
          hint={t("metrics.customers.onlineHint")}
          tone="neutral"
          icon="phone"
        />
        <MetricCard
          label={t("metrics.customers.walkIn")}
          value={format.percent(data.kpis.walkInRate.value)}
          delta={walkIn?.value}
          deltaLabel={walkIn?.label}
          caption={t("metrics.customers.walkInCaption")}
          hint={t("metrics.customers.walkInHint")}
          tone="warning"
          icon="home"
        />
      </section>

      <div className="grid gap-stack lg:grid-cols-3">
        <CompositionDonut
          title={t("metrics.customers.byType")}
          center={{ value: format.count(data.clients), label: t("metrics.customers.clients") }}
          slices={data.byClientType.map((row) => ({ id: row.id, label: t(CLIENT_TYPE[row.id].labelKey), value: row.count, tone: CLIENT_TYPE[row.id].tone }))}
          formatValue={format.count}
          showShare
          emptyLabel={t("metrics.empty")}
        />
        <div className="flex flex-col gap-stack">
          <DistributionBar
            title={t("metrics.customers.newVsReturning")}
            unit={t("metrics.customers.clients")}
            segments={[
              { id: "new", label: t("metrics.customers.new"), value: data.newVsReturning.new, tone: "brand" },
              { id: "returning", label: t("metrics.customers.returning"), value: data.newVsReturning.returning, tone: "positive" },
            ]}
            formatValue={format.count}
            emptyLabel={t("metrics.empty")}
          />
          <DistributionBar
            title={t("metrics.customers.preference")}
            unit={t("metrics.customers.clients")}
            segments={[
              { id: "with", label: t("metrics.customers.withPreference"), value: data.barberPreference.withPreference, tone: "brand" },
              { id: "none", label: t("metrics.customers.noPreference"), value: data.barberPreference.noPreference, tone: "neutral" },
            ]}
            formatValue={format.count}
            emptyLabel={t("metrics.empty")}
          />
        </div>
        <BarList
          title={t("metrics.customers.frequency")}
          description={t("metrics.customers.frequencyHint")}
          count={format.count(data.newVsReturning.returning)}
          items={data.visitFrequency.map((row) => ({ id: row.id, label: t(FREQUENCY[row.id]), value: row.count }))}
          formatValue={format.count}
          sorted={false}
          tone="positive"
          emptyLabel={t("metrics.empty")}
        />
      </div>
    </div>
  );
}
