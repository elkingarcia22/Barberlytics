import * as React from "react";
import { useAppT } from "@/app/i18n";
import { cn } from "@/lib/utils";
import type { ModelContext } from "../calendarModel";
import type { AppointmentLinkProps } from "../appointmentTabs/AppointmentLinkSection";
import { AppointmentMessages } from "../appointmentTabs/AppointmentMessages";
import type { Appointment, AppointmentPatch } from "../types";
import { AppointmentFields } from "./AppointmentFields";
import { ClientField, ClientPageContent } from "./ClientPage";
import { HistoryTimeline } from "./HistoryTimeline";
import { AfterVisit } from "./AfterVisit";
import { ActionButton, ClientTags, CriticalAlerts, MoreActionsMenu } from "./PanelParts";
import { SourceLine } from "./SourceLine";
import { LinkedBlock, PanelStepper } from "./PanelShared";
import { NavRowLink, PanelQuestion, PanelSubpage } from "./bookingStyle";
import { isClosed, mainAction, quickActions, restActions } from "./panelLogic";
import { usePanelPages } from "./panelHooks";
import { ClipperButton, QuickTiles, StageHeading, TicketSummary } from "./StageParts";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * El cuerpo del panel de una cita («Tarjeta + Arma la cita», la que eligió el
 * usuario el 2026-10-18; las demás versiones y su selector se quitaron).
 * Arriba el avance; la tarjeta del momento, teñida por el estado, con quién
 * viene y qué se va a hacer en tarjetas que se cambian en su sitio —cliente,
 * servicios, productos, barbero, día y hora, y el comentario y la foto del
 * corte— y la acción principal dentro. Debajo, las alertas, los atajos (solo
 * si hacen falta), los mensajes de la cita, las enlazadas, Clipper y la
 * actividad. Cobrada o cerrada sin atender, lo que sigue con el cliente.
 */

export interface PanelBodyProps extends AppointmentLinkProps {
  model: AppointmentModel;
  ctx: ModelContext;
  onPatch: (appointment: Appointment, patch: AppointmentPatch) => void;
  onOpenClient: (clientId: string) => void;
}

type Page = "client" | "history";

/** Las páginas a las que se navega dentro del panel: el cliente y el historial. */
function Subpage({ page, back, props }: { page: Page; back: () => void; props: PanelBodyProps }) {
  const t = useAppT();
  const { model, ctx, onOpenClient } = props;
  if (page === "client") {
    return (
      <PanelSubpage title={model.clientName} onBack={back}>
        <ClientPageContent model={model} ctx={ctx} onOpenClient={onOpenClient} />
      </PanelSubpage>
    );
  }
  return (
    <PanelSubpage title={t("calendar.history.title")} onBack={back}>
      <HistoryTimeline model={model} ctx={ctx} />
    </PanelSubpage>
  );
}

/** De dónde salió la cita (en línea, con cita previa o sin ella), discreto, y las etiquetas del cliente. */
export function VisitContext({ model }: { model: AppointmentModel }) {
  return (
    <div className="-mt-2 flex flex-col gap-2" data-testid="panel-visit-context">
      <SourceLine appointment={model.appointment} />
      <ClientTags model={model} />
    </div>
  );
}

/** El tinte de la tarjeta según el momento: lo que pide moverse, en su color. */
const MOMENT_TINT: Record<AppointmentModel["playbook"]["stage"], string> = {
  late: "from-destructive/15 via-destructive/5",
  upcoming: "from-primary/15 via-primary/5",
  waiting: "from-info/15 via-info/5",
  seated: "from-primary/15 via-primary/5",
  toCollect: "from-warning/15 via-warning/5",
  paid: "from-success/15 via-success/5",
  noShow: "from-muted via-muted/40",
  cancelled: "from-muted via-muted/40",
};

export function AppointmentPanelBody(props: PanelBodyProps) {
  const t = useAppT();
  const { model, ctx, onPatch } = props;
  const pages = usePanelPages<Page>();
  const fieldsRef = React.useRef<HTMLDivElement>(null);
  if (pages.page) return <Subpage page={pages.page} back={pages.back} props={props} />;
  // Cobrada o cerrada sin atender: lo que sigue con el cliente, no la cita.
  if (isClosed(model)) return <AfterVisit model={model} ctx={ctx} onOpenClient={() => pages.open("client")} onOpenHistory={() => pages.open("history")} linked={props.linked} onSelectAppointment={props.onSelectAppointment} onUnlink={props.onUnlink} onShowLinked={props.onShowLinked} />;
  const { appointment } = model;
  const stage = model.playbook.stage;
  // Al «⋯» va lo que no está ya en los atajos (cancelar, no asistió… cuando ya está en la barbería).
  const quick: readonly string[] = quickActions(model);
  const more = restActions(model).filter((action) => !quick.includes(action));
  return (
    <div className="flex flex-col gap-5" data-testid="panel-body">
      <PanelStepper model={model} ctx={ctx} />
      <section className={cn("flex flex-col gap-4 rounded-2xl bg-gradient-to-b to-transparent p-4", MOMENT_TINT[stage])} data-testid="panel-moment-card">
        <StageHeading model={model} ctx={ctx} size="lg" />
        <VisitContext model={model} />
        <PanelQuestion title={t("calendar.panel.cards.who")}>
          <ClientField model={model} ctx={ctx} onOpenPage={() => pages.open("client")} />
        </PanelQuestion>
        <PanelQuestion title={t("calendar.panel.cards.what")}>
          <div ref={fieldsRef} className="scroll-mt-4">
            <AppointmentFields model={model} ctx={ctx} onPatch={onPatch} />
          </div>
        </PanelQuestion>
        {stage === "toCollect" && <TicketSummary model={model} ctx={ctx} />}
        <div className="flex items-center gap-2">
          <ActionButton model={model} action={mainAction(model)} variant="default" size="lg" className="flex-1" />
          <MoreActionsMenu model={model} actions={more} />
        </div>
      </section>
      <CriticalAlerts model={model} compact />
      <QuickTiles model={model} onChange={() => fieldsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />
      {/* Si confirmó que viene y qué mensajes se le mandaron por correo o SMS (confirmación, recordatorios). */}
      {!appointment.walkIn && <AppointmentMessages appointment={appointment} onPatch={onPatch} />}
      <LinkedBlock {...props} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ClipperButton model={model} ctx={ctx} />
        <NavRowLink label={t("calendar.history.title")} onClick={() => pages.open("history")} />
      </div>
    </div>
  );
}
