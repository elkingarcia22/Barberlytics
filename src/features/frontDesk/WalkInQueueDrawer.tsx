import * as React from "react";
import { DoorOpen, Footprints, Globe, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { PanelFooter, SidePanelShell } from "@/components/overlays";
import { EmptyState } from "@/components/feedback";
import { Field, SearchableSelect } from "@/components/forms";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PersonAvatar, ServiceThumb } from "@/features/calendar/calendarShared";
import type { ModelContext } from "@/features/calendar/calendarModel";
import { InlineList, PanelField, PanelQuestion } from "@/features/calendar/appointmentPanel/bookingStyle";
import { FieldIcon, SaleCard, SaleCardHead } from "@/features/calendar/saleParts";
import { useQueueActions, useWalkInQueue, type QueueEntry } from "./api";

/**
 * La fila de quien llega sin cita, en recepción, con la cara de «Crear cita»: la tarjeta teñida con
 * cuántos esperan (en el local y en línea) y, debajo, quién sigue y los demás en orden, cada uno una
 * tarjeta que se abre en su sitio con lo que pidió, cuánto le falta (aprox.) y sus dos acciones.
 * «Llamar» lo pasa a la agenda como «Llegó» con ese barbero; «Se fue» lo saca y cuenta como cliente
 * que no se atendió. Se puede sumar a alguien desde aquí (además del kiosco). Abajo, un solo botón:
 * llamar a quien sigue.
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

/** La espera y con quién: por separado para el detalle, juntas en la tarjeta cerrada. */
function useWaitParts() {
  const t = useAppT();
  return (entry: QueueEntry) => {
    const wait = entry.waitMin === null || entry.waitMax === null ? t("frontDesk.queue.noTimeToday") : entry.waitMax <= 10 ? t("frontDesk.queue.almostNow") : t("frontDesk.queue.wait", { min: entry.waitMin, max: entry.waitMax });
    const who = entry.barberName ? t("frontDesk.queue.asked", { name: entry.barberName }) : entry.suggestedBarberName ? t("frontDesk.queue.with", { name: entry.suggestedBarberName }) : null;
    const barber = entry.barberName ? t("frontDesk.queue.askedFor", { name: entry.barberName }) : entry.suggestedBarberName ? t("frontDesk.queue.anyWith", { name: entry.suggestedBarberName }) : t("frontDesk.queue.anyBarber");
    return { wait, barber, line: [wait, who].filter(Boolean).join(" · ") };
  };
}

/** El turno, teñido por cómo llegó: azul si se unió en línea (puede venir de camino), del tema si ya está en el local. */
function Position({ entry }: { entry: QueueEntry }) {
  const t = useAppT();
  return (
    <span
      className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums", entry.source === "online" ? "bg-status-info/15 text-status-info" : "bg-primary/15 text-primary")}
      aria-label={t("frontDesk.queue.position", { position: entry.position })}
    >
      {entry.position}
    </span>
  );
}

const sourceKey = (entry: QueueEntry) => (entry.source === "online" ? "frontDesk.queue.source.online" : entry.source === "kiosk" ? "frontDesk.queue.source.kiosk" : "frontDesk.queue.source.reception");

