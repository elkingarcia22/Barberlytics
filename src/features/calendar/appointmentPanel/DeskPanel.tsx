import * as React from "react";
import { Check, Pencil } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { Heading, Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/navigation";
import { formatClock, formatClockRange, ScheduleColorDot } from "@/components/scheduling";
import { appointmentRange, appointmentStart, durationLabel, isActive, serviceColor, serviceSlots, type ModelContext } from "../calendarModel";
import { DetailRow, PersonAvatar } from "../calendarShared";
import { StageHeadline } from "../appointmentTabs/AppointmentPanelParts";
import { AppointmentEditForm } from "../appointmentTabs/AppointmentEditForm";
import { AppointmentLinkSection, LinkPicker, type AppointmentLinkProps } from "../appointmentTabs/AppointmentLinkSection";
import { STATUS_KEYS, type Appointment, type AppointmentPatch, type AppointmentStatus } from "../types";
import { ActionButton, ClientTags, CriticalAlerts, MoreActionsMenu, NotesSplit, ReferencePhotos } from "./PanelParts";
import { clockRelation, mainAction, restActions } from "./panelLogic";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * Versión «Mostrador»: para recepción con fila. Lo que no se puede pasar por
 * alto (alergias) queda fijo arriba aunque se baje (el banner de Epic); las
 * etiquetas van pegadas al nombre (SevenRooms); la frase de estado dice
 * cuánto falta o cuánto lleva; el avance guarda la hora real de cada paso
 * (Housecall Pro, Open Dental) y la acción siguiente vive en el pie, siempre a
 * la vista, con contacto a un toque y el resto al menú. Sin pestañas: todo en
 * una sola columna.
 */

export interface DeskPanelProps extends AppointmentLinkProps {
  model: AppointmentModel;
  ctx: ModelContext;
  onPatch: (appointment: Appointment, patch: AppointmentPatch) => void;
}

const TRACK: readonly AppointmentStatus[] = ["scheduled", "arrived", "seated", "paid"];

export function DeskPanel({ model, ctx, onPatch, linked = [], linkCandidates = [], onSelectAppointment, onUnlink, onLink, onShowLinked }: DeskPanelProps) {
  const t = useAppT();
  const [editing, setEditing] = React.useState(false);
  const { appointment, barber, services, stepTimes } = model;
  const relation = clockRelation(model, ctx.now, t);
  const trackIndex = TRACK.indexOf(appointment.status);
  const time = (date: Date | null) => (date ? formatClock(date, ctx.intl) : undefined);
  const trackTimes: Record<AppointmentStatus, string | undefined> = {
    scheduled: formatClock(appointmentStart(appointment), ctx.intl),
    arrived: time(stepTimes.arrived),
    seated: time(stepTimes.seated),
    paid: time(stepTimes.paid),
    no_show: undefined,
    cancelled: undefined,
  };

  return (
    <div className="flex flex-col gap-5" data-testid="panel-desk">
      {model.critical.length > 0 && (
        // Fija arriba aunque se baje: el panel es de un solo tono, sin atmósfera detrás.
        <div className="sticky -top-5 z-10 -mx-5 -mt-5 bg-surface px-5 pb-2 pt-5">
          <CriticalAlerts model={model} compact />
        </div>
      )}

      <ClientTags model={model} />

      <section className="space-y-3" data-stage={model.playbook.stage}>
        <StageHeadline stage={model.playbook.stage}>{model.headline}</StageHeadline>
        {relation && (
          <Heading level={3} className="tabular-nums" data-testid="panel-clock">
            {relation}
          </Heading>
        )}
        {trackIndex >= 0 && (
          <Stepper
            size="sm"
            aria-label={t("calendar.detail.track")}
            current={appointment.status === "paid" ? TRACK.length : trackIndex}
            steps={TRACK.map((status) => ({
              id: status,
              label: t(status === "scheduled" ? "calendar.detail.trackScheduled" : STATUS_KEYS[status]),
              description: trackTimes[status],
            }))}
          />
        )}
      </section>

      {linked.length > 1 && onSelectAppointment && <AppointmentLinkSection linked={linked} current={appointment} ctx={ctx} onSelect={onSelectAppointment} onUnlink={onUnlink} onShowLinked={onShowLinked} />}

      <section aria-label={t("calendar.panel.desk.facts")}>
        <div className="mb-1 flex items-center justify-between gap-2">
          <Text variant="label" weight="semibold">
            {t("calendar.panel.desk.facts")}
          </Text>
          {model.unpaid && (
            <Button variant="ghost" size="xs" onClick={() => setEditing((value) => !value)} data-testid="appointment-edit-toggle">
              {editing ? <Check /> : <Pencil />} {editing ? t("calendar.detail.edit.done") : t("action.edit")}
            </Button>
          )}
        </div>
        {editing && model.unpaid ? (
          <AppointmentEditForm appointment={appointment} ctx={ctx} onPatch={onPatch} />
        ) : (
          <div>
            {serviceSlots(ctx.catalog, appointment).map(({ service, start, end }, index) => (
              <DetailRow key={`${service.id}-${index}`} plain label={services.length > 1 ? formatClockRange(start, end, ctx.intl) : t("calendar.field.service")}>
                <span className="inline-flex min-w-0 items-center gap-2">
                  <ScheduleColorDot color={serviceColor(ctx.catalog, service.id) ?? 1} className="size-2.5" />
                  <span className="truncate">{service.name}</span>
                </span>
              </DetailRow>
            ))}
            <DetailRow plain label={t("calendar.field.barber")}>
              <span className="inline-flex items-center gap-2">
                {barber && <PersonAvatar name={barber.name} avatarUrl={barber.avatarUrl} size="sm" />}
                {barber?.name ?? "—"}
              </span>
            </DetailRow>
            <DetailRow plain label={t("calendar.detail.edit.time")}>
              {appointmentRange(appointment, ctx.intl)} · {durationLabel(appointment.durationMin)}
            </DetailRow>
            {model.known?.phone && model.phone && (
              <DetailRow plain label={t("calendar.field.client")}>
                {model.known.phone}
              </DetailRow>
            )}
            <DetailRow plain label={appointment.payment ? t("calendar.detail.paid") : t("calendar.field.price")} strong>
              <span data-testid="appointment-price">{ctx.formatMoney(model.price)}</span>
            </DetailRow>
          </div>
        )}
      </section>

      <NotesSplit model={model} />
      <ReferencePhotos model={model} />
      {onLink && isActive(appointment) && <LinkPicker current={appointment} candidates={linkCandidates} ctx={ctx} onLink={onLink} />}
    </div>
  );
}

/** El pie del mostrador: contacto a un toque, la acción siguiente grande y el resto al menú. */
export function DeskFooter({ model }: { model: AppointmentModel }) {
  const contact = model.phone ? (["call", "whatsapp"] as const) : [];
  return (
    <footer className="flex shrink-0 items-center gap-2 border-t border-border/60 px-5 py-4" data-testid="appointment-primary">
        {contact.map((action) => (
          <ActionButton key={action} model={model} action={action} variant="outline" iconOnly />
        ))}
        <ActionButton model={model} action={mainAction(model)} variant="default" className="flex-1" />
        <MoreActionsMenu model={model} actions={restActions(model)} />
    </footer>
  );
}
