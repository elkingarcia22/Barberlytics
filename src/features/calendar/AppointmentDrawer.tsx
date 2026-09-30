import * as React from "react";
import { Armchair, Ban, CheckCheck, HandCoins, LogIn, Menu, UserX } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { DrawerShell } from "@/components/overlays";
import { ThemaTabs } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Text } from "@/components/typography";
import { AppointmentStatusBadge, ClientTypeBadge, PersonAvatar } from "./calendarShared";
import { useOpenKey } from "./calendarFormat";
import { findClient, isUnpaid, type ModelContext } from "./calendarModel";
import { AppointmentSummaryTab } from "./appointmentTabs/AppointmentSummaryTab";
import { AppointmentNotesTab } from "./appointmentTabs/AppointmentNotesTab";
import { AppointmentClientTab } from "./appointmentTabs/AppointmentClientTab";
import { AppointmentHistoryTab } from "./appointmentTabs/AppointmentHistoryTab";
import type { Appointment, AppointmentStatus } from "./types";

/**
 * El detalle de una cita: la cabecera con el cliente y su estado, el menú
 * Acciones con el recorrido completo (Barbero listo, Ingresar, Sentado,
 * Cobrar, No se presentó, Cancelar) y las cuatro pestañas de producción:
 * Resumen, Notas, Cliente e Historial.
 */

export interface AppointmentDrawerProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctx: ModelContext;
  branchId: string;
  onStatus: (appointment: Appointment, status: AppointmentStatus) => void;
  onBarberReady: (appointment: Appointment) => void;
  onPay: (appointment: Appointment) => void;
  onDuration: (appointment: Appointment, minutes: number) => void;
  onCancel: (appointment: Appointment) => void;
  onNoShow: (appointment: Appointment) => void;
  onOpenClient: (clientId: string) => void;
}

type Tab = "summary" | "notes" | "client" | "history";

export function AppointmentDrawer(props: AppointmentDrawerProps) {
  return <AppointmentPanel key={`${useOpenKey(props.open)}-${props.appointment?.id ?? ""}`} {...props} />;
}

function AppointmentPanel({ appointment, open, onOpenChange, ctx, branchId, onStatus, onBarberReady, onPay, onDuration, onCancel, onNoShow, onOpenClient }: AppointmentDrawerProps) {
  const t = useAppT();
  const [tab, setTab] = React.useState<Tab>("summary");

  const client = appointment ? findClient(ctx.catalog, appointment.clientId) : undefined;
  const clientName = client?.name ?? t("calendar.clientType.walkin");
  const unpaid = appointment ? isUnpaid(appointment) : false;

  return (
    <DrawerShell open={open} onOpenChange={onOpenChange} size="lg" title={t("calendar.detail.title")} description={client?.phone ? `${t("calendar.phone")} · ${client.phone}` : undefined}>
      {appointment && (
        <div className="space-y-4" data-testid="appointment-drawer">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <PersonAvatar name={clientName} size="lg" />
              <div className="min-w-0">
                <Text weight="semibold" className="truncate">
                  {clientName}
                </Text>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {client && client.type !== "walkin" && <ClientTypeBadge type={client.type} />}
                  <AppointmentStatusBadge status={appointment.status} />
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="appointment-actions">
                  <Menu /> {t("calendar.detail.actions")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled={!unpaid || appointment.barberReady} onSelect={() => onBarberReady(appointment)}>
                  <CheckCheck className="size-4" /> {t("calendar.step.ready")}
                </DropdownMenuItem>
                <DropdownMenuItem disabled={appointment.status !== "scheduled"} onSelect={() => onStatus(appointment, "arrived")}>
                  <LogIn className="size-4" /> {t("calendar.step.checkIn")}
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!["scheduled", "arrived"].includes(appointment.status)} onSelect={() => onStatus(appointment, "seated")}>
                  <Armchair className="size-4" /> {t("calendar.step.seat")}
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!unpaid} onSelect={() => onPay(appointment)}>
                  <HandCoins className="size-4" /> {t("calendar.step.pay")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={!unpaid} onSelect={() => onNoShow(appointment)}>
                  <UserX className="size-4" /> {t("calendar.step.noShow")}
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!unpaid} variant="destructive" onSelect={() => onCancel(appointment)}>
                  <Ban className="size-4" /> {t("calendar.step.cancel")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <ThemaTabs
            className="mb-2"
            fitContent
            tabs={[
              { id: "summary", label: t("calendar.tab.summary") },
              { id: "notes", label: t("calendar.tab.notes"), badge: client?.notes.length ?? 0 },
              { id: "client", label: t("calendar.tab.client") },
              { id: "history", label: t("calendar.tab.history"), badge: appointment.history.length },
            ]}
            activeTabId={tab}
            onTabChange={(id) => setTab(id as Tab)}
          />

          {tab === "summary" && <AppointmentSummaryTab appointment={appointment} ctx={ctx} onStatus={onStatus} onPay={onPay} onDuration={onDuration} />}
          {tab === "notes" && <AppointmentNotesTab client={client ?? null} branchId={branchId} />}
          {tab === "client" && <AppointmentClientTab client={client ?? null} appointment={appointment} ctx={ctx} onOpenClient={onOpenClient} />}
          {tab === "history" && <AppointmentHistoryTab appointment={appointment} ctx={ctx} />}
        </div>
      )}
    </DrawerShell>
  );
}
