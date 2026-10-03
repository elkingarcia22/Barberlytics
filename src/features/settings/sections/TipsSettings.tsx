import { Plus, X } from "lucide-react";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { Field, NumberField } from "@/components/forms";
import { ThemaTabs } from "@/components/navigation";
import { CardSelection } from "@/components/selection";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Text } from "@/components/typography";
import { SettingsCard, SettingsDocument, type FieldErrors } from "../SettingsFormParts";
import { tipsSchema, type TipOption, type TipsSettings as Tips } from "../settingsTypes";
import { tipLabel } from "./settingsMath";

const MAX_OPTIONS = 6;
const NONE = "none";

const CHECKOUT: readonly { id: Tips["checkout"]; label: AppMessageKey; hint: AppMessageKey }[] = [
  { id: "unset", label: "cfg.tips.checkoutUnset", hint: "cfg.tips.checkoutUnsetHint" },
  { id: "both", label: "cfg.tips.checkoutBoth", hint: "cfg.tips.checkoutBothHint" },
  { id: "percent", label: "cfg.tips.checkoutPercent", hint: "cfg.tips.checkoutPercentHint" },
  { id: "amount", label: "cfg.tips.checkoutAmount", hint: "cfg.tips.checkoutAmountHint" },
];

/**
 * Propinas: las opciones que se ofrecen al cobrar, cuál sale marcada y qué
 * ve el cajero. Todo se guarda junto —en producción eran tres botones de
 * guardar y una opción nueva no aparecía en «predeterminada» hasta guardar la
 * primera parte—.
 */
export function TipsSettings() {
  const t = useAppT();

  const validate = (draft: Tips): FieldErrors => {
    if (draft.options.some((option) => !(option.value > 0))) return { options: t("cfg.tips.error.value") };
    const keys = draft.options.map((option) => `${option.type}:${option.value}`);
    if (new Set(keys).size !== keys.length) return { options: t("cfg.tips.error.duplicate") };
    return {};
  };

  return (
    <SettingsDocument section="tips" schema={tipsSchema} validate={validate}>
      {({ draft, set, errors }) => {
        const update = (id: string, patch: Partial<TipOption>) => set("options", draft.options.map((option) => (option.id === id ? { ...option, ...patch } : option)));
        const remove = (id: string) => {
          set("options", draft.options.filter((option) => option.id !== id));
          if (draft.defaultId === id) set("defaultId", null);
        };
        const add = () => set("options", [...draft.options, { id: `tip_${Date.now().toString(36)}`, type: "percent", value: Number.NaN }]);
        return (
          <>
            <SettingsCard
              title={t("cfg.tips.options")}
              description={t("cfg.tips.optionsHint")}
              actions={
                <Button type="button" size="xs" variant="outline" onClick={add} disabled={draft.options.length >= MAX_OPTIONS} data-testid="tips-add">
                  <Plus /> {t("cfg.tips.add")}
                </Button>
              }
            >
              {draft.options.length === 0 ? (
                <Text variant="muted">{t("cfg.tips.empty")}</Text>
              ) : (
                <ul className="space-y-2" data-testid="tips-options">
                  {draft.options.map((option) => (
                    <li key={option.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 p-2">
                      <ThemaTabs
                        className="mb-0"
                        fitContent
                        tabs={[
                          { id: "percent", label: t("cfg.percent") },
                          { id: "amount", label: t("cfg.fixedAmount") },
                        ]}
                        activeTabId={option.type}
                        onTabChange={(id) => update(option.id, { type: id as TipOption["type"] })}
                      />
                      <div className="w-36">
                        <NumberField value={Number.isFinite(option.value) ? option.value : null} onValueChange={(value) => update(option.id, { value: value ?? Number.NaN })} min={0} precision={2} size="sm" prefix={option.type === "amount" ? "$" : undefined} suffix={option.type === "percent" ? "%" : undefined} aria-label={t("cfg.tips.value")} />
                      </div>
                      <Button type="button" variant="ghost" size="icon-sm" className="ml-auto" aria-label={t("cfg.tips.remove")} onClick={() => remove(option.id)}>
                        <X />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {errors.options && (
                <p className="text-sm font-medium text-status-negative" role="alert">
                  {errors.options}
                </p>
              )}
              <Field label={t("cfg.tips.default")} description={t("cfg.tips.defaultHint")} className="sm:max-w-xs">
                <Select value={draft.defaultId ?? NONE} onValueChange={(value) => set("defaultId", value === NONE ? null : value)}>
                  <SelectTrigger data-testid="tips-default">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t("cfg.tips.noDefault")}</SelectItem>
                    {draft.options
                      .filter((option) => option.value > 0)
                      .map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {tipLabel(option)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
            </SettingsCard>

            <SettingsCard title={t("cfg.tips.checkout")} description={t("cfg.tips.checkoutHint")}>
              <CardSelection columns={2} value={draft.checkout} onChange={(value) => set("checkout", value as Tips["checkout"])} options={CHECKOUT.map((item) => ({ value: item.id, label: t(item.label), description: t(item.hint) }))} />
            </SettingsCard>
          </>
        );
      }}
    </SettingsDocument>
  );
}
