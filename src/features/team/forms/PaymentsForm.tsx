import * as React from "react";
import { Eye, EyeOff, Landmark } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useBranchCurrency } from "@/features/branches";
import { useRevealBank } from "../queries";
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

/** El símbolo de la moneda de la sucursal («$», «€», «COP»), no un `$` fijo. */
function useCurrencySymbol(): string {
  const currency = useBranchCurrency();
  const { current } = useLocale();
  return React.useMemo(() => new Intl.NumberFormat(current.intl, { style: "currency", currency, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((part) => part.type === "currency")?.value ?? currency, [currency, current.intl]);
}

export function PaymentsForm({ value, onChange, errors = {} }: PaymentsFormProps) {
  const t = useAppT();
  const symbol = useCurrencySymbol();
  const set = <K extends keyof Payments>(key: K, next: Payments[K]) => onChange({ ...value, [key]: next });
  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]" data-testid="payments-form">
      <InfoCard title={t("teamMember.payments.title")} description={t("teamMember.payments.hint")}>
        <div className="space-y-4">
          <Field label={t("teamMember.payments.rentBase")} required description={t("teamMember.payments.rentBaseHint")} error={errors.rentBase}>
            <NumberField value={value.rentBase} onValueChange={(rentBase) => set("rentBase", rentBase ?? 0)} min={0} step={10} prefix={symbol} />
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
          <Field label={t("teamMember.payments.accountNumber")} description={t("teamMember.payments.accountHint")}>
            <Input value={value.accountNumber} onChange={(event) => set("accountNumber", event.target.value)} inputMode="numeric" autoComplete="off" data-testid="payments-account" />
          </Field>
        </div>
      </InfoCard>
    </div>
  );
}

export function PaymentsView({ memberId, value, formatMoney }: { memberId: string; value: Payments; formatMoney: (value: number) => string }) {
  const t = useAppT();
  // El número completo solo con la identidad confirmada (el servidor lo manda siempre enmascarado).
  const reveal = useRevealBank();
  const [shown, setShown] = React.useState<string | null>(null);
  const toggle = () =>
    shown
      ? setShown(null)
      : reveal.mutate(memberId, {
          onSuccess: (bank) => setShown(bank.accountNumber),
          onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
        });
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
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono" data-testid="payments-account-value">
              {shown ?? (value.accountNumber || "--")}
            </span>
            {value.accountNumber && (
              <Button type="button" size="xs" variant="ghost" onClick={toggle} disabled={reveal.isPending} data-testid="payments-account-reveal">
                {shown ? <EyeOff /> : <Eye />} {t(shown ? "teamMember.payments.hideAccount" : "teamMember.payments.showAccount")}
              </Button>
            )}
          </span>
        </InfoRow>
      </InfoCard>
    </div>
  );
}
