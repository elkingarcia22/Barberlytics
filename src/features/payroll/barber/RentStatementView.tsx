import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { useLocale } from "@/i18n";
import { QueryBoundary } from "@/lib/query";
import { MetricCard } from "@/components/charts";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { Text } from "@/components/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRentStatement } from "../barberPay";

const DAY: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
const STATUS: Readonly<Record<"open" | "approved" | "paid", { key: AppMessageKey; badge: "pending" | "active" | "completed" }>> = {
  open: { key: "payroll.statement.open", badge: "pending" },
  approved: { key: "payroll.statement.approved", badge: "active" },
  paid: { key: "payroll.statement.closed", badge: "completed" },
};

/**
 * El estado de cuenta de la renta, ciclo por ciclo: lo que la barbería le guardó, la renta y las deducciones, lo que
 * pagó y el saldo que se arrastra. Responde «¿cuánto debo y desde cuándo?» sin sumar periodos a mano.
 */
export function RentStatementView({ branchId, memberId = null, formatMoney }: { branchId: string; memberId?: string | null; formatMoney: (value: number) => string }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const query = useRentStatement(branchId, memberId);
  const day = (value: string) => formatDate(new Date(`${value}T12:00:00`), DAY);
  const signed = (value: number) => (value === 0 ? formatMoney(0) : `${value > 0 ? "+" : "−"}${formatMoney(Math.abs(value))}`);

  return (
    <QueryBoundary query={query} loading={<Skeleton className="h-72 w-full rounded-2xl" />}>
      {(data) => (
        <div className="space-y-section" data-testid="rent-statement">
          <div className="grid gap-stack sm:grid-cols-2">
            <MetricCard
              label={t("payroll.statement.balance")}
              value={data.balance < 0 ? t("payroll.mine.netOwes", { amount: formatMoney(-data.balance) }) : data.balance === 0 ? t("payroll.rent.upToDate") : t("payroll.statement.shopOwesYou", { amount: formatMoney(data.balance) })}
              caption={t(data.balance < 0 ? "payroll.statement.owesCaption" : "payroll.statement.okCaption", { count: data.rows.length })}
              tone={data.balance < 0 ? "warning" : "positive"}
              icon="building"
            />
            <MetricCard label={t("payroll.statement.paidTotal")} value={formatMoney(data.rows.reduce((sum, row) => sum + row.paid, 0))} caption={t("payroll.statement.paymentsCount", { count: data.payments.length })} tone="brand" icon="check" />
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("payroll.statement.cycle")}</TableHead>
                  <TableHead className="text-right">{t("payroll.rent.held")}</TableHead>
                  <TableHead className="text-right">{t("payroll.statement.charges")}</TableHead>
                  <TableHead className="text-right">{t("payroll.rent.paid")}</TableHead>
                  <TableHead className="text-right">{t("payroll.statement.paidOut")}</TableHead>
                  <TableHead className="text-right">{t("payroll.statement.cycleBalance")}</TableHead>
                  <TableHead className="text-right">{t("payroll.statement.running")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...data.rows].reverse().map((row) => (
                  <TableRow key={row.from}>
                    <TableCell className="whitespace-nowrap">
                      <span className="mr-2 tabular-nums">
                        {day(row.from)} – {day(row.to)}
                      </span>
                      <StatusBadge status={STATUS[row.status].badge} label={t(STATUS[row.status].key)} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(row.held)}</TableCell>
                    <TableCell className="text-right tabular-nums text-status-warning">−{formatMoney(row.rent + row.deductions)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(row.paid)}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.paidOut > 0 ? `−${formatMoney(row.paidOut)}` : "—"}</TableCell>
                    <TableCell className={row.balance < 0 ? "text-right tabular-nums text-status-warning" : "text-right tabular-nums"}>{signed(row.balance)}</TableCell>
                    <TableCell className={row.running < 0 ? "text-right font-semibold tabular-nums text-status-warning" : "text-right font-semibold tabular-nums"}>{signed(row.running)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Text size="xs" tone="muted">
            {t("payroll.statement.note")}
          </Text>
        </div>
      )}
    </QueryBoundary>
  );
}
