import * as React from "react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { Field, PhoneInput } from "@/components/forms";
import { SegmentedControl } from "@/components/selection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/feedback/Spinner";
import { describeError } from "@/lib/api";
import { useResetOnChange } from "@/lib/useResetOnChange";
import { useSendReceiptMutation } from "../queries";
import type { Reservation } from "../types";
import { BookingSheet } from "./BookingSheet";

interface SendReceiptDialogProps {
  reservation: Reservation | null;
  onOpenChange: (open: boolean) => void;
}

/** Reenviar el recibo a un correo o a un celular; trae los del cliente ya puestos. */
export function SendReceiptDialog({ reservation, onOpenChange }: SendReceiptDialogProps) {
  const t = useAppT();
  const send = useSendReceiptMutation();
  const [channel, setChannel] = React.useState<"email" | "sms">("email");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");

  // Al abrir con otro recibo, los datos de ese cliente.
  useResetOnChange(reservation?.id ?? "", () => {
    setEmail(reservation?.email ?? "");
    setPhone(reservation?.phone.replace(/[^\d+]/g, "") ?? "");
  });

  const submit = () => {
    if (!reservation) return;
    const to = channel === "email" ? email.trim() : phone;
    send.mutate(
      { reservationId: reservation.id, channel, to },
      {
        onSuccess: (result) => {
          toast.success(t("booking.receipt.sent", { to: result.to }));
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <BookingSheet
      open={reservation !== null}
      onOpenChange={onOpenChange}
      title={t("booking.receipt.sendTitle")}
      description={t("booking.receipt.sendLead")}
      actions={
        <Button type="button" onClick={submit} disabled={send.isPending}>
          {send.isPending && <Spinner size="sm" tone="inverse" />}
          {t("booking.receipt.send")}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <SegmentedControl
          options={[
            { value: "email", label: t("booking.receipt.email") },
            { value: "sms", label: t("booking.receipt.sms") },
          ]}
          value={channel}
          onChange={(value) => setChannel(value as "email" | "sms")}
          fullWidth
          ariaLabel={t("booking.receipt.to")}
        />
        <Field label={t("booking.receipt.to")} error={send.isError ? describeError(send.error).description : undefined}>
          {channel === "email" ? <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /> : <PhoneInput value={phone} onValueChange={setPhone} />}
        </Field>
      </div>
    </BookingSheet>
  );
}
