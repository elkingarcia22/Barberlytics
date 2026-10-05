import * as React from "react";
import { useAppT } from "@/app/i18n";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { RowContextMenu, type RowAction } from "@/components/data-display";
import { Text } from "@/components/typography";
import { minutesOfDay, scheduleColorClass, ScheduleColorDot, ScheduleMarkers } from "@/components/scheduling";
import { cn } from "@/lib/utils";
import { AppointmentStatusBadge, ClientAvatar, ClientTypeBadge } from "./calendarShared";
import { appointmentRange, appointmentStart, hasFilters, matchesFilters, findBarber, findClient, toEvent, visibleBarbers, type AgendaFilters, type ModelContext } from "./calendarModel";

const NO_FILTERS: AgendaFilters = { stages: [], serviceIds: [] };
import type { Appointment, CalendarDay, TeamFilter } from "./types";

/**
 * La vista Agenda: las citas del día una debajo de otra, repartidas en
 * mañana, tarde y noche, con el cliente, el servicio, el barbero, el estado
 * y el siguiente paso a mano. Sirve para repasar el día sin columnas. Cada
 * fila sigue los mismos ajustes de tarjeta que la rejilla del día.
 */

export interface CalendarAgendaViewProps {
  date: Date;
  team: TeamFilter;
  day: CalendarDay;
  ctx: ModelContext;
  /** Los filtros puestos (estado, servicio): solo se listan las citas que pasan. */
  filters?: AgendaFilters;
  onClearFocus?: () => void;
  onOpenAppointment: (appointment: Appointment) => void;
  onNextStep: (appointment: Appointment) => void;
  /** El clic derecho sobre una cita: sus acciones. */
  appointmentActions?: (appointment: Appointment) => readonly RowAction[];
}

const AFTERNOON_FROM = 12 * 60;
const EVENING_FROM = 18 * 60;

export function CalendarAgendaView({ date, team, day, ctx, filters = NO_FILTERS, onClearFocus, onOpenAppointment, onNextStep, appointmentActions }: CalendarAgendaViewProps) {
  const t = useAppT();
  const systemT = useT();
  const barberIds = React.useMemo(() => new Set(visibleBarbers(ctx.catalog.barbers, team, date).map((barber) => barber.id)), [ctx.catalog.barbers, team, date]);
  const appointments = React.useMemo(
    () =>
      day.appointments
        .filter((item) => barberIds.has(item.barberId) && matchesFilters(item, filters, ctx.now, ctx.catalog))
        .sort((a, b) => a.start.localeCompare(b.start)),
    [day.appointments, barberIds, filters, ctx.now, ctx.catalog]
  );

  if (appointments.length === 0 && hasFilters(filters)) {
    return (
      <EmptyState
        icon="calendar"
        title={t("calendar.pulse.focusEmpty")}
        description={t("calendar.pulse.focusEmptyHint")}
        action={onClearFocus ? <Button onClick={onClearFocus}>{t("calendar.pulse.clear")}</Button> : undefined}
        data-testid="calendar-agenda-focus-empty"
      />
    );
  }

  if (appointments.length === 0) {
    return <EmptyState icon="calendar" title={t("calendar.agenda.empty")} description={t("calendar.agenda.emptyHint")} data-testid="calendar-agenda-empty" />;
  }

  const groups = [
    { id: "morning", label: systemT("schedule.morning"), items: appointments.filter((item) => minutesOfDay(appointmentStart(item)) < AFTERNOON_FROM) },
    { id: "afternoon", label: systemT("schedule.afternoon"), items: appointments.filter((item) => minutesOfDay(appointmentStart(item)) >= AFTERNOON_FROM && minutesOfDay(appointmentStart(item)) < EVENING_FROM) },
    { id: "evening", label: systemT("schedule.evening"), items: appointments.filter((item) => minutesOfDay(appointmentStart(item)) >= EVENING_FROM) },
  ].filter((group) => group.items.length > 0);

  return (
    <div className={cn("space-y-6", ctx.card?.vivid && "schedule-vivid")} data-testid="calendar-agenda">
      {groups.map((group) => (
        <section key={group.id} aria-label={group.label} className="space-y-2">
          <Text variant="label" tone="muted" className="uppercase tracking-wide">
            {group.label} · {group.items.length}
          </Text>
          <ListItemGroup>
            {group.items.map((appointment) => (
              <AgendaRow
                key={appointment.id}
                appointment={appointment}
                ctx={ctx}
                onOpen={onOpenAppointment}
                onNextStep={onNextStep}
                actions={appointmentActions?.(appointment) ?? []}
              />
            ))}
          </ListItemGroup>
        </section>
      ))}
      <Text variant="caption" className="text-center">
        {t("calendar.agenda.noMore")}
      </Text>
    </div>
  );
}

interface AgendaRowProps {
  appointment: Appointment;
  ctx: ModelContext;
  onOpen: (appointment: Appointment) => void;
  onNextStep: (appointment: Appointment) => void;
  actions: readonly RowAction[];
}

/**
 * Una cita de la lista. Sale del mismo `toEvent` que la tarjeta de la rejilla,
 * así que los ajustes de «Cómo se ven las tarjetas» —qué cuenta, qué iconos,
 * de qué se tiñe y si el color es pastel o vivo— valen igual en las dos vistas.
 * Lo único propio de la lista es el barbero, que aquí no da la columna.
 */
function AgendaRow({ appointment, ctx, onOpen, onNextStep, actions }: AgendaRowProps) {
  const event = toEvent(appointment, ctx);
  const client = findClient(ctx.catalog, appointment.clientId);
  const barber = findBarber(ctx.catalog, appointment.barberId);
  const clientName = event.title;
  const tint = event.muted ? null : event.fill === "category" && event.color !== undefined ? scheduleColorClass(event.color) : event.fill === "tone" ? `schedule-tone-${event.tone ?? "neutral"}` : null;
  // Sin teñir, el servicio se reconoce por su punto de color, como en la tarjeta.
  const dot = !tint && event.fill !== "category" && event.color !== undefined ? <ScheduleColorDot color={event.color} className="size-2.5" /> : null;
  const description = [event.hideTime ? null : appointmentRange(appointment, ctx.intl), event.subtitle, barber?.name].filter(Boolean).join(" · ");

  return (
    <RowContextMenu rowLabel={clientName} actions={actions}>
      <div className="contents">
        <ListItem
          className={cn(tint && cn("schedule-pastel", tint), event.muted && "opacity-60")}
          leading={<ClientAvatar client={client} name={clientName} />}
          title={
            <span className="flex items-center gap-2">
              {dot}
              <span data-card-ink className={cn("truncate", event.muted && "line-through")}>
                {clientName}
              </span>
              {event.markers && event.markers.length > 0 && <ScheduleMarkers markers={event.markers} />}
              {event.badge && client && client.type !== "walkin" && <ClientTypeBadge type={client.type} />}
            </span>
          }
          description={description || undefined}
          meta={event.status ? <AppointmentStatusBadge status={appointment.status} /> : undefined}
          actions={
            event.action ? (
              <Button size="sm" variant="outline" onClick={() => onNextStep(appointment)} aria-label={`${event.action.label}: ${clientName}`}>
                {event.action.label}
              </Button>
            ) : undefined
          }
          onClick={() => onOpen(appointment)}
        />
      </div>
    </RowContextMenu>
  );
}
