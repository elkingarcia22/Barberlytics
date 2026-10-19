import { format } from "date-fns";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { SidePanelShell } from "@/components/overlays";
import { ClientAvatar } from "./calendarShared";
import { useOpenKey } from "./calendarFormat";
import { appointmentStart, type ModelContext } from "./calendarModel";
import type { CreateAppointmentInitial } from "./CreateAppointmentDrawer";
import type { AppointmentLinkProps } from "./appointmentTabs/AppointmentLinkSection";
import type { Appointment, AppointmentPatch, AppointmentStatus } from "./types";
import { usePanelVersion } from "./appointmentPanel/panelVersion";
import { PanelVersionPicker } from "./appointmentPanel/PanelParts";
import { useAppointmentModel } from "./appointmentPanel/useAppointmentModel";
import { PanelFooter } from "./appointmentPanel/PanelShared";
import { CardsVersion, MomentVersion } from "./appointmentPanel/PanelVersions";

/**
 * El panel de una cita. Se abre al lado de la agenda: en la cabecera, quién
 * es (avatar, nombre y día); debajo, lo que pide el momento de la cita.
 *
 * Tiene dos diseños para elegir con el selector de arriba —«Arma la cita» y
 * «Tarjeta del momento»— (`appointmentPanel/`, docs/investigacion-modulos/
 * panel-de-cita.md). Los dos leen la misma cita con `useAppointmentModel` y
 * corren las mismas acciones. El de pestañas se quitó el 2026-10-18.
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
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function AppointmentDrawer(props: AppointmentDrawerProps) {
  // Pasar a otra cita del mismo grupo no remonta el panel: sigue en la misma página.
  const panelKey = props.linked && props.linked.length > 1 && props.appointment?.linkId ? `link-${props.appointment.linkId}` : (props.appointment?.id ?? "");
  const [version] = usePanelVersion();
  const key = `${useOpenKey(props.open)}-${panelKey}`;
  if (!props.appointment) return null;
  return <AppointmentVersionPanel key={`${key}-${version}`} {...props} appointment={props.appointment} />;
}

/** Los dos diseños: mismo marco y mismos datos; cambia cómo se ordena lo de adentro. */
function AppointmentVersionPanel(props: AppointmentDrawerProps & { appointment: Appointment }) {
  const { appointment, open, onOpenChange, ctx, onOpenClient, onPatch } = props;
  const { locale } = useLocale();
  const [version] = usePanelVersion();
  const model = useAppointmentModel(appointment, ctx, props);
  const day = capitalize(format(appointmentStart(appointment), "EEEE d 'de' MMMM", { locale: calendarLocale(locale) }));
  const versionProps = { model, ctx, onPatch, onOpenClient, linked: props.linked, linkCandidates: props.linkCandidates, onSelectAppointment: props.onSelectAppointment, onUnlink: props.onUnlink, onLink: props.onLink, onShowLinked: props.onShowLinked };
  const stage = model.playbook.stage;
  // Cobrada o cerrada sin atender, la próxima se agenda en el cuerpo; en «Tarjeta del momento» la acción vive en la tarjeta.
  const hasFooter = version !== "moment" && stage !== "paid" && stage !== "noShow" && stage !== "cancelled";

  return (
    <SidePanelShell
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={model.clientName}
      description={day}
      leading={<ClientAvatar client={model.client} name={model.clientName} size="lg" />}
      footer={hasFooter ? <PanelFooter model={model} /> : undefined}
    >
      <div className="space-y-5" data-testid="appointment-drawer" data-panel-version={version}>
        <PanelVersionPicker />
        {version === "cards" && <CardsVersion {...versionProps} />}
        {version === "moment" && <MomentVersion {...versionProps} />}
      </div>
    </SidePanelShell>
  );
}
