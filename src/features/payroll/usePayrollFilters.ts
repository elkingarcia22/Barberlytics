import * as React from "react";
import { useSearchParams } from "react-router";
import { fromIsoDate, periodRange, toIsoDate, type PeriodGranularity } from "@/components/date";
import { payoutSchema, type Payout } from "./types";

const GRANULARITIES: readonly PeriodGranularity[] = ["day", "week", "month"];

/**
 * Lo que decide qué nómina se ve, en la URL: el periodo, la forma de pago y
 * el barbero abierto en el panel. Por defecto la semana en curso: la renta y
 * el salario son semanales y es el ciclo en que se liquida.
 */
export function usePayrollFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const granularityParam = searchParams.get("periodo");
  const granularity: PeriodGranularity = GRANULARITIES.includes(granularityParam as PeriodGranularity) ? (granularityParam as PeriodGranularity) : "week";
  const dateParam = searchParams.get("fecha");
  const date = React.useMemo(() => fromIsoDate(dateParam) ?? new Date(), [dateParam]);
  const payoutParam = searchParams.get("pago");
  const payout: Payout = payoutSchema.safeParse(payoutParam).success ? (payoutParam as Payout) : "commission";
  const memberId = searchParams.get("miembro");

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
    payout,
    memberId,
    from: toIsoDate(range.from),
    to: toIsoDate(range.to),
    setGranularity: (value: PeriodGranularity) => set({ periodo: value === "week" ? undefined : value }),
    setDate: (value: Date) => {
      const iso = toIsoDate(value);
      set({ fecha: iso === today ? undefined : iso });
    },
    setPayout: (value: string) => set({ pago: value === "commission" ? undefined : value }),
    openMember: (id: string | null) => set({ miembro: id ?? undefined }),
  };
}
