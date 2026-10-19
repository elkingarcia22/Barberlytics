import { CalendarX2, Palmtree, Stethoscope, UserRound } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { EmptyState } from "@/components/feedback";
import { formatClockRange, parseClock, atMinutes } from "@/components/scheduling";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/utility/IconTile";
import { ABSENCE_KIND_KEYS, type Absence } from "@/features/team/workforce";
import { AppointmentStatusBadge, ClientAvatar, ClientTypeBadge, PersonAvatar } from "../calendarShared";
import { appointmentRange, findBarber, findClient, isActive, nextStep, servicesOf, type ModelContext } from "../calendarModel";
import { BLOCK_CATEGORY_KEYS, type Appointment, type TimeBlock } from "../types";
import { clientsOf } from "./dayPanelModel";

/**
 * Las cuatro listas del panel del día: las citas (con su paso siguiente si el
 * día es hoy), los clientes que vienen, los bloqueos y quién falta. Cada fila
 * lleva a donde se trabaja: la cita en la agenda, la ficha del cliente, la
 * revisión de la ausencia o del bloqueo.
 */

const KIND_ICON = { vacation: Palmtree, sick: Stethoscope, personal: UserRound } as const;

export function DayAppointments({ appointments, ctx, isToday, onOpen }: { appointments: readonly Appointment[]; ctx: ModelContext; isToday: boolean; onOpen: (appointment: Appointment) => void }) {
  const t = useAppT();
  if (appointments.length === 0) return <EmptyState icon="calendar" title={t("calendar.dayPanel.empty.appointments")} data-testid="day-panel-empty" />;
  return (
    <ListItemGroup>
      {appointments.map((appointment) => {
        const client = findClient(ctx.catalog, appointment.clientId);
        const barber = findBarber(ctx.catalog, appointment.barberId);
        const name = client?.name ?? t("calendar.clientType.walkin");
        const step = isToday && isActive(appointment) ? nextStep(appointment.status) : null;
        return (
          <ListItem
            key={appointment.id}
            size="sm"
            data-testid={`day-panel-appointment-${appointment.id}`}
            onClick={() => onOpen(appointment)}
            leading={<ClientAvatar client={client} name={name} size="sm" />}
            title={name}
            description={`${appointmentRange(appointment, ctx.intl)} · ${servicesOf(ctx.catalog, appointment)
              .map((service) => service.name)
              .join(" + ")}${barber ? ` · ${barber.name.split(" ")[0]}` : ""}`}
            meta={<AppointmentStatusBadge status={appointment.status} />}
            actions={
              step && ctx.onNextStep ? (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={(event) => {
                    event.stopPropagation();
                    ctx.onNextStep?.(appointment);
                  }}
                >
                  {t(step.labelKey)}
                </Button>
              ) : undefined
            }
          />
        );
      })}
    </ListItemGroup>
  );
}

export function DayClients({ appointments, ctx, onOpenClient }: { appointments: readonly Appointment[]; ctx: ModelContext; onOpenClient: (clientId: string) => void }) {
  const t = useAppT();
  const clients = clientsOf(appointments).map((item) => ({ ...item, client: findClient(ctx.catalog, item.clientId) }));
  if (clients.length === 0) return <EmptyState icon="users" title={t("calendar.dayPanel.empty.clients")} />;
  return (
    <ListItemGroup>
      {clients.map(({ clientId, client, first, count }) => {
        const name = client?.name ?? t("calendar.clientType.walkin");
        const allergy = client?.notes.some((note) => note.kind === "allergy");
        const visits = client ? t("calendar.dayPanel.client.visits", { count: client.visits }) : "";
        const extra = count > 1 ? ` · ${t("calendar.meta.appointments", { count })}` : "";
        return (
          <ListItem
            key={clientId}
            size="sm"
            data-testid={`day-panel-client-${clientId}`}
            onClick={client ? () => onOpenClient(clientId) : undefined}
            leading={<ClientAvatar client={client} name={name} size="sm" />}
            title={name}
            description={`${appointmentRange(first, ctx.intl)}${visits ? ` · ${visits}` : ""}${extra}`}
            meta={
              <span className="flex items-center gap-1.5">
                {allergy && <StatusBadge status="warning" label={t("calendar.dayPanel.client.allergy")} />}
                {client && <ClientTypeBadge type={client.type} />}
              </span>
            }
          />
        );
      })}
    </ListItemGroup>
  );
}

export function DayBlocks({ blocks, ctx, date, onOpen }: { blocks: readonly TimeBlock[]; ctx: ModelContext; date: Date; onOpen: (block: TimeBlock) => void }) {
  const t = useAppT();
  if (blocks.length === 0) return <EmptyState icon="calendar" title={t("calendar.dayPanel.empty.blocks")} />;
  return (
    <ListItemGroup>
      {blocks.map((block) => {
        const barber = findBarber(ctx.catalog, block.barberId);
        const range = formatClockRange(atMinutes(date, parseClock(block.startTime)), atMinutes(date, parseClock(block.endTime)), ctx.intl);
        return (
          <ListItem
            key={block.id}
            size="sm"
            data-testid={`day-panel-block-${block.id}`}
            onClick={() => onOpen(block)}
            leading={barber ? <PersonAvatar name={barber.name} avatarUrl={barber.avatarUrl} size="sm" /> : <IconTile icon={<CalendarX2 />} size="sm" />}
            title={`${t(BLOCK_CATEGORY_KEYS[block.category])} · ${range}`}
            description={[barber?.name, block.description].filter(Boolean).join(" · ")}
            meta={block.status === "pending" ? <StatusBadge status="pending" label={t("calendar.timeOff.pending")} /> : undefined}
          />
        );
      })}
    </ListItemGroup>
  );
}

export function DayAbsences({ absences, onOpen, formatRange }: { absences: readonly Absence[]; onOpen: (absence: Absence) => void; formatRange: (absence: Absence) => string }) {
  const t = useAppT();
  if (absences.length === 0) return <EmptyState icon="users" title={t("calendar.dayPanel.empty.absences")} />;
  return (
    <ListItemGroup>
      {absences.map((absence) => {
        const Icon = KIND_ICON[absence.kind];
        return (
          <ListItem
            key={absence.id}
            size="sm"
            data-testid={`day-panel-absence-${absence.id}`}
            onClick={() => onOpen(absence)}
            leading={<IconTile icon={<Icon />} size="sm" tone={absence.status === "pending" ? "warning" : "neutral"} />}
            title={`${absence.memberName} · ${t(ABSENCE_KIND_KEYS[absence.kind])}`}
            description={formatRange(absence)}
            meta={absence.status === "pending" ? <StatusBadge status="pending" label={t("calendar.timeOff.pending")} /> : <StatusBadge status="completed" label={t("calendar.timeOff.approved")} />}
          />
        );
      })}
    </ListItemGroup>
  );
}
