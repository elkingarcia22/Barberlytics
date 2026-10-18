import * as React from "react";
import { format, isBefore, startOfDay } from "date-fns";
import { isWorkingAt, minutesOfDay } from "@/components/scheduling";
import { clashingAppointments, clashingBlocks, workingHoursOn } from "../calendarModel";
import { useDayQuery } from "../queries";
import type { Barber } from "../types";

/**
 * Las horas libres de un barbero en un día, para el selector de día y hora:
 * pide la agenda de ese día y apaga lo pasado, lo que cae fuera de su jornada
 * y lo que pisa otra cita o un bloqueo. Sirve para mover una cita y para
 * agendar la próxima sin salir del panel.
 */

export interface FreeSlots {
  day: Date;
  setDay: (day: Date) => void;
  loading: boolean;
  isSlotDisabled: (date: Date) => boolean;
  isDayDisabled: (day: Date) => boolean;
}

export function useFreeSlots({ branchId, barber, durationMin, initialDay, now, excludeId }: { branchId: string; barber: Barber | undefined; durationMin: number; initialDay: Date; now: Date; excludeId?: string }): FreeSlots {
  const [day, setDay] = React.useState(() => startOfDay(initialDay));
  const query = useDayQuery(branchId, format(day, "yyyy-MM-dd"));
  const appointments = query.data?.appointments;
  const blocks = query.data?.blocks;
  const hours = barber ? (query.data?.hours?.[barber.id] ?? workingHoursOn(barber, day)) : undefined;

  const isSlotDisabled = React.useCallback(
    (date: Date) => {
      if (isBefore(date, now)) return true;
      if (!barber) return false;
      const from = minutesOfDay(date);
      const to = from + durationMin;
      if (!isWorkingAt(hours, from) || !isWorkingAt(hours, to - 1)) return true;
      if (clashingAppointments(appointments ?? [], barber.id, date, from, to, excludeId).length > 0) return true;
      return clashingBlocks(blocks ?? [], barber.id, from, to).length > 0;
    },
    [appointments, barber, blocks, durationMin, excludeId, hours, now]
  );
  const isDayDisabled = React.useCallback((candidate: Date) => isBefore(startOfDay(candidate), startOfDay(now)) || (barber ? workingHoursOn(barber, candidate).length === 0 : false), [barber, now]);

  return { day, setDay: (next) => setDay(startOfDay(next)), loading: query.isFetching && !appointments, isSlotDisabled, isDayDisabled };
}
