import * as React from "react";
import { format } from "date-fns";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { SidePanelShell } from "@/components/overlays";
import { ThemaTabs } from "@/components/navigation";
import { ClientAvatar } from "./calendarShared";
import { useOpenKey } from "./calendarFormat";
import { appointmentStart, findClient, type ModelContext } from "./calendarModel";
import { appointmentInsights } from "./appointmentInsights";
import type { CreateAppointmentInitial } from "./CreateAppointmentDrawer";
import { AppointmentSummaryTab } from "./appointmentTabs/AppointmentSummaryTab";
import type { AppointmentLinkProps } from "./appointmentTabs/AppointmentLinkSection";
import { AppointmentClipperTab } from "./appointmentTabs/AppointmentClipperTab";
import { AppointmentNotesTab } from "./appointmentTabs/AppointmentNotesTab";
import { AppointmentClientTab } from "./appointmentTabs/AppointmentClientTab";
import { AppointmentHistoryTab } from "./appointmentTabs/AppointmentHistoryTab";
import type { Appointment, AppointmentPatch, AppointmentStatus } from "./types";
import { usePanelVersion } from "./appointmentPanel/panelVersion";
import { PanelVersionPicker } from "./appointmentPanel/PanelParts";
import { useAppointmentModel } from "./appointmentPanel/useAppointmentModel";
import { PanelFooter } from "./appointmentPanel/PanelShared";
import { CardsVersion, IndexVersion, MomentVersion, StepsVersion, TabsVersion } from "./appointmentPanel/PanelVersions";

/**
 * El panel de una cita. Se abre al lado de la agenda: en la cabecera, quién
 * es (avatar, nombre y día); debajo, las pestañas.
 *
 * - Resumen: en qué va la cita, sus alertas, la cita en filas y, al final,
 *   lo que toca hacer ahora, que cambia con su estado (llamar si va tarde,
 *   ingresar, sentar, cobrar, agendar la próxima).
 * - Clipper: lo que sugiere el agente, aparte para que se lea como IA.
 * - Notas, Cliente e Historial: el resto, por tema.
 *
 * Arriba, un selector deja comparar ese diseño con cinco propuestas
 * (`appointmentPanel/`, docs/investigacion-modulos/panel-de-cita.md). Todas
 * leen la misma cita con `useAppointmentModel` y corren las mismas acciones.
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

type Tab = "summary" | "clipper" | "notes" | "client" | "history";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function AppointmentDrawer(props: AppointmentDrawerProps) {
  // Pasar a otra cita del mismo grupo no remonta el panel: sigue en la misma pestaña.
  const panelKey = props.linked && props.linked.length > 1 && props.appointment?.linkId ? `link-${props.appointment.linkId}` : (props.appointment?.id ?? "");
  const [version] = usePanelVersion();
  const key = `${useOpenKey(props.open)}-${panelKey}`;
  if (version === "tabs" || !props.appointment) return <AppointmentPanel key={key} {...props} />;
  return <AppointmentVersionPanel key={`${key}-${version}`} {...props} appointment={props.appointment} />;
}

/** Las cinco propuestas: mismo marco y mismos datos; cambia cómo se ordena lo de adentro. */
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
        {version === "index" && <IndexVersion {...versionProps} />}
        {version === "cards" && <CardsVersion {...versionProps} />}
        {version === "tabsNow" && <TabsVersion {...versionProps} />}
        {version === "moment" && <MomentVersion {...versionProps} />}
        {version === "steps" && <StepsVersion {...versionProps} />}
      </div>
    </SidePanelShell>
  );
}

function AppointmentPanel({ appointment, open, onOpenChange, ctx, onOpenClient, onPatch, onRebook, linked, linkCandidates, onSelectAppointment, onUnlink, onLink, onShowLinked, ...actions }: AppointmentDrawerProps) {
  const t = useAppT();
  const { locale } = useLocale();
  const [tab, setTab] = React.useState<Tab>("summary");

  const client = appointment ? findClient(ctx.catalog, appointment.clientId) : undefined;
  const clientName = client?.name ?? t("calendar.clientType.walkin");
  const day = appointment ? capitalize(format(appointmentStart(appointment), "EEEE d 'de' MMMM", { locale: calendarLocale(locale) })) : undefined;
  const insightCount = appointment ? appointmentInsights(appointment, client, ctx.catalog).length : 0;

  return (
    <SidePanelShell
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={appointment ? clientName : t("calendar.detail.title")}
      description={day}
      leading={appointment ? <ClientAvatar client={client} name={clientName} size="lg" /> : undefined}
    >
      {appointment && (
        <div className="space-y-5" data-testid="appointment-drawer" data-panel-version="tabs">
          <PanelVersionPicker />
          {/* Cinco pestañas caben en el panel de escritorio; en un teléfono se deslizan en vez de pisarse. */}
          <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ThemaTabs
              className="mb-0 min-w-[24rem]"
              tabs={[
                { id: "summary", label: t("calendar.tab.summary") },
                { id: "clipper", label: t("agent.name"), badge: insightCount, badgeTone: "ai" },
                { id: "notes", label: t("calendar.tab.notes"), badge: client?.notes.length ?? 0, badgeTone: "neutral" },
                { id: "client", label: t("calendar.tab.client") },
                { id: "history", label: t("calendar.tab.history") },
              ]}
              activeTabId={tab}
              onTabChange={(id) => setTab(id as Tab)}
            />
          </div>

          {tab === "summary" && <AppointmentSummaryTab key={appointment.id} appointment={appointment} ctx={ctx} onPatch={onPatch} onRebook={onRebook} onOpenClient={onOpenClient} linked={linked} linkCandidates={linkCandidates} onSelectAppointment={onSelectAppointment} onUnlink={onUnlink} onLink={onLink} onShowLinked={onShowLinked} {...actions} />}
          {tab === "clipper" && <AppointmentClipperTab appointment={appointment} ctx={ctx} onPatch={onPatch} onRebook={onRebook} />}
          {tab === "notes" && <AppointmentNotesTab client={client ?? null} />}
          {tab === "client" && <AppointmentClientTab client={client ?? null} appointment={appointment} ctx={ctx} onOpenClient={onOpenClient} />}
          {tab === "history" && <AppointmentHistoryTab appointment={appointment} ctx={ctx} />}
        </div>
      )}
    </SidePanelShell>
  );
}
