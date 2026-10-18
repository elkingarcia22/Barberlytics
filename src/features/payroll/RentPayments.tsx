import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Field, NumberField } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Text } from "@/components/typography";
import { useAddRentPayment, useRemoveRentPayment } from "./queries";
import { PAY_METHOD_KEYS, PAY_METHODS, type PayMethod, type PayrollMember } from "./types";

export interface RentPaymentsProps {
  member: PayrollMember;
  period: { branchId: string; from: string; to: string };
  canManage: boolean;
  formatMoney: (value: number) => string;
}

const DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

/**
 * Lo que el barbero de renta le entregó a la barbería en el periodo. Se cuenta aunque la nómina
 * esté aprobada: es dinero que ya cambió de manos, no una regla que se recalcula.
 */
export function RentPayments({ member, period, canManage, formatMoney }: RentPaymentsProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const add = useAddRentPayment();
  const remove = useRemoveRentPayment();
  const [amount, setAmount] = React.useState<number | null>(null);
  const [method, setMethod] = React.useState<PayMethod>("cash");
  const payments = member.rentPayments ?? [];
  // Se anota con la fecha de hoy si cae en el periodo; si no, con su último día.
  const today = new Date().toISOString().slice(0, 10);
  const date = today >= period.from && today <= period.to ? today : period.to;

  const submit = () => {
    if (amount === null || amount <= 0) return;
    add.mutate({ branchId: period.branchId, memberId: member.memberId, amount, method, date }, { onSuccess: () => (setAmount(null), toast.success(t("payroll.rent.added"))) });
  };

  return (
    <section aria-label={t("payroll.rent.title")} className="space-y-3" data-testid="payroll-rent-payments">
      <div>
        <Text variant="label">{t("payroll.rent.title")}</Text>
        <Text variant="muted">{t("payroll.rent.hint")}</Text>
      </div>
      {payments.length === 0 ? (
        <Text variant="muted">{t("payroll.rent.empty")}</Text>
      ) : (
        <ul className="space-y-2">
          {payments.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2">
              <span className="min-w-0 flex-1 text-sm text-text-primary">
                {formatDate(new Date(`${item.date}T12:00:00`), DATE)} · {t(PAY_METHOD_KEYS[item.method as PayMethod] ?? "payroll.payMethod.cash")}
                <span className="block text-xs text-text-muted">{item.by}</span>
              </span>
              <span className="text-sm font-semibold tabular-nums text-text-primary">{formatMoney(item.amount)}</span>
              {canManage && (
                <Button variant="ghost" size="icon" aria-label={t("payroll.rent.removeAria", { amount: formatMoney(item.amount) })} onClick={() => remove.mutate(item.id)} disabled={remove.isPending}>
                  <Trash2 />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canManage && (
        <div className="grid items-end gap-3 rounded-xl border border-border/60 p-3 sm:grid-cols-[10rem_10rem_auto]">
          <Field label={t("payroll.rent.amount")} required>
            <NumberField value={amount} onValueChange={setAmount} min={0} precision={2} data-testid="payroll-rent-amount" />
          </Field>
          <Field label={t("payroll.rent.method")} required>
            <Select value={method} onValueChange={(value) => setMethod(value as PayMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAY_METHODS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {t(PAY_METHOD_KEYS[item])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Button size="sm" onClick={submit} disabled={amount === null || amount <= 0 || add.isPending} data-testid="payroll-rent-add">
            <Plus /> {t("payroll.rent.add")}
          </Button>
        </div>
      )}
    </section>
  );
}
