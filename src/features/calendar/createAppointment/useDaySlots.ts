import * as React from "react";
import { format, isBefore, startOfDay } from "date-fns";
import { atMinutes, isWorkingAt } from "@/components/scheduling";
import { clashingAppointments, clashingBlocks, workingHoursOn } from "../calendarModel";
import { useDayQuery } from "../queries";
import type { Barber } from "../types";

/**
 * Las horas libres de un día para varios barberos a la vez, como la reserva en
 * línea: por cada hora, quiénes pueden. Pide la agenda de ese día y apaga lo
 * pasado, lo que cae fuera de la jornada y lo que pisa otra cita o un bloqueo.
 * Con un solo barbero es su lista de horas; con todos, «Sin preferencia» y las
 * caras de quienes pueden.
 */

/** Cada cuánto se ofrece una hora. */
export const SLOT_STEP_MINUTES = 15;

export interface FreeTime {
  /** Minutos del día: 900 = 3:00 p. m. */
  minute: number;
  start: Date;
  barberIds: readonly string[];
}

export interface DaySlots {
  loading: boolean;
  times: readonly FreeTime[];
}

export function useDaySlots({ branchId, day, barbers, durationMin, now }: { branchId: string; day: Date; barbers: readonly Barber[]; durationMin: number; now: Date }): DaySlots {
  const query = useDayQuery(branchId, format(day, "yyyy-MM-dd"));
  const data = query.data;
  const times = React.useMemo(() => {
    if (!data || isBefore(startOfDay(day), startOfDay(now))) return [];
    const byMinute = new Map<number, string[]>();
    for (const barber of barbers) {
      const hours = data.hours?.[barber.id] ?? workingHoursOn(barber, day);
      for (let minute = 0; minute + durationMin <= 24 * 60; minute += SLOT_STEP_MINUTES) {
        const to = minute + durationMin;
        if (!isWorkingAt(hours, minute) || !isWorkingAt(hours, to - 1)) continue;
        if (isBefore(atMinutes(day, minute), now)) continue;
        if (clashingAppointments(data.appointments, barber.id, day, minute, to).length > 0) continue;
        if (clashingBlocks(data.blocks, barber.id, minute, to).length > 0) continue;
        byMinute.set(minute, [...(byMinute.get(minute) ?? []), barber.id]);
      }
    }
    return [...byMinute.entries()].sort(([a], [b]) => a - b).map(([minute, barberIds]) => ({ minute, start: atMinutes(day, minute), barberIds }));
  }, [data, day, barbers, durationMin, now]);
  return { loading: query.isFetching && !data, times };
}

/** Mañana hasta las 12, tarde hasta las 6 y noche: las franjas de la reserva. */
export function windowOf(minute: number): "morning" | "afternoon" | "evening" {
  if (minute < 12 * 60) return "morning";
  if (minute < 18 * 60) return "afternoon";
  return "evening";
}
