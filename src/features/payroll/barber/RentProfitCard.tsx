import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { Button } from "@/components/ui/button";
import { InfoCard } from "@/features/team/teamShared";
import type { PayrollMember } from "../types";

/**
 * «Mi negocio» completo para el de renta: lo que vendió con sus propinas menos lo que le paga a la barbería (renta y
 * deducciones, con el % de cada una) y los gastos de su silla. Lo que queda es lo suyo, cobre quien cobre.
 */
export function RentProfitCard({ member, formatMoney }: { member: PayrollMember; formatMoney: (value: number) => string }) {
  const t = useAppT();
  const navigate = useNavigate();
  const rates = member.deductionRates;
  const expenses = member.chairExpenses?.total ?? 0;
  const profit = member.profit ?? 0;
  const rows: { label: string; value: number; sign: 1 | -1; hint?: string }[] = [
    { label: t("payroll.mine.profit.sales"), value: member.serviceSales + member.productSales, sign: 1 },
    { label: t("payroll.column.tips"), value: member.tips, sign: 1 },
    { label: t("payroll.column.rent"), value: member.rent, sign: -1 },
    { label: t("payroll.column.deductions"), value: member.deductions, sign: -1, hint: rates ? t("payroll.mine.profit.rates", { walkIn: rates.walkIn, noPreference: rates.noPreference, newClient: rates.newClient }) : undefined },
    { label: t("payroll.mine.profit.expenses"), value: expenses, sign: -1 },
  ];

  return (
    <InfoCard
      title={t("payroll.mine.profit.title")}
      description={t("payroll.mine.profit.hint")}
      actions={
        <Button size="sm" variant="ghost" onClick={() => navigate("/gastos")}>
          {t("payroll.mine.profit.seeExpenses")} <ArrowRight />
        </Button>
      }
    >
      <dl className="space-y-2 text-sm" data-testid="rent-profit">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-text-secondary">
              {row.label}
              {row.hint && <span className="block text-xs text-text-muted">{row.hint}</span>}
            </dt>
            <dd className={row.sign < 0 ? "tabular-nums text-status-warning" : "tabular-nums text-text-primary"}>
              {row.sign < 0 ? "−" : "+"}
              {formatMoney(row.value)}
            </dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 border-t border-border/60 pt-2">
          <dt className="font-semibold text-text-primary">{t(profit < 0 ? "payroll.mine.profit.loss" : "payroll.mine.profit.total")}</dt>
          <dd className={profit < 0 ? "text-lg font-semibold tabular-nums text-status-negative" : "text-lg font-semibold tabular-nums text-status-positive"} data-testid="rent-profit-total">
            {formatMoney(Math.abs(profit))}
          </dd>
        </div>
      </dl>
    </InfoCard>
  );
}
