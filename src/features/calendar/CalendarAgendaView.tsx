import * as React from "react";
import { CalendarX2 } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { Text } from "@/components/typography";
import { minutesOfDay } from "@/components/scheduling";
import { AppointmentStatusBadge, ClientTypeBadge, PersonAvatar } from "./calendarShared";
import { appointmentRange, appointmentStart, findBarber, findClient, nextStep, servicesOf, servicesPrice, visibleBarbers, type ModelContext } from "./calendarModel";
import type { Appointment, CalendarDay, TeamFilter } from "./types";

/**
 * La vista Agenda: las citas del día una debajo de otra, repartidas en
 * mañana, tarde y noche, con el cliente, el servicio, el barbero, el estado
 * y el siguiente paso a mano. Sirve para repasar el día sin columnas.
 */

export interface CalendarAgendaViewProps {
  date: Date;
  team: TeamFilter;
  day: CalendarDay;
  ctx: ModelContext;
  onOpenAppointment: (appointment: Appointment) => void;
  onNextStep: (appointment: Appointment) => void;
}

const AFTERNOON_FROM = 12 * 60;
const EVENING_FROM = 18 * 60;

export function CalendarAgendaView({ date, team, day, ctx, onOpenAppointment, onNextStep }: CalendarAgendaViewProps) {
  const t = useAppT();
  const systemT = useT();
  const barberIds = React.useMemo(() => new Set(visibleBarbers(ctx.catalog.barbers, team, date).map((barber) => barber.id)), [ctx.catalog.barbers, team, date]);
  const appointments = React.useMemo(
    () => day.appointments.filter((item) => barberIds.has(item.barberId)).sort((a, b) => a.start.localeCompare(b.start)),
    [day.appointments, barberIds]
  );

  if (appointments.length === 0) {
    return <EmptyState icon={CalendarX2} title={t("calendar.agenda.empty")} description={t("calendar.agenda.emptyHint")} data-testid="calendar-agenda-empty" />;
  }

  const groups = [
    { id: "morning", label: systemT("schedule.morning"), items: appointments.filter((item) => minutesOfDay(appointmentStart(item)) < AFTERNOON_FROM) },
    { id: "afternoon", label: systemT("schedule.afternoon"), items: appointments.filter((item) => minutesOfDay(appointmentStart(item)) >= AFTERNOON_FROM && minutesOfDay(appointmentStart(item)) < EVENING_FROM) },
    { id: "evening", label: systemT("schedule.evening"), items: appointments.filter((item) => minutesOfDay(appointmentStart(item)) >= EVENING_FROM) },
  ].filter((group) => group.items.length > 0);

  return (
    <div className="space-y-6" data-testid="calendar-agenda">
      {groups.map((group) => (
        <section key={group.id} aria-label={group.label} className="space-y-2">
          <Text variant="label" tone="muted" className="uppercase tracking-wide">
            {group.label} · {group.items.length}
          </Text>
          <ListItemGroup>
            {group.items.map((appointment) => {
              const client = findClient(ctx.catalog, appointment.clientId);
              const barber = findBarber(ctx.catalog, appointment.barberId);
              const services = servicesOf(ctx.catalog, appointment);
              const step = nextStep(appointment.status);
              const clientName = client?.name ?? t("calendar.clientType.walkin");
              return (
                <ListItem
                  key={appointment.id}
                  leading={<PersonAvatar name={clientName} />}
                  title={
                    <span className="flex items-center gap-2">
                      {clientName}
                      {client && client.type !== "walkin" && <ClientTypeBadge type={client.type} />}
                    </span>
                  }
                  description={`${appointmentRange(appointment, ctx.intl)} · ${services.map((service) => service.name).join(" + ")} · ${ctx.formatMoney(servicesPrice(services))} · ${barber?.name ?? ""}`}
                  meta={<AppointmentStatusBadge status={appointment.status} />}
                  actions={
                    step ? (
                      <Button size="sm" variant="outline" onClick={() => onNextStep(appointment)} aria-label={`${t(step.labelKey)}: ${clientName}`}>
                        {t(step.labelKey)}
                      </Button>
                    ) : undefined
                  }
                  onClick={() => onOpenAppointment(appointment)}
                />
              );
            })}
          </ListItemGroup>
        </section>
      ))}
      <Text variant="caption" className="text-center">
        {t("calendar.agenda.noMore")}
      </Text>
    </div>
  );
}
