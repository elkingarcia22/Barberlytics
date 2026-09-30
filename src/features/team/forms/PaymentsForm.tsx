import { Landmark } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { Field, NumberField } from "@/components/forms";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/typography";
import { InfoCard, InfoRow, Stat } from "../teamShared";
import type { Payments } from "../types";

/**
 * La pestaña Pagos de un barbero de renta: la base de la renta, las tres
 * deducciones por los clientes que le puso la barbería y su cuenta bancaria.
 */

export interface PaymentsFormProps {
  value: Payments;
  onChange: (value: Payments) => void;
  errors?: Record<string, string>;
}

const DEDUCTIONS = [
  { key: "walkInDeduction", labelKey: "teamMember.payments.walkInDeduction" },
  { key: "newClientDeduction", labelKey: "teamMember.payments.newClientDeduction" },
  { key: "noPreferenceDeduction", labelKey: "teamMember.payments.noPreferenceDeduction" },
] as const;

export function PaymentsForm({ value, onChange, errors = {} }: PaymentsFormProps) {
  const t = useAppT();
  const set = <K extends keyof Payments>(key: K, next: Payments[K]) => onChange({ ...value, [key]: next });
  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]" data-testid="payments-form">
      <InfoCard title={t("teamMember.payments.title")} description={t("teamMember.payments.hint")}>
        <div className="space-y-4">
          <Field label={t("teamMember.payments.rentBase")} required description={t("teamMember.payments.rentBaseHint")} error={errors.rentBase}>
            <NumberField value={value.rentBase} onValueChange={(rentBase) => set("rentBase", rentBase ?? 0)} min={0} step={10} prefix="$" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            {DEDUCTIONS.map((field) => (
              <Field key={field.key} label={t(field.labelKey)}>
                <NumberField value={value[field.key]} onValueChange={(next) => set(field.key, next ?? 0)} min={0} max={100} suffix="%" size="sm" />
              </Field>
            ))}
          </div>
        </div>
      </InfoCard>
      <InfoCard title={t("teamMember.payments.bank")} description={t("teamMember.payments.bankHint")}>
        <div className="space-y-4">
          <Field label={t("teamMember.payments.bankName")}>
            <Input value={value.bankName} onChange={(event) => set("bankName", event.target.value)} />
          </Field>
          <Field label={t("teamMember.payments.accountNumber")}>
            <Input value={value.accountNumber} onChange={(event) => set("accountNumber", event.target.value)} />
          </Field>
        </div>
      </InfoCard>
    </div>
  );
}

export function PaymentsView({ value, formatMoney }: { value: Payments; formatMoney: (value: number) => string }) {
  const t = useAppT();
  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <InfoCard title={t("teamMember.payments.title")} description={t("teamMember.payments.hint")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat label={t("teamMember.payments.rentBase")}>{formatMoney(value.rentBase)}</Stat>
          {DEDUCTIONS.map((field) => (
            <Stat key={field.key} label={t(field.labelKey)}>
              {value[field.key]}%
            </Stat>
          ))}
        </div>
      </InfoCard>
      <InfoCard title={t("teamMember.payments.bank")} description={t("teamMember.payments.bankHint")}>
        <InfoRow icon={<Landmark />} label={t("teamMember.payments.bankName")}>
          {value.bankName || <Text variant="muted">--</Text>}
        </InfoRow>
        <InfoRow label={t("teamMember.payments.accountNumber")}>
          <span className="font-mono">{value.accountNumber || "--"}</span>
        </InfoRow>
      </InfoCard>
    </div>
  );
}
