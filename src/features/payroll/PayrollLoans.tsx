import * as React from "react";
import { HandCoins, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Field, NumberField } from "@/components/forms";
import { ConfirmDialog } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/typography";
import { useCurrencyInput } from "@/features/branches";
import { useAddLoan, useCancelLoan, useLoansQuery } from "./queries";
import type { PayrollLoan, PayrollMember } from "./types";

export interface PayrollLoansProps {
  member: PayrollMember;
  period: { branchId: string; from: string; to: string };
  canManage: boolean;
  formatMoney: (value: number) => string;
}

const DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
const MAX_INSTALLMENTS = 24;
const MIN_NOTE = 3;

/**
 * Los préstamos de la persona: se le entregó el dinero y se le descuenta en cuotas iguales, una por ciclo
 * de pago. La cuota sale sola en la nómina de cada ciclo (como un ajuste que no se borra); cancelar el
 * préstamo deja de cobrar lo que falta.
 */
export function PayrollLoans({ member, period, canManage, formatMoney }: PayrollLoansProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const money = useCurrencyInput();
  const query = useLoansQuery(period.branchId, member.memberId);
  const add = useAddLoan();
  const cancel = useCancelLoan();
  const [adding, setAdding] = React.useState(false);
  const [amount, setAmount] = React.useState<number | null>(null);
  const [installments, setInstallments] = React.useState<number | null>(2);
  const [note, setNote] = React.useState("");
  const [cancelling, setCancelling] = React.useState<PayrollLoan | null>(null);
  const loans = query.data?.items ?? [];
  const each = amount && installments ? amount / installments : null;
  const valid = (amount ?? 0) > 0 && (installments ?? 0) >= 1 && (installments ?? 0) <= MAX_INSTALLMENTS && note.trim().length >= MIN_NOTE;

  const submit = () =>
    valid &&
    add.mutate(
      { branchId: period.branchId, memberId: member.memberId, amount: amount!, installments: installments!, startDate: period.from, note: note.trim() },
      {
        onSuccess: () => {
          setAdding(false);
          setAmount(null);
          setNote("");
          toast.success(t("payroll.loan.added"));
        },
      }
    );

  if (loans.length === 0 && !canManage) return null;
  return (
    <section aria-label={t("payroll.loan.title")} className="space-y-3" data-testid="payroll-loans">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Text variant="label">{t("payroll.loan.title")}</Text>
          <Text variant="muted">{t("payroll.loan.hint")}</Text>
        </div>
        {canManage && !adding && (
          <Button size="xs" variant="ghost" onClick={() => setAdding(true)} data-testid="payroll-loan-new">
            <Plus /> {t("payroll.loan.new")}
          </Button>
        )}
      </div>
      {loans.length > 0 && (
        <ul className="space-y-2">
          {loans.map((loan) => (
            <li key={loan.id} className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2" data-testid="payroll-loan">
              <HandCoins className="size-4 shrink-0 text-text-muted" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-text-primary">
                  {formatMoney(loan.amount)} · {t("payroll.loan.installments", { count: loan.installments })} · {loan.note}
                </span>
                <span className="block text-xs text-text-muted">
                  {loan.cancelledAt ? t("payroll.loan.cancelled", { date: formatDate(new Date(loan.cancelledAt), DATE) }) : t("payroll.loan.since", { date: formatDate(new Date(`${loan.startDate}T12:00:00`), DATE), each: formatMoney(Math.floor((loan.amount / loan.installments) * 100) / 100) })}
                </span>
              </span>
              {canManage && !loan.cancelledAt && (
                <Button variant="ghost" size="icon" aria-label={t("payroll.loan.cancel")} onClick={() => setCancelling(loan)}>
                  <X />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {adding && (
        <div className="space-y-3 rounded-xl border border-border/60 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("payroll.loan.amount")} required>
              <NumberField value={amount} onValueChange={setAmount} min={0} precision={money.decimals} prefix={money.symbol} data-testid="payroll-loan-amount" />
            </Field>
            <Field label={t("payroll.loan.count")} required description={each ? t("payroll.loan.each", { amount: formatMoney(each) }) : undefined}>
              <NumberField value={installments} onValueChange={(value) => setInstallments(value === null ? null : Math.round(value))} min={1} max={MAX_INSTALLMENTS} step={1} data-testid="payroll-loan-installments" />
            </Field>
          </div>
          <Field label={t("payroll.adjustment.note")} required>
            <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder={t("payroll.loan.notePlaceholder")} autoComplete="off" data-testid="payroll-loan-note" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setAdding(false)}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" onClick={submit} disabled={!valid || add.isPending} data-testid="payroll-loan-save">
              {t("payroll.loan.save")}
            </Button>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={cancelling !== null}
        onOpenChange={(open) => !open && setCancelling(null)}
        title={t("payroll.loan.cancelTitle")}
        description={t("payroll.loan.cancelHint")}
        confirmLabel={t("payroll.loan.cancel")}
        variant="warning"
        loading={cancel.isPending}
        onConfirm={() => cancelling && cancel.mutate(cancelling.id, { onSuccess: () => setCancelling(null) })}
      />
    </section>
  );
}
