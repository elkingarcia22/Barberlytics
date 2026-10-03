import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { Text } from "@/components/typography";
import { useMoney } from "@/features/calendar/calendarFormat";
import { SettingsCard, SettingsDocument, SwitchRow } from "../SettingsFormParts";
import { commissionsSchema, type CommissionSettings as Commissions } from "../settingsTypes";

const RULES: readonly { key: keyof Commissions; label: AppMessageKey; hint: AppMessageKey; amount: number }[] = [
  { key: "deductDiscounts", label: "cfg.commissions.discounts", hint: "cfg.commissions.discountsHint", amount: 5 },
  { key: "deductTaxes", label: "cfg.commissions.taxes", hint: "cfg.commissions.taxesHint", amount: 4 },
  { key: "deductServiceCost", label: "cfg.commissions.serviceCost", hint: "cfg.commissions.serviceCostHint", amount: 10 },
  { key: "deductProductCost", label: "cfg.commissions.productCost", hint: "cfg.commissions.productCostHint", amount: 0 },
];

/* El ejemplo: un servicio de 50 con un 40 % de comisión. */
const EXAMPLE_PRICE = 50;
const EXAMPLE_RATE = 40;

/**
 * Comisiones: qué se le resta al precio antes de calcular la comisión del
 * barbero. Un ejemplo se recalcula con cada interruptor para que se vea en
 * dinero lo que cambia.
 */
export function CommissionSettings() {
  const t = useAppT();
  const formatMoney = useMoney();
  return (
    <SettingsDocument section="commissions" schema={commissionsSchema}>
      {({ draft, set }) => {
        const base = RULES.reduce((value, rule) => (draft[rule.key] ? value - rule.amount : value), EXAMPLE_PRICE);
        return (
          <SettingsCard title={t("cfg.commissions.title")} description={t("cfg.commissions.hint")}>
            {RULES.map((rule) => (
              <SwitchRow key={rule.key} label={t(rule.label)} hint={t(rule.hint)} checked={draft[rule.key]} onCheckedChange={(checked) => set(rule.key, checked)} testId={`commissions-${rule.key}`} />
            ))}
            <div className="rounded-lg border border-border/60 p-3" data-testid="commissions-example">
              <Text variant="label">{t("cfg.commissions.exampleTitle")}</Text>
              <Text variant="muted">{t("cfg.commissions.example", { price: formatMoney(EXAMPLE_PRICE), base: formatMoney(base), rate: EXAMPLE_RATE, commission: formatMoney((base * EXAMPLE_RATE) / 100) })}</Text>
            </div>
          </SettingsCard>
        );
      }}
    </SettingsDocument>
  );
}
