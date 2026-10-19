import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { QueryBoundary } from "@/lib/query";
import { MetricCard } from "@/components/charts";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/typography";
import { useMoney } from "@/features/calendar/calendarFormat";
import { useMemberPerformance } from "./workforce";

/**
 * Cómo va un barbero en los últimos 90 días, con su agenda y sus reseñas: ocupación, cuántos clientes
 * dejan su siguiente cita al cobrar, cuántos vuelven, ticket, producto, propinas, ausencias y valoración.
 * Lo que Zenoti, Phorest o Boulevard dan por profesional, sin datos nuevos.
 */
export function MemberPerformance({ memberId, branchId }: { memberId: string; branchId: string }) {
  const t = useAppT();
  const { formatNumber } = useLocale();
  const formatMoney = useMoney();
  const query = useMemberPerformance(memberId, branchId);
  const percent = (value: number) => `${formatNumber(value, { maximumFractionDigits: 1 })}%`;

  return (
    <QueryBoundary query={query} loading={<Skeleton className="h-64 w-full rounded-2xl" />}>
      {(data) => (
        <section aria-label={t("team.performance.aria")} className="space-y-stack" data-testid="member-performance">
          <Text variant="muted">{t("team.performance.period", { days: data.days, count: data.services })}</Text>
          <div className="grid gap-stack sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label={t("team.performance.occupancy")} value={percent(data.occupancy)} caption={t("team.performance.occupancyHint")} tone="brand" icon="calendar" />
            <MetricCard label={t("team.performance.rebook")} value={percent(data.rebookRate)} caption={t("team.performance.rebookHint")} tone="positive" icon="refresh" />
            <MetricCard label={t("team.performance.retention")} value={percent(data.retention)} caption={t("team.performance.retentionHint")} tone="positive" icon="users" />
            <MetricCard label={t("team.performance.ticket")} value={formatMoney(data.avgTicket)} caption={t("team.performance.ticketHint", { products: formatNumber(data.productsPerService, { maximumFractionDigits: 1 }) })} tone="brand" icon="chart" />
            <MetricCard label={t("team.performance.tips")} value={formatMoney(data.tips)} caption={t("team.performance.tipsHint")} tone="positive" icon="award" />
            <MetricCard label={t("team.performance.noShows")} value={formatNumber(data.noShows)} caption={t("team.performance.noShowsHint", { rate: percent(data.noShowRate) })} tone="warning" icon="warning" />
            <MetricCard label={t("team.performance.rating")} value={data.rating === null ? "—" : formatNumber(data.rating, { maximumFractionDigits: 1 })} caption={t("team.performance.ratingHint", { count: data.reviews })} tone="brand" icon="star" />
          </div>
        </section>
      )}
    </QueryBoundary>
  );
}
