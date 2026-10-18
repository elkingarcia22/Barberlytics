import { useAppT } from "@/app/i18n";
import { Stepper } from "@/components/navigation";
import { formatClock } from "@/components/scheduling";
import { appointmentStart, isActive, type ModelContext } from "../calendarModel";
import { AppointmentLinkSection, LinkPicker, type AppointmentLinkProps } from "../appointmentTabs/AppointmentLinkSection";
import { STATUS_KEYS } from "../types";
import { ActionButton, MoreActionsMenu } from "./PanelParts";
import { TRACK, mainAction, restActions, showsRequest, trackIndexOf } from "./panelLogic";
import { NextVisitBooker } from "./NextVisitBooker";
import { BookingRequest, TicketSummary } from "./StageParts";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * Lo que comparten las cinco versiones: el avance arriba (como en el panel de
 * siempre) con la hora real de cada paso, el bloque que cambia con el momento
 * de la cita y el pie con la acción principal, ancha y dorada como «Continuar»
 * en la reserva.
 */

export interface PanelStepperProps {
  model: AppointmentModel;
  ctx: ModelContext;
  /** Volver clicables los pasos hechos y el actual (la versión «Paso a paso»). */
  onStepClick?: (index: number) => void;
}

export function PanelStepper({ model, ctx, onStepClick }: PanelStepperProps) {
  const t = useAppT();
  const index = trackIndexOf(model);
  if (index < 0) return null;
  const clock = (date: Date | null) => (date ? formatClock(date, ctx.intl) : undefined);
  const times: Record<string, string | undefined> = {
    scheduled: formatClock(appointmentStart(model.appointment), ctx.intl),
    arrived: clock(model.stepTimes.arrived),
    seated: clock(model.stepTimes.seated),
    paid: clock(model.stepTimes.paid),
  };
  return (
    <Stepper
      size="sm"
      aria-label={t("calendar.detail.track")}
      current={model.appointment.status === "paid" ? TRACK.length : index}
      onStepClick={onStepClick}
      steps={TRACK.map((status) => ({ id: status, label: t(status === "scheduled" ? "calendar.detail.trackScheduled" : STATUS_KEYS[status]), description: times[status] }))}
    />
  );
}

/**
 * Lo que el momento pide además del titular: antes de cobrar, lo que el
 * cliente pidió al reservar; al terminar, el ticket; cobrada (o cerrada sin
 * atender), agendar la próxima ahí mismo.
 */
export function StageBlock({ model, ctx }: { model: AppointmentModel; ctx: ModelContext }) {
  const stage = model.playbook.stage;
  if (stage === "paid" || stage === "noShow" || stage === "cancelled") return <NextVisitBooker model={model} ctx={ctx} />;
  if (stage === "toCollect") return <TicketSummary model={model} ctx={ctx} />;
  return showsRequest(model) ? <BookingRequest model={model} /> : null;
}

/** Las citas enlazadas y enlazar otra: van con la cita, en la página o el bloque que la muestra. */
export function LinkedBlock({ model, ctx, linked = [], linkCandidates = [], onSelectAppointment, onUnlink, onLink, onShowLinked }: AppointmentLinkProps & { model: AppointmentModel; ctx: ModelContext }) {
  return (
    <>
      {linked.length > 1 && onSelectAppointment && <AppointmentLinkSection linked={linked} current={model.appointment} ctx={ctx} onSelect={onSelectAppointment} onUnlink={onUnlink} onShowLinked={onShowLinked} />}
      {onLink && isActive(model.appointment) && <LinkPicker current={model.appointment} candidates={linkCandidates} ctx={ctx} onLink={onLink} />}
    </>
  );
}

/** El pie: la acción principal ancha y dorada; lo demás, al menú. */
export function PanelFooter({ model }: { model: AppointmentModel }) {
  return (
    <footer className="flex shrink-0 items-center gap-2 border-t border-border/60 px-5 py-4" data-testid="appointment-primary">
      <ActionButton model={model} action={mainAction(model)} variant="default" size="lg" className="flex-1" />
      <MoreActionsMenu model={model} actions={restActions(model)} />
    </footer>
  );
}
