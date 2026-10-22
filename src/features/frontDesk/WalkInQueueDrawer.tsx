import * as React from "react";
import { DoorOpen, Footprints, Globe, Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { DrawerSection, SidePanelShell } from "@/components/overlays";
import { EmptyState } from "@/components/feedback";
import { Field, SearchableSelect } from "@/components/forms";
import { Text } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PersonAvatar, ServiceThumb } from "@/features/calendar/calendarShared";
import type { ModelContext } from "@/features/calendar/calendarModel";
import { useQueueActions, useWalkInQueue, type QueueEntry } from "./api";

/**
 * La fila de quien llega sin cita, en recepción: quién espera, en qué orden, cuánto le falta (aprox.) y
 * con quién le tocaría. «Llamar» lo pasa a la agenda como «Llegó» con ese barbero; «Se fue» lo saca y
 * cuenta como cliente que no se atendió. Se puede sumar a alguien desde aquí (además del kiosco).
 * Cada uno dice por dónde llegó: en línea (se unió desde el enlace y puede venir de camino) o en el
 * local (caminando, por el kiosco o en recepción).
 */

export interface WalkInQueueDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  ctx: ModelContext;
  /** Recepción y gerencia la mueven; un barbero solo la mira. */
  canManage: boolean;
}

const NO_PREFERENCE = "__any";
const MINUTE_MS = 60_000;

/** En línea o en el local: lo primero que recepción necesita saber para llamar a alguien. */
function SourceBadge({ source }: { source: QueueEntry["source"] }) {
  const t = useAppT();
  if (source === "online")
    return (
      <Badge variant="info" className="gap-1" data-testid="queue-source-online">
        <Globe className="size-3" aria-hidden />
        {t("frontDesk.queue.source.online")}
      </Badge>
    );
  return (
    <Badge variant="neutral" className="gap-1" data-testid="queue-source-walkin">
      <Footprints className="size-3" aria-hidden />
      {t(source === "kiosk" ? "frontDesk.queue.source.kiosk" : "frontDesk.queue.source.reception")}
    </Badge>
  );
}

function WaitRange({ entry }: { entry: QueueEntry }) {
  const t = useAppT();
  if (entry.waitMin === null || entry.waitMax === null) return <span className="text-status-warning">{t("frontDesk.queue.noTimeToday")}</span>;
  if (entry.waitMax <= 10) return <span>{t("frontDesk.queue.almostNow")}</span>;
  return <span>{t("frontDesk.queue.wait", { min: entry.waitMin, max: entry.waitMax })}</span>;
}

/** `now`: cuándo llegó la fila (se refresca cada 20 s): con él se cuenta cuánto lleva esperando. */
function QueueRow({ entry, now, canManage, onCall, onLeave, busy }: { entry: QueueEntry; now: number; canManage: boolean; onCall: () => void; onLeave: () => void; busy: boolean }) {
  const t = useAppT();
  const waited = Math.max(0, Math.round((now - Date.parse(entry.joinedAt)) / MINUTE_MS));
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-input bg-surface p-3" data-testid="queue-entry">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold tabular-nums text-primary" aria-label={t("frontDesk.queue.position", { position: entry.position })}>
          {entry.position}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Text as="span" weight="medium" className="truncate">
              {entry.firstName}
            </Text>
            <SourceBadge source={entry.source} />
          </div>
          <Text as="p" size="sm" tone="muted" className="truncate">
            {entry.services.join(" + ")} · {entry.barberName ? t("frontDesk.queue.asked", { name: entry.barberName }) : t("frontDesk.queue.anyBarber")}
          </Text>
          <Text as="p" size="sm">
            <WaitRange entry={entry} />
            {entry.suggestedBarberName && !entry.barberName && <span className="text-text-muted"> · {t("frontDesk.queue.with", { name: entry.suggestedBarberName })}</span>}
          </Text>
          <Text as="p" size="xs" tone="muted">
            {t(entry.source === "online" ? "frontDesk.queue.joinedOnline" : "frontDesk.queue.waited", { minutes: waited })}
          </Text>
        </div>
      </div>
      {canManage && (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onLeave} disabled={busy} data-testid="queue-leave">
            <DoorOpen aria-hidden />
            {t("frontDesk.queue.left")}
          </Button>
          <Button type="button" size="sm" onClick={onCall} disabled={busy} data-testid="queue-call">
            <Footprints aria-hidden />
            {t("frontDesk.queue.call")}
          </Button>
        </div>
      )}
    </li>
  );
}

