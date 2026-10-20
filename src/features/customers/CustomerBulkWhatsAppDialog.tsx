import * as React from "react";
import { Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { describeError } from "@/lib/api";
import { Field } from "@/components/forms";
import { ModalShell } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/typography";
import { branchName } from "./customersUtils";
import { MESSAGE_PURPOSES, useBulkSendCheck, useLogMessage, whatsappLink, type MessagePurpose, type SendBlock } from "./relationship";
import type { Customer } from "./types";
import { PURPOSE_KEYS, templateBody } from "./whatsappTemplates";

export interface CustomerBulkWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: readonly Customer[];
  /** Con qué propósito arranca (el del aviso: cumpleaños, volver…). */
  purpose?: MessagePurpose;
  /** Quién escribe, si es un barbero a sus clientes: va en el texto en vez de «cualquier barbero». */
  barberName?: string | null;
  /** Un hueco libre para ofrecer («el jue 23 a las 10:00»): se suma al mensaje de volver. */
  slotText?: string | null;
}

const BLOCK_KEYS: Readonly<Record<SendBlock, AppMessageKey>> = {
  noPhone: "customers.bulk.block.noPhone",
  noConsent: "customers.bulk.block.noConsent",
  outsideWindow: "customers.bulk.block.outsideWindow",
  promoCap: "customers.bulk.block.promoCap",
  notFound: "customers.bulk.block.notFound",
};

const NAME_TOKEN = "{nombre}";
const DAYS_TOKEN = "{días}";
const DAY_MS = 86_400_000;
const MAX_BODY = 1_000;
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/**
 * Escribirles a varios por WhatsApp (desde un aviso o una selección): un texto con `{nombre}`, la lista con a
 * quién sí y a quién no (sin celular, sin permiso para promociones, fuera del horario legal o con el tope del
 * mes) y un botón por cliente que abre su chat con el mensaje listo y lo anota en su historial. Uno por uno:
 * el navegador no deja abrir muchas pestañas a la vez y así nadie recibe un mensaje sin que alguien lo mande.
 */
export function CustomerBulkWhatsAppDialog({ open, onOpenChange, customers, purpose: initialPurpose = "thanks", barberName = null, slotText = null }: CustomerBulkWhatsAppDialogProps) {
  const t = useAppT();
  const [purpose, setPurpose] = React.useState<MessagePurpose>(initialPurpose);
  const template = (next: MessagePurpose) => {
    const body = templateBody(t, next, { name: NAME_TOKEN, shop: branchName(customers[0]?.branchId ?? ""), barber: barberName, daysSince: DAYS_TOKEN, bookingUrl: `${window.location.origin}/reservar` });
    return next === "rebook" && slotText ? `${body}\n\n${t("customers.bulk.slotLine", { slot: slotText })}` : body;
  };
  /* «Hoy» se fija al abrir: los días de cada cliente no cambian mientras se escribe. */
  const [now] = React.useState(() => Date.now());
  const daysOf = (id: string): string => {
    const lastVisitAt = customers.find((customer) => customer.id === id)?.lastVisitAt;
    return lastVisitAt ? String(Math.max(0, Math.floor((now - new Date(lastVisitAt).getTime()) / DAY_MS))) : "—";
  };
  const [body, setBody] = React.useState(() => template(initialPurpose));
  const [sent, setSent] = React.useState<ReadonlySet<string>>(new Set());
  const ids = React.useMemo(() => customers.map((customer) => customer.id), [customers]);
  const check = useBulkSendCheck(ids, purpose, open);
  const log = useLogMessage();
  const items = check.data?.items ?? [];
  const ready = items.filter((item) => item.blocked === null);

  const pick = (next: MessagePurpose) => {
    setPurpose(next);
    setBody(template(next));
  };
  const textFor = (id: string, name: string) => body.split(NAME_TOKEN).join(firstName(name)).split(DAYS_TOKEN).join(daysOf(id)).trim();
  const send = (item: (typeof items)[number]) => {
    const text = textFor(item.id, item.name);
    // La pestaña se abre ya, en el clic, para que el navegador no la bloquee; el registro va detrás.
    window.open(whatsappLink(item.phone, text), "_blank", "noopener,noreferrer");
    log.mutate(
      { id: item.id, purpose, body: text },
      {
        onSuccess: () => setSent((current) => new Set(current).add(item.id)),
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("customers.bulk.title", { count: customers.length })}
      description={t("customers.bulk.description")}
      size="lg"
      actions={
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {t(sent.size > 0 ? "customers.bulk.done" : "common.cancel")}
        </Button>
      }
    >
      <div className="space-y-4" data-testid="customer-bulk-whatsapp">
        <Field label={t("customers.whatsapp.purpose")}>
          <Select value={purpose} onValueChange={(value) => pick(value as MessagePurpose)}>
            <SelectTrigger data-testid="customer-bulk-purpose">
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
        <Field label={t("customers.whatsapp.message")} description={t("customers.bulk.messageHint", { token: NAME_TOKEN, days: DAYS_TOKEN })}>
          <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={5} maxLength={MAX_BODY} data-testid="customer-bulk-body" />
        </Field>
        {check.isPending ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <>
            <Text variant="muted" data-testid="customer-bulk-summary">
              {t("customers.bulk.summary", { ready: ready.length, sent: sent.size, blocked: items.length - ready.length })}
            </Text>
            <ul className="max-h-80 divide-y divide-border/60 overflow-y-auto rounded-lg border border-border">
              {items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2" data-testid="customer-bulk-row">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-text-primary">{item.name}</span>
                    {item.blocked && <span className="block text-xs text-status-warning">{t(BLOCK_KEYS[item.blocked])}</span>}
                  </span>
                  {sent.has(item.id) ? (
                    <span className="flex items-center gap-1 text-xs text-status-positive">
                      <Check className="size-3.5" aria-hidden /> {t("customers.bulk.sent")}
                    </span>
                  ) : (
                    item.blocked === null && (
                      <Button size="xs" variant="outline" onClick={() => send(item)} disabled={body.trim().length < 2 || log.isPending} data-testid="customer-bulk-send">
                        <ExternalLink /> {t("customers.bulk.open")}
                      </Button>
                    )
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </ModalShell>
  );
}
