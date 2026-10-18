import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppT, type AppMessageKey } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { QueryBoundary } from "@/lib/query";
import { cn } from "@/lib/utils";
import { MetricCard } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/typography";
import { useMoney } from "@/features/calendar/calendarFormat";
import { InfoCard } from "@/features/team/teamShared";
import { changePercent, monthKey, shiftMonth, useIncomeStatement, type IncomeStatement } from "./income";

export interface IncomeStatementViewProps {
  branchId: string;
  month: string;
  onMonthChange: (month: string) => void;
}

const MONTH_LABEL: Intl.DateTimeFormatOptions = {
  month: "long",
  year: "numeric",
};

/**
 * ¿Cuánto me gané? El mes de la sucursal en un estado de resultados —lo que entró, lo que costó
 * ganarlo y lo fijo— y el punto de equilibrio dicho como se piensa en una barbería: cuántos servicios
 * al día hacen falta para cubrir lo fijo, frente a los que se están haciendo.
 */
export function IncomeStatementView({ branchId, month, onMonthChange }: IncomeStatementViewProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const query = useIncomeStatement(branchId, month);
  const [year, index] = month.split("-").map(Number);
  const isCurrent = month >= monthKey(new Date());

  return (
    <div className="space-y-section" data-testid="income-statement">
      <div className="flex items-center gap-2" role="group" aria-label={t("expenses.income.monthAria")}>
        <Button variant="outline" size="icon-sm" onClick={() => onMonthChange(shiftMonth(month, -1))} aria-label={t("metrics.period.previous")}>
          <ChevronLeft />
        </Button>
        <Text weight="semibold" className="min-w-36 text-center first-letter:uppercase" data-testid="income-month">
          {formatDate(new Date(year, index - 1, 1), MONTH_LABEL)}
        </Text>
        <Button variant="outline" size="icon-sm" onClick={() => onMonthChange(shiftMonth(month, 1))} disabled={isCurrent} aria-label={t("metrics.period.next")}>
          <ChevronRight />
        </Button>
      </div>
      <QueryBoundary
        query={query}
        loading={
          <div className="space-y-stack">
            <div className="grid gap-stack lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-[168px] rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        }
      >
        {(data) => <IncomeBody data={data} />}
      </QueryBoundary>
    </div>
  );
}

function IncomeBody({ data }: { data: IncomeStatement }) {
  const t = useAppT();
  const { formatNumber } = useLocale();
  const formatMoney = useMoney();
  const percent = (value: number) => `${formatNumber(value, { maximumFractionDigits: 1 })}%`;
  const revenueChange = changePercent(data.revenue.total, data.previous.revenue);
  const partial = data.elapsedDays < data.days;
  const { breakEven } = data;

  return (
    <>
      {partial && (
        <Text variant="muted" data-testid="income-partial">
          {t("expenses.income.partial", {
            elapsed: data.elapsedDays,
            days: data.days,
          })}
        </Text>
      )}
      <section aria-label={t("expenses.income.summaryAria")} className="grid gap-stack lg:grid-cols-3">
        <MetricCard
          label={t("expenses.income.revenue")}
          value={formatMoney(data.revenue.total)}
          caption={
            revenueChange === null
              ? t("expenses.income.noPrevious")
              : t(partial ? "expenses.income.vsPreviousPartial" : "expenses.income.vsPrevious", {
                  change: `${revenueChange > 0 ? "+" : ""}${percent(revenueChange)}`,
                  days: data.previous.elapsedDays,
                })
          }
          hint={t("expenses.income.revenueHint")}
          tone="brand"
          icon="chart"
        />
        <MetricCard
          label={t("expenses.income.net")}
          value={formatMoney(data.net)}
          caption={t("expenses.income.margin", {
            margin: percent(data.marginPercent),
            previous: formatMoney(data.previous.net),
          })}
          hint={t("expenses.income.netHint")}
          tone={data.net >= 0 ? "positive" : "negative"}
          icon={data.net >= 0 ? "trendUp" : "trendDown"}
          data-testid="income-net"
        />
        <MetricCard
          label={t("expenses.income.breakEven")}
          value={
            breakEven
              ? t("expenses.income.servicesPerDay", {
                  count: breakEven.servicesPerDay,
                })
              : "—"
          }
          caption={
            breakEven
              ? t("expenses.income.breakEvenCaption", {
                  actual: formatNumber(breakEven.actualPerDay, {
                    maximumFractionDigits: 1,
                  }),
                  ticket: formatMoney(breakEven.avgTicket),
                })
              : t("expenses.income.breakEvenNone")
          }
          hint={t("expenses.income.breakEvenHint")}
          tone={breakEven && breakEven.actualPerDay >= breakEven.servicesPerDay ? "positive" : "warning"}
          icon="flag"
          data-testid="income-break-even"
        />
      </section>

      <div className="grid items-start gap-stack lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <InfoCard title={t("expenses.income.statement")} description={t("expenses.income.statementHint")}>
          <StatementTable data={data} formatMoney={formatMoney} percent={percent} />
        </InfoCard>
        {breakEven && <BreakEvenCard breakEven={breakEven} partial={partial} formatMoney={formatMoney} percent={percent} />}
      </div>
    </>
  );
}

interface Row {
  key: AppMessageKey;
  amount: number;
  /** Se resta: va con signo menos. */
  minus?: boolean;
  /** Un subtotal: en negrita y con línea arriba. */
  total?: boolean;
  testId?: string;
}

function StatementTable({ data, formatMoney, percent }: { data: IncomeStatement; formatMoney: (value: number) => string; percent: (value: number) => string }) {
  const t = useAppT();
  const rows: (Row | false)[] = [
    { key: "expenses.income.row.services", amount: data.revenue.services },
    { key: "expenses.income.row.products", amount: data.revenue.products },
    data.revenue.rent > 0 && {
      key: "expenses.income.row.rent",
      amount: data.revenue.rent,
    },
    data.revenue.refunds > 0 && {
      key: "expenses.income.row.refunds",
      amount: data.revenue.refunds,
      minus: true,
    },
    {
      key: "expenses.income.row.revenue",
      amount: data.revenue.total,
      total: true,
    },
    {
      key: "expenses.income.row.productCost",
      amount: data.costs.products,
      minus: true,
    },
    {
      key: "expenses.income.row.commissions",
      amount: data.costs.commissions,
      minus: true,
    },
    {
      key: "expenses.income.row.contribution",
      amount: data.contribution,
      total: true,
    },
    data.costs.salaries > 0 && {
      key: "expenses.income.row.salaries",
      amount: data.costs.salaries,
      minus: true,
    },
    data.costs.adjustments !== 0 && {
      key: "expenses.income.row.adjustments",
      amount: data.costs.adjustments,
      minus: true,
    },
    {
      key: data.elapsedDays < data.days ? "expenses.income.row.fixedPartial" : "expenses.income.row.fixed",
      amount: data.costs.expensesFixed,
      minus: true,
    },
    {
      key: "expenses.income.row.variable",
      amount: data.costs.expensesVariable,
      minus: true,
    },
    {
      key: "expenses.income.row.net",
      amount: data.net,
      total: true,
      testId: "income-row-net",
    },
  ];
  const share = (amount: number) => (data.revenue.total > 0 ? percent((amount / data.revenue.total) * 100) : "—");

  return (
    <table className="w-full text-sm">
      <thead className="sr-only">
        <tr>
          <th scope="col">{t("expenses.income.concept")}</th>
          <th scope="col">{t("expenses.income.amount")}</th>
          <th scope="col">{t("expenses.income.share")}</th>
        </tr>
      </thead>
      <tbody>
        {rows
          .filter((row): row is Row => row !== false)
          .map((row) => (
            <tr key={row.key} className={cn("border-border/60", row.total ? "border-t font-semibold text-text-primary" : "text-text-secondary")} data-testid={row.testId}>
              <th scope="row" className={cn("py-2 text-left font-normal", row.total && "font-semibold", row.minus && "pl-3")}>
                {t(row.key)}
              </th>
              <td className={cn("whitespace-nowrap py-2 pl-2 text-right tabular-nums", row.total && row.amount < 0 && "text-status-negative")}>{row.minus ? `− ${formatMoney(row.amount)}` : formatMoney(row.amount)}</td>
              <td className="w-16 py-2 text-right text-xs tabular-nums text-text-muted">{share(row.amount)}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

interface BreakEvenCardProps {
  breakEven: NonNullable<IncomeStatement["breakEven"]>;
  partial: boolean;
  formatMoney: (value: number) => string;
  percent: (value: number) => string;
}

function BreakEvenCard({ breakEven, partial, formatMoney, percent }: BreakEvenCardProps) {
  const t = useAppT();
  const { formatNumber } = useLocale();
  const progress = Math.min(100, breakEven.servicesPerDay > 0 ? (breakEven.actualPerDay / breakEven.servicesPerDay) * 100 : 0);
  const covered = breakEven.actualPerDay >= breakEven.servicesPerDay;
  return (
    <InfoCard
      title={t("expenses.income.breakEvenTitle")}
      description={t("expenses.income.breakEvenExplain", {
        contribution: percent(breakEven.contributionPercent),
      })}
    >
      <div className="space-y-4" data-testid="income-break-even-card">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-text-secondary">{t("expenses.income.actualVsNeeded")}</span>
            <span className="font-semibold tabular-nums text-text-primary">
              {formatNumber(breakEven.actualPerDay, {
                maximumFractionDigits: 1,
              })}{" "}
              / {breakEven.servicesPerDay}
            </span>
          </div>
          <Progress value={progress} color={covered ? "success" : "warning"} aria-label={t("expenses.income.actualVsNeeded")} />
          <Text variant="muted">{t(covered ? "expenses.income.covered" : "expenses.income.notCovered")}</Text>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-text-muted">{t("expenses.income.breakEvenRevenue")}</dt>
            <dd className="font-semibold tabular-nums text-text-primary">{formatMoney(breakEven.revenue)}</dd>
          </div>
          <div>
            <dt className="text-text-muted">{t("expenses.income.perDay")}</dt>
            <dd className="font-semibold tabular-nums text-text-primary">{formatMoney(breakEven.perDay)}</dd>
          </div>
          <div>
            <dt className="text-text-muted">{t("expenses.income.avgTicket")}</dt>
            <dd className="font-semibold tabular-nums text-text-primary">{formatMoney(breakEven.avgTicket)}</dd>
          </div>
          <div>
            <dt className="text-text-muted">{t("expenses.income.openDays")}</dt>
            <dd className="font-semibold tabular-nums text-text-primary">{breakEven.openDays}</dd>
          </div>
        </dl>
        {partial && <Text variant="muted">{t("expenses.income.fullMonthNote")}</Text>}
      </div>
    </InfoCard>
  );
}
