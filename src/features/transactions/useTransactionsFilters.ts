import * as React from "react";
import { useSearchParams } from "react-router";
import { fromIsoDate, periodRange, toIsoDate, type PeriodGranularity } from "@/components/date";
import { appointmentStatusSchema, paymentMethodSchema, type AppointmentStatus, type PaymentMethod } from "@/features/calendar/types";
import { accountStatusSchema, type AccountStatus } from "./types";

export const ALL = "todos";
export type StatusFilter = AccountStatus | typeof ALL;
export type AppointmentFilter = AppointmentStatus | typeof ALL;
export type MethodFilter = PaymentMethod | typeof ALL;

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
  // Quién atendió y con qué se pagó: las cuentas de un barbero o de un medio (en la URL, como lo demás).
  const barber = searchParams.get("barbero") ?? ALL;
  const methodParam = searchParams.get("metodo");
  const method: MethodFilter = paymentMethodSchema.safeParse(methodParam).success ? (methodParam as PaymentMethod) : ALL;

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
    barber,
    method,
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
    setBarber: (value: string) => set({ barbero: value === ALL ? undefined : value }),
    setMethod: (value: string) => set({ metodo: value === ALL ? undefined : value }),
    /** Ver una cuenta sin cobrar de otro día: ese día, las por cobrar y la cuenta abierta. */
    showUnpaid: (date: string, id: string) => set({ fecha: date === today ? undefined : date, periodo: undefined, estado: "open", cuenta: id }),
    openAccount: (id: string | null) => set({ cuenta: id ?? undefined }),
    clearFilters: () => set({ estado: undefined, estadoCita: undefined, barbero: undefined, metodo: undefined }),
  };
}
