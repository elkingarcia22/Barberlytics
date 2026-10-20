import * as React from "react";
import { MessageSquareReply } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError, isApiError } from "@/lib/api";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { Field } from "@/components/forms";
import { ModalShell } from "@/components/overlays";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePayDisputeActions, usePayDisputes, type PayDispute } from "../barberPay";

const MIN_MESSAGE = 10;
const MIN_ANSWER = 5;
const MAX_TEXT = 500;
const WHEN: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };

export interface DisputeTarget {
  period: { branchId: string; from: string; to: string };
  /** Una cita del pago; sin ella, el reclamo es del periodo. */
  line?: { appointmentId: string; label: string } | null;
}

/**
 * «Esto no cuadra»: el barbero cuenta qué no le cuadra de su pago (del periodo o de una cita) y le llega a quien gestiona,
 * con la cita adjunta. Queda escrito: la respuesta vuelve como aviso y en la lista.
 */
export function PayDisputeDialog({ target, onClose }: { target: DisputeTarget | null; onClose: () => void }) {
  const t = useAppT();
  const { create } = usePayDisputeActions();
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const close = () => {
    setMessage("");
    setError(null);
    onClose();
  };
  const send = () => {
    if (!target) return;
    create.mutate(
      { ...target.period, appointmentId: target.line?.appointmentId ?? null, message: message.trim() },
      {
        onSuccess: () => {
          toast.success(t("payroll.dispute.sent"));
          close();
        },
        onError: (reason) => setError(isApiError(reason) ? (reason.fieldErrors?.message?.[0] ?? describeError(reason).description ?? null) : describeError(reason).description ?? null),
      }
    );
  };
  return (
    <ModalShell
      open={target !== null}
      onOpenChange={(open) => !open && close()}
      title={t("payroll.dispute.title")}
      description={target?.line ? t("payroll.dispute.forLine", { line: target.line.label }) : t("payroll.dispute.forPeriod")}
      size="md"
      actions={
        <>
          <Button variant="outline" onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button onClick={send} disabled={message.trim().length < MIN_MESSAGE || create.isPending} data-testid="pay-dispute-send">
            {t("payroll.dispute.send")}
          </Button>
        </>
      }
    >
      <Field label={t("payroll.dispute.message")} description={t("payroll.dispute.messageHint")} error={error ?? undefined}>
        <Textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} maxLength={MAX_TEXT} data-testid="pay-dispute-message" />
      </Field>
    </ModalShell>
  );
}

/**
 * Los reclamos de un barbero: él ve los suyos con su respuesta; quien gestiona (`canAnswer`) los responde ahí mismo.
 * Sin reclamos no se muestra nada.
 */
export function PayDisputeList({ branchId, memberId = null, canAnswer = false }: { branchId: string; memberId?: string | null; canAnswer?: boolean }) {
  const t = useAppT();
  const query = usePayDisputes({ branchId, memberId });
  const items = query.data?.items ?? [];
  if (items.length === 0) return null;
  return (
    <section aria-label={t("payroll.dispute.listTitle")} className="space-y-2" data-testid="pay-disputes">
      <Text variant="label">{t("payroll.dispute.listTitle")}</Text>
      <ul className="divide-y divide-border/60 rounded-xl border border-border/60">
        {items.map((item) => (
          <DisputeItem key={item.id} item={item} canAnswer={canAnswer} />
        ))}
      </ul>
    </section>
  );
}

function DisputeItem({ item, canAnswer }: { item: PayDispute; canAnswer: boolean }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const { answer } = usePayDisputeActions();
  const [reply, setReply] = React.useState("");
  const open = item.status === "open";
  const submit = () =>
    answer.mutate(
      { id: item.id, answer: reply.trim() },
      { onSuccess: () => toast.success(t("payroll.dispute.answered")), onError: (reason) => toast.error(describeError(reason).description) }
    );
  return (
    <li className="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-text-primary">{item.appointmentLabel ? [item.appointmentLabel, item.appointmentAt ? formatDate(new Date(item.appointmentAt), WHEN) : null].filter(Boolean).join(" · ") : t("payroll.dispute.wholePeriod")}</span>
        <StatusBadge status={open ? "pending" : "completed"} label={t(open ? "payroll.dispute.open" : "payroll.dispute.closed")} />
      </div>
      <Text size="sm">«{item.message}»</Text>
      <Text size="xs" tone="muted">
        {[canAnswer ? item.memberName : null, formatDate(new Date(item.createdAt), WHEN)].filter(Boolean).join(" · ")}
      </Text>
      {item.answer && (
        <div className="rounded-lg bg-surface-subtle px-3 py-2 text-sm">
          <span className="font-medium text-text-primary">{item.answeredBy}: </span>
          <span className="text-text-secondary">{item.answer}</span>
        </div>
      )}
      {open && canAnswer && (
        <div className="space-y-2">
          <Textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={2} maxLength={MAX_TEXT} placeholder={t("payroll.dispute.answerPlaceholder")} aria-label={t("payroll.dispute.answer")} data-testid="pay-dispute-answer" />
          <Button size="sm" variant="outline" onClick={submit} disabled={reply.trim().length < MIN_ANSWER || answer.isPending}>
            <MessageSquareReply /> {t("payroll.dispute.answer")}
          </Button>
        </div>
      )}
    </li>
  );
}
