import { Star } from "lucide-react";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { useLocale } from "@/i18n";
import { QueryBoundary } from "@/lib/query";
import { MetricCard } from "@/components/charts";
import { EmptyState } from "@/components/feedback";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/typography";
import { InfoCard } from "@/features/team/teamShared";
import { useReputation, type Reputation } from "../barberPay";

const DAY: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
const THEME_KEYS: Readonly<Record<Reputation["themes"][number]["id"], AppMessageKey>> = {
  punctual: "payroll.reputation.theme.punctual",
  cut: "payroll.reputation.theme.cut",
  beard: "payroll.reputation.theme.beard",
  care: "payroll.reputation.theme.care",
  wait: "payroll.reputation.theme.wait",
};

/**
 * Mi reputación: el promedio de sus reseñas, cómo va frente a los 90 días anteriores, el reparto de estrellas, lo que
 * más repiten sus clientes y las últimas reseñas. En la demo, las de ejemplo van marcadas.
 */
export function MyReputationView({ memberId }: { memberId: string }) {
  const t = useAppT();
  const query = useReputation(memberId);
  return (
    <QueryBoundary query={query} loading={<Skeleton className="h-72 w-full rounded-2xl" />}>
      {(data) => (data.total === 0 ? <EmptyState icon="star" title={t("payroll.reputation.emptyTitle")} description={t("payroll.reputation.emptyHint")} /> : <ReputationBody data={data} />)}
    </QueryBoundary>
  );
}

function ReputationBody({ data }: { data: Reputation }) {
  const t = useAppT();
  const { formatDate, formatNumber } = useLocale();
  const one = (value: number | null) => (value === null ? "—" : formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
  const delta = data.last90.rating !== null && data.previous90.rating !== null ? Math.round((data.last90.rating - data.previous90.rating) * 10) / 10 : null;
  const max = Math.max(1, ...data.distribution.map((row) => row.count));

  return (
    <div className="space-y-section" data-testid="my-reputation">
      <div className="grid gap-stack sm:grid-cols-2">
        <MetricCard label={t("payroll.reputation.average")} value={`${one(data.rating)} ★`} caption={t("payroll.reputation.count", { count: data.total })} tone="brand" icon="star" />
        <MetricCard
          label={t("payroll.reputation.last90")}
          value={`${one(data.last90.rating)} ★`}
          delta={delta ?? undefined}
          deltaLabel={delta === null ? undefined : `${delta > 0 ? "+" : ""}${one(delta)}`}
          caption={delta === null ? t("payroll.reputation.noPrevious") : t("payroll.reputation.vsPrevious", { rating: one(data.previous90.rating) })}
          tone={delta !== null && delta < 0 ? "warning" : "positive"}
          icon={delta !== null && delta < 0 ? "trendDown" : "trendUp"}
        />
      </div>
      {data.sample && (
        <Text size="xs" tone="muted">
          {t("payroll.reputation.sample")}
        </Text>
      )}
      <div className="grid gap-stack lg:grid-cols-2">
        <InfoCard title={t("payroll.reputation.distribution")}>
          <ul className="space-y-2">
            {data.distribution.map((row) => (
              <li key={row.stars} className="flex items-center gap-3 text-sm">
                <span className="flex w-10 shrink-0 items-center gap-1 tabular-nums text-text-secondary">
                  {row.stars} <Star className="size-3.5" aria-hidden />
                </span>
                <Progress value={Math.round((row.count / max) * 100)} className="flex-1" aria-label={t("payroll.reputation.starsAria", { stars: row.stars, count: row.count })} />
                <span className="w-8 text-right tabular-nums text-text-muted">{row.count}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
        <InfoCard title={t("payroll.reputation.themes")} description={t("payroll.reputation.themesHint")}>
          {data.themes.length === 0 ? (
            <Text variant="muted">{t("payroll.reputation.noThemes")}</Text>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.themes.map((theme) => (
                <Badge key={theme.id} variant={theme.tone === "negative" ? "warning" : "positive"}>
                  {t(THEME_KEYS[theme.id])} · {theme.count}
                </Badge>
              ))}
            </div>
          )}
        </InfoCard>
      </div>
      <InfoCard title={t("payroll.reputation.recent")}>
        <ul className="divide-y divide-border/60">
          {data.recent.map((review) => (
            <li key={review.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-text-primary">{review.clientName}</span>
                <span className="tabular-nums text-text-muted">
                  {"★".repeat(review.rating)} · {formatDate(new Date(review.createdAt), DAY)}
                </span>
              </div>
              {review.comment && <Text size="sm">{review.comment}</Text>}
            </li>
          ))}
        </ul>
      </InfoCard>
    </div>
  );
}
