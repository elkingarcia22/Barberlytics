import * as React from "react";
import { useNavigate } from "react-router";
import { Download, FilePlus2, HeartOff, HeartPulse, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { Field } from "@/components/forms";
import { ConfirmDialog, ModalShell } from "@/components/overlays";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/typography";
import { InfoCard } from "@/features/team/teamShared";
import { useHealthConsentTexts } from "@/features/legal/useConsentPack";
import { useCustomerPermissions } from "./customerAccess";
import { PRIVACY_CHANNEL_KEYS, PRIVACY_CHANNELS, PRIVACY_REQUEST_TYPES, PRIVACY_TYPE_KEYS, useClosePrivacyRequest, useEraseCustomer, useExportCustomerData, useLogPrivacyRequest, usePrivacyRequests, type PrivacyChannel, type PrivacyRequest, type PrivacyRequestType } from "./privacy";
import { useCustomerRelationship, useSetHealthConsent, type HealthConsent } from "./relationship";
import type { CustomerDetail } from "./types";

const DAY: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
const MAX_NOTE = 500;

const toastError = (error: unknown) => toast.error(describeError(error).title, { description: describeError(error).description });

/**
 * Los datos del cliente y sus derechos, en su ficha: el permiso aparte para anotar alergias y
 * medicamentos (dato sensible), la copia de todo lo que hay de él, el borrado y el registro de cada
 * solicitud con su plazo. El barbero no la ve; recepción anota permisos y solicitudes; exportar,
 * borrar y cerrar solicitudes es del dueño o un administrador.
 */
export function CustomerPrivacy({ customer }: { customer: CustomerDetail }) {
  const t = useAppT();
  const perms = useCustomerPermissions();
  const relationship = useCustomerRelationship(customer.id);
  const [dialog, setDialog] = React.useState<"log" | "erase" | null>(null);
  const exportData = useExportCustomerData();
  if (!perms.canHealthConsent) return null;

  const runExport = () =>
    exportData.mutate(
      { clientId: customer.id, channel: "app" },
      { onSuccess: () => toast.success(t("customers.privacy.exported"), { description: t("customers.privacy.exportedHint") }), onError: toastError }
    );

  return (
    <InfoCard title={t("customers.privacy.title")} description={t("customers.privacy.hint")}>
      <div className="space-y-4" data-testid="customer-privacy">
        <HealthConsentRow customerId={customer.id} consent={relationship.data?.consent.health ?? null} hasMedical={customer.notes.some((note) => note.kind !== "note")} />
        {perms.canLogPrivacy && (
          <div className="flex flex-wrap gap-2">
            {perms.canManagePrivacy && (
              <Button size="xs" variant="outline" onClick={runExport} disabled={exportData.isPending} data-testid="customer-privacy-export">
                <Download /> {t("customers.privacy.export")}
              </Button>
            )}
            <Button size="xs" variant="outline" onClick={() => setDialog("log")} data-testid="customer-privacy-log">
              <FilePlus2 /> {t("customers.privacy.log")}
            </Button>
            {perms.canManagePrivacy && (
              <Button size="xs" variant="ghost" className="text-status-negative hover:text-status-negative" onClick={() => setDialog("erase")} data-testid="customer-privacy-erase">
                <Trash2 /> {t("customers.privacy.erase")}
              </Button>
            )}
          </div>
        )}
        {perms.canLogPrivacy && <RequestList clientId={customer.id} canClose={perms.canManagePrivacy} />}
      </div>
      {dialog === "log" && <LogRequestDialog customer={customer} onClose={() => setDialog(null)} />}
      {dialog === "erase" && <EraseDialog customer={customer} onClose={() => setDialog(null)} />}
    </InfoCard>
  );
}

function HealthConsentRow({ customerId, consent, hasMedical }: { customerId: string; consent: HealthConsent | null; hasMedical: boolean }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const texts = useHealthConsentTexts();
  const setHealth = useSetHealthConsent();
  const [asking, setAsking] = React.useState<"grant" | "revoke" | null>(null);
  const accepted = consent?.accepted === true;
  const save = (health: boolean) =>
    setHealth.mutate(
      { id: customerId, health },
      {
        onSuccess: () => {
          setAsking(null);
          toast.success(t(health ? "customers.privacy.healthGranted" : "customers.privacy.healthRevoked"));
        },
        onError: toastError,
      }
    );
  const status = consent?.accepted
    ? t("customers.privacy.healthYes", { date: formatDate(new Date(consent.at), DAY), version: consent.version }) + (consent.by ? ` · ${consent.by}` : "")
    : t("customers.privacy.healthNo");

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-subtle px-3 py-2" data-testid="customer-health-consent">
      {accepted ? <HeartPulse className="size-4 text-status-positive" aria-hidden /> : <HeartOff className="size-4 text-text-muted" aria-hidden />}
      <div className="min-w-0 flex-1">
        <Text weight="semibold">{t("customers.privacy.health")}</Text>
        <Text variant="muted">{status}</Text>
      </div>
      <Button size="xs" variant="outline" onClick={() => setAsking(accepted ? "revoke" : "grant")} data-testid={accepted ? "customer-health-revoke" : "customer-health-grant"}>
        {t(accepted ? "customers.privacy.healthRevoke" : "customers.privacy.healthGrant")}
      </Button>
      <ConfirmDialog
        open={asking === "grant"}
        onOpenChange={(open) => !open && setAsking(null)}
        title={t("customers.privacy.healthGrantTitle")}
        description={texts.staffScript}
        confirmLabel={t("customers.privacy.healthGrantConfirm")}
        loading={setHealth.isPending}
        onConfirm={() => save(true)}
      />
      <ConfirmDialog
        open={asking === "revoke"}
        onOpenChange={(open) => !open && setAsking(null)}
        title={t("customers.privacy.healthRevokeTitle")}
        description={t(hasMedical ? "customers.privacy.healthRevokeHint" : "customers.privacy.healthRevokeHintEmpty")}
        confirmLabel={t("customers.privacy.healthRevoke")}
        variant="warning"
        loading={setHealth.isPending}
        onConfirm={() => save(false)}
      />
    </div>
  );
}

