import { CircleCheck, Clock3, FileCheck2 } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { Text } from "@/components/typography";
import { InfoCard } from "@/features/team/teamShared";
import { ADJUSTMENT_VIEW_KEYS, PAY_METHOD_KEYS, type PayMethod, type PayrollMember, type PayrollRun } from "./types";

export interface MyPayStatusProps {
  run: PayrollRun | null;
  member: PayrollMember;
  formatMoney: (value: number) => string;
}

const DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };
const DAY: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
const SIGN: Readonly<Record<string, 1 | -1>> = { bonus: 1, deduction: -1, advance: -1 };

/**
 * ¿Ya me pagaron? El estado del periodo dicho al barbero (provisional, aprobado o pagado y con
 * qué), y lo que movió su cifra a mano: bonos, deducciones, adelantos y, si es de renta, lo que ya
 * le pagó a la barbería. Sin esto, un adelanto bajaba la cifra sin explicación.
 */
export function MyPayStatus({ run, member, formatMoney }: MyPayStatusProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const status = run?.status ?? "open";
  const method = run?.method ? t(PAY_METHOD_KEYS[run.method as PayMethod] ?? "payroll.payMethod.transfer") : "";
  const hint =
    status === "paid" && run
      ? t("payroll.mine.statusPaid", { date: formatDate(new Date(run.paidAt ?? run.approvedAt), DATE), method })
      : status === "approved" && run
        ? t("payroll.mine.statusApproved", { date: formatDate(new Date(run.approvedAt), DATE) })
        : t("payroll.mine.statusOpen");
  const Icon = status === "paid" ? CircleCheck : status === "approved" ? FileCheck2 : Clock3;
  const adjustments = member.adjustments ?? [];
  const rentPayments = member.rentPayments ?? [];

  return (
    <div className="space-y-stack" data-testid="my-pay-status">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-surface-subtle px-4 py-3">
        <Icon className="size-4 text-text-muted" aria-hidden />
        <StatusBadge status={status === "paid" ? "active" : status === "approved" ? "pending" : "inactive"} label={t(status === "paid" ? "payroll.run.paid" : status === "approved" ? "payroll.run.approved" : "payroll.mine.provisional")} />
        <Text variant="muted" className="min-w-0 flex-1">
          {hint}
        </Text>
      </div>
      {(adjustments.length > 0 || rentPayments.length > 0) && (
        <InfoCard title={t("payroll.mine.movesTitle")} description={t("payroll.mine.movesHint")}>
          <ul className="divide-y divide-border/60 text-sm" data-testid="my-pay-moves">
            {adjustments.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="text-text-primary">{t(ADJUSTMENT_VIEW_KEYS[item.kind])}</span>
                  {item.note && <span className="block truncate text-xs text-text-muted">{item.note}</span>}
                </span>
                <span className={SIGN[item.kind] < 0 ? "tabular-nums text-status-negative" : "tabular-nums text-status-positive"}>
                  {SIGN[item.kind] < 0 ? "−" : "+"} {formatMoney(item.amount)}
                </span>
              </li>
            ))}
            {rentPayments.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="text-text-primary">{t("payroll.mine.rentPaid")}</span>
                  <span className="block truncate text-xs text-text-muted">
                    {formatDate(new Date(`${item.date.slice(0, 10)}T12:00:00`), DAY)} · {item.method}
                    {item.note ? ` · ${item.note}` : ""}
                  </span>
                </span>
                <span className="tabular-nums text-text-primary">{formatMoney(item.amount)}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
      )}
    </div>
  );
}
