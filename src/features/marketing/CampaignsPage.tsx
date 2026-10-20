import { useNavigate } from "react-router";
import { ArrowLeft, Ban } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { EmptyState } from "@/components/feedback";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/utility";
import { useMoney } from "@/features/calendar/calendarFormat";
import { InfoCard } from "@/features/team/teamShared";
import { useCampaignActions, useCampaigns, type Campaign } from "./campaigns";

const WHEN: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" };

/**
 * Las campañas mandadas y lo que dejó cada una: cuántos mensajes salieron, cuántos clientes reservaron en los 14 días
 * siguientes, lo cobrado de esas citas, los usos del cupón y el retorno sobre el costo estimado. Mientras dura la
 * ventana, las cifras pueden crecer.
 */
export function CampaignsPage() {
  const t = useAppT();
  const navigate = useNavigate();
  const campaigns = useCampaigns();
  return (
    <>
      <PageHeader
        title={t("campaigns.title")}
        description={t("campaigns.hint")}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate("/clientes")}>
            <ArrowLeft /> {t("campaigns.back")}
          </Button>
        }
      />
      <QueryBoundary query={campaigns} loading={<Skeleton className="h-48 w-full rounded-2xl" />}>
        {(data) =>
          data.items.length === 0 ? (
            <EmptyState icon="send" title={t("campaigns.emptyTitle")} description={t("campaigns.emptyHint")} action={<Button onClick={() => navigate("/clientes")}>{t("campaigns.goToClients")}</Button>} />
          ) : (
            <ul className="space-y-stack" data-testid="campaigns-list">
              {data.items.map((campaign) => (
                <li key={campaign.id}>
                  <CampaignCard campaign={campaign} />
                </li>
              ))}
            </ul>
          )
        }
      </QueryBoundary>
    </>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const t = useAppT();
  const { formatDate, current } = useLocale();
  const formatMoney = useMoney();
  const { cancel } = useCampaignActions();
  const results = campaign.results;
  const usd = (amount: number) => new Intl.NumberFormat(current.intl, { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount);
  const stats: { label: string; value: string; testId?: string }[] = [
    { label: t("campaigns.result.sent"), value: `${results.sent}${results.scheduled > 0 ? ` · ${t("campaigns.result.pending", { count: results.scheduled })}` : ""}` },
    { label: t("campaigns.result.booked"), value: String(results.bookedClients), testId: "campaign-booked" },
    { label: t("campaigns.result.revenue"), value: formatMoney(results.revenue) },
    { label: t("campaigns.result.cost"), value: usd(results.cost) },
    { label: t("campaigns.result.roi"), value: results.roi === null ? "—" : `${results.roi}×` },
    ...(campaign.couponCode ? [{ label: t("campaigns.result.coupon", { code: campaign.couponCode }), value: String(results.couponUses) }] : []),
  ];
  return (
    <InfoCard
      title={campaign.name}
      description={t("campaigns.meta", { when: formatDate(new Date(campaign.sendAt), WHEN), by: campaign.by, count: campaign.recipients })}
      actions={
        <span className="flex items-center gap-2">
          {campaign.status === "cancelled" ? <StatusBadge status="inactive" label={t("campaigns.cancelled")} /> : results.open ? <StatusBadge status="active" label={t("campaigns.measuring")} /> : <StatusBadge status="completed" label={t("campaigns.closed")} />}
          {campaign.status !== "cancelled" && results.scheduled > 0 && (
            <Button size="xs" variant="outline" disabled={cancel.isPending} onClick={() => cancel.mutate(campaign.id, { onSuccess: () => toast.success(t("campaigns.cancelDone")), onError: (error) => toast.error(describeError(error).description) })}>
              <Ban /> {t("campaigns.cancel")}
            </Button>
          )}
        </span>
      }
    >
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((item) => (
          <div key={item.label} className="rounded-xl bg-surface-subtle p-3">
            <dt className="text-xs text-text-muted">{item.label}</dt>
            <dd className="text-base font-semibold tabular-nums text-text-primary" data-testid={item.testId}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
      <Text size="sm" tone="muted" className="mt-3 line-clamp-2">
        {campaign.body}
      </Text>
    </InfoCard>
  );
}
