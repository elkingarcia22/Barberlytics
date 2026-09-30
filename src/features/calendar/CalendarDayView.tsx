import * as React from "react";
import { format } from "date-fns";
import { Ban, Clock, UserRound, Users } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback";
import { ResourceDayGrid, type ScheduleDrop, type ScheduleEvent, type ScheduleSlot } from "@/components/scheduling";
import { blockToEvent, isActive, toEvent, toResource, visibleBarbers, type ModelContext } from "./calendarModel";
import type { Appointment, Barber, CalendarDay, TeamFilter } from "./types";

/**
 * La vista Día: la rejilla por barbero con lo que se puede hacer desde ella
 * —agendar en un hueco, abrir una cita, moverla, estirarla— y el aviso de
 * «Nadie trabaja este día» cuando el filtro no deja a nadie en pantalla.
 */

export interface CalendarDayViewProps {
  date: Date;
  team: TeamFilter;
  day: CalendarDay;
  ctx: ModelContext;
  now?: Date;
  onSlotClick: (slot: ScheduleSlot) => void;
  onOpenAppointment: (appointment: Appointment) => void;
  onMove: (appointment: Appointment, drop: ScheduleDrop) => void;
  onResize: (appointment: Appointment, drop: ScheduleDrop) => void;
  onSeeAll: () => void;
  onConfigureHours: () => void;
  onViewBarber: (barber: Barber) => void;
  onBlockBarber: (barber: Barber) => void;
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function CalendarDayView({ date, team, day, ctx, now, onSlotClick, onOpenAppointment, onMove, onResize, onSeeAll, onConfigureHours, onViewBarber, onBlockBarber }: CalendarDayViewProps) {
  const t = useAppT();
  const { locale } = useLocale();
  const barbers = React.useMemo(() => visibleBarbers(ctx.catalog.barbers, team, date), [ctx.catalog.barbers, team, date]);
  const byId = React.useMemo(() => new Map(day.appointments.map((item) => [item.id, item])), [day.appointments]);

  const resources = React.useMemo(() => barbers.map((barber) => toResource(barber, date, day.appointments, ctx)), [barbers, date, day.appointments, ctx]);
  const events = React.useMemo<ScheduleEvent[]>(
    () => [
      ...day.appointments.filter(isActive).map((appointment) => toEvent(appointment, ctx)),
      ...day.blocks.map((block) => blockToEvent(block, date, ctx)),
    ],
    [day.appointments, day.blocks, date, ctx]
  );

  if (barbers.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={t("calendar.nobody.title")}
        description={t("calendar.nobody.hint", { date: capitalize(format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: calendarLocale(locale) })) })}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={onSeeAll} data-testid="calendar-see-all">
              <Users /> {t("calendar.nobody.seeAll")}
            </Button>
            <Button variant="outline" onClick={onConfigureHours}>
              <Clock /> {t("calendar.nobody.configure")}
            </Button>
          </div>
        }
        data-testid="calendar-nobody"
      />
    );
  }

  return (
    <ResourceDayGrid
      date={date}
      resources={resources}
      events={events}
      now={now}
      onSlotClick={onSlotClick}
      onEventClick={(event) => {
        const appointment = byId.get(event.id);
        if (appointment) onOpenAppointment(appointment);
      }}
      onEventMove={(event, drop) => {
        const appointment = byId.get(event.id);
        if (appointment) onMove(appointment, drop);
      }}
      onEventResize={(event, drop) => {
        const appointment = byId.get(event.id);
        if (appointment) onResize(appointment, drop);
      }}
      resourceActions={(resource) => {
        const barber = ctx.catalog.barbers.find((item) => item.id === resource.id);
        if (!barber) return [];
        return [
          { id: "view", label: t("calendar.barberMenu.view"), icon: <UserRound className="size-4" />, onSelect: () => onViewBarber(barber) },
          { id: "block", label: t("calendar.barberMenu.block"), icon: <Ban className="size-4" />, onSelect: () => onBlockBarber(barber) },
        ];
      }}
    />
  );
}
