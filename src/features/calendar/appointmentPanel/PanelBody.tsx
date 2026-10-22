import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CheckCheck, CircleDashed, HandCoins, Link2, Undo2 } from "lucide-react";
import { isActive, type ModelContext } from "../calendarModel";
import type { AppointmentLinkProps } from "../appointmentTabs/AppointmentLinkSection";
import { AppointmentMessages } from "../appointmentTabs/AppointmentMessages";
import type { Appointment, AppointmentPatch } from "../types";
import { AppointmentFields } from "./AppointmentFields";
import { ClientPageContent } from "./ClientPage";
import type { ClientTab } from "./clientHighlightsModel";
import { ClientField } from "./ClientField";
import { ConductPage } from "./ClientConduct";
import { HistoryTimeline } from "./HistoryTimeline";
import { RefundPage } from "./RefundPage";
import { AfterVisit } from "./AfterVisit";
import { ConfirmationBadge } from "./ConfirmationBadge";
import { confirmationOf } from "./confirmation";
import { NextVisitBooker } from "./NextVisitBooker";
import { SendReceiptPage } from "./SendReceiptPage";
import { DepositPage, DepositStatus } from "./DepositPage";
import { ReceiptPage } from "./ReceiptPage";
import { ActionButton, ClientTags, MoreActionsMenu, type MenuExtra } from "./PanelParts";
import { CareAlerts } from "./CareAlerts";
import { StatusConfirmContent, type ClosingAction } from "./StatusConfirm";
import { SourceLine } from "./SourceLine";
import { LinkedField, LinkPickerField, PanelStepper } from "./PanelShared";
import { PanelQuestion, PanelSubpage } from "./bookingStyle";
import { isClosed, mainAction, previousStatus, quickActions, restActions } from "./panelLogic";
import { STATUS_KEYS } from "../types";
import type { PanelPages } from "./panelHooks";
import { QuickTiles, StageHeading, TicketSummary } from "./StageParts";
import type { AppointmentModel } from "./useAppointmentModel";
import { PanelFooter } from "@/components/overlays";

/**
 * El cuerpo del panel de una cita («Tarjeta + Arma la cita», la que eligió el
 * usuario el 2026-10-18; las demás versiones y su selector se quitaron).
 * Arriba el avance; la tarjeta del momento, teñida por el estado, con quién
 * viene y qué se va a hacer en tarjetas que se cambian en su sitio —cliente,
 * servicios, productos, barbero, día y hora, y el comentario y la foto del
 * corte—, la confirmación y las enlazadas (también tarjetas), y al final los
 * atajos (solo si hacen falta) y la acción principal con su «⋯». Todo vive en
 * la tarjeta; la actividad y Clipper van en la cabecera del panel. Cobrada o cerrada sin atender, lo que sigue con el cliente.
 */

export interface PanelBodyProps extends AppointmentLinkProps {
  model: AppointmentModel;
  ctx: ModelContext;
  onPatch: (appointment: Appointment, patch: AppointmentPatch) => void;
  onOpenClient: (clientId: string) => void;
  /** En qué página del panel se está: la tiene el panel, porque la actividad se abre desde la cabecera. */
  pages: PanelPages<PanelPage>;
}

export type PanelPage = "client" | "history" | "refund" | "rebook" | "sendReceipt" | "receipt" | "deposit" | "conduct";

