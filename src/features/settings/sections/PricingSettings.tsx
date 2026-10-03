import { useAppT } from "@/app/i18n";
import { Field } from "@/components/forms";
import { CardSelection } from "@/components/selection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsCard, SettingsDocument } from "../SettingsFormParts";
import { CURRENCIES, pricingSchema } from "../settingsTypes";

/** Precios y moneda: en qué moneda se cobra y si el precio que se escribe ya lleva el impuesto dentro. */
export function PricingSettings() {
  const t = useAppT();
  return (
    <SettingsDocument section="pricing" schema={pricingSchema}>
      {({ draft, set }) => (
        <>
          <SettingsCard title={t("cfg.pricing.currency")} description={t("cfg.pricing.currencyHint")}>
            <Field label={t("cfg.pricing.currencyField")} required className="sm:max-w-xs">
              <Select value={draft.currency} onValueChange={(value) => set("currency", value)}>
                <SelectTrigger data-testid="pricing-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </SettingsCard>
          <SettingsCard title={t("cfg.pricing.tax")} description={t("cfg.pricing.taxHint")}>
            <CardSelection
              columns={2}
              value={draft.taxInclusive ? "inclusive" : "exclusive"}
              onChange={(value) => set("taxInclusive", value === "inclusive")}
              options={[
                { value: "exclusive", label: t("cfg.pricing.exclusive"), description: t("cfg.pricing.exclusiveExample") },
                { value: "inclusive", label: t("cfg.pricing.inclusive"), description: t("cfg.pricing.inclusiveExample") },
              ]}
            />
          </SettingsCard>
        </>
      )}
    </SettingsDocument>
  );
}
