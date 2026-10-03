import { useAppT } from "@/app/i18n";
import { Field, NumberField } from "@/components/forms";
import { ThemaTabs } from "@/components/navigation";
import { Input } from "@/components/ui/input";
import { useMoney } from "@/features/calendar/calendarFormat";
import { SettingsCard, SettingsDocument, SwitchRow, type FieldErrors } from "../SettingsFormParts";
import { cardFeeSchema, type CardFeeSettings as CardFee } from "../settingsTypes";

/** La cuenta de ejemplo con la que se enseña cuánto sería el recargo. */
const EXAMPLE_BILL = 50;

/** Recargo por tarjeta: si se cobra, cómo se llama en el recibo y cuánto es —un porcentaje o un monto fijo—. */
export function CardFeeSettings() {
  const t = useAppT();
  const formatMoney = useMoney();

  const validate = (draft: CardFee): FieldErrors => {
    if (!draft.enabled) return {};
    const errors: FieldErrors = {};
    if (draft.name.trim().length < 2) errors.name = t("cfg.cardFee.error.name");
    if (!(draft.rate > 0)) errors.rate = t("cfg.cardFee.error.rate");
    return errors;
  };

  return (
    <SettingsDocument section="cardFee" schema={cardFeeSchema} validate={validate}>
      {({ draft, set, errors }) => {
        const fee = draft.type === "percent" ? (EXAMPLE_BILL * draft.rate) / 100 : draft.rate;
        return (
          <SettingsCard title={t("cfg.cardFee.title")} description={t("cfg.cardFee.hint")}>
            <SwitchRow label={t("cfg.cardFee.enable")} hint={t("cfg.cardFee.enableHint")} checked={draft.enabled} onCheckedChange={(checked) => set("enabled", checked)} testId="cardfee-enabled" />
            {draft.enabled && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("cfg.cardFee.name")} required error={errors.name} description={t("cfg.cardFee.nameHint")}>
                  <Input value={draft.name} onChange={(event) => set("name", event.target.value)} aria-invalid={!!errors.name} autoComplete="off" data-testid="cardfee-name" />
                </Field>
                <Field label={t("cfg.cardFee.type")} required>
                  <ThemaTabs
                    className="mb-0"
                    fitContent
                    tabs={[
                      { id: "percent", label: t("cfg.percent") },
                      { id: "amount", label: t("cfg.fixedAmount") },
                    ]}
                    activeTabId={draft.type}
                    onTabChange={(id) => set("type", id as CardFee["type"])}
                  />
                </Field>
                <Field label={t("cfg.cardFee.rate")} required error={errors.rate} description={Number.isFinite(fee) && fee > 0 ? t("cfg.cardFee.example", { bill: formatMoney(EXAMPLE_BILL), fee: formatMoney(Math.round(fee * 100) / 100) }) : undefined}>
                  <NumberField value={Number.isFinite(draft.rate) ? draft.rate : null} onValueChange={(value) => set("rate", value ?? Number.NaN)} min={0} precision={2} prefix={draft.type === "amount" ? "$" : undefined} suffix={draft.type === "percent" ? "%" : undefined} aria-invalid={!!errors.rate} data-testid="cardfee-rate" />
                </Field>
              </div>
            )}
          </SettingsCard>
        );
      }}
    </SettingsDocument>
  );
}
