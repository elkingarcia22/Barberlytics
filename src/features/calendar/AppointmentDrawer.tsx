import { format } from "date-fns";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { SidePanelShell } from "@/components/overlays";
import { formatClock } from "@/components/scheduling";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { useOpenKey } from "./calendarFormat";
import { appointmentEnd, appointmentStart, durationLabel, type ModelContext } from "./calendarModel";
import type { CreateAppointmentInitial } from "./CreateAppointmentDrawer";
import type { AppointmentLinkProps } from "./appointmentTabs/AppointmentLinkSection";
import type { Appointment, AppointmentPatch, AppointmentStatus } from "./types";
import { useAppointmentModel } from "./appointmentPanel/useAppointmentModel";
import { AppointmentPanelBody, type PanelPage } from "./appointmentPanel/PanelBody";
import { usePanelPages } from "./appointmentPanel/panelHooks";
import { PanelHeaderActions } from "./appointmentPanel/StageParts";

/**
 * El panel de una cita. Se abre al lado de la agenda: en la cabecera, cuándo
 * es (el día y la hora, de inicio a fin); el cliente va dentro, como una
 * tarjeta más de la cita. Debajo, lo que pide el momento de la cita
 * (`appointmentPanel/PanelBody.tsx`, docs/investigacion-modulos/panel-de-cita.md).
 */

export interface AppointmentDrawerProps extends AppointmentLinkProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctx: ModelContext;
  onStatus: (appointment: Appointment, status: AppointmentStatus) => void;
  onBarberReady: (appointment: Appointment) => void;
  onPay: (appointment: Appointment) => void;
  /** Cambiar el servicio, el barbero, la hora, la duración o la nota. */
  onPatch: (appointment: Appointment, patch: AppointmentPatch) => void;
  /** Agendar la siguiente visita con lo de esta ya puesto. */
  onRebook: (initial: CreateAppointmentInitial) => void;
  onCancel: (appointment: Appointment) => void;
  onNoShow: (appointment: Appointment) => void;
  onOpenClient: (clientId: string) => void;
  /** Abrir ya en una página del panel (el recibo, justo después de cobrar). */
  initialPage?: PanelPage;
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function AppointmentDrawer(props: AppointmentDrawerProps) {
  // Pasar a otra cita del mismo grupo no remonta el panel: sigue en la misma página.
  const panelKey = props.linked && props.linked.length > 1 && props.appointment?.linkId ? `link-${props.appointment.linkId}` : (props.appointment?.id ?? "");
  const key = `${useOpenKey(props.open)}-${panelKey}`;
  if (!props.appointment) return null;
  return <AppointmentPanel key={key} {...props} appointment={props.appointment} />;
}

function AppointmentPanel(props: AppointmentDrawerProps & { appointment: Appointment }) {
  const { appointment, open, onOpenChange, ctx, onOpenClient, onPatch } = props;
  const t = useAppT();
  const { locale } = useLocale();
  const model = useAppointmentModel(appointment, ctx, props);
  const pages = usePanelPages<PanelPage>(props.initialPage ?? null);
  const start = appointmentStart(appointment);
  const day = capitalize(format(start, "EEEE d 'de' MMMM", { locale: calendarLocale(locale) }));
  const time = t("calendar.panel.header.time", { from: formatClock(start, ctx.intl), to: formatClock(appointmentEnd(appointment), ctx.intl), duration: durationLabel(appointment.durationMin) });

  return (
    <SidePanelShell open={open} onOpenChange={onOpenChange} size="lg" title={day} description={time} leading={<IconTile size="lg" shape="circle" tone="neutral" icon={<ThemaIcon name="calendar" />} />}
      headerActions={<PanelHeaderActions model={model} ctx={ctx} historyOpen={pages.page === "history"} onOpenHistory={() => (pages.page === "history" ? pages.back() : pages.open("history"))} />}
    >
      <div className="space-y-5" data-testid="appointment-drawer">
        <AppointmentPanelBody pages={pages} model={model} ctx={ctx} onPatch={onPatch} onOpenClient={onOpenClient} linked={props.linked} linkCandidates={props.linkCandidates} onSelectAppointment={props.onSelectAppointment} onUnlink={props.onUnlink} onLink={props.onLink} onShowLinked={props.onShowLinked} />
      </div>
    </SidePanelShell>
  );
}
