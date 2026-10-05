import * as React from "react";
import { format } from "date-fns";
import { Ban, Clock, Shuffle, UserRound, Users } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ai-interaction";
import { EmptyState } from "@/components/feedback";
import {
  ResourceDayGrid,
  type ScheduleDrop,
  type ScheduleDropValidator,
  type ScheduleEvent,
  type ScheduleResourceAlert,
  type ScheduleSlot,
} from "@/components/scheduling";
import { minutesOfDay, parseClock } from "@/components/scheduling";
import type { RowAction } from "@/components/data-display";
import { appointmentStart, blockToEvent, isActive, matchesFilters, toEvent, toResource, visibleBarbers, type AgendaFilters, type ModelContext } from "./calendarModel";
import type { Appointment, Barber, CalendarDay, TeamFilter, TimeBlock } from "./types";

/**
 * La vista Día: la rejilla por barbero con lo que se puede hacer desde ella
 * —agendar en un hueco, abrir una cita, moverla, estirarla— y el aviso de
 * «Nadie trabaja este día» cuando el filtro no deja a nadie en pantalla.
 *
 * Encima de la rejilla se pueden pintar propuestas (`extraEvents`): huecos
 * sugeridos o a dónde iría cada cita en un reacomodo. Son fantasmas: no se
 * arrastran y tocarlos es aceptar. Las citas que un plan movería se apagan
 * (`fadedIds`) para que se vea el antes y el después a la vez.
 *
 * En pantalla estrecha la agenda se recorre barbero a barbero: una tira de
 * chips arriba elige a quién ver, y la rejilla queda con una sola columna.
 */

export interface CalendarDayViewProps {
  date: Date;
  team: TeamFilter;
  day: CalendarDay;
  ctx: ModelContext;
  now?: Date;
  /** Los filtros puestos (estado, servicio): las citas que no pasan se apagan. */
  filters?: AgendaFilters;
  /** Alto de cada media hora, en píxeles: la densidad elegida. */
  slotHeight?: number;
  /** Propuestas que se dibujan encima de la agenda (huecos sugeridos, reacomodos). */
  extraEvents?: readonly ScheduleEvent[];
  /** Citas que una propuesta movería: se apagan mientras se decide. */
  fadedIds?: ReadonlySet<string>;
  /** Avisos bajo el nombre de un barbero, por id («Hueco 15:00 · 2 en espera»). */
  alerts?: Readonly<Record<string, ScheduleResourceAlert>>;
  validateDrop?: ScheduleDropValidator;
  onDropRejected?: (event: ScheduleEvent, drop: ScheduleDrop, reason: string) => void;
  onSlotClick: (slot: ScheduleSlot) => void;
  onOpenAppointment: (appointment: Appointment) => void;
  /** Tocar un bloqueo: desde ahí se quita. */
  onOpenBlock?: (block: TimeBlock) => void;
  /** El clic derecho sobre una cita o un bloqueo: sus acciones. */
  appointmentActions?: (appointment: Appointment) => readonly RowAction[];
  blockActions?: (block: TimeBlock) => readonly RowAction[];
  /** Tocar una propuesta: aceptarla. */
  onAcceptProposal?: (event: ScheduleEvent) => void;
  onMove: (appointment: Appointment, drop: ScheduleDrop) => void;
  onResize: (appointment: Appointment, drop: ScheduleDrop) => void;
  /** Sin él (un barbero solo ve su columna) no se ofrece ver a todo el equipo. */
  onSeeAll?: () => void;
  /** Sin él (sin permiso sobre Equipo) no se ofrece ir a los horarios. */
  onConfigureHours?: () => void;
  /** Las opciones de la columna que el rol permite: sin la función, la opción no sale. */
  onViewBarber?: (barber: Barber) => void;
  onBlockBarber?: (barber: Barber) => void;
  /** Pedir un plan para la cola de un barbero que va con retraso. */
  onReflowBarber?: (barber: Barber) => void;
  /** En pantalla estrecha, la tira de barberos cambia el filtro de equipo. */
  onTeamChange?: (team: TeamFilter) => void;
}

