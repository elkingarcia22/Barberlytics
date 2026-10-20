import { useAppT } from "@/app/i18n";
import { Field, NumberField } from "@/components/forms";
import { Text } from "@/components/typography";
import { useCurrencyInput } from "@/features/branches";
import { SettingsCard, SettingsDocument, SwitchRow, type FieldErrors } from "../SettingsFormParts";
import { marketingSchema, type MarketingSettings as Marketing } from "../settingsTypes";

/**
 * Referidos y mensajes automáticos. El referido premia a los dos con saldo a favor cuando se cobra la primera visita
 * del nuevo. Los mensajes salen solos: cumpleaños (promoción: con permiso, en la franja legal y dentro del tope),
 * gracias tras la primera visita y el pedido de reseña tras cada visita cobrada (a todos, sin filtrar a los contentos).
 */
export function MarketingSettings() {
  const t = useAppT();
  const { symbol } = useCurrencyInput();

  const validate = (draft: Marketing): FieldErrors => {
    const errors: FieldErrors = {};
    if (draft.referral.enabled && !(draft.referral.reward > 0)) errors.reward = t("cfg.marketing.error.reward");
    for (const key of ["thanks", "review"] as const) if (!(draft.automations[key].delayHours >= 0 && draft.automations[key].delayHours <= 72)) errors[`${key}Delay`] = t("cfg.marketing.error.delay");
    return errors;
  };

  return (
    <SettingsDocument section="marketing" schema={marketingSchema} validate={validate}>
      {({ draft, set, errors }) => {
        const setAutomation = <K extends keyof Marketing["automations"]>(key: K, value: Partial<Marketing["automations"][K]>) => set("automations", { ...draft.automations, [key]: { ...draft.automations[key], ...value } });
        return (
          <>
            <SettingsCard title={t("cfg.marketing.referral")} description={t("cfg.marketing.referralHint")}>
              <SwitchRow label={t("cfg.marketing.referralEnable")} hint={t("cfg.marketing.referralEnableHint")} checked={draft.referral.enabled} onCheckedChange={(enabled) => set("referral", { ...draft.referral, enabled })} testId="marketing-referral" />
              {draft.referral.enabled && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("cfg.marketing.reward")} required error={errors.reward} description={t("cfg.marketing.rewardHint")}>
                    <NumberField value={draft.referral.reward} onValueChange={(reward) => set("referral", { ...draft.referral, reward: reward ?? 0 })} min={0} precision={2} prefix={symbol} data-testid="marketing-reward" />
                  </Field>
                  <Field label={t("cfg.marketing.maxPerReferrer")} description={t("cfg.marketing.maxPerReferrerHint")}>
                    <NumberField value={draft.referral.maxPerReferrer || null} onValueChange={(value) => set("referral", { ...draft.referral, maxPerReferrer: value ? Math.floor(value) : 0 })} min={0} />
                  </Field>
                </div>
              )}
            </SettingsCard>

            <SettingsCard title={t("cfg.marketing.automations")} description={t("cfg.marketing.automationsHint")}>
              <SwitchRow label={t("cfg.marketing.birthday")} hint={t("cfg.marketing.birthdayHint")} checked={draft.automations.birthday.enabled} onCheckedChange={(enabled) => setAutomation("birthday", { enabled })} testId="marketing-birthday" />
              <SwitchRow label={t("cfg.marketing.thanks")} hint={t("cfg.marketing.thanksHint")} checked={draft.automations.thanks.enabled} onCheckedChange={(enabled) => setAutomation("thanks", { enabled })} testId="marketing-thanks">
                {draft.automations.thanks.enabled && (
                  <Field label={t("cfg.marketing.delay")} error={errors.thanksDelay}>
                    <NumberField value={draft.automations.thanks.delayHours} onValueChange={(value) => setAutomation("thanks", { delayHours: value ?? 0 })} min={0} max={72} suffix="h" size="sm" />
                  </Field>
                )}
              </SwitchRow>
              <SwitchRow label={t("cfg.marketing.review")} hint={t("cfg.marketing.reviewHint")} checked={draft.automations.review.enabled} onCheckedChange={(enabled) => setAutomation("review", { enabled })} testId="marketing-review">
                {draft.automations.review.enabled && (
                  <Field label={t("cfg.marketing.delay")} error={errors.reviewDelay}>
                    <NumberField value={draft.automations.review.delayHours} onValueChange={(value) => setAutomation("review", { delayHours: value ?? 0 })} min={0} max={72} suffix="h" size="sm" />
                  </Field>
                )}
              </SwitchRow>
              <Text variant="muted">{t("cfg.marketing.automationsNote")}</Text>
            </SettingsCard>
          </>
        );
      }}
    </SettingsDocument>
  );
}
