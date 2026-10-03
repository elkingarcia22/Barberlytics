import { isSameDay } from "date-fns";
import { atMinutes, minutesOfDay, parseClock } from "@/components/scheduling";
import { clashingAppointments, clashingBlocks, isWorkingOn, workingHoursOn } from "./calendarModel";
import type { Barber, CalendarCatalog, CalendarDay, Service, WaitlistEntry } from "./types";

/**
 * Los huecos del día: los ratos libres de cada barbero dentro de su jornada,
 * desde ahora. Es lo que se puede vender todavía hoy —a quien llama, a quien
 * entra sin cita, a la lista de espera—, así que cada hueco trae qué cabe en
 * él y quién de la lista lo tomaría.
 */

export interface DayGap {
  id: string;
  barber: Barber;
  start: Date;
  end: Date;
  minutes: number;
  /** Los servicios del catálogo que caben, del más largo al más corto. */
  fits: Service[];
  /** Quién de la lista de espera pidió este día y cabe en el hueco. */
  waitlist: WaitlistEntry[];
}

export interface DayGapsOptions {
  day: Pick<CalendarDay, "appointments" | "blocks">;
  catalog: CalendarCatalog;
  barbers: readonly Barber[];
  date: Date;
  now?: Date;
  waitlist?: readonly WaitlistEntry[];
  /** Un hueco más corto que esto no se cuenta: no cabe nada. */
  minMinutes?: number;
}

export const DEFAULT_MIN_GAP_MINUTES = 15;
/** Hoy los huecos empiezan en el próximo cuarto de hora, no en el minuto exacto. */
const ROUND_TO_MINUTES = 15;

const dateKeyOf = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function dayGaps({ day, catalog, barbers, date, now, waitlist = [], minMinutes = DEFAULT_MIN_GAP_MINUTES }: DayGapsOptions): DayGap[] {
  const from = now && isSameDay(now, date) ? Math.ceil(minutesOfDay(now) / ROUND_TO_MINUTES) * ROUND_TO_MINUTES : 0;
  const key = dateKeyOf(date);
  const waiting = waitlist.filter((entry) => entry.slots.some((slot) => slot.date === key));
  const gaps: DayGap[] = [];

  for (const barber of barbers.filter((item) => isWorkingOn(item, date))) {
    const busy = [
      ...clashingAppointments(day.appointments, barber.id, date, 0, 24 * 60).map((item): [number, number] => {
        const start = minutesOfDay(new Date(item.start));
        return [start, start + item.durationMin];
      }),
      ...clashingBlocks(day.blocks, barber.id, 0, 24 * 60).map((block): [number, number] => [parseClock(block.startTime), parseClock(block.endTime)]),
    ].sort((a, b) => a[0] - b[0]);

    for (const range of workingHoursOn(barber, date)) {
      let cursor = Math.max(parseClock(range.start), from);
      const close = parseClock(range.end);
      const push = (start: number, end: number) => {
        const minutes = end - start;
        if (minutes < minMinutes) return;
        gaps.push({
          id: `${barber.id}-${start}`,
          barber,
          start: atMinutes(date, start),
          end: atMinutes(date, end),
          minutes,
          fits: catalog.services.filter((service) => service.durationMin <= minutes).sort((a, b) => b.durationMin - a.durationMin),
          waitlist: waiting.filter((entry) => (entry.barberId === null || entry.barberId === barber.id) && (catalog.services.find((service) => service.id === entry.serviceId)?.durationMin ?? 30) <= minutes),
        });
      };
      for (const [start, end] of busy) {
        if (end <= cursor) continue;
        if (start >= close) break;
        if (start > cursor) push(cursor, Math.min(start, close));
        cursor = Math.max(cursor, end);
      }
      if (cursor < close) push(cursor, close);
    }
  }
  return gaps.sort((a, b) => a.start.getTime() - b.start.getTime() || a.barber.name.localeCompare(b.barber.name));
}

export interface GapsSummary {
  count: number;
  minutes: number;
  /** Lo que se dejaría de vender si nadie los toma: el servicio más caro que cabe en cada uno. */
  potential: number;
  withWaitlist: number;
}

export function gapsSummary(gaps: readonly DayGap[]): GapsSummary {
  return {
    count: gaps.length,
    minutes: gaps.reduce((sum, gap) => sum + gap.minutes, 0),
    potential: gaps.reduce((sum, gap) => sum + Math.max(0, ...gap.fits.map((service) => service.price)), 0),
    withWaitlist: gaps.filter((gap) => gap.waitlist.length > 0).length,
  };
}