const NO_FILTERS: AgendaFilters = { stages: [], serviceIds: [] };
const DEFAULT_START_HOUR = 6;
const DEFAULT_END_HOUR = 24;
const MIN_VISIBLE_HOURS = 8;

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function CalendarDayView({
  date,
  team,
  day,
  ctx,
  now,
  filters = NO_FILTERS,
  slotHeight,
  extraEvents = [],
  fadedIds,
  alerts,
  validateDrop,
  onDropRejected,
  onSlotClick,
  onOpenAppointment,
  onOpenBlock,
  appointmentActions,
  blockActions,
  onAcceptProposal,
  onMove,
  onResize,
  onSeeAll,
  onConfigureHours,
  onViewBarber,
  onBlockBarber,
  onReflowBarber,
  onTeamChange,
}: CalendarDayViewProps) {
  const t = useAppT();
  const { locale } = useLocale();
  const barbers = React.useMemo(() => visibleBarbers(ctx.catalog.barbers, team, date), [ctx.catalog.barbers, team, date]);
  const working = React.useMemo(() => visibleBarbers(ctx.catalog.barbers, "working", date), [ctx.catalog.barbers, date]);
  const byId = React.useMemo(() => new Map(day.appointments.map((item) => [item.id, item])), [day.appointments]);

  const resources = React.useMemo(
    () => barbers.map((barber) => ({ ...toResource(barber, date, day.appointments, ctx, day.blocks), alert: alerts?.[barber.id] })),
    [alerts, barbers, date, day.appointments, day.blocks, ctx]
  );
  const events = React.useMemo<ScheduleEvent[]>(
    () => [
      ...day.appointments.filter(isActive).map((appointment) => toEvent(appointment, ctx, { faded: !matchesFilters(appointment, filters, ctx.now, ctx.catalog) || fadedIds?.has(appointment.id) })),
      ...day.blocks.map((block) => blockToEvent(block, date, ctx)),
      ...extraEvents,
    ],
    [day.appointments, day.blocks, date, ctx, filters, fadedIds, extraEvents]
  );

  // La rejilla enseña la jornada real: de una hora antes de que abra el
  // primero a una hora después de que cierre el último (o de la última cita).
  const [startHour, endHour] = React.useMemo(() => {
    const ranges = resources.flatMap((resource) => resource.workingHours ?? []);
    const active = day.appointments.filter(isActive);
    const starts = [...ranges.map((range) => parseClock(range.start)), ...active.map((item) => minutesOfDay(appointmentStart(item)))];
    const ends = [...ranges.map((range) => parseClock(range.end)), ...active.map((item) => minutesOfDay(appointmentStart(item)) + item.durationMin)];
    if (starts.length === 0) return [DEFAULT_START_HOUR, DEFAULT_END_HOUR];
    const first = Math.max(0, Math.floor(Math.min(...starts) / 60) - 1);
    const last = Math.min(24, Math.ceil(Math.max(...ends) / 60) + 1);
    return [first, Math.max(last, first + MIN_VISIBLE_HOURS)];
  }, [resources, day.appointments]);

  if (barbers.length === 0) {
    return (
      <EmptyState
        icon="users"
        title={t("calendar.nobody.title")}
        description={t("calendar.nobody.hint", { date: capitalize(format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: calendarLocale(locale) })) })}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {onSeeAll && (
              <Button onClick={onSeeAll} data-testid="calendar-see-all">
                <Users /> {t("calendar.nobody.seeAll")}
              </Button>
            )}
            {onConfigureHours && (
              <Button variant="outline" onClick={onConfigureHours}>
                <Clock /> {t("calendar.nobody.configure")}
              </Button>
            )}
          </div>
        }
        data-testid="calendar-nobody"
      />
    );
  }

  return (
    <>
      {/* Pantalla estrecha: un barbero a la vez, elegido en la tira. */}
      {onTeamChange && working.length > 1 && (
        <div role="group" aria-label={t("calendar.team")} className="-mx-1 flex shrink-0 gap-1.5 overflow-x-auto px-1 pb-1 md:hidden" data-testid="calendar-barber-strip">
          <Chip size="sm" label={t("calendar.team.all")} selected={team === "working" || team === "all"} tone={team === "working" || team === "all" ? "primary" : "default"} onClick={() => onTeamChange("working")} />
          {working.map((barber) => (
            <Chip key={barber.id} size="sm" label={barber.name.split(" ")[0]} selected={team === barber.id} tone={team === barber.id ? "primary" : "default"} onClick={() => onTeamChange(barber.id)} />
          ))}
        </div>
      )}
      <ResourceDayGrid
        // El estilo vivo de las tarjetas teñidas es un ajuste de la vista: lo activa una clase en la rejilla.
        className={ctx.card?.vivid ? "schedule-vivid" : undefined}
        date={date}
        resources={resources}
        events={events}
        now={now}
        fill
        slotHeight={slotHeight}
        startHour={startHour}
        endHour={Math.min(24, endHour)}
        onSlotClick={onSlotClick}
        onEventClick={(event) => {
          if (event.ghost) {
            onAcceptProposal?.(event);
            return;
          }
          const appointment = byId.get(event.id);
          if (appointment) onOpenAppointment(appointment);
          const block = day.blocks.find((item) => item.id === event.id);
          if (block) onOpenBlock?.(block);
        }}
        eventActions={(event) => {
          const appointment = byId.get(event.id);
          if (appointment) return appointmentActions?.(appointment) ?? [];
          const block = day.blocks.find((item) => item.id === event.id);
          return block ? (blockActions?.(block) ?? []) : [];
        }}
        validateDrop={validateDrop}
        onDropRejected={onDropRejected}
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
            ...(onViewBarber ? [{ id: "view", label: t("calendar.barberMenu.view"), icon: <UserRound className="size-4" />, onSelect: () => onViewBarber(barber) }] : []),
            ...(onReflowBarber ? [{ id: "reflow", label: t("calendar.reflow.menu"), icon: <Shuffle className="size-4" />, onSelect: () => onReflowBarber(barber) }] : []),
            ...(onBlockBarber ? [{ id: "block", label: t("calendar.barberMenu.block"), icon: <Ban className="size-4" />, onSelect: () => onBlockBarber(barber) }] : []),
          ];
        }}
      />
    </>
  );
}
