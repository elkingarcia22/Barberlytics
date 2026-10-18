import * as React from "react";
import { differenceInCalendarDays } from "date-fns";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { AIButton } from "@/components/ai-interaction";
import { ListItem } from "@/components/data-display/ListItem";
import { appointmentRange, type ModelContext } from "../calendarModel";
import { ServiceThumb } from "../calendarShared";
import { StageHeadline } from "../appointmentTabs/AppointmentPanelParts";
import { AppointmentClipperTab } from "../appointmentTabs/AppointmentClipperTab";
import type { CreateAppointmentInitial } from "../CreateAppointmentDrawer";
import type { Appointment, AppointmentPatch } from "../types";
import { ActionButton, ClientTags, CriticalAlerts, LoyaltyStrip, MoreActionsMenu, RebookShortcuts } from "./PanelParts";
import { mainAction, restActions } from "./panelLogic";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * Versión «Ficha del cliente»: la persona antes que la cita (SevenRooms,
 * Mews, la ficha de Jane). Arriba sus números —visitas, ritmo, última vez,
 * cumplimiento—, su membresía y sus alertas; luego esta cita en una fila, sus
 * preferencias y la próxima visita que toca por su ritmo. Lo que sabe Clipper
 * se pide con un botón (los «Smart tips» de Mews): no ocupa sitio si no se usa.
 */

export interface ClientPanelProps {
  model: AppointmentModel;
  ctx: ModelContext;
  onPatch: (appointment: Appointment, patch: AppointmentPatch) => void;
  onRebook: (initial: CreateAppointmentInitial) => void;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-surface-subtle px-3 py-2.5">
      <Text size="xs" tone="muted">
        {label}
      </Text>
      <Text size="lg" weight="semibold" tabular>
        {value}
      </Text>
    </div>
  );
}

export function ClientPanel({ model, ctx, onPatch, onRebook }: ClientPanelProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const [brief, setBrief] = React.useState(false);
  const { appointment, known, barber, services } = model;
  const today = ctx.now ?? new Date();
  const preferred = known?.preferredBarberId ? ctx.catalog.barbers.find((entry) => entry.id === known.preferredBarberId) : undefined;

  return (
    <div className="flex flex-col gap-5" data-testid="panel-client">
      <ClientTags model={model} />

      {known ? (
        <div className="grid grid-cols-2 gap-2" data-testid="panel-stats">
          <Stat label={t("calendar.panel.client.visits")} value={String(known.visits)} />
          <Stat label={t("calendar.panel.client.rhythm")} value={known.visitEveryDays ? t("calendar.panel.client.rhythmValue", { days: known.visitEveryDays }) : "—"} />
          <Stat
            label={t("calendar.panel.client.last")}
            value={model.lastVisit ? (differenceInCalendarDays(today, model.lastVisit) === 0 ? t("calendar.panel.client.today") : t("calendar.panel.client.lastValue", { days: differenceInCalendarDays(today, model.lastVisit) })) : "—"}
          />
          <Stat label={t("calendar.panel.client.kept")} value={known.visits > 0 ? `${Math.round((Math.max(0, known.visits - known.noShows) / known.visits) * 100)} %` : "—"} />
        </div>
      ) : (
        <Text tone="muted">{t("calendar.notes.walkIn")}</Text>
      )}

      <CriticalAlerts model={model} compact />
      <LoyaltyStrip model={model} />

      <section aria-label={t("calendar.panel.client.thisVisit")} className="space-y-2">
        <Text variant="label" weight="semibold">
          {t("calendar.panel.client.thisVisit")}
        </Text>
        <StageHeadline stage={model.playbook.stage}>{model.headline}</StageHeadline>
        <ListItem
          leading={<ServiceThumb service={services[0]} size="md" />}
          title={services.map((service) => service.name).join(" + ") || "—"}
          description={`${appointmentRange(appointment, ctx.intl)}${barber ? ` · ${barber.name}` : ""}`}
          meta={ctx.formatMoney(model.price)}
        />
        {appointment.notes && (
          <Text size="sm" tone="secondary">
            {appointment.notes}
          </Text>
        )}
      </section>

      {known && (
        <section aria-label={t("calendar.panel.client.usual")} className="space-y-2">
          <Text variant="label" weight="semibold">
            {t("calendar.panel.client.usual")}
          </Text>
          {preferred && <Text size="sm">{t("calendar.panel.client.usualBarber", { name: preferred.name })}</Text>}
          {model.notes.map((note) => (
            <Text key={note.id} size="sm" tone="secondary">
              {note.text}
            </Text>
          ))}
          <div className="space-y-2 rounded-xl bg-surface-subtle px-3 py-2.5">
            <Text size="xs" tone="muted">
              {t("calendar.panel.client.nextVisit")}
            </Text>
            {model.nextVisit && (
              <Text size="sm" weight="semibold" className="first-letter:uppercase">
                {formatDate(model.nextVisit, { weekday: "long", day: "numeric", month: "long" })}
              </Text>
            )}
            <RebookShortcuts model={model} />
          </div>
        </section>
      )}

      {model.insights.length > 0 && (
        <section aria-label={t("calendar.panel.client.brief")} className="space-y-3">
          <AIButton variant={brief ? "subtle" : "secondary"} size="sm" label={brief ? t("calendar.panel.client.briefHide") : t("calendar.panel.client.briefShow")} onClick={() => setBrief((value) => !value)} />
          {brief && <AppointmentClipperTab appointment={appointment} ctx={ctx} onPatch={onPatch} onRebook={onRebook} />}
        </section>
      )}
    </div>
  );
}

export function ClientFooter({ model, onOpenClient }: { model: AppointmentModel; onOpenClient: (clientId: string) => void }) {
  const t = useAppT();
  const known = model.known;
  return (
    <footer className="flex shrink-0 items-center gap-2 border-t border-border/60 px-5 py-4" data-testid="appointment-primary">
      {known && (
        <Button variant="outline" onClick={() => onOpenClient(known.id)}>
          {t("calendar.client.openProfile")}
        </Button>
      )}
      <ActionButton model={model} action={mainAction(model)} variant="default" className="flex-1" />
      <MoreActionsMenu model={model} actions={restActions(model)} />
    </footer>
  );
}
