import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Progress } from "@/components/ui/progress";
import { Text } from "@/components/typography";
import { InfoCard } from "@/features/team/teamShared";
import { useMemberGoal, type MemberGoal } from "../barberPay";

const DAY: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

/**
 * La meta del ciclo en curso y cuánto va: ventas de servicios, de productos y cuántos clientes dejan la siguiente cita.
 * En escala, además, cuánto falta para el siguiente tramo. La pone quien gestiona; sin meta ni escala no se muestra.
 */
export function BarberGoalCard({ branchId, memberId = null, formatMoney }: { branchId: string; memberId?: string | null; formatMoney: (value: number) => string }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const query = useMemberGoal(branchId, memberId);
  const data = query.data;
  if (!data || (!data.goal && !data.nextTier)) return null;
  const day = (value: string) => formatDate(new Date(`${value}T12:00:00`), DAY);
  const rows = goalRows(data, formatMoney, t);

  return (
    <InfoCard
      title={t("payroll.goal.title")}
      description={[t("payroll.goal.cycle", { from: day(data.cycle.from), to: day(data.cycle.to) }), data.goal ? t("payroll.goal.setBy", { name: data.goal.setBy }) : null].filter(Boolean).join(" · ")}
    >
      <div className="space-y-4" data-testid="barber-goal">
        {rows.map((row) => (
          <div key={row.id} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-text-secondary">{row.label}</span>
              <span className="tabular-nums text-text-primary">
                <strong className="font-semibold">{row.value}</strong> <span className="text-text-muted">/ {row.target}</span>
              </span>
            </div>
            <Progress value={row.percent} aria-label={`${row.label}: ${row.percent}%`} />
          </div>
        ))}
        {data.nextTier && (
          <Text size="sm" tone="positive" data-testid="barber-goal-tier">
            {t(data.nextTier.currentPercent === null ? "payroll.goal.firstTier" : "payroll.goal.nextTier", { missing: formatMoney(data.nextTier.missing), percent: data.nextTier.percent, current: data.nextTier.currentPercent ?? 0 })}
          </Text>
        )}
      </div>
    </InfoCard>
  );
}

function goalRows(data: MemberGoal, formatMoney: (value: number) => string, t: ReturnType<typeof useAppT>) {
  const goal = data.goal;
  if (!goal) return [];
  const percent = (value: number, target: number) => Math.min(100, Math.round((value / target) * 100));
  return [
    goal.serviceSales !== null && { id: "services", label: t("payroll.goal.serviceSales"), value: formatMoney(data.progress.serviceSales), target: formatMoney(goal.serviceSales), percent: percent(data.progress.serviceSales, goal.serviceSales) },
    goal.productSales !== null && { id: "products", label: t("payroll.goal.productSales"), value: formatMoney(data.progress.productSales), target: formatMoney(goal.productSales), percent: percent(data.progress.productSales, goal.productSales) },
    goal.rebookRate !== null && { id: "rebook", label: t("payroll.goal.rebookRate"), value: `${data.progress.rebookRate}%`, target: `${goal.rebookRate}%`, percent: percent(data.progress.rebookRate, goal.rebookRate) },
  ].filter((row): row is { id: string; label: string; value: string; target: string; percent: number } => Boolean(row));
}
