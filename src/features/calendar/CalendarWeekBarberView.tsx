import * as React from "react";
import { addDays, format } from "date-fns";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/lib/query";
import { ResourceDayGrid, minutesOfDay, parseClock, type ScheduleEvent, type ScheduleResource, type ScheduleSlot } from "@/components/scheduling";
import type { RowAction } from "@/components/data-display";
import { calendarApi } from "./api";
import { calendarKeys } from "./queries";
import { appointmentStart, applyDayHours, blockToEvent, isActive, matchesFilters, toEvent, toResource, type AgendaFilters, type ModelContext } from "./calendarModel";
import { FULL_CALENDAR_ACCESS, scopeDay } from "./calendarAccess";
import { WEEK_DAYS, weekStartOf } from "./weekModel";
import type { Appointment, Barber, CalendarDay, TimeBlock } from "./types";

/**
 * La vista Semana cuando se mira a un solo barbero: su semana como agenda,
 * una columna por día y las horas hacia abajo, con las mismas tarjetas de la
 * vista Día. Tocar un hueco agenda ese día a esa hora; tocar una cita la abre.
 * Mover citas entre días se hace desde la cita (Reagendar), no arrastrando.
 */

export interface CalendarWeekBarberViewProps {
  branchId: string;
  date: Date;
  barber: Barber;
  ctx: ModelContext;
  now?: Date;
  filters?: AgendaFilters;
  slotHeight?: number;
  /** Bloqueos que no se pintan (filtros «Vacaciones y ausencias» y «Bloqueos»). */
  hideBlock?: (block: TimeBlock) => boolean;
  onSlotClick: (slot: ScheduleSlot) => void;
  onOpenAppointment: (appointment: Appointment) => void;
  onOpenBlock?: (block: TimeBlock, date: Date) => void;
  appointmentActions?: (appointment: Appointment) => readonly RowAction[];
}

const NO_FILTERS: AgendaFilters = { stages: [], serviceIds: [] };
const DEFAULT_START_HOUR = 6;
const DEFAULT_END_HOUR = 24;
const MIN_VISIBLE_HOURS = 8;

/** Los siete días juntos: `null` hasta que llegan todos. Fuera del componente para que TanStack memorice el resultado. */
function combineWeek(results: readonly UseQueryResult<CalendarDay>[]) {
  const ready = results.every((result) => result.data);
  return {
    days: ready ? results.map((result) => result.data as CalendarDay) : null,
    error: results.find((result) => result.isError)?.error ?? null,
    retry: () => results.forEach((result) => void result.refetch()),
  };
}

interface WeekDay {
  key: string;
  date: Date;
  data: CalendarDay;
  barber: Barber;
}

export function CalendarWeekBarberView({ branchId, date, barber, ctx, now, filters = NO_FILTERS, slotHeight, hideBlock, onSlotClick, onOpenAppointment, onOpenBlock, appointmentActions }: CalendarWeekBarberViewProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const dates = React.useMemo(() => Array.from({ length: WEEK_DAYS }, (_, index) => addDays(weekStartOf(date), index)), [date]);
  const { days, error, retry } = useQueries({
    queries: dates.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      return { queryKey: calendarKeys.day(branchId, key), queryFn: ({ signal }: { signal: AbortSignal }) => calendarApi.day(branchId, key, signal) };
    }),
    combine: combineWeek,
  });
  const access = ctx.access ?? FULL_CALENDAR_ACCESS;

  const week = React.useMemo<WeekDay[]>(() => {
    if (!days) return [];
    return dates.map((day, index) => {
      const data = scopeDay(days[index], access.ownBarberId);
      // Las excepciones de horario de ese día (no las del día abierto en la agenda).
      const [resolved] = applyDayHours([barber], day, data.hours);
      return { key: format(day, "yyyy-MM-dd"), date: day, data, barber: resolved };
    });
  }, [days, dates, barber, access.ownBarberId]);

  const resources = React.useMemo<ScheduleResource[]>(
    () =>
      week.map(({ key, date: day, data, barber: resolved }) => {
        const base = toResource(resolved, day, data.appointments, ctx, data.blocks);
        const count = data.appointments.filter((item) => item.barberId === barber.id && isActive(item)).length;
        return {
          ...base,
          id: key,
          name: formatDate(day, { weekday: "long", day: "numeric", month: "long" }),
          avatarUrl: null,
          subtitle: t("calendar.meta.appointments", { count }),
          alert: undefined,
          date: day,
        };
      }),
    [week, ctx, barber.id, formatDate, t]
  );

  const events = React.useMemo<ScheduleEvent[]>(
    () =>
      week.flatMap(({ key, date: day, data }) => [
        ...data.appointments
          .filter((item) => item.barberId === barber.id && isActive(item))
          .map((appointment) => ({ ...toEvent(appointment, ctx, { faded: !matchesFilters(appointment, filters, ctx.now, ctx.catalog) }), resourceId: key })),
        ...data.blocks.filter((block) => block.barberId === barber.id && !hideBlock?.(block)).map((block) => ({ ...blockToEvent(block, day, ctx), resourceId: key })),
      ]),
    [week, barber.id, ctx, filters, hideBlock]
  );

  // De una hora antes de que empiece la primera jornada (o cita) de la semana a una hora después de la última.
  const [startHour, endHour] = React.useMemo(() => {
    const ranges = resources.flatMap((resource) => resource.workingHours ?? []);
    const active = week.flatMap(({ data }) => data.appointments.filter((item) => item.barberId === barber.id && isActive(item)));
    const starts = [...ranges.map((range) => parseClock(range.start)), ...active.map((item) => minutesOfDay(appointmentStart(item)))];
    const ends = [...ranges.map((range) => parseClock(range.end)), ...active.map((item) => minutesOfDay(appointmentStart(item)) + item.durationMin)];
    if (starts.length === 0) return [DEFAULT_START_HOUR, DEFAULT_END_HOUR];
    const first = Math.max(0, Math.floor(Math.min(...starts) / 60) - 1);
    const last = Math.min(24, Math.ceil(Math.max(...ends) / 60) + 1);
    return [first, Math.min(24, Math.max(last, first + MIN_VISIBLE_HOURS))];
  }, [resources, week, barber.id]);

  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!days) return <Skeleton className="h-[28rem] w-full" role="status" aria-busy="true" />;

  const appointmentById = (id: string) => week.flatMap(({ data }) => data.appointments).find((item) => item.id === id);
  const blockById = (id: string) => {
    for (const { date: day, data } of week) {
      const block = data.blocks.find((item) => item.id === id);
      if (block) return { block, day };
    }
    return undefined;
  };

  return (
    <ResourceDayGrid
      className={ctx.card?.vivid ? "schedule-vivid" : undefined}
      date={dates[0]}
      resources={resources}
      events={events}
      now={now}
      fill
      slotHeight={slotHeight}
      startHour={startHour}
      endHour={endHour}
      // Las columnas son días: el hueco se agenda con este barbero.
      onSlotClick={(slot) => onSlotClick({ ...slot, resourceId: barber.id })}
      onEventClick={(event) => {
        const appointment = appointmentById(event.id);
        if (appointment) {
          onOpenAppointment(appointment);
          return;
        }
        const found = blockById(event.id);
        if (found) onOpenBlock?.(found.block, found.day);
      }}
      eventActions={(event) => {
        const appointment = appointmentById(event.id);
        return appointment ? (appointmentActions?.(appointment) ?? []) : [];
      }}
    />
  );
}