/** Las páginas a las que se navega dentro del panel: el cliente y el historial. */
function Subpage({ page, back, props, clientTab }: { page: PanelPage; back: () => void; props: PanelBodyProps; clientTab: ClientTab }) {
  const t = useAppT();
  const { model, ctx, onOpenClient } = props;
  if (page === "client") {
    return (
      <PanelSubpage title={model.clientName} onBack={back}>
        <ClientPageContent model={model} ctx={ctx} onOpenClient={onOpenClient} onReportConduct={() => props.pages.open("conduct")} initialTab={clientTab} />
      </PanelSubpage>
    );
  }
  if (page === "conduct") {
    return (
      <PanelSubpage title={t("calendar.conduct.reportTitle", { name: model.firstName })} onBack={back}>
        <ConductPage model={model} onDone={back} />
      </PanelSubpage>
    );
  }
  if (page === "rebook") {
    return (
      <PanelSubpage title={t("calendar.panel.after.rebook")} onBack={back}>
        <NextVisitBooker model={model} ctx={ctx} group={props.linked} onDone={back} />
      </PanelSubpage>
    );
  }
  if (page === "receipt") {
    return (
      <PanelSubpage title={t("calendar.receipt.title")} onBack={back}>
        <ReceiptPage model={model} ctx={ctx} onSend={model.phone || model.email ? () => props.pages.open("sendReceipt") : undefined} />
      </PanelSubpage>
    );
  }
  if (page === "sendReceipt") {
    return (
      <PanelSubpage title={t("calendar.panel.send.receiptTitle")} onBack={back}>
        <SendReceiptPage model={model} ctx={ctx} onDone={back} />
      </PanelSubpage>
    );
  }
  if (page === "deposit") {
    return (
      <PanelSubpage title={t("calendar.deposit.title")} onBack={back}>
        <DepositPage model={model} ctx={ctx} onDone={back} />
      </PanelSubpage>
    );
  }
  if (page === "refund") {
    return (
      <PanelSubpage title={t("calendar.refund.title")} onBack={back}>
        <RefundPage model={model} ctx={ctx} onDone={back} />
      </PanelSubpage>
    );
  }
  return (
    <PanelSubpage title={t("calendar.history.title")} onBack={back}>
      <HistoryTimeline model={model} ctx={ctx} />
    </PanelSubpage>
  );
}

/**
 * De dónde salió la cita (en línea, con cita previa o sin ella), discreto; las
 * etiquetas del cliente y, juntas, las alertas (riesgo de no venir, alergias,
 * medicamentos) con lo completo en su tooltip.
 */
