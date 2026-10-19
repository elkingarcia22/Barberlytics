import * as React from "react";
import { useAppT } from "@/app/i18n";
import { formatClock } from "@/components/scheduling";
import { Text } from "@/components/typography";
import { ActionTile } from "@/components/utility";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { appointmentEnd, appointmentStart, durationLabel, type ModelContext } from "../calendarModel";
import type { AppointmentLinkProps } from "../appointmentTabs/AppointmentLinkSection";
import type { Appointment, AppointmentPatch } from "../types";
import { AppointmentFields } from "./AppointmentFields";
import { ClientPageContent, ClientSummaryRow } from "./ClientPage";
import { HistoryTimeline } from "./HistoryTimeline";
import { NextVisitBooker } from "./NextVisitBooker";
import { ActionButton, CriticalAlerts, ReferencePhotos } from "./PanelParts";
import { LinkedBlock, PanelStepper } from "./PanelShared";
import { PanelQuestion, PanelSubpage } from "./bookingStyle";
import { mainAction, showsRequest } from "./panelLogic";
import { usePanelPages } from "./panelHooks";
import { BookingRequest, ClipperButton, QuickTiles, StageHeading, TicketSummary } from "./StageParts";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * Las dos propuestas del panel de una cita que quedaron (2026-10-18, junto a
 * las pestañas de siempre). Las dos cumplen lo mismo: el
 * avance arriba, lo primero es lo que pide el momento de la cita, lo que el
 * cliente pidió al reservar está a la vista hasta cobrar, los atajos van en
 * tarjetas como en la reserva, el cliente agrupa su membresía, ritmo y notas,
 * y Clipper abre su panel para preguntar. Cambia cómo se llega a lo demás.
 * Se quitaron «Lo de ahora + índice», «Pestañas por estado» y «Paso a paso».
 */

export interface VersionProps extends AppointmentLinkProps {
  model: AppointmentModel;
  ctx: ModelContext;
  onPatch: (appointment: Appointment, patch: AppointmentPatch) => void;
  onOpenClient: (clientId: string) => void;
}

type Page = "appointment" | "client" | "history";

/** Las páginas a las que se navega dentro del panel: la cita, el cliente y el historial. */
function Subpage({ page, back, props }: { page: Page; back: () => void; props: VersionProps }) {
  const t = useAppT();
  const { model, ctx, onPatch, onOpenClient } = props;
  if (page === "client") {
    return (
      <PanelSubpage title={model.clientName} onBack={back}>
        <ClientPageContent model={model} ctx={ctx} onOpenClient={onOpenClient} />
      </PanelSubpage>
    );
  }
  if (page === "history") {
    return (
      <PanelSubpage title={t("calendar.history.title")} onBack={back}>
        <HistoryTimeline model={model} ctx={ctx} />
      </PanelSubpage>
    );
  }
  return (
    <PanelSubpage title={t("calendar.panel.page.appointment")} onBack={back}>
      <AppointmentFields model={model} ctx={ctx} onPatch={onPatch} />
      <BookingRequest model={model} />
      <LinkedBlock {...props} />
    </PanelSubpage>
  );
}


/* ---------------------------------------------------------------- 1. Arma la cita */

/**
 * «Arma la cita»: la cara de «Arma tu cita» de la reserva. Bajo el titular,
 * las preguntas con su campo-tarjeta —qué se hace, con quién, cuándo— que se
 * cambian en su sitio mientras no ha ingresado; lo que pidió al reservar, los
 * atajos y el cliente como una tarjeta más que abre su página.
 */
