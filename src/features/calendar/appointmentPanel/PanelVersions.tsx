import * as React from "react";
import { useAppT } from "@/app/i18n";
import { formatClock } from "@/components/scheduling";
import { ThemaTabs } from "@/components/navigation";
import { Text } from "@/components/typography";
import { ActionTile } from "@/components/utility";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { appointmentEnd, appointmentRange, appointmentStart, durationLabel, type ModelContext } from "../calendarModel";
import type { AppointmentLinkProps } from "../appointmentTabs/AppointmentLinkSection";
import type { Appointment, AppointmentPatch } from "../types";
import { AppointmentFields } from "./AppointmentFields";
import { ClientPageContent, ClientSummaryRow } from "./ClientPage";
import { HistoryTimeline } from "./HistoryTimeline";
import { NextVisitBooker } from "./NextVisitBooker";
import { ActionButton, CriticalAlerts, ReferencePhotos } from "./PanelParts";
import { LinkedBlock, PanelStepper, StageBlock } from "./PanelShared";
import { NavRow, PanelQuestion, PanelSubpage } from "./bookingStyle";
import { mainAction, showsRequest, trackIndexOf } from "./panelLogic";
import { usePanelPages } from "./panelHooks";
import { BookingRequest, ClipperButton, QuickTiles, StageHeading, TicketSummary } from "./StageParts";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * Las cinco propuestas del panel de una cita. Todas cumplen lo mismo: el
 * avance arriba, lo primero es lo que pide el momento de la cita, lo que el
 * cliente pidió al reservar está a la vista hasta cobrar, los atajos van en
 * tarjetas como en la reserva, el cliente agrupa su membresía, ritmo y notas,
 * y Clipper abre su panel para preguntar. Cambia cómo se llega a lo demás.
 */

export interface VersionProps extends AppointmentLinkProps {
  model: AppointmentModel;
  ctx: ModelContext;
  onPatch: (appointment: Appointment, patch: AppointmentPatch) => void;
  onOpenClient: (clientId: string) => void;
}

type Page = "appointment" | "client" | "history";

/** Las páginas a las que se navega dentro del panel; las comparten las versiones con índice. */
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

/** Lo que dice la fila de la cita: servicios, barbero y hora. */
const appointmentSummary = (model: AppointmentModel, ctx: ModelContext) => [model.services.map((service) => service.name).join(" + "), model.barber?.name.split(" ")[0], appointmentRange(model.appointment, ctx.intl)].filter(Boolean).join(" · ");

/* ---------------------------------------------------------------- 1. Lo de ahora + índice */

/**
 * «Lo de ahora + índice» (side peek de Notion, ajustes de iOS): arriba solo
 * lo del momento —titular, lo que pidió o el ticket o la próxima, y los
 * atajos—; debajo, un índice («La cita», «Cliente», «Historial») que abre
 * cada cosa en su página dentro del panel, con «Volver».
 */
export function IndexVersion(props: VersionProps) {
  const t = useAppT();
  const { model, ctx } = props;
  const pages = usePanelPages<Page>();
  if (pages.page) return <Subpage page={pages.page} back={pages.back} props={props} />;
  return (
    <div className="flex flex-col gap-5" data-testid="panel-index">
      <PanelStepper model={model} ctx={ctx} />
      <StageHeading model={model} ctx={ctx} />
      <CriticalAlerts model={model} compact />
      <StageBlock model={model} ctx={ctx} />
      <QuickTiles model={model} ctx={ctx} onChange={() => pages.open("appointment")} />
      <nav aria-label={t("calendar.panel.index.title")} className="flex flex-col gap-2">
        <Text size="sm" weight="medium">
          {t("calendar.panel.index.title")}
        </Text>
        <NavRow icon="calendar" title={t("calendar.panel.page.appointment")} description={appointmentSummary(model, ctx)} onClick={() => pages.open("appointment")} testId="panel-nav-appointment" />
        {model.known && <ClientSummaryRow model={model} onOpen={() => pages.open("client")} />}
        <NavRow icon="clock" title={t("calendar.history.title")} description={t("calendar.panel.index.historyHint")} onClick={() => pages.open("history")} testId="panel-nav-history" />
      </nav>
      <ClipperButton model={model} ctx={ctx} />
    </div>
  );
}

/* ---------------------------------------------------------------- 2. Arma la cita */

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

/* ---------------------------------------------------------------- 3. Pestañas por estado */

type Tab = "now" | "appointment" | "client" | "history";

/**
 * «Pestañas por estado»: el panel de siempre, ordenado de nuevo. La primera
 * pestaña ya no es un resumen fijo: es «Ahora», y cambia con el momento de la
 * cita. Las demás —La cita, Cliente, Historial— agrupan el resto; Clipper va
 * junto a las pestañas y abre su panel.
 */