function VisitContext({ model }: { model: AppointmentModel }) {
  return (
    <div className="-mt-2 flex flex-col gap-2" data-testid="panel-visit-context">
      <SourceLine appointment={model.appointment} />
      <ClientTags model={model} />
      <CareAlerts model={model} />
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
  noShow: "from-destructive/15 via-destructive/5",
  cancelled: "from-destructive/15 via-destructive/5",
};

export function AppointmentPanelBody(props: PanelBodyProps) {
  const t = useAppT();
  const { model, ctx, onPatch } = props;
  const { pages } = props;
  const [linking, setLinking] = React.useState(false);
  // Cancelar o «No asistió» pedidos desde el «⋯»: su popover se abre bajo la acción principal, un
  // cuadro después de cerrarse el menú.
  const [confirming, setConfirming] = React.useState<ClosingAction | null>(null);
  const fieldsRef = React.useRef<HTMLDivElement>(null);
  // La pestaña de la página del cliente: la del punto que se tocó en «Sobre {nombre}».
  const [clientTab, setClientTab] = React.useState<ClientTab>("summary");
  const openClient = (tab: ClientTab = "summary") => {
    setClientTab(tab);
    pages.open("client");
  };
  if (pages.page) return <Subpage page={pages.page} back={pages.back} props={props} clientTab={clientTab} />;
  // Cobrada o cerrada sin atender: lo que sigue con el cliente, no la cita.
  if (isClosed(model)) return <AfterVisit model={model} ctx={ctx} onOpenClient={() => openClient()} onOpenRefund={() => pages.open("refund")} onOpenRebook={() => pages.open("rebook")} onOpenSendReceipt={() => pages.open("sendReceipt")} onOpenReceipt={() => pages.open("receipt")} onReportConduct={() => pages.open("conduct")} linked={props.linked} onSelectAppointment={props.onSelectAppointment} onUnlink={props.onUnlink} onShowLinked={props.onShowLinked} />;
  const { appointment } = model;
  const stage = model.playbook.stage;
  // Al «⋯» va lo que no está ya en los atajos (cancelar, no asistió… cuando ya está en la barbería).
  const quick: readonly string[] = quickActions(model);
  const more = restActions(model).filter((action) => !quick.includes(action));
  // Enlazarla con otra cita del día: una opción del «⋯», solo si hay con cuál.
  const canLink = Boolean(props.onLink) && isActive(appointment) && (props.linkCandidates?.length ?? 0) > 0;
  // Deshacer el último paso (ingresó o lo sentó por error): vuelve al estado anterior.
  const previous = previousStatus(appointment.status);
  // Confirmar que viene (lo dijo por teléfono o en persona), o quitarlo: del «⋯», mientras no ha llegado.
  const confirmation = confirmationOf(appointment);
  const canConfirm = appointment.status === "scheduled" && !appointment.walkIn;
  const menuExtra: MenuExtra[] = [
    ...(canConfirm && confirmation.kind !== "confirmed" ? [{ id: "confirm", label: t("calendar.panel.confirm"), icon: CheckCheck, onSelect: () => onPatch(appointment, { confirmation: "confirmed" }) }] : []),
    ...(canConfirm && confirmation.kind === "confirmed" ? [{ id: "unconfirm", label: t("calendar.panel.unconfirm"), icon: CircleDashed, onSelect: () => onPatch(appointment, { confirmation: "pending" }) }] : []),
    ...(previous ? [{ id: "undo", label: t("calendar.panel.undo", { status: t(STATUS_KEYS[previous]) }), icon: Undo2, onSelect: () => model.setStatus(previous) }] : []),
    ...(canLink ? [{ id: "link", label: t("calendar.link.add"), icon: Link2, onSelect: () => setLinking(true) }] : []),
    // Pedir anticipo: antes de que llegue, si aún no lo pagó.
    ...(canConfirm && appointment.depositRequest?.status !== "paid" ? [{ id: "deposit", label: t("calendar.deposit.title"), icon: HandCoins, onSelect: () => pages.open("deposit") }] : []),
  ];
  return (
    <div className="flex flex-col gap-5" data-testid="panel-body">
      <PanelStepper model={model} ctx={ctx} />
      <section className={cn("flex flex-col gap-4 rounded-2xl bg-gradient-to-b to-transparent p-4", MOMENT_TINT[stage])} data-testid="panel-moment-card">
        <StageHeading model={model} ctx={ctx} size="lg" badge={!appointment.walkIn && <ConfirmationBadge appointment={appointment} />} />
        <VisitContext model={model} />
        <PanelQuestion title={t("calendar.panel.cards.who")}>
          <ClientField model={model} ctx={ctx} onOpenPage={openClient} onPatch={onPatch} />
        </PanelQuestion>
        <PanelQuestion title={t("calendar.panel.cards.what")}>
          <div ref={fieldsRef} className="scroll-mt-4">
            <AppointmentFields model={model} ctx={ctx} onPatch={onPatch} />
          </div>
        </PanelQuestion>
        {/* Los mensajes y lo que respondió, y con qué citas va: tarjetas como las de arriba, solo si aplican. */}
        <div className="flex flex-col gap-2 empty:hidden">
          <DepositStatus model={model} ctx={ctx} onOpen={() => pages.open("deposit")} />
          {!appointment.walkIn && <AppointmentMessages appointment={appointment} />}
          <LinkedField model={model} ctx={ctx} linked={props.linked} onSelectAppointment={props.onSelectAppointment} onUnlink={props.onUnlink} onShowLinked={props.onShowLinked} />
          {linking && <LinkPickerField model={model} ctx={ctx} linkCandidates={props.linkCandidates} onLink={props.onLink} onDone={() => setLinking(false)} />}
        </div>
        {stage === "toCollect" && <TicketSummary model={model} ctx={ctx} />}
        {/* Al final de la tarjeta: los atajos (solo si hacen falta) y debajo la acción principal con su «⋯». */}
        <QuickTiles model={model} onChange={() => fieldsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />
        <PanelFooter>
          <Popover open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
            <PopoverAnchor asChild>
              <div className="flex items-center gap-2">
                <ActionButton model={model} action={mainAction(model)} variant="default" size="lg" className="flex-1" />
                <MoreActionsMenu model={model} actions={more} extra={menuExtra} onConfirm={(action) => requestAnimationFrame(() => setConfirming(action))} />
              </div>
            </PopoverAnchor>
            {/* Lo cierra un clic fuera o Escape, no el foco que el menú devuelve a su botón al cerrarse. */}
            <PopoverContent align="end" className="w-72" onFocusOutside={(event) => event.preventDefault()}>
              {confirming && <StatusConfirmContent model={model} action={confirming} onClose={() => setConfirming(null)} />}
            </PopoverContent>
          </Popover>
        </PanelFooter>
      </section>
    </div>
  );
}
