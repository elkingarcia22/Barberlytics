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
import { AppointmentClipperTab } from "./appointmentTabs/AppointmentClipperTab";
import { AppointmentNotesTab } from "./appointmentTabs/AppointmentNotesTab";
import { AppointmentClientTab } from "./appointmentTabs/AppointmentClientTab";
import { AppointmentHistoryTab } from "./appointmentTabs/AppointmentHistoryTab";
import type { Appointment, AppointmentPatch, AppointmentStatus } from "./types";

/**
 * El panel de una cita. Se abre al lado de la agenda: en la cabecera, quién
 * es (avatar, nombre y día); debajo, las pestañas.
 *
 * - Resumen: en qué va la cita, sus alertas, la cita en filas y, al final,
 *   lo que toca hacer ahora, que cambia con su estado (llamar si va tarde,
 *   ingresar, sentar, cobrar, agendar la próxima).
 * - Clipper: lo que sugiere el agente, aparte para que se lea como IA.
 * - Notas, Cliente e Historial: el resto, por tema.
 */

export interface AppointmentDrawerProps {
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
  /** Las citas de su visita (servicios añadidos), en orden; vacío si va suelta. */
  visit?: readonly Appointment[];
  /** Mirar otra cita de la misma visita. */
  onSelectAppointment?: (appointment: Appointment) => void;
  /** Separar la visita en citas independientes. */
  onSeparateVisit?: (visit: readonly Appointment[]) => void;
}

type Tab = "summary" | "clipper" | "notes" | "client" | "history";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function AppointmentDrawer(props: AppointmentDrawerProps) {
  // Pasar a otra cita de la misma visita no remonta el panel: sigue en la misma pestaña.
  const visitKey = props.visit && props.visit.length > 1 ? `visit-${props.visit[0].id}` : (props.appointment?.id ?? "");
  return <AppointmentPanel key={`${useOpenKey(props.open)}-${visitKey}`} {...props} />;
}

function AppointmentPanel({ appointment, open, onOpenChange, ctx, onOpenClient, onPatch, onRebook, visit, onSelectAppointment, onSeparateVisit, ...actions }: AppointmentDrawerProps) {
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
        <div className="space-y-5" data-testid="appointment-drawer">
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

          {tab === "summary" && <AppointmentSummaryTab key={appointment.id} appointment={appointment} ctx={ctx} onPatch={onPatch} onRebook={onRebook} onOpenClient={onOpenClient} visit={visit} onSelectAppointment={onSelectAppointment} onSeparateVisit={onSeparateVisit} {...actions} />}
          {tab === "clipper" && <AppointmentClipperTab appointment={appointment} ctx={ctx} onPatch={onPatch} onRebook={onRebook} />}
          {tab === "notes" && <AppointmentNotesTab client={client ?? null} />}
          {tab === "client" && <AppointmentClientTab client={client ?? null} appointment={appointment} ctx={ctx} onOpenClient={onOpenClient} />}
          {tab === "history" && <AppointmentHistoryTab appointment={appointment} ctx={ctx} />}
        </div>
      )}
    </SidePanelShell>
  );
}
