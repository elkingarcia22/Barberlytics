import * as React from "react";
import { useSearchParams } from "react-router";
import { fromIsoDate, periodRange, toIsoDate, type PeriodGranularity } from "@/components/date";
import { appointmentStatusSchema, type AppointmentStatus } from "@/features/calendar/types";
import { accountStatusSchema, type AccountStatus } from "./types";

export const ALL = "todos";
export type StatusFilter = AccountStatus | typeof ALL;
export type AppointmentFilter = AppointmentStatus | typeof ALL;

const GRANULARITIES: readonly PeriodGranularity[] = ["day", "week", "month"];

/**
 * Lo que decide qué cuentas se ven, en la URL: el periodo (día, semana o
 * mes alrededor de una fecha), el estado de la cuenta, el de la cita y la
 * cuenta abierta en el panel. Copiar el enlace reproduce la misma vista.
 *
 * El periodo por defecto es hoy —la pregunta de todos los días es «cómo va
 * la caja»— y la fecha solo se escribe cuando no es hoy.
 */
export function useTransactionsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const granularityParam = searchParams.get("periodo");
  const granularity: PeriodGranularity = GRANULARITIES.includes(granularityParam as PeriodGranularity) ? (granularityParam as PeriodGranularity) : "day";
  const dateParam = searchParams.get("fecha");
  const date = React.useMemo(() => fromIsoDate(dateParam) ?? new Date(), [dateParam]);
  const statusParam = searchParams.get("estado");
  const status: StatusFilter = accountStatusSchema.safeParse(statusParam).success ? (statusParam as AccountStatus) : ALL;
  const appointmentParam = searchParams.get("estadoCita");
  const appointment: AppointmentFilter = appointmentStatusSchema.safeParse(appointmentParam).success ? (appointmentParam as AppointmentStatus) : ALL;
  const accountId = searchParams.get("cuenta");

  const set = React.useCallback(
    (patch: Record<string, string | undefined>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined) next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const range = periodRange(date, granularity);
  const today = toIsoDate(new Date());

  return {
    granularity,
    date,
    status,
    appointment,
    accountId,
    from: toIsoDate(range.from),
    to: toIsoDate(range.to),
    range,
    setGranularity: (value: PeriodGranularity) => set({ periodo: value === "day" ? undefined : value }),
    setDate: (value: Date) => {
      const iso = toIsoDate(value);
      set({ fecha: iso === today ? undefined : iso });
    },
    setStatus: (value: string) => set({ estado: value === ALL ? undefined : value }),
    setAppointment: (value: string) => set({ estadoCita: value === ALL ? undefined : value }),
    openAccount: (id: string | null) => set({ cuenta: id ?? undefined }),
    clearFilters: () => set({ estado: undefined, estadoCita: undefined }),
  };
}
