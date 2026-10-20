import * as React from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { MetricCard } from "@/components/charts";
import { ProgressRing } from "@/components/data-display/ProgressRing";
import { NumberField } from "@/components/forms";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/utility";
import { useCurrencyInput } from "@/features/branches/useBranchMoney";
import { useMoney } from "@/features/calendar/calendarFormat";
import { changePercent, useIncomeStatement } from "@/features/expenses/income";
import { useMonthGoal, useSetMonthGoal, type MonthGoal } from "../goal";

const MONTH: Intl.DateTimeFormatOptions = { month: "long" };

/**
 * El dinero del mes en Métricas, para quien gestiona: la utilidad (lo que queda después de costos y gastos, del estado
 * de resultados) y la meta de ingresos con su ritmo — cuánto va, en cuánto cerraría al paso de hoy y cuánto falta por
 * día —. La meta se pone o se cambia aquí mismo.
 */
export function MonthMoneySection({ branchId, month }: { branchId: string; month: string }) {
  const t = useAppT();
  const navigate = useNavigate();
  const { formatDate } = useLocale();
  const monthName = formatDate(new Date(`${month}-15T12:00:00`), MONTH);

  return (
    <section className="space-y-stack" aria-label={t("metrics.money.title", { month: monthName })} data-testid="metrics-month-money">
      <SectionHeader
        title={t("metrics.money.title", { month: monthName })}
        description={t("metrics.money.hint")}
        actions={
          <Button size="sm" variant="ghost" onClick={() => navigate(`/gastos?vista=resultado&mes=${month}`)}>
            {t("metrics.money.statement")} <ArrowRight />
          </Button>
        }
      />
      <div className="grid gap-stack lg:grid-cols-2">
        <ProfitCard branchId={branchId} month={month} monthName={monthName} />
        <GoalCard branchId={branchId} month={month} />
      </div>
    </section>
  );
}

function ProfitCard({ branchId, month, monthName }: { branchId: string; month: string; monthName: string }) {
  const t = useAppT();
  const money = useMoney();
  const { formatNumber } = useLocale();
  const query = useIncomeStatement(branchId, month);
  if (!query.data) return <Skeleton className="h-[132px] rounded-2xl" />;
  const data = query.data;
  const delta = changePercent(data.net, data.previous.net);
  return (
    <MetricCard
      label={t("metrics.money.profit", { month: monthName })}
      value={money(data.net)}
      delta={delta ?? undefined}
      deltaLabel={delta === null ? undefined : `${delta > 0 ? "+" : ""}${formatNumber(delta, { maximumFractionDigits: 1 })} %`}
      caption={t("metrics.money.profitCaption", { margin: formatNumber(data.marginPercent, { maximumFractionDigits: 1 }), revenue: money(data.revenue.total) })}
      hint={t("metrics.money.profitHint")}
      tone={data.net >= 0 ? "positive" : "negative"}
      icon={data.net >= 0 ? "trendUp" : "trendDown"}
    />
  );
}

function GoalCard({ branchId, month }: { branchId: string; month: string }) {
  const t = useAppT();
  const query = useMonthGoal(branchId, month);
  const [editing, setEditing] = React.useState(false);
  if (!query.data) return <Skeleton className="h-[132px] rounded-2xl" />;
  const data = query.data;
  return (
    <div className="rounded-2xl border border-border/60 bg-surface p-card shadow-card" data-testid="metrics-goal">
      {editing || !data.goal ? (
        <GoalForm branchId={branchId} month={month} data={data} onDone={() => setEditing(false)} canCancel={Boolean(data.goal)} />
      ) : (
        <GoalProgress data={data} onEdit={() => setEditing(true)} />
      )}
      {!editing && !data.goal && (
        <Text size="xs" tone="muted" className="mt-2">
          {t("metrics.goal.emptyHint")}
        </Text>
      )}
    </div>
  );
}

function GoalProgress({ data, onEdit }: { data: MonthGoal; onEdit: () => void }) {
  const t = useAppT();
  const money = useMoney();
  const goal = data.goal!;
  const progress = Math.round(data.progress ?? 0);
  const reached = data.revenue >= goal.revenue;
  return (
    <div className="flex items-start gap-4">
      <ProgressRing size="lg" value={Math.min(progress, 100)} color={reached || data.onTrack ? "success" : "warning"} aria-label={t("metrics.goal.progressAria", { percent: progress })}>
        <span className="text-xs font-semibold tabular-nums">{progress}%</span>
      </ProgressRing>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <Text size="sm" tone="muted">
            {t("metrics.goal.title")}
          </Text>
          <Button size="xs" variant="ghost" onClick={onEdit} data-testid="metrics-goal-edit">
            <Pencil /> {t("metrics.goal.edit")}
          </Button>
        </div>
        <p className="text-lg font-semibold tabular-nums text-text-primary" data-testid="metrics-goal-progress">
          {t("metrics.goal.ofGoal", { revenue: money(data.revenue), goal: money(goal.revenue) })}
        </p>
        <Text size="sm" tone={reached || data.onTrack ? "positive" : "warning"} data-testid="metrics-goal-pace">
          {reached ? t("metrics.goal.reached") : data.onTrack ? t("metrics.goal.onTrack", { projected: money(data.projected) }) : t("metrics.goal.behind", { projected: money(data.projected) })}
        </Text>
        {!reached && data.neededPerDay !== null && (
          <Text size="xs" tone="muted">
            {t("metrics.goal.perDay", { amount: money(data.neededPerDay), count: Math.max(0, data.days - data.elapsedDays) })}
          </Text>
        )}
      </div>
    </div>
  );
}

function GoalForm({ branchId, month, data, onDone, canCancel }: { branchId: string; month: string; data: MonthGoal; onDone: () => void; canCancel: boolean }) {
  const t = useAppT();
  const money = useMoney();
  const { symbol } = useCurrencyInput();
  const set = useSetMonthGoal(branchId, month);
  const [value, setValue] = React.useState<number | null>(data.goal?.revenue ?? null);

  const save = (revenue: number | null) =>
    set.mutate(revenue, {
      onSuccess: () => {
        toast.success(revenue === null ? t("metrics.goal.removed") : t("metrics.goal.saved"));
        onDone();
      },
      onError: (error) => toast.error(describeError(error).description),
    });

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (value && value > 0) save(value);
      }}
    >
      <div>
        <Text weight="semibold">{t(data.goal ? "metrics.goal.editTitle" : "metrics.goal.setTitle")}</Text>
        <Text size="sm" tone="muted">
          {t("metrics.goal.formHint", { projected: money(data.projected) })}
        </Text>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <NumberField value={value} onValueChange={setValue} min={1} precision={0} prefix={symbol} aria-label={t("metrics.goal.amount")} className="w-44" data-testid="metrics-goal-input" />
        <Button type="submit" size="sm" disabled={!value || value <= 0 || set.isPending} data-testid="metrics-goal-save">
          {t("metrics.goal.save")}
        </Button>
        {canCancel && (
          <>
            <Button type="button" size="sm" variant="ghost" onClick={onDone}>
              {t("common.cancel")}
            </Button>
            <Button type="button" size="sm" variant="ghost" className="text-status-negative" disabled={set.isPending} onClick={() => save(null)}>
              {t("metrics.goal.remove")}
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
