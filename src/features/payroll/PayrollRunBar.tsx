import * as React from "react";
import { CheckCheck, HandCoins, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAppT, type AppMessageKey } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Field } from "@/components/forms";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { ModalShell } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/typography";
import { useMoney } from "@/features/calendar/calendarFormat";
import { ReviewFindings } from "@/features/review/ReviewFindings";
import { needsAcknowledge, usePayrollReview } from "@/features/review/review";
import { useApprovePayroll, usePayPayroll, useReopenPayroll } from "./queries";
import { PAY_METHOD_KEYS, PAY_METHODS, type PayMethod, type PayrollRun } from "./types";

export interface PayrollRunBarProps {
  period: { branchId: string; from: string; to: string };
  run: PayrollRun | null;
  /** Aprobar, pagar y reabrir son de quien gestiona los pagos del equipo. */
  canManage: boolean;
}

const STATUS_KEYS = { open: "payroll.run.open", approved: "payroll.run.approved", paid: "payroll.run.paid" } as const satisfies Record<string, AppMessageKey>;
const DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };
const MIN_REASON = 5;

/**
 * El estado del periodo y lo siguiente que toca: abierto → aprobar; aprobado → marcar pagado (o
 * reabrir con motivo); pagado → nada, se corrige con un ajuste en el periodo siguiente.
 */
export function PayrollRunBar({ period, run, canManage }: PayrollRunBarProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const approve = useApprovePayroll();
  const pay = usePayPayroll();
  const reopen = useReopenPayroll();
  const [dialog, setDialog] = React.useState<"approve" | "pay" | "reopen" | null>(null);
  const [method, setMethod] = React.useState<PayMethod>("transfer");
  const [reference, setReference] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [acknowledged, setAcknowledged] = React.useState(false);
  const formatMoney = useMoney();
  // La revisión se pide al abrir «Aprobar»: lo raro frente al historial, antes de dejarlo fijo.
  const review = usePayrollReview(period, dialog === "approve");
  const blockedByReview = review.isPending || (needsAcknowledge(review.data?.items ?? []) && !acknowledged);

  const status = run?.status ?? "open";
  const hint =
    status === "paid" && run
      ? t("payroll.run.paidHint", { name: run.paidBy ?? "", date: formatDate(new Date(run.paidAt ?? run.approvedAt), DATE), method: run.method ? t(PAY_METHOD_KEYS[run.method as PayMethod] ?? "payroll.payMethod.transfer") : "" })
      : status === "approved" && run
        ? t("payroll.run.approvedHint", { name: run.approvedBy, date: formatDate(new Date(run.approvedAt), DATE) })
        : t("payroll.run.openHint");

  const close = () => (setDialog(null), setAcknowledged(false));
  const onApprove = () => approve.mutate(period, { onSuccess: () => (close(), toast.success(t("payroll.run.approvedToast"))) });
  const onPay = () => run && pay.mutate({ id: run.id, method, reference: reference.trim() || undefined }, { onSuccess: () => (close(), toast.success(t("payroll.run.paidToast"))) });
  const onReopen = () => run && reopen.mutate({ id: run.id, reason: reason.trim() }, { onSuccess: () => (close(), setReason(""), toast.success(t("payroll.run.reopenedToast"))) });

  return (
    <section aria-label={t("payroll.run.aria")} className="mb-section flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-surface-subtle px-4 py-3" data-testid="payroll-run">
      <StatusBadge status={status === "paid" ? "active" : status === "approved" ? "pending" : "inactive"} label={t(STATUS_KEYS[status])} />
      <Text variant="muted" className="min-w-0 flex-1" data-testid="payroll-run-hint">
        {hint}
      </Text>
      {canManage && status === "open" && (
        <Button size="sm" onClick={() => setDialog("approve")} data-testid="payroll-approve">
          <CheckCheck /> {t("payroll.run.approve")}
        </Button>
      )}
      {canManage && status === "approved" && (
        <>
          <Button size="sm" variant="outline" onClick={() => setDialog("reopen")} data-testid="payroll-reopen">
            <RotateCcw /> {t("payroll.run.reopen")}
          </Button>
          <Button size="sm" onClick={() => setDialog("pay")} data-testid="payroll-pay">
            <HandCoins /> {t("payroll.run.pay")}
          </Button>
        </>
      )}

      <ModalShell
        open={dialog === "approve"}
        onOpenChange={(open) => !open && close()}
        title={t("payroll.run.approveTitle")}
        description={t("payroll.run.approveHint")}
        size="md"
        actions={
          <>
            <Button variant="outline" onClick={close}>
              {t("common.cancel")}
            </Button>
            <Button onClick={onApprove} disabled={approve.isPending || blockedByReview} data-testid="payroll-approve-confirm">
              {t("payroll.run.approve")}
            </Button>
          </>
        }
      >
        <ReviewFindings items={review.data?.items} loading={review.isPending} formatMoney={formatMoney} acknowledged={acknowledged} onAcknowledgedChange={setAcknowledged} />
      </ModalShell>

      <ModalShell
        open={dialog === "pay"}
        onOpenChange={(open) => !open && close()}
        title={t("payroll.run.payTitle")}
        description={t("payroll.run.payHint")}
        size="md"
        actions={
          <>
            <Button variant="outline" onClick={close}>
              {t("common.cancel")}
            </Button>
            <Button onClick={onPay} disabled={pay.isPending} data-testid="payroll-pay-confirm">
              {t("payroll.run.pay")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t("payroll.run.payMethod")} required>
            <Select value={method} onValueChange={(value) => setMethod(value as PayMethod)}>
              <SelectTrigger data-testid="payroll-pay-method">
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
          <Field label={t("payroll.run.payReference")}>
            <Input value={reference} onChange={(event) => setReference(event.target.value)} autoComplete="off" data-testid="payroll-pay-reference" />
          </Field>
        </div>
      </ModalShell>

      <ModalShell
        open={dialog === "reopen"}
        onOpenChange={(open) => !open && close()}
        title={t("payroll.run.reopenTitle")}
        description={t("payroll.run.reopenHint")}
        size="md"
        actions={
          <>
            <Button variant="outline" onClick={close}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={onReopen} disabled={reopen.isPending || reason.trim().length < MIN_REASON} data-testid="payroll-reopen-confirm">
              {t("payroll.run.reopen")}
            </Button>
          </>
        }
      >
        <Field label={t("payroll.run.reopenReason")} required>
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} data-testid="payroll-reopen-reason" />
        </Field>
      </ModalShell>
    </section>
  );
}
