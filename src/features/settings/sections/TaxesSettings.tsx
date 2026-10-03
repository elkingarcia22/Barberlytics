import { Percent, Plus, X } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { Field, NumberField } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/typography";
import { IconTile } from "@/components/utility";
import type { FieldErrors } from "../SettingsFormParts";
import { SettingsList } from "../SettingsListParts";
import { taxGroupSchema, type TaxGroup, type TaxGroupInput } from "../settingsTypes";
import { taxTotal } from "./settingsMath";

const EMPTY: TaxGroupInput = { name: "", taxes: [{ name: "", percent: Number.NaN }] };
const MAX_RATES = 5;

/**
 * Impuestos: los grupos de tasas que se aplican al cobrar. Un grupo junta
 * varias tasas —estatal y local, por ejemplo— que se suman pero salen
 * separadas en el recibo.
 */
export function TaxesSettings() {
  const t = useAppT();

  const validate = (draft: TaxGroupInput): FieldErrors => {
    const errors: FieldErrors = {};
    if (draft.name.trim().length < 2) errors.name = t("cfg.taxes.error.name");
    if (draft.taxes.some((tax) => !tax.name.trim() || !(tax.percent > 0 && tax.percent <= 100))) errors.taxes = t("cfg.taxes.error.rates");
    return errors;
  };

  return (
    <SettingsList<TaxGroup, TaxGroupInput>
      list="taxGroups"
      schema={taxGroupSchema}
      icon="ticket"
      labelOf={(item) => item.name}
      renderRow={(item) => ({
        leading: <IconTile icon={<Percent />} tone="primary" />,
        description: item.taxes.map((tax) => `${tax.name} ${tax.percent}%`).join(" + "),
        meta: <span className="font-semibold tabular-nums text-text-primary">{taxTotal(item)}%</span>,
      })}
      emptyDraft={EMPTY}
      toDraft={({ name, taxes }) => ({ name, taxes })}
      validate={validate}
      messages={{
        count: (count) => t("cfg.taxes.count", { count }),
        add: t("cfg.taxes.add"),
        emptyTitle: t("cfg.taxes.emptyTitle"),
        emptyHint: t("cfg.taxes.emptyHint"),
        createTitle: t("cfg.taxes.add"),
        editTitle: t("cfg.taxes.editTitle"),
        formHint: t("cfg.taxes.formHint"),
        created: t("cfg.taxes.created"),
        saved: t("cfg.saved"),
        removed: t("cfg.taxes.removed"),
        removeTitle: (label) => t("cfg.removeTitle", { name: label }),
        removeHint: t("cfg.taxes.removeHint"),
        editAria: (label) => t("cfg.editAria", { name: label }),
        removeAria: (label) => t("cfg.removeAria", { name: label }),
      }}
      renderForm={({ draft, set, errors }) => (
        <>
          <Field label={t("cfg.taxes.name")} required error={errors.name} description={t("cfg.taxes.nameHint")}>
            <Input value={draft.name} onChange={(event) => set("name", event.target.value)} aria-invalid={!!errors.name} autoComplete="off" data-testid="taxGroups-name" />
          </Field>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Text variant="label">{t("cfg.taxes.rates")}</Text>
              <Button type="button" size="xs" variant="outline" onClick={() => set("taxes", [...draft.taxes, { name: "", percent: Number.NaN }])} disabled={draft.taxes.length >= MAX_RATES}>
                <Plus /> {t("cfg.taxes.addRate")}
              </Button>
            </div>
            {draft.taxes.map((tax, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input className="flex-1" placeholder={t("cfg.taxes.rateName")} aria-label={t("cfg.taxes.rateName")} value={tax.name} onChange={(event) => set("taxes", draft.taxes.map((item, i) => (i === index ? { ...item, name: event.target.value } : item)))} autoComplete="off" data-testid={`taxGroups-rate-name-${index}`} />
                <div className="w-32">
                  <NumberField value={Number.isFinite(tax.percent) ? tax.percent : null} onValueChange={(value) => set("taxes", draft.taxes.map((item, i) => (i === index ? { ...item, percent: value ?? Number.NaN } : item)))} min={0} max={100} precision={3} suffix="%" aria-label={t("cfg.taxes.ratePercent")} data-testid={`taxGroups-rate-percent-${index}`} />
                </div>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={t("cfg.taxes.removeRate")} onClick={() => set("taxes", draft.taxes.filter((_, i) => i !== index))} disabled={draft.taxes.length === 1}>
                  <X />
                </Button>
              </div>
            ))}
            {errors.taxes && (
              <p className="text-sm font-medium text-status-negative" role="alert">
                {errors.taxes}
              </p>
            )}
            <Text variant="muted">{t("cfg.taxes.total", { total: taxTotal(draft) })}</Text>
          </div>
        </>
      )}
    />
  );
}