/** Una persona de la fila: cerrada dice cómo llegó, quién es y su espera; abierta, el detalle y sus acciones. */
function QueueRow({ entry, now, open, onToggle, canManage, onCall, onLeave, busy }: { entry: QueueEntry; now: number; open: boolean; onToggle: () => void; canManage: boolean; onCall: () => void; onLeave: () => void; busy: boolean }) {
  const t = useAppT();
  const waitParts = useWaitParts();
  const parts = waitParts(entry);
  const waited = Math.max(0, Math.round((now - Date.parse(entry.joinedAt)) / MINUTE_MS));
  const SourceIcon = entry.source === "online" ? Globe : Footprints;
  return (
    <div className="flex flex-col gap-2" data-testid="queue-entry" data-source={entry.source}>
      <PanelField eyebrow={t(sourceKey(entry))} value={entry.firstName} detail={parts.line} leading={<Position entry={entry} />} open={open} onOpen={onToggle} testId={`queue-entry-${entry.id}`} />
      {open && (
        <InlineList
          title={t("frontDesk.queue.detailTitle", { position: entry.position, name: entry.firstName })}
          onClose={onToggle}
          footer={
            canManage ? (
              <>
                <Button type="button" variant="outline" className="flex-1" onClick={onLeave} disabled={busy} data-testid="queue-leave">
                  <DoorOpen aria-hidden />
                  {t("frontDesk.queue.left")}
                </Button>
                <Button type="button" className="flex-1" onClick={onCall} disabled={busy} data-testid="queue-call">
                  <Footprints aria-hidden />
                  {t("frontDesk.queue.call")}
                </Button>
              </>
            ) : undefined
          }
        >
          <div className="flex flex-col gap-1 px-1">
            <Fact label={t("frontDesk.queue.services")} value={entry.services.join(" + ")} />
            <Fact label={t("frontDesk.queue.barber")} value={parts.barber} />
            <Fact label={t("frontDesk.queue.waitLabel")} value={parts.wait} />
            <span className="flex items-center gap-2 py-1.5">
              <SourceIcon className={cn("size-4 shrink-0", entry.source === "online" ? "text-status-info" : "text-text-muted")} aria-hidden />
              <Text size="sm" tone="secondary">
                {t(entry.source === "online" ? "frontDesk.queue.joinedOnline" : "frontDesk.queue.waited", { minutes: waited })}
              </Text>
            </span>
          </div>
        </InlineList>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <Text size="sm" tone="secondary" className="shrink-0">
        {label}
      </Text>
      <Text size="sm" weight="medium" className="text-right">
        {value}
      </Text>
    </div>
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
    <form onSubmit={submit} className="space-y-3 px-1" data-testid="queue-add-form">
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
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const waiting = queue.data?.waiting ?? [];
  const online = waiting.filter((entry) => entry.source === "online").length;
  const busy = call.isPending || leave.isPending;
  const onError = (error: unknown) => toast.error(describeError(error).title, { description: describeError(error).description });
  const [first, ...rest] = waiting;

  const callEntry = (entry: QueueEntry) =>
    call.mutate(
      { id: entry.id, barberId: null },
      {
        onSuccess: () => {
          toast.success(t("frontDesk.queue.called", { name: entry.firstName }));
          setOpenId(null);
        },
        onError,
      }
    );
  const row = (entry: QueueEntry) => (
    <QueueRow
      key={entry.id}
      entry={entry}
      now={queue.dataUpdatedAt}
      open={openId === entry.id}
      onToggle={() => setOpenId((current) => (current === entry.id ? null : entry.id))}
      canManage={canManage}
      busy={busy}
      onCall={() => callEntry(entry)}
      onLeave={() => leave.mutate({ id: entry.id, reason: "left" }, { onSuccess: () => setOpenId(null), onError })}
    />
  );

  return (
    <SidePanelShell open={open} onOpenChange={onOpenChange} size="lg" title={t("frontDesk.queue.title")}>
      <div data-testid="walk-in-queue">
        <SaleCard testId="walk-in-queue-cards">
          <SaleCardHead
            eyebrow={t("frontDesk.queue.title")}
            title={waiting.length > 0 ? t("frontDesk.queue.headWaiting", { count: waiting.length }) : t("frontDesk.queue.emptyTitle")}
            lead={queue.data ? t("frontDesk.queue.headLead", { here: waiting.length - online, online, served: queue.data.served, left: queue.data.left }) : t("frontDesk.queue.hint")}
          />

          {first ? (
            <>
              <PanelQuestion title={t("frontDesk.queue.next")}>{row(first)}</PanelQuestion>
              {rest.length > 0 && (
                <PanelQuestion title={t("frontDesk.queue.after", { count: rest.length })}>
                  <div className="flex flex-col gap-2">{rest.map(row)}</div>
                </PanelQuestion>
              )}
            </>
          ) : (
            !adding && <EmptyState icon="queue" title={t("frontDesk.queue.emptyTitle")} description={t("frontDesk.queue.emptyHint")} />
          )}

          {canManage && (
            <PanelQuestion title={t("frontDesk.queue.addQuestion")}>
              <PanelField eyebrow={t("frontDesk.queue.add")} value="" placeholder={t("frontDesk.queue.addPlaceholder")} leading={<FieldIcon icon={UserPlus} filled={false} />} open={adding} onOpen={() => setAdding((current) => !current)} testId="queue-add" />
              {adding && (
                <InlineList title={t("frontDesk.queue.addSubmit")} description={t("frontDesk.queue.phoneHint")} onClose={() => setAdding(false)}>
                  <AddToQueue branchId={branchId} ctx={ctx} onDone={() => setAdding(false)} />
                </InlineList>
              )}
            </PanelQuestion>
          )}

          <Text size="xs" tone="muted">
            {t("frontDesk.queue.estimateNote")}
          </Text>

          {canManage && first && (
            <PanelFooter>
              <Button size="lg" className="w-full" onClick={() => callEntry(first)} disabled={busy} data-testid="queue-call-next">
                <Footprints aria-hidden />
                {t("frontDesk.queue.callNext", { name: first.firstName })}
              </Button>
            </PanelFooter>
          )}
        </SaleCard>
      </div>
    </SidePanelShell>
  );
}
