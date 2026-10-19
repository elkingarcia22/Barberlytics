import * as React from "react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { NarrativeCard } from "@/features/narrative/NarrativeCard";
import type { Facts } from "@/features/narrative/narrative";
import type { PayrollMember } from "./types";

/**
 * «¿Por qué esta cifra?»: la nómina del barbero contada en palabras, con las mismas cifras que la
 * página (lo que vendió, su comisión o su renta, propinas, ajustes y el neto). La IA, si hay clave,
 * solo redacta; si no, el resumen automático dice lo mismo.
 */
export function PayNarrative({ member, formatMoney }: { member: PayrollMember; formatMoney: (value: number) => string }) {
  const t = useAppT();
  const { formatNumber } = useLocale();
  const rent = member.payout === "rent";

  const facts = React.useMemo<Facts>(() => {
    const money = (value: number) => formatMoney(Math.abs(value));
    const out: Facts = {
      services: { label: t("narrative.pay.services"), value: formatNumber(member.services) },
      sales: { label: t("narrative.pay.sales"), value: money(member.serviceSales) },
      tips: { label: t("narrative.pay.tips"), value: money(member.tips) },
      net: { label: t(member.net < 0 ? "narrative.pay.owes" : "narrative.pay.net"), value: money(member.net) },
    };
    if (rent) {
      out.rent = { label: t("narrative.pay.rent"), value: money(member.rent) };
      out.deductions = { label: t("narrative.pay.deductions"), value: money(member.deductions) };
      out.held = { label: t("narrative.pay.held"), value: money(member.held ?? 0) };
    } else if (member.payout === "salary") out.salary = { label: t("narrative.pay.salary"), value: money(member.salary) };
    else out.commission = { label: t("narrative.pay.commission"), value: money(member.serviceCommission + member.productCommission) };
    if (member.adjustmentsTotal) out.adjustments = { label: t("narrative.pay.adjustments"), value: `${member.adjustmentsTotal < 0 ? "−" : "+"}${money(member.adjustmentsTotal)}` };
    return out;
  }, [member, rent, t, formatMoney, formatNumber]);

  const fallback = React.useMemo(() => {
    const values = Object.fromEntries(Object.entries(facts).map(([key, fact]) => [key, fact.value]));
    const parts = [t("narrative.pay.auto.sales", values)];
    parts.push(t(rent ? "narrative.pay.auto.rent" : member.payout === "salary" ? "narrative.pay.auto.salary" : "narrative.pay.auto.commission", values));
    if (facts.adjustments) parts.push(t("narrative.pay.auto.adjustments", values));
    parts.push(t(member.net < 0 ? "narrative.pay.auto.owes" : "narrative.pay.auto.net", values));
    return parts.join(" ");
  }, [facts, member, rent, t]);

  return <NarrativeCard title={t("narrative.pay.title")} kind="pay" facts={facts} fallback={fallback} data-testid="pay-narrative" />;
}