function RequestList({ clientId, canClose }: { clientId: string; canClose: boolean }) {
  const t = useAppT();
  const { data } = usePrivacyRequests({ clientId });
  const items = data?.items ?? [];
  return (
    <section aria-label={t("customers.privacy.requests")} className="space-y-2">
      <Text variant="label">{t("customers.privacy.requests")}</Text>
      {items.length === 0 ? (
        <Text variant="muted">{t("customers.privacy.requestsEmpty")}</Text>
      ) : (
        <ul className="space-y-2" data-testid="customer-privacy-requests">
          {items.map((request) => (
            <RequestItem key={request.id} request={request} canClose={canClose} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** Una solicitud: qué pidió, por dónde, quién la anotó y hasta cuándo hay para responder. */
export function RequestItem({ request, canClose, showClient = false }: { request: PrivacyRequest; canClose: boolean; showClient?: boolean }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const close = useClosePrivacyRequest();
  const open = request.status === "open";
  const when = open ? t("customers.privacy.due", { date: formatDate(new Date(request.dueAt), DAY) }) : t("customers.privacy.doneAt", { date: formatDate(new Date(request.doneAt ?? request.requestedAt), DAY) });
  return (
    <li className="flex flex-wrap items-start gap-x-3 gap-y-1 border-b border-border/60 pb-2 text-sm last:border-b-0" data-testid="privacy-request">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-text-primary">
          {showClient && `${request.clientName} · `}
          {t(PRIVACY_TYPE_KEYS[request.type])}
        </p>
        <p className="text-xs text-text-muted">
          {t(PRIVACY_CHANNEL_KEYS[request.channel])} · {formatDate(new Date(request.requestedAt), DAY)} · {request.by}
        </p>
        {request.note && <p className="text-xs text-text-secondary">{request.note}</p>}
      </div>
      <div className="flex items-center gap-2">
        {request.overdue ? <Badge variant="destructive">{t("customers.privacy.overdue")}</Badge> : <Badge variant={open ? "outline" : "secondary"}>{when}</Badge>}
        {open && canClose && (
          <Button size="xs" variant="ghost" onClick={() => close.mutate({ id: request.id, note: "" }, { onSuccess: () => toast.success(t("customers.privacy.closed")), onError: toastError })} disabled={close.isPending} data-testid="privacy-request-close">
            <ShieldCheck /> {t("customers.privacy.close")}
          </Button>
        )}
      </div>
    </li>
  );
}

function ChannelSelect({ value, onChange }: { value: PrivacyChannel; onChange: (value: PrivacyChannel) => void }) {
  const t = useAppT();
  return (
    <Select value={value} onValueChange={(next) => onChange(next as PrivacyChannel)}>
      <SelectTrigger data-testid="privacy-channel">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PRIVACY_CHANNELS.map((item) => (
          <SelectItem key={item} value={item}>
            {t(PRIVACY_CHANNEL_KEYS[item])}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function LogRequestDialog({ customer, onClose }: { customer: CustomerDetail; onClose: () => void }) {
  const t = useAppT();
  const log = useLogPrivacyRequest();
  const [type, setType] = React.useState<PrivacyRequestType>("access");
  const [channel, setChannel] = React.useState<PrivacyChannel>("phone");
  const [note, setNote] = React.useState("");
  const submit = () =>
    log.mutate(
      { clientId: customer.id, type, channel, note: note.trim() },
      {
        onSuccess: (created) => {
          toast.success(t("customers.privacy.logged"), { description: t(PRIVACY_TYPE_KEYS[created.type]) });
          onClose();
        },
        onError: toastError,
      }
    );
  return (
    <ModalShell
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("customers.privacy.logTitle", { name: customer.name })}
      description={t("customers.privacy.logHint")}
      size="md"
      actions={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={log.isPending} data-testid="privacy-log-submit">
            {t("customers.privacy.logSubmit")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t("customers.privacy.typeLabel")}>
          <Select value={type} onValueChange={(next) => setType(next as PrivacyRequestType)}>
            <SelectTrigger data-testid="privacy-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIVACY_REQUEST_TYPES.map((item) => (
                <SelectItem key={item} value={item}>
                  {t(PRIVACY_TYPE_KEYS[item])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("customers.privacy.channelLabel")}>
          <ChannelSelect value={channel} onChange={setChannel} />
        </Field>
        <Field label={t("customers.privacy.note")}>
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={MAX_NOTE} />
        </Field>
      </div>
    </ModalShell>
  );
}

function EraseDialog({ customer, onClose }: { customer: CustomerDetail; onClose: () => void }) {
  const t = useAppT();
  const navigate = useNavigate();
  const erase = useEraseCustomer();
  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("customers.privacy.eraseTitle", { name: customer.name })}
      description={t("customers.privacy.eraseHint")}
      confirmLabel={t("customers.privacy.eraseConfirm")}
      confirmationText={customer.name}
      variant="destructive"
      loading={erase.isPending}
      onConfirm={() =>
        erase.mutate(
          { clientId: customer.id, channel: "app", note: "" },
          {
            onSuccess: () => {
              toast.success(t("customers.privacy.erased"));
              onClose();
              navigate("/clientes");
            },
            onError: toastError,
          }
        )
      }
    />
  );
}
