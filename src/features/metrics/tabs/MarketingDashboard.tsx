import { BarList, MetricCard } from "@/components/charts";
import { EmptyState } from "@/components/feedback";
import { useAppT } from "@/app/i18n";
import { useMetricsFormatters } from "../metricsFormat";
import type { MetricsMarketing } from "../types";

/**
 * Marketing: por dónde llegan las reservas digitales, cuánto convierte cada
 * canal y qué trajo cada campaña. Sin datos, un solo vacío que dice qué hace
 * falta, no tres tarjetas con un icono gris.
 */
export function MarketingDashboard({ data }: { data: MetricsMarketing }) {
  const t = useAppT();
  const format = useMetricsFormatters();
  const online = format.delta(data.kpis.onlineBookings, "pp");
  const campaigns = format.delta(data.kpis.campaignBookings);
  const hasData = data.channels.length > 0 || data.campaigns.length > 0;
  const conversion = data.channels.map((channel) => ({
    id: channel.id,
    label: channel.name,
    value: channel.visits ? Math.round((channel.bookings / channel.visits) * 1000) / 10 : 0,
    meta: `${format.count(channel.bookings)}/${format.count(channel.visits)}`,
  }));

  return (
    <div className="flex flex-col space-y-section">
      <section aria-label={t("metrics.pulseAria")} className="grid gap-stack md:grid-cols-3">
        <MetricCard
          label={t("metrics.marketing.online")}
          value={format.percent(data.kpis.onlineBookings.value)}
          delta={online?.value}
          deltaLabel={online?.label}
          caption={t("metrics.marketing.onlineCaption")}
          hint={t("metrics.customers.onlineHint")}
          tone="brand"
          icon="phone"
        />
        <MetricCard
          label={t("metrics.marketing.bestChannel")}
          value={data.kpis.bestChannel ?? <span className="text-text-muted">—</span>}
          caption={data.kpis.bestChannel ? t("metrics.marketing.bestChannelCaption") : t("metrics.marketing.noChannel")}
          hint={t("metrics.marketing.bestChannelHint")}
          tone={data.kpis.bestChannel ? "positive" : "neutral"}
          icon="award"
        />
        <MetricCard
          label={t("metrics.marketing.campaignBookings")}
          value={format.count(data.kpis.campaignBookings.value)}
          delta={campaigns?.value}
          deltaLabel={campaigns?.label}
          caption={t("metrics.marketing.campaignBookingsCaption", { count: data.campaigns.length })}
          hint={t("metrics.marketing.campaignBookingsHint")}
          tone="warning"
          icon="sparkles"
        />
      </section>

      {hasData ? (
        <div className="grid gap-stack lg:grid-cols-3">
          <BarList
            title={t("metrics.marketing.channels")}
            description={t("metrics.marketing.channelsHint")}
            count={format.count(data.channels.reduce((sum, channel) => sum + channel.bookings, 0))}
            items={data.channels.map((channel) => ({ id: channel.id, label: channel.name, value: channel.bookings }))}
            formatValue={format.count}
            tone="brand"
            emptyLabel={t("metrics.marketing.empty")}
          />
          <BarList
            title={t("metrics.marketing.conversion")}
            description={t("metrics.marketing.conversionHint")}
            items={conversion}
            formatValue={format.percent}
            tone="positive"
            emptyLabel={t("metrics.marketing.empty")}
          />
          <BarList
            title={t("metrics.marketing.campaigns")}
            description={t("metrics.marketing.campaignsHint")}
            count={format.count(data.campaigns.reduce((sum, campaign) => sum + campaign.bookings, 0))}
            items={data.campaigns.map((campaign) => ({ id: campaign.id, label: campaign.name, value: campaign.bookings, meta: format.moneyRound(campaign.revenue) }))}
            formatValue={format.count}
            tone="warning"
            emptyLabel={t("metrics.marketing.empty")}
          />
        </div>
      ) : (
        <EmptyState icon="analytics" title={t("metrics.marketing.empty")} description={t("metrics.marketing.emptyHint")} />
      )}
    </div>
  );
}
