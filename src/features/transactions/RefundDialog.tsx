import * as React from "react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { Field, NumberField } from "@/components/forms";
import { ModalShell } from "@/components/overlays";
import { SegmentedControl } from "@/components/selection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRefundAccount } from "./queries";
import { refundableOf, type Account } from "./types";

export interface RefundDialogProps {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formatMoney: (value: number) => string;
}

const MIN_REASON = 3;

/**
 * Devolver una cuenta cobrada, entera o en parte: cuánto, a dónde vuelve (efectivo o la tarjeta) y
 * por qué. La cuenta queda «Devuelta», el cobrado del periodo baja y la nómina deja de comisionarlo.
 */
export function RefundDialog({ account, open, onOpenChange, formatMoney }: RefundDialogProps) {
  const t = useAppT();
  const refund = useRefundAccount();
  const max = refundableOf(account);
  const [amount, setAmount] = React.useState<number | null>(max);
  const [reason, setReason] = React.useState("");
  const [to, setTo] = React.useState<"cash" | "card">(account.method === "cash" ? "cash" : "card");
  const valid = amount !== null && amount > 0 && amount <= max && reason.trim().length >= MIN_REASON;

  const submit = () => {
    if (!valid || !account.appointmentId || amount === null) return;
    refund.mutate(
      { appointmentId: account.appointmentId, input: { amount, reason: reason.trim(), to } },
      {
        onSuccess: () => {
          toast.success(t("transactions.refund.done"), { description: formatMoney(amount) });
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("transactions.refund.title")}
      description={t("transactions.refund.hint", { amount: formatMoney(max) })}
      size="md"
      actions={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={submit} disabled={!valid || refund.isPending} data-testid="refund-confirm">
            {t("transactions.refund.confirm", { amount: formatMoney(amount ?? 0) })}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t("transactions.refund.amount")} required description={t("transactions.refund.amountHint", { amount: formatMoney(max) })}>
          <NumberField value={amount} onValueChange={setAmount} min={0} max={max} precision={2} data-testid="refund-amount" />
        </Field>
        <Field label={t("transactions.refund.to")} required>
          <SegmentedControl
            size="sm"
            variant="outline"
            value={to}
            onChange={(value) => setTo(value as "cash" | "card")}
            options={[
              { value: "cash", label: t("transactions.refund.toCash") },
              { value: "card", label: t("transactions.refund.toCard") },
            ]}
            ariaLabel={t("transactions.refund.to")}
          />
        </Field>
        <Field label={t("transactions.refund.reason")} required>
          <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t("transactions.refund.reasonPlaceholder")} autoComplete="off" data-testid="refund-reason" />
        </Field>
      </div>
    </ModalShell>
  );
}
