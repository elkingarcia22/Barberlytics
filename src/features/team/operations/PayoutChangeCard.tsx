import * as React from "react";
import { ArrowRightLeft, X } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { useLocale } from "@/i18n";
import { describeError, isApiError } from "@/lib/api";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { Field, NumberField } from "@/components/forms";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrencyInput } from "@/features/branches/useBranchMoney";
import { InfoCard } from "../teamShared";
import type { TeamMember } from "../types";
import { usePayoutChangeActions, usePayoutChanges, type PayoutTarget } from "./operationsApi";

const DAY: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
const TARGET_KEYS: Readonly<Record<PayoutTarget, AppMessageKey>> = { commission: "payroll.payout.commission", salary: "payroll.payout.salary", rent: "payroll.payout.rent" };
const AMOUNT_KEYS: Readonly<Record<PayoutTarget, AppMessageKey>> = { commission: "team.payoutChange.amountCommission", salary: "team.payoutChange.amountSalary", rent: "team.payoutChange.amountRent" };
const STATUS_BADGE = { scheduled: "pending", applied: "completed", cancelled: "inactive" } as const;
const STATUS_KEYS: Readonly<Record<keyof typeof STATUS_BADGE, AppMessageKey>> = { scheduled: "team.payoutChange.scheduled", applied: "team.payoutChange.applied", cancelled: "team.payoutChange.cancelled" };

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

/** La forma de pago de hoy de una ficha de barbero. */
const payoutOf = (member: TeamMember): PayoutTarget => (member.role === "barbero-renta" ? "rent" : member.compensation?.type === "salary" ? "salary" : "commission");

/**
 * Cambiar la forma de pago —comisión, salario o renta— desde una fecha, sin recrear a la persona. Si la fecha ya llegó se
 * aplica al guardar; si no, queda programado y se puede cancelar. La nómina de antes de esa fecha sigue con la forma de
 * entonces. El detalle fino (escala, deducciones) se ajusta después en su pestaña.
 */
export function PayoutChangeCard({ member }: { member: TeamMember }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const { symbol } = useCurrencyInput();
  const history = usePayoutChanges(member.id);
  const { create, cancel } = usePayoutChangeActions(member.id);
  const current = payoutOf(member);
  const options = (["commission", "salary", "rent"] as const).filter((item) => item !== current);
  const [to, setTo] = React.useState<PayoutTarget>(options[0]);
  const [date, setDate] = React.useState(today);
  const [amount, setAmount] = React.useState<number | null>(null);
  const [note, setNote] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const items = history.data?.items ?? [];
  const scheduled = items.find((item) => item.status === "scheduled");
  const day = (value: string) => formatDate(new Date(`${value}T12:00:00`), DAY);
  const targetOf = (role: string, type?: string): PayoutTarget => (role === "barbero-renta" ? "rent" : type === "salary" ? "salary" : "commission");

  const submit = () => {
    setErrors({});
    create.mutate(
      { to, effectiveDate: date, amount, note: note.trim() },
      {
        onSuccess: (change) => {
          toast.success(t(change.status === "applied" ? "team.payoutChange.appliedNow" : "team.payoutChange.scheduledFor", { date: day(change.effectiveDate) }));
          setAmount(null);
          setNote("");
        },
        onError: (error) => {
          const fields = isApiError(error) ? error.fieldErrors : undefined;
          if (fields) setErrors(Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, messages[0] ?? ""])));
          else toast.error(describeError(error).description);
        },
      }
    );
  };

  return (
    <InfoCard className="mt-section" title={t("team.payoutChange.title")} description={t("team.payoutChange.hint", { current: t(TARGET_KEYS[current]) })}>
      <div className="space-y-4" data-testid="payout-change">
        {scheduled ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-subtle px-4 py-3">
            <Text size="sm">{t("team.payoutChange.pending", { to: t(TARGET_KEYS[targetOf(scheduled.to, scheduled.after.compensation?.type)]), date: day(scheduled.effectiveDate) })}</Text>
            <Button size="sm" variant="ghost" disabled={cancel.isPending} onClick={() => cancel.mutate(scheduled.id, { onSuccess: () => toast.success(t("team.payoutChange.cancelledDone")), onError: (error) => toast.error(describeError(error).description) })}>
              <X /> {t("team.payoutChange.cancel")}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("team.payoutChange.to")} error={errors.to}>
              <Select value={to} onValueChange={(value) => setTo(value as PayoutTarget)}>
                <SelectTrigger data-testid="payout-change-to">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((item) => (
                    <SelectItem key={item} value={item}>
                      {t(TARGET_KEYS[item])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("team.payoutChange.from")} description={t("team.payoutChange.fromHint")} error={errors.effectiveDate}>
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} data-testid="payout-change-date" />
            </Field>
            <Field label={t(AMOUNT_KEYS[to])} description={t("team.payoutChange.amountHint")}>
              <NumberField value={amount} onValueChange={setAmount} min={0} precision={to === "commission" ? 0 : 2} prefix={to === "commission" ? undefined : symbol} suffix={to === "commission" ? "%" : undefined} />
            </Field>
            <Field label={t("team.payoutChange.note")}>
              <Input value={note} onChange={(event) => setNote(event.target.value)} maxLength={200} />
            </Field>
            <div className="sm:col-span-2">
              <Button onClick={submit} disabled={create.isPending || !date} data-testid="payout-change-save">
                <ArrowRightLeft /> {t(date <= today() ? "team.payoutChange.applyNow" : "team.payoutChange.schedule")}
              </Button>
            </div>
          </div>
        )}
        {items.filter((item) => item.status !== "scheduled").length > 0 && (
          <ul className="space-y-1 text-sm">
            {items
              .filter((item) => item.status !== "scheduled")
              .map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-text-secondary">
                  <span>{t("team.payoutChange.row", { from: t(TARGET_KEYS[targetOf(item.from)]), to: t(TARGET_KEYS[targetOf(item.to, item.after.compensation?.type)]), date: day(item.effectiveDate), by: item.createdBy })}</span>
                  <StatusBadge status={STATUS_BADGE[item.status]} label={t(STATUS_KEYS[item.status])} />
                </li>
              ))}
          </ul>
        )}
      </div>
    </InfoCard>
  );
}