function AddToQueue({ branchId, ctx, onDone }: { branchId: string; ctx: ModelContext; onDone: () => void }) {
  const t = useAppT();
  const { join } = useQueueActions(branchId);
  const [firstName, setFirstName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [serviceId, setServiceId] = React.useState("");
  const [barberId, setBarberId] = React.useState(NO_PREFERENCE);
  const ready = firstName.trim().length >= 2 && serviceId !== "";
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    join.mutate(
      { branchId, firstName: firstName.trim(), phone: phone.trim() || undefined, serviceIds: [serviceId], barberId: barberId === NO_PREFERENCE ? null : barberId },
      {
        onSuccess: () => {
          toast.success(t("frontDesk.queue.added", { name: firstName.trim() }));
          onDone();
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );
  };
  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-dashed border-input p-3" data-testid="queue-add-form">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("frontDesk.queue.firstName")} required>
          <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="off" maxLength={40} data-testid="queue-add-name" />
        </Field>
        <Field label={t("frontDesk.queue.phone")} description={t("frontDesk.queue.phoneHint")}>
          <Input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" inputMode="tel" autoComplete="off" />
        </Field>
      </div>
      <Field label={t("calendar.field.service")} required>
        <SearchableSelect
          value={serviceId}
          onValueChange={setServiceId}
          placeholder={t("calendar.create.pickService")}
          options={ctx.catalog.services.map((item) => ({ value: item.id, label: item.name, description: t("calendar.create.durationPrice", { minutes: item.durationMin, price: ctx.formatMoney(item.price) }), leading: <ServiceThumb service={item} /> }))}
        />
      </Field>
      <Field label={t("calendar.field.barber")}>
        <Select value={barberId} onValueChange={setBarberId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_PREFERENCE}>{t("frontDesk.queue.anyBarber")}</SelectItem>
            {ctx.catalog.barbers.map((barber) => (
              <SelectItem key={barber.id} value={barber.id}>
                <span className="flex items-center gap-2">
                  <PersonAvatar name={barber.name} avatarUrl={barber.avatarUrl} size="sm" />
                  {barber.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={!ready || join.isPending} data-testid="queue-add-submit">
          {t("frontDesk.queue.addSubmit")}
        </Button>
      </div>
    </form>
  );
}

export function WalkInQueueDrawer({ open, onOpenChange, branchId, ctx, canManage }: WalkInQueueDrawerProps) {
  const t = useAppT();
  const queue = useWalkInQueue(branchId, open);
  const { call, leave } = useQueueActions(branchId);
  const [adding, setAdding] = React.useState(false);
  const waiting = queue.data?.waiting ?? [];
  const online = waiting.filter((entry) => entry.source === "online").length;
  const busy = call.isPending || leave.isPending;
  const onError = (error: unknown) => toast.error(describeError(error).title, { description: describeError(error).description });

  return (
    <SidePanelShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("frontDesk.queue.title")}
      description={queue.data ? t("frontDesk.queue.summary", { waiting: waiting.length, served: queue.data.served, left: queue.data.left }) : t("frontDesk.queue.hint")}
    >
      <DrawerSection
        icon={UsersRound}
        tone="brand"
        title={t("frontDesk.queue.title")}
        hint={waiting.length > 0 ? t("frontDesk.queue.split", { here: waiting.length - online, online }) : t("frontDesk.queue.hint")}
        action={
          canManage && !adding ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)} data-testid="queue-add">
              <Plus aria-hidden />
              {t("frontDesk.queue.add")}
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-3" data-testid="walk-in-queue">
          {adding && <AddToQueue branchId={branchId} ctx={ctx} onDone={() => setAdding(false)} />}
          {waiting.length === 0 && !adding ? (
            <EmptyState icon="queue" title={t("frontDesk.queue.emptyTitle")} description={t("frontDesk.queue.emptyHint")} />
          ) : (
            <ol className="space-y-2">
              {waiting.map((entry) => (
                <QueueRow
                  key={entry.id}
                  entry={entry}
                  now={queue.dataUpdatedAt}
                  canManage={canManage}
                  busy={busy}
                  onCall={() =>
                    call.mutate(
                      { id: entry.id, barberId: null },
                      { onSuccess: () => toast.success(t("frontDesk.queue.called", { name: entry.firstName })), onError }
                    )
                  }
                  onLeave={() => leave.mutate({ id: entry.id, reason: "left" }, { onError })}
                />
              ))}
            </ol>
          )}
          <Text as="p" size="xs" tone="muted">
            {t("frontDesk.queue.estimateNote")}
          </Text>
        </div>
      </DrawerSection>
    </SidePanelShell>
  );
}
