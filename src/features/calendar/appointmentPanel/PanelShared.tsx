import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { Stepper } from "@/components/navigation";
import { formatClock } from "@/components/scheduling";
import { appointmentStart, appointmentTotal, isActive, servicesOf, type ModelContext } from "../calendarModel";
import { AppointmentLinkSection, LinkPicker, type AppointmentLinkProps } from "../appointmentTabs/AppointmentLinkSection";
import { STATUS_KEYS } from "../types";
import { TRACK, trackIndexOf } from "./panelLogic";
import { InlineList, PanelField } from "./bookingStyle";
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
 * Las citas enlazadas, solo si las hay, como una tarjeta más de la cita: qué
 * van juntas y su total; abierta, la lista (se elige cuál mirar, se saca una
 * del grupo) y «Ver en la agenda». Enlazar otra se pide desde el «⋯» y se
 * elige aquí, en una lista que se abre en su sitio.
 */
export function LinkedField({ model, ctx, linked = [], onSelectAppointment, onUnlink, onShowLinked }: Pick<AppointmentLinkProps, "linked" | "onSelectAppointment" | "onUnlink" | "onShowLinked"> & { model: AppointmentModel; ctx: ModelContext }) {
  const t = useAppT();
  const [open, setOpen] = React.useState(false);
  if (linked.length < 2 || !onSelectAppointment) return null;
  const total = linked.reduce((sum, item) => sum + appointmentTotal(ctx.catalog, item), 0);
  const names = linked.map((item) => servicesOf(ctx.catalog, item)[0]?.name ?? "—").join(" + ");
  return (
    <>
      <PanelField
        eyebrow={t("calendar.link.linked")}
        value={names}
        detail={t("calendar.link.summary", { count: linked.length, total: ctx.formatMoney(total) })}
        icon="link"
        open={open}
        onOpen={() => setOpen((current) => !current)}
        testId="panel-field-linked"
      />
      {open && (
        <InlineList
          title={t("calendar.link.title", { count: linked.length })}
          onClose={() => setOpen(false)}
          footer={
            onShowLinked ? (
              <Button variant="outline" className="flex-1" onClick={onShowLinked} data-testid="appointment-linked-show">
                <ThemaIcon name="calendar" /> {t("calendar.link.show")}
              </Button>
            ) : undefined
          }
        >
          <AppointmentLinkSection bare linked={linked} current={model.appointment} ctx={ctx} onSelect={onSelectAppointment} onUnlink={onUnlink} />
        </InlineList>
      )}
    </>
  );
}

/** Enlazar otra cita (pedido desde el «⋯»): la lista para elegirla, en su sitio. */
export function LinkPickerField({ model, ctx, linkCandidates = [], onLink, onDone }: { model: AppointmentModel; ctx: ModelContext; linkCandidates?: AppointmentLinkProps["linkCandidates"]; onLink?: AppointmentLinkProps["onLink"]; onDone: () => void }) {
  const t = useAppT();
  if (!onLink || !isActive(model.appointment)) return null;
  return (
    <InlineList title={t("calendar.link.add")} description={t("calendar.link.pickHint")} onClose={onDone}>
      <LinkPicker
        current={model.appointment}
        candidates={linkCandidates}
        ctx={ctx}
        onLink={(appointment, target) => {
          onLink(appointment, target);
          onDone();
        }}
      />
    </InlineList>
  );
}