export function TabsVersion(props: VersionProps) {
  const t = useAppT();
  const { model, ctx, onPatch, onOpenClient } = props;
  const [tab, setTab] = React.useState<Tab>("now");
  return (
    <div className="flex flex-col gap-5" data-testid="panel-tabs">
      <PanelStepper model={model} ctx={ctx} />
      <div className="flex items-center gap-2">
        <div className="-mx-1 min-w-0 flex-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ThemaTabs
            className="mb-0 min-w-[20rem]"
            tabs={[
              { id: "now", label: t("calendar.panel.tabs.now") },
              { id: "appointment", label: t("calendar.panel.tabs.appointment") },
              { id: "client", label: t("calendar.tab.client") },
              { id: "history", label: t("calendar.tab.history") },
            ]}
            activeTabId={tab}
            onTabChange={(id) => setTab(id as Tab)}
          />
        </div>
      </div>
      {tab === "now" && (
        <div className="flex flex-col gap-5">
          <StageHeading model={model} ctx={ctx} />
          <CriticalAlerts model={model} compact />
          <StageBlock model={model} ctx={ctx} />
          <QuickTiles model={model} ctx={ctx} onChange={() => setTab("appointment")} />
          <ClipperButton model={model} ctx={ctx} />
        </div>
      )}
      {tab === "appointment" && (
        <div className="flex flex-col gap-5">
          <AppointmentFields model={model} ctx={ctx} onPatch={onPatch} />
          <BookingRequest model={model} />
          <LinkedBlock {...props} />
        </div>
      )}
      {tab === "client" && <ClientPageContent model={model} ctx={ctx} onOpenClient={onOpenClient} />}
      {tab === "history" && <HistoryTimeline model={model} ctx={ctx} />}
    </div>
  );
}

/* ---------------------------------------------------------------- 4. Tarjeta del momento */

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

/* ---------------------------------------------------------------- 5. Paso a paso */

/**
 * «Paso a paso»: el avance de arriba es la navegación. Cada paso hecho y el
 * actual se tocan y muestran lo suyo: Agendada, la reserva (lo que pidió y la
 * cita para cambiarla); Llegó, la llegada y la espera; En silla, la foto y
 * sumar servicios; Cobrada, el ticket y la próxima. Abre en el paso en curso.
 */
export function StepsVersion(props: VersionProps) {
  const t = useAppT();
  const { model, ctx, onPatch } = props;
  const pages = usePanelPages<Page>();
  const current = trackIndexOf(model);
  const [step, setStep] = React.useState(model.appointment.status === "paid" ? 3 : Math.max(0, current));
  if (pages.page) return <Subpage page={pages.page} back={pages.back} props={props} />;
  const closed = current < 0;
  const { stepTimes } = model;
  const clock = (date: Date | null) => (date ? formatClock(date, ctx.intl) : "—");

  const content = (() => {
    if (closed) return <NextVisitBooker model={model} ctx={ctx} />;
    switch (step) {
      case 0:
        return (
          <>
            <BookingRequest model={model} />
            <PanelQuestion title={t("calendar.panel.cards.what")}>
              <AppointmentFields model={model} ctx={ctx} onPatch={onPatch} />
            </PanelQuestion>
            <LinkedBlock {...props} />
          </>
        );
      case 1:
        return (
          <>
            <div className="flex flex-col gap-1 rounded-2xl border border-border bg-surface px-4 py-3">
              <StepFact label={t("calendar.panel.steps.expected")} value={formatClock(appointmentStart(model.appointment), ctx.intl)} />
              <StepFact label={t("calendar.panel.visit.arrived")} value={clock(stepTimes.arrived)} />
              <StepFact label={t("calendar.panel.steps.barberReady")} value={model.appointment.barberReady ? t("calendar.panel.steps.yes") : t("calendar.panel.steps.notYet")} />
            </div>
            {showsRequest(model) && <BookingRequest model={model} />}
          </>
        );
      case 2:
        return (
          <>
            {showsRequest(model) && <BookingRequest model={model} />}
            <PanelQuestion title={t("calendar.panel.cards.what")}>
              <AppointmentFields model={model} ctx={ctx} onPatch={onPatch} />
            </PanelQuestion>
          </>
        );
      default:
        return (
          <>
            <TicketSummary model={model} ctx={ctx} />
            {model.appointment.status === "paid" && <NextVisitBooker model={model} ctx={ctx} />}
          </>
        );
    }
  })();

  return (
    <div className="flex flex-col gap-5" data-testid="panel-steps">
      <PanelStepper model={model} ctx={ctx} onStepClick={setStep} />
      <StageHeading model={model} ctx={ctx} />
      <CriticalAlerts model={model} compact />
      {!closed && step !== current && step !== 3 && (
        <Text size="xs" tone="muted" className="-mt-2">
          {t("calendar.panel.steps.viewing")}
        </Text>
      )}
      {content}
      <QuickTiles model={model} ctx={ctx} onChange={() => setStep(Math.max(0, current))} />
      {model.known && <ClientSummaryRow model={model} onOpen={() => pages.open("client")} />}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ClipperButton model={model} ctx={ctx} />
        <NavRowLink label={t("calendar.history.title")} onClick={() => pages.open("history")} />
      </div>
    </div>
  );
}

function StepFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <Text size="sm" tone="secondary">
        {label}
      </Text>
      <Text size="sm" weight="medium" tabular>
        {value}
      </Text>
    </div>
  );
}
