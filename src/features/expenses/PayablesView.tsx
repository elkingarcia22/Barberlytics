import { CheckCircle2, ChevronLeft, ChevronRight, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { MetricCard } from "@/components/charts";
import { EmptyState } from "@/components/feedback";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMoney } from "@/features/calendar/calendarFormat";
import { shiftMonth } from "./income";
import { usePayableActions, usePayables, type Payable } from "./payablesQueries";

const DAY: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
const MONTH: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
const GROUPS: readonly { status: Payable["status"]; key: AppMessageKey }[] = [
  { status: "overdue", key: "expenses.payables.overdue" },
  { status: "dueSoon", key: "expenses.payables.dueSoon" },
  { status: "upcoming", key: "expenses.payables.upcoming" },
  { status: "paid", key: "expenses.payables.paid" },
];
const BADGE: Readonly<Record<Payable["status"], "error" | "pending" | "inactive" | "completed">> = { overdue: "error", dueSoon: "pending", upcoming: "inactive", paid: "completed" };

/**
 * Por pagar: los vencimientos de los gastos fijos del mes, agrupados en vencidos, esta semana, más adelante y pagados.
 * Marcar pagado deja quién y cuándo; deshacer quita el pago. Los gastos siguen contando por mes en el estado de
 * resultados: esto es la caja.
 */
export function PayablesView({ branchId, month, ownerMemberId, onMonthChange }: { branchId: string; month: string; ownerMemberId: string | null; onMonthChange: (month: string) => void }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const formatMoney = useMoney();
  const query = usePayables(branchId, month, ownerMemberId);
  const { pay, undo } = usePayableActions();
  const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

  return (
    <div className="space-y-section" data-testid="expenses-payables">
      <div className="flex items-center gap-2">
        <Button size="icon-sm" variant="outline" aria-label={t("metrics.period.previous")} onClick={() => onMonthChange(shiftMonth(month, -1))}>
          <ChevronLeft />
        </Button>
        <Text weight="semibold" className="min-w-40 text-center">
          {capitalize(formatDate(new Date(`${month}-15T12:00:00`), MONTH))}
        </Text>
        <Button size="icon-sm" variant="outline" aria-label={t("metrics.period.next")} onClick={() => onMonthChange(shiftMonth(month, 1))}>
          <ChevronRight />
        </Button>
      </div>
      <QueryBoundary query={query} loading={<Skeleton className="h-64 w-full rounded-2xl" />}>
        {(data) =>
          data.items.length === 0 ? (
            <EmptyState icon="calendar" title={t("expenses.payables.emptyTitle")} description={t("expenses.payables.emptyHint")} />
          ) : (
            <>
              <section className="grid gap-stack md:grid-cols-3" aria-label={t("expenses.payables.summary")}>
                <MetricCard label={t("expenses.payables.pendingTotal")} value={formatMoney(data.totals.pending)} caption={t("expenses.payables.ofTotal", { total: formatMoney(data.totals.due) })} tone="warning" icon="calendar" />
                <MetricCard label={t("expenses.payables.overdueTotal")} value={formatMoney(data.totals.overdue)} caption={t("expenses.payables.overdueCaption")} tone={data.totals.overdue > 0 ? "negative" : "neutral"} icon="warning" />
                <MetricCard label={t("expenses.payables.paidTotal")} value={formatMoney(data.totals.paid)} caption={t("expenses.payables.paidCaption")} tone="positive" icon="check" />
              </section>
              {GROUPS.map(({ status, key }) => {
                const items = data.items.filter((item) => item.status === status);
                if (items.length === 0) return null;
                return (
                  <section key={status} aria-label={t(key)} className="space-y-2" data-testid={`payables-${status}`}>
                    <Text variant="label">
                      {t(key)} · {items.length}
                    </Text>
                    <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-surface">
                      {items.map((item) => (
                        <li key={`${item.expenseId}-${item.dueDate}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate font-medium text-text-primary">{item.name}</span>
                            <span className="text-xs text-text-muted">
                              {[formatDate(new Date(`${item.dueDate}T12:00:00`), DAY), item.supplier, item.payment ? t("expenses.payables.paidBy", { name: item.payment.by }) : null].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                          <span className="font-semibold tabular-nums">{formatMoney(item.amount)}</span>
                          <StatusBadge status={BADGE[status]} label={t(key)} />
                          {item.payment ? (
                            <Button size="xs" variant="ghost" disabled={undo.isPending} onClick={() => undo.mutate({ expenseId: item.expenseId, paymentId: item.payment!.id }, { onError: (error) => toast.error(describeError(error).description) })}>
                              <Undo2 /> {t("expenses.payables.undo")}
                            </Button>
                          ) : (
                            <Button size="xs" variant="outline" disabled={pay.isPending} onClick={() => pay.mutate({ expenseId: item.expenseId, dueDate: item.dueDate }, { onSuccess: () => toast.success(t("expenses.payables.done", { name: item.name })), onError: (error) => toast.error(describeError(error).description) })} data-testid="payable-pay">
                              <CheckCircle2 /> {t("expenses.payables.markPaid")}
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </>
          )
        }
      </QueryBoundary>
    </div>
  );
}
