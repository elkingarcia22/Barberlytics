import { useAppT } from "@/app/i18n";
import { Stepper } from "@/components/navigation";
import { formatClock } from "@/components/scheduling";
import { appointmentStart, isActive, type ModelContext } from "../calendarModel";
import { AppointmentLinkSection, LinkPicker, type AppointmentLinkProps } from "../appointmentTabs/AppointmentLinkSection";
import { STATUS_KEYS } from "../types";
import { TRACK, trackIndexOf } from "./panelLogic";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * El avance arriba (como en el panel de siempre) con la hora real de cada
 * paso, y el bloque de las citas enlazadas.
 */

export function PanelStepper({ model, ctx }: { model: AppointmentModel; ctx: ModelContext }) {
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
      steps={TRACK.map((status) => ({ id: status, label: t(status === "scheduled" ? "calendar.detail.trackScheduled" : STATUS_KEYS[status]), description: times[status] }))}
    />
  );
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
