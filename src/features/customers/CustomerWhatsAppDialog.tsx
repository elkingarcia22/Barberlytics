import * as React from "react";
import { Clock, ExternalLink, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { Field } from "@/components/forms";
import { ModalShell } from "@/components/overlays";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { branchName } from "./customersUtils";
import { MESSAGE_PURPOSES, isPromotional, useCustomerRelationship, useLogMessage, whatsappLink, type MessagePurpose } from "./relationship";
import type { CustomerDetail } from "./types";
import { PURPOSE_KEYS, templateBody } from "./whatsappTemplates";

export interface CustomerWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerDetail;
}

const DAY_MS = 86_400_000;
const MAX_BODY = 1_000;
const WHEN: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };

/**
 * Escribirle a un cliente por WhatsApp sin copiar ni pegar: se elige para qué, se ajusta el texto y se
 * abre WhatsApp con el mensaje ya escrito. Queda anotado en su historial. Volver y cumpleaños son
 * promoción: si el cliente no lo aceptó, no se puede (y se dice por qué).
 */
export function CustomerWhatsAppDialog({ open, onOpenChange, customer }: CustomerWhatsAppDialogProps) {
  const t = useAppT();
  const relationship = useCustomerRelationship(open ? customer.id : "");
  const log = useLogMessage();
  /* «Hoy» se fija al abrir: el texto no cambia mientras se escribe. */
  const [now] = React.useState(() => Date.now());
  const context = React.useMemo(
    () => ({
      name: customer.name,
      shop: branchName(customer.branchId),
      barber: customer.preferredBarber,
      daysSince: customer.lastVisitAt ? Math.max(0, Math.floor((now - new Date(customer.lastVisitAt).getTime()) / DAY_MS)) : null,
      bookingUrl: `${window.location.origin}/reservar`,
    }),
    [customer, now]
  );
  const [purpose, setPurpose] = React.useState<MessagePurpose>("thanks");
  const [body, setBody] = React.useState(() => templateBody(t, "thanks", context));

  const { formatDate } = useLocale();
  const consented = relationship.data?.consent.marketing?.accepted === true;
  // Volver y cumpleaños son promoción: con permiso y dentro de la franja legal de su sede (Ley 2300, TCPA).
  const promoWindow = relationship.data?.promoWindow;
  const outsideWindow = isPromotional(purpose) && consented && promoWindow !== undefined && !promoWindow.allowed;
  const blocked = isPromotional(purpose) && (!consented || outsideWindow);
  const pick = (next: MessagePurpose) => {
    setPurpose(next);
    setBody(templateBody(t, next, context));
  };

  const send = () => {
    /* La pestaña se abre ya, en el clic, para que el navegador no la bloquee; el registro va detrás. */
    window.open(whatsappLink(customer.phone, body.trim()), "_blank", "noopener,noreferrer");
    log.mutate(
      { id: customer.id, purpose, body: body.trim() },
      {
        onSuccess: () => {
          toast.success(t("customers.whatsapp.logged"), { description: customer.name });
          onOpenChange(false);
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("customers.whatsapp.title", { name: customer.name })}
      description={t("customers.whatsapp.description")}
      size="md"
      actions={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={send} disabled={blocked || body.trim().length < 2 || log.isPending} data-testid="customer-whatsapp-send">
            <ExternalLink /> {t("customers.whatsapp.open")}
          </Button>
        </>
      }
    >
      <div className="space-y-4" data-testid="customer-whatsapp">
        <Field label={t("customers.whatsapp.purpose")}>
          <Select value={purpose} onValueChange={(value) => pick(value as MessagePurpose)}>
            <SelectTrigger data-testid="customer-whatsapp-purpose">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESSAGE_PURPOSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {t(PURPOSE_KEYS[item])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {blocked && !outsideWindow && (
          <Alert data-testid="customer-whatsapp-no-consent">
            <ShieldAlert />
            <AlertDescription>{t("customers.whatsapp.noConsent")}</AlertDescription>
          </Alert>
        )}
        {outsideWindow && promoWindow && (
          <Alert data-testid="customer-whatsapp-outside-window">
            <Clock />
            <AlertDescription>{t("customers.whatsapp.outsideWindow", { when: formatDate(new Date(promoWindow.nextAt), { ...WHEN, timeZone: promoWindow.timeZone }) })}</AlertDescription>
          </Alert>
        )}
        <Field label={t("customers.whatsapp.message")} description={t("customers.whatsapp.messageHint")}>
          <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={6} maxLength={MAX_BODY} data-testid="customer-whatsapp-body" />
        </Field>
      </div>
    </ModalShell>
  );
}
