import { Plus, Trash2 } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { Field, NumberField } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Text } from "@/components/typography";
import { InfoCard, Stat } from "../teamShared";
import { COMPENSATION_TYPE_KEYS, compensationTypeSchema, type Compensation, type CompensationType } from "../types";
import { useCurrencyInput } from "@/features/branches";

/**
 * La pestaña Compensación de un barbero por comisión: cómo se le paga cada
 * servicio (comisión fija, de escala o salario) y qué se lleva por producto.
 */

export interface CompensationFormProps {
  value: Compensation;
  onChange: (value: Compensation) => void;
  errors?: Record<string, string>;
  formatMoney: (value: number) => string;
}

const LOGIC_KEYS: Record<CompensationType, "teamMember.compensation.logicCommission" | "teamMember.compensation.logicScale" | "teamMember.compensation.logicSalary"> = {
  commission: "teamMember.compensation.logicCommission",
  scale: "teamMember.compensation.logicScale",
  salary: "teamMember.compensation.logicSalary",
};

const CLIENT_FIELDS = [
  { key: "recurring", labelKey: "teamMember.compensation.recurring", hintKey: "teamMember.compensation.recurringHint" },
  { key: "walkIn", labelKey: "teamMember.compensation.walkIn", hintKey: "teamMember.compensation.walkInHint" },
  { key: "noPreference", labelKey: "teamMember.compensation.noPreference", hintKey: "teamMember.compensation.noPreferenceHint" },
  { key: "newClient", labelKey: "teamMember.compensation.newClient", hintKey: "teamMember.compensation.newClientHint" },
] as const;

const EXAMPLE_PRICE = 40;

export function CompensationForm({ value, onChange, errors = {}, formatMoney }: CompensationFormProps) {
  const { symbol: currencySymbol } = useCurrencyInput();
  const t = useAppT();
  const set = <K extends keyof Compensation>(key: K, next: Compensation[K]) => onChange({ ...value, [key]: next });

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]" data-testid="compensation-form">
      <InfoCard title={t("teamMember.compensation.title")} description={t("teamMember.compensation.hint")}>
        <div className="space-y-4">
          <Field label={t("teamMember.compensation.type")} required description={t(LOGIC_KEYS[value.type])}>
            <Select value={value.type} onValueChange={(next) => set("type", next as CompensationType)}>
              <SelectTrigger data-testid="compensation-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {compensationTypeSchema.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(COMPENSATION_TYPE_KEYS[option])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {value.type === "salary" ? (
            <Field label={t("teamMember.compensation.salaryAmount")} required>
              <NumberField value={value.salary} onValueChange={(salary) => set("salary", salary)} min={0} step={50} prefix={currencySymbol} />
            </Field>
          ) : (
            <>
              <Field label={t("teamMember.compensation.basic")} required description={t("teamMember.compensation.basicHint")} error={errors.basic}>
                <NumberField value={value.basic} onValueChange={(basic) => set("basic", basic ?? 0)} min={0} max={100} suffix="%" />
              </Field>
              {value.type === "scale" && (
                <div className="space-y-2 rounded-lg bg-surface-subtle p-3">
                  {value.scale.map((tier, index) => (
                    <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                      <Field label={t("teamMember.compensation.scaleFrom")}>
                        <NumberField value={tier.from} onValueChange={(from) => set("scale", value.scale.map((item, i) => (i === index ? { ...item, from: from ?? 0 } : item)))} min={0} step={100} prefix={currencySymbol} size="sm" />
                      </Field>
                      <Field label={t("teamMember.compensation.scalePercent")}>
                        <NumberField value={tier.percent} onValueChange={(percent) => set("scale", value.scale.map((item, i) => (i === index ? { ...item, percent: percent ?? 0 } : item)))} min={0} max={100} suffix="%" size="sm" />
                      </Field>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={t("common.delete")} onClick={() => set("scale", value.scale.filter((_, i) => i !== index))}>
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => set("scale", [...value.scale, { from: (value.scale.at(-1)?.from ?? 0) + 1000, percent: value.basic + 5 }])}>
                    <Plus /> {t("teamMember.compensation.addTier")}
                  </Button>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {CLIENT_FIELDS.map((field) => (
                  <Field key={field.key} label={t(field.labelKey)} description={t(field.hintKey)}>
                    <NumberField value={value[field.key]} onValueChange={(next) => set(field.key, next)} min={0} max={100} suffix="%" size="sm" />
                  </Field>
                ))}
              </div>
            </>
          )}
        </div>
      </InfoCard>

      <div className="space-y-4">
        <InfoCard title={t("teamMember.compensation.product")} description={t("teamMember.compensation.productHint")}>
          <Field label={t("teamMember.compensation.product")}>
            <NumberField value={value.productPercent} onValueChange={(productPercent) => set("productPercent", productPercent)} min={0} max={100} suffix="%" />
          </Field>
        </InfoCard>
        {value.type !== "salary" && (
          <Text variant="muted">{t("teamMember.compensation.example", { price: formatMoney(EXAMPLE_PRICE), amount: formatMoney(Math.round(EXAMPLE_PRICE * (value.basic / 100) * 100) / 100) })}</Text>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ view */

export function CompensationView({ value, formatMoney }: { value: Compensation; formatMoney: (value: number) => string }) {
  const t = useAppT();
  const percent = (amount: number | null) => (amount === null ? t("teamMember.compensation.sameAsBasic") : `${amount}%`);
  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <InfoCard title={t("teamMember.compensation.title")} description={t(LOGIC_KEYS[value.type])} actions={<Text variant="small">{t(COMPENSATION_TYPE_KEYS[value.type])}</Text>}>
        {value.type === "salary" ? (
          <Stat label={t("teamMember.compensation.salaryAmount")}>{formatMoney(value.salary ?? 0)}</Stat>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label={t("teamMember.compensation.basic")}>{value.basic}%</Stat>
            {CLIENT_FIELDS.map((field) => (
              <Stat key={field.key} label={t(field.labelKey)}>
                {percent(value[field.key])}
              </Stat>
            ))}
            {value.type === "scale" &&
              value.scale.map((tier, index) => (
                <Stat key={index} label={`${t("teamMember.compensation.scaleFrom")} ${formatMoney(tier.from)}`}>
                  {tier.percent}%
                </Stat>
              ))}
          </div>
        )}
      </InfoCard>
      <InfoCard title={t("teamMember.compensation.product")} description={t("teamMember.compensation.productHint")}>
        {value.productPercent === null ? <Text variant="muted">{t("teamMember.compensation.productNone")}</Text> : <Stat label={t("teamMember.compensation.product")}>{value.productPercent}%</Stat>}
      </InfoCard>
    </div>
  );
}
