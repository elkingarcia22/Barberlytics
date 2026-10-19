import { BarList, MetricCard } from "@/components/charts";
import { EmptyState } from "@/components/feedback";
import { useAppT } from "@/app/i18n";
import { useMetricsFormatters } from "../metricsFormat";
import type { MetricsMarketing } from "../types";

/**
 * Marketing: por dónde llegan las reservas en línea (el `utm_source` con que se
 * reservó cada cita), cuánto convierte cada canal (sobre las sesiones que
 * empezaron la reserva desde ahí) y qué trajo cada campaña (`utm_campaign`).
 * Sin datos, un solo vacío que dice qué hace falta.
 */
export function MarketingDashboard({ data }: { data: MetricsMarketing }) {
  const t = useAppT();
  const format = useMetricsFormatters();
  const online = format.delta(data.kpis.onlineBookings, "pp");
  const campaigns = format.delta(data.kpis.campaignBookings);
  const hasData = data.channels.length > 0 || data.campaigns.length > 0;
  // Solo los canales con visitas medidas: sin ellas no hay conversión que calcular.
  // Del embudo: sesiones que reservaron sobre sesiones que empezaron, desde cada canal.
  const conversion = data.channels.flatMap((channel) =>
    channel.visits && channel.funnelBookings !== null
      ? [{ id: channel.id, label: channel.name, value: Math.round((channel.funnelBookings / channel.visits) * 1000) / 10, meta: `${format.count(channel.funnelBookings)}/${format.count(channel.visits)}` }]
      : []
  );

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
            description={data.visitsSample ? `${t("metrics.marketing.conversionHint")} · ${t("metrics.marketing.visitsSample")}` : t("metrics.marketing.conversionHint")}
            items={conversion}
            formatValue={format.percent}
            tone="positive"
            emptyLabel={t("metrics.marketing.noVisits")}
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