export function CardsVersion(props: VersionProps) {
  const t = useAppT();
  const { model, ctx, onPatch } = props;
  const pages = usePanelPages<Page>();
  const fieldsRef = React.useRef<HTMLDivElement>(null);
  if (pages.page) return <Subpage page={pages.page} back={pages.back} props={props} />;
  const stage = model.playbook.stage;
  const closed = stage === "paid" || stage === "noShow" || stage === "cancelled";
  return (
    <div className="flex flex-col gap-5" data-testid="panel-cards">
      <PanelStepper model={model} ctx={ctx} />
      <StageHeading model={model} ctx={ctx} />
      <CriticalAlerts model={model} compact />
      {closed && <NextVisitBooker model={model} ctx={ctx} />}
      {stage === "toCollect" && <TicketSummary model={model} ctx={ctx} />}
      <PanelQuestion title={t("calendar.panel.cards.what")}>
        <div ref={fieldsRef} className="scroll-mt-4">
          <AppointmentFields model={model} ctx={ctx} onPatch={onPatch} />
        </div>
      </PanelQuestion>
      {showsRequest(model) && (
        <PanelQuestion title={t("calendar.panel.cards.asked")}>
          <BookingRequest model={model} />
        </PanelQuestion>
      )}
      <QuickTiles model={model} ctx={ctx} onChange={() => fieldsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />
      <LinkedBlock {...props} />
      {model.known && (
        <PanelQuestion title={t("calendar.panel.cards.who")}>
          <ClientSummaryRow model={model} onOpen={() => pages.open("client")} />
        </PanelQuestion>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ClipperButton model={model} ctx={ctx} />
        <NavRowLink label={t("calendar.history.title")} onClick={() => pages.open("history")} />
      </div>
    </div>
  );
}

/** Un enlace discreto a otra página del panel. */
function NavRowLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-text-secondary outline-none transition-colors duration-fast hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring/50">
      {label}
      <ThemaIcon name="chevronRight" size="sm" />
    </button>
  );
}

/* ---------------------------------------------------------------- 2. Tarjeta del momento */

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

/**
 * «Tarjeta del momento»: una sola tarjeta grande arriba con el titular, lo
 * esencial de la cita, lo que pidió (o el ticket, o la próxima) y el botón de
 * lo que toca, como el «Tu membresía» de la reserva. Debajo, los atajos y dos
 * tarjetas que abren La cita y El cliente; el pie desaparece: la acción vive
 * en la tarjeta.
 */
export function MomentVersion(props: VersionProps) {
  const t = useAppT();
  const { model, ctx } = props;
  const pages = usePanelPages<Page>();
  if (pages.page) return <Subpage page={pages.page} back={pages.back} props={props} />;
  const { appointment, services, barber } = model;
  const stage = model.playbook.stage;
  const active = stage !== "paid" && stage !== "noShow" && stage !== "cancelled";
  return (
    <div className="flex flex-col gap-5" data-testid="panel-moment">
      <PanelStepper model={model} ctx={ctx} />
      <section className={cn("flex flex-col gap-4 rounded-2xl bg-gradient-to-b to-transparent p-4", MOMENT_TINT[stage])} data-testid="panel-moment-card">
        <StageHeading model={model} ctx={ctx} size="lg" />
        <div className="flex items-center gap-3">
          <IconTile size="lg" src={services[0]?.imageUrl} icon={<ThemaIcon name="scissors" />} />
          <div className="flex min-w-0 flex-col">
            <Text weight="semibold" truncate>
              {services.map((service) => service.name).join(" + ") || "—"}
            </Text>
            <Text size="sm" tone="secondary" tabular truncate>
              {`${formatClock(appointmentStart(appointment), ctx.intl)} – ${formatClock(appointmentEnd(appointment), ctx.intl)} · ${barber?.name ?? "—"}`}
            </Text>
          </div>
          <Text weight="semibold" tabular className="ml-auto shrink-0">
            {ctx.formatMoney(model.price)}
          </Text>
        </div>
        <CriticalAlerts model={model} compact />
        {appointment.notes && showsRequest(model) && <Text className="border-l-2 border-primary/60 pl-3 italic">«{appointment.notes}»</Text>}
        {showsRequest(model) && <ReferencePhotos model={model} />}
        {stage === "toCollect" && <TicketSummary model={model} ctx={ctx} />}
        {active ? <ActionButton model={model} action={mainAction(model)} variant="default" size="lg" className="w-full" /> : <NextVisitBooker model={model} ctx={ctx} />}
      </section>
      <QuickTiles model={model} ctx={ctx} onChange={() => pages.open("appointment")} />
      <div className="grid grid-cols-2 gap-2">
        <ActionTile layout="stacked" leading={<IconTile size="md" shape="circle" tone="neutral" icon={<ThemaIcon name="calendar" />} />} title={t("calendar.panel.page.appointment")} description={durationLabel(appointment.durationMin)} onClick={() => pages.open("appointment")} />
        {model.known ? (
          <ActionTile layout="stacked" leading={<IconTile size="md" shape="circle" tone="neutral" icon={<ThemaIcon name="users" />} />} title={t("calendar.tab.client")} description={t("calendar.panel.client.membershipShort", { count: model.loyaltyProgress, total: 10 })} onClick={() => pages.open("client")} />
        ) : (
          <ActionTile layout="stacked" leading={<IconTile size="md" shape="circle" tone="neutral" icon={<ThemaIcon name="clock" />} />} title={t("calendar.history.title")} description={t("calendar.panel.index.historyHint")} onClick={() => pages.open("history")} />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ClipperButton model={model} ctx={ctx} />
        {model.known && <NavRowLink label={t("calendar.history.title")} onClick={() => pages.open("history")} />}
      </div>
    </div>
  );
}
