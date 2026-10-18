import { useAppT } from "@/app/i18n";
import { Heading, Text } from "@/components/typography";
import { ThemaIcon } from "@/icons";
import { IconTile } from "@/components/utility/IconTile";
import { appointmentRange, type ModelContext } from "../calendarModel";
import { StageHeadline } from "../appointmentTabs/AppointmentPanelParts";
import { AppointmentClipperTab } from "../appointmentTabs/AppointmentClipperTab";
import type { CreateAppointmentInitial } from "../CreateAppointmentDrawer";
import type { Appointment, AppointmentPatch } from "../types";
import { ActionButton, ClientTags, CriticalAlerts, MoreActionsMenu, NotesSplit, ReferencePhotos } from "./PanelParts";
import { clockRelation, mainAction, restActions } from "./panelLogic";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * Versión «Modo silla»: para el barbero con la tablet al lado y las manos
 * ocupadas (el «Start → Finish» de Housecall Pro, el check-in de Mariana
 * Tek). Una sola cosa por bloque y en grande: la foto de lo que pidió, cuánto
 * queda, lo que no puede olvidar y lo que Clipper sabe antes de empezar
 * (el «pre-shift» de SevenRooms). Sin dinero ni métricas: eso es de la caja.
 * Abajo, un único botón ancho.
 */

export interface ChairPanelProps {
  model: AppointmentModel;
  ctx: ModelContext;
  onPatch: (appointment: Appointment, patch: AppointmentPatch) => void;
  onRebook: (initial: CreateAppointmentInitial) => void;
}

export function ChairPanel({ model, ctx, onPatch, onRebook }: ChairPanelProps) {
  const t = useAppT();
  const relation = clockRelation(model, ctx.now, t);
  const { appointment, known, services } = model;
  const hasPhoto = (appointment.referencePhotos?.length ?? 0) > 0;
  const hasNotes = model.critical.length > 0 || model.notes.length > 0 || Boolean(appointment.notes);

  return (
    <div className="flex flex-col gap-6" data-testid="panel-chair">
      <section className="space-y-3">
        {hasPhoto ? (
          <>
            <Text variant="label" weight="semibold">
              {t("calendar.panel.photosTitle")}
            </Text>
            <ReferencePhotos model={model} large />
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-surface-subtle p-3">
            <IconTile size="lg" src={services[0]?.imageUrl} icon={<ThemaIcon name="scissors" />} />
            <Text size="sm" tone="secondary">
              {t("calendar.panel.chair.noPhoto")}
            </Text>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <Heading level={2}>{services.map((service) => service.name).join(" + ") || "—"}</Heading>
        <Text tone="secondary">
          {appointmentRange(appointment, ctx.intl)}
          {known && ` · ${t("calendar.panel.chair.visitN", { count: known.visits + (appointment.status === "paid" ? 0 : 1) })}`}
        </Text>
        <StageHeadline stage={model.playbook.stage}>{model.headline}</StageHeadline>
        {relation && (
          <Heading level={1} className="tabular-nums" data-testid="panel-clock">
            {relation}
          </Heading>
        )}
        <ClientTags model={model} operational />
      </section>

      {hasNotes && (
        <section aria-label={t("calendar.panel.chair.dontForget")} className="space-y-3">
          <Text variant="label" weight="semibold">
            {t("calendar.panel.chair.dontForget")}
          </Text>
          <CriticalAlerts model={model} />
          <NotesSplit model={model} />
        </section>
      )}

      {model.insights.length > 0 && (
        <section aria-label={t("calendar.panel.chair.before")} className="space-y-3">
          <Text variant="label" weight="semibold">
            {t("calendar.panel.chair.before")}
          </Text>
          <AppointmentClipperTab appointment={appointment} ctx={ctx} onPatch={onPatch} onRebook={onRebook} />
        </section>
      )}
    </div>
  );
}

/** Un solo botón, grande, al alcance del pulgar; lo raro al menú. */
export function ChairFooter({ model }: { model: AppointmentModel }) {
  return (
    <footer className="flex shrink-0 items-center gap-2 border-t border-border/60 px-5 py-4" data-testid="appointment-primary">
      <ActionButton model={model} action={mainAction(model)} variant="default" size="lg" className="flex-1" hidePrice />
      <MoreActionsMenu model={model} actions={restActions(model)} />
    </footer>
  );
}
