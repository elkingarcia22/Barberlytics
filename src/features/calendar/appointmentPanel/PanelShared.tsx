import { useAppT } from "@/app/i18n";
import { Stepper } from "@/components/navigation";
import { formatClock } from "@/components/scheduling";
import { appointmentStart, isActive, type ModelContext } from "../calendarModel";
import { AppointmentLinkSection, LinkPicker, type AppointmentLinkProps } from "../appointmentTabs/AppointmentLinkSection";
import { STATUS_KEYS } from "../types";
import { TRACK, trackIndexOf } from "./panelLogic";
import { InlineList } from "./bookingStyle";
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

/**
 * Las citas enlazadas, solo si las hay. Enlazar otra se pide desde el «⋯» de
 * la acción principal y se elige aquí, en una lista que se abre en su sitio.
 */
export function LinkedBlock({ model, ctx, linked = [], linkCandidates = [], onSelectAppointment, onUnlink, onLink, onShowLinked, linking, onLinkingDone }: AppointmentLinkProps & { model: AppointmentModel; ctx: ModelContext; linking: boolean; onLinkingDone: () => void }) {
  const t = useAppT();
  return (
    <>
      {linking && onLink && isActive(model.appointment) && (
        <InlineList title={t("calendar.link.add")} description={t("calendar.link.pickHint")} onClose={onLinkingDone}>
          <LinkPicker
            current={model.appointment}
            candidates={linkCandidates}
            ctx={ctx}
            onLink={(appointment, target) => {
              onLink(appointment, target);
              onLinkingDone();
            }}
          />
        </InlineList>
      )}
      {linked.length > 1 && onSelectAppointment && <AppointmentLinkSection linked={linked} current={model.appointment} ctx={ctx} onSelect={onSelectAppointment} onUnlink={onUnlink} onShowLinked={onShowLinked} />}
    </>
  );
}
