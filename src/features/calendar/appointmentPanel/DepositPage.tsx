import * as React from "react";
import { toast } from "sonner";
import { HandCoins } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { describeError, isApiError } from "@/lib/api";
import { Field, NumberField, PhoneInput } from "@/components/forms";
import { Spinner } from "@/components/feedback/Spinner";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrencyInput } from "@/features/branches";
import { ChannelCard } from "@/features/booking/flow/SendReceiptDialog";
import type { ModelContext } from "../calendarModel";
import { useDepositActions, type DepositChannel } from "../deposit";
import type { AppointmentModel } from "./useAppointmentModel";
import { PanelFooter } from "@/components/overlays";

/** Lo que se propone de entrada: el anticipo habitual de la reserva en línea. */
const SUGGESTED_PERCENTS = [30, 50, 100] as const;

/** Lo que falta por pagar: el precio menos lo ya pagado en línea. */
const dueOf = (model: AppointmentModel): number => Math.max(0, model.price - (model.appointment.online?.paid ?? 0));

/**
 * Pedir un anticipo, como una página del panel: cuánto (con atajos de 30 %, 50 % o todo) y por dónde va el
 * enlace (SMS, correo o los dos). El servidor arma el mensaje con el enlace de pago de la pasarela de la sede.
 * Con uno pendiente se ve aquí, se puede volver a mandar o retirar.
 */
export function DepositPage({ model, ctx, onDone }: { model: AppointmentModel; ctx: ModelContext; onDone: () => void }) {
  const t = useAppT();
  const { symbol, decimals } = useCurrencyInput();
  const { request, cancel } = useDepositActions(model.appointment.id);
  const due = dueOf(model);
  const round = (value: number) => Math.round(value * 10 ** decimals) / 10 ** decimals;
  const pending = model.appointment.depositRequest?.status === "requested" ? model.appointment.depositRequest : null;
  const [amount, setAmount] = React.useState<number | null>(pending?.amount ?? round(due * (SUGGESTED_PERCENTS[0] / 100)));
  const [channels, setChannels] = React.useState<readonly DepositChannel[]>(model.phone ? ["sms"] : ["email"]);
  const [email, setEmail] = React.useState(model.email);
  const [phone, setPhone] = React.useState(model.phone);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const toggle = (channel: DepositChannel) => (checked: boolean) => setChannels((current) => (checked ? [...current, channel] : current.filter((entry) => entry !== channel)));

  const submit = () => {
    if (!amount || amount <= 0) return setErrors({ amount: t("calendar.deposit.amountError") });
    if (channels.length === 0) return toast.error(t("calendar.panel.send.pickChannel"));
    setErrors({});
    request.mutate(
      { amount, channels: channels.map((channel) => ({ channel, to: channel === "email" ? email.trim() : phone })) },
      {
        onSuccess: () => {
          toast.success(t("calendar.deposit.sent", { amount: ctx.formatMoney(amount) }));
          onDone();
        },
        onError: (error) => {
          const fields = isApiError(error) ? error.fieldErrors : undefined;
          if (fields) setErrors(Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, messages[0] ?? ""])));
          else toast.error(describeError(error).title, { description: describeError(error).description });
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-4" data-testid="panel-deposit">
      <Text size="sm" tone="secondary">
        {t("calendar.deposit.lead", { due: ctx.formatMoney(due) })}
      </Text>
      {pending && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warning/40 bg-warning/5 px-3 py-2" data-testid="panel-deposit-pending">
          <Text size="sm">{t("calendar.deposit.pending", { amount: ctx.formatMoney(pending.amount) })}</Text>
          <Button type="button" variant="ghost" size="xs" disabled={cancel.isPending} onClick={() => cancel.mutate(undefined, { onSuccess: () => toast.success(t("calendar.deposit.cancelled")), onError: (error) => toast.error(describeError(error).description) })}>
            {t("calendar.deposit.cancel")}
          </Button>
        </div>
      )}
      <Field label={t("calendar.deposit.amount")} error={errors.amount}>
        <NumberField value={amount} onValueChange={setAmount} min={0} max={due} precision={decimals} prefix={symbol} aria-invalid={!!errors.amount} data-testid="panel-deposit-amount" />
      </Field>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("calendar.deposit.shortcuts")}>
        {SUGGESTED_PERCENTS.map((percent) => (
          <Button key={percent} type="button" variant="outline" size="xs" onClick={() => setAmount(round(due * (percent / 100)))}>
            {percent === 100 ? t("calendar.deposit.all") : `${percent} %`}
          </Button>
        ))}
      </div>
      <div role="group" aria-label={t("calendar.panel.send.to")} className="flex flex-col gap-3">
        <ChannelCard id="deposit-sms" icon="smsCode" label={t("calendar.panel.send.sms")} checked={channels.includes("sms")} onCheckedChange={toggle("sms")}>
          <Field label={t("calendar.panel.send.to")} error={errors.sms}>
            <PhoneInput value={phone} onValueChange={setPhone} />
          </Field>
        </ChannelCard>
        <ChannelCard id="deposit-email" icon="mail" label={t("calendar.panel.send.email")} checked={channels.includes("email")} onCheckedChange={toggle("email")}>
          <Field label={t("calendar.panel.send.to")} error={errors.email}>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="off" />
          </Field>
        </ChannelCard>
      </div>
      {errors.channels && (
        <Text size="sm" tone="negative">
          {errors.channels}
        </Text>
      )}
      <PanelFooter>
        <Button type="button" size="lg" className="w-full" onClick={submit} disabled={request.isPending} data-testid="panel-deposit-submit">
          {request.isPending ? <Spinner size="sm" tone="inverse" /> : <HandCoins />}
          {pending ? t("calendar.deposit.resend") : t("calendar.deposit.send")}
        </Button>
      </PanelFooter>
    </div>
  );
}

/** En la tarjeta de la cita: el anticipo pedido (esperando pago) o pagado. Sin pedido, nada. */
export function DepositStatus({ model, ctx, onOpen }: { model: AppointmentModel; ctx: ModelContext; onOpen: () => void }) {
  const t = useAppT();
  const request = model.appointment.depositRequest;
  if (!request || request.status === "cancelled") return null;
  const paid = request.status === "paid";
  return (
    <button type="button" onClick={paid ? undefined : onOpen} disabled={paid} className="flex items-center gap-2 rounded-xl border border-border/60 bg-surface/60 px-3 py-2 text-left text-sm transition-colors enabled:hover:bg-surface disabled:cursor-default" data-testid="panel-deposit-status">
      <HandCoins className={paid ? "size-4 text-status-positive" : "size-4 text-status-warning"} aria-hidden />
      <span className="flex-1">{t(paid ? "calendar.deposit.paid" : "calendar.deposit.pending", { amount: ctx.formatMoney(request.amount) })}</span>
    </button>
  );
}
