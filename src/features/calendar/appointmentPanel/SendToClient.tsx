import * as React from "react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError, isApiError } from "@/lib/api";
import { Field, PhoneInput } from "@/components/forms";
import { Spinner } from "@/components/feedback/Spinner";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemaIcon } from "@/icons";
import { ChannelCard } from "@/features/booking/flow/SendReceiptDialog";
import { useSendToClient, type SendChannel, type SendToClientInput } from "../messages";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * Mandarle al cliente su recibo o el enlace para reagendar, como el recibo de
 * la reserva en línea: Correo y SMS son tarjetas que se marcan (una, la otra o
 * las dos), cada una con su destino ya puesto y editable, y un solo «Enviar»
 * debajo —el botón principal de la página donde vaya—. Va dentro del panel, en
 * su propia página; lo enviado queda en los mensajes de la cita.
 */

export interface SendToClientProps {
  model: AppointmentModel;
  kind: SendToClientInput["kind"];
  /** El texto que se manda (el recibo con sus líneas, o el saludo con el enlace). */
  body: string;
  /** Una línea encima de los canales. */
  lead?: string;
  onSent: () => void;
}

export function SendToClient({ model, kind, body, lead, onSent }: SendToClientProps) {
  const t = useAppT();
  const send = useSendToClient(model.appointment.id);
  const [channels, setChannels] = React.useState<readonly SendChannel[]>(model.email ? ["email"] : ["sms"]);
  const [email, setEmail] = React.useState(model.email);
  const [phone, setPhone] = React.useState(model.phone);
  const [errors, setErrors] = React.useState<Partial<Record<SendChannel, string>>>({});
  const toggle = (channel: SendChannel) => (checked: boolean) => setChannels((current) => (checked ? [...current, channel] : current.filter((entry) => entry !== channel)));

  const submit = async () => {
    if (channels.length === 0) {
      toast.error(t("calendar.panel.send.pickChannel"));
      return;
    }
    const sent: string[] = [];
    const failed: Partial<Record<SendChannel, string>> = {};
    for (const channel of channels) {
      try {
        const result = await send.mutateAsync({ kind, channel, to: channel === "email" ? email.trim() : phone, body });
        sent.push(result.to);
      } catch (error) {
        failed[channel] = isApiError(error) ? (error.fieldErrors?.to?.[0] ?? describeError(error).description) : describeError(error).description;
      }
    }
    setErrors(failed);
    if (sent.length > 0) toast.success(t(kind === "receipt" ? "calendar.panel.send.receiptSent" : "calendar.panel.send.linkSent", { to: sent.join(t("calendar.panel.send.and")) }));
    if (Object.keys(failed).length === 0) onSent();
  };

  return (
    <div className="flex flex-col gap-4" data-testid={`panel-send-${kind}`}>
      {lead && (
        <Text size="sm" tone="secondary">
          {lead}
        </Text>
      )}
      <div role="group" aria-label={t("calendar.panel.send.to")} className="flex flex-col gap-3">
        <ChannelCard id={`send-${kind}-email`} icon="mail" label={t("calendar.panel.send.email")} checked={channels.includes("email")} onCheckedChange={toggle("email")}>
          <Field label={t("calendar.panel.send.to")} error={errors.email}>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="off" data-testid="panel-send-email" />
          </Field>
        </ChannelCard>
        <ChannelCard id={`send-${kind}-sms`} icon="smsCode" label={t("calendar.panel.send.sms")} checked={channels.includes("sms")} onCheckedChange={toggle("sms")}>
          <Field label={t("calendar.panel.send.to")} error={errors.sms}>
            <PhoneInput value={phone} onValueChange={setPhone} />
          </Field>
        </ChannelCard>
      </div>
      <Button type="button" size="lg" className="w-full" onClick={() => void submit()} disabled={send.isPending} data-testid="panel-send-submit">
        {send.isPending ? <Spinner size="sm" tone="inverse" /> : <ThemaIcon name="mail" />}
        {channels.length > 1 ? t("calendar.panel.send.sendBoth") : t("calendar.panel.send.send")}
      </Button>
    </div>
  );
}
