import * as React from "react";
import { useSearchParams } from "react-router";
import { fromIsoDate, toIsoDate, type PeriodGranularity } from "@/components/date";
import { ALL_BARBERS, periodGranularitySchema, type MetricsParams } from "./types";

export const METRICS_TABS = ["business", "customers", "barbers", "marketing", "insights"] as const;
export type MetricsTab = (typeof METRICS_TABS)[number];

const isTab = (value: string | null): value is MetricsTab => METRICS_TABS.includes(value as MetricsTab);

/**
 * Lo que decide qué se ve, en la URL: la pestaña, el grano del periodo, la
 * fecha ancla y el barbero. Copiar el enlace reproduce el mismo tablero y
 * las flechas de periodo funcionan con «atrás».
 *
 * La fecha solo se escribe cuando no es hoy: así el enlace del menú se queda
 * limpio y siempre abre el periodo actual.
 */
export function useMetricsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab");
  const tab: MetricsTab = isTab(tabParam) ? tabParam : "business";
  const granularityParam = searchParams.get("period");
  const granularity: PeriodGranularity = periodGranularitySchema.safeParse(granularityParam).success
    ? (granularityParam as PeriodGranularity)
    : "month";
  const date = React.useMemo(() => fromIsoDate(searchParams.get("date")) ?? new Date(), [searchParams]);
  const barberId = searchParams.get("barber") ?? ALL_BARBERS;

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

  const params: MetricsParams = { granularity, date: toIsoDate(date), barberId };
  const today = toIsoDate(new Date());

  return {
    tab,
    granularity,
    date,
    barberId,
    params,
    setTab: (value: MetricsTab) => set({ tab: value === "business" ? undefined : value }),
    setGranularity: (value: PeriodGranularity) => set({ period: value === "month" ? undefined : value }),
    setDate: (value: Date) => {
      const iso = toIsoDate(value);
      set({ date: iso === today ? undefined : iso });
    },
    setBarberId: (value: string) => set({ barber: value === ALL_BARBERS ? undefined : value }),
  };
}
