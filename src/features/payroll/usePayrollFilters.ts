import * as React from "react";
import { useSearchParams } from "react-router";
import { fromIsoDate, periodRange, toIsoDate, type PeriodGranularity } from "@/components/date";
import { useSettingsSection } from "@/features/settings/settingsQueries";
import { payrollCycleSchema } from "@/features/settings/settingsTypes";
import { payoutSchema, type Payout } from "./types";
import { payCycleWindow, shiftPayCycle, type PayCycleSettings } from "./payCycle";

const GRANULARITIES: readonly PeriodGranularity[] = ["day", "week", "month"];

/**
 * Lo que decide qué nómina se ve, en la URL: el periodo, la forma de pago y
 * el barbero abierto en el panel. Por defecto, el **ciclo de pago** de
 * Configuración › Nómina (la semana, la quincena del 1 al 15 o del 16 a fin
 * de mes, o el mes) que contiene la fecha; con `?periodo=` se mira un día,
 * una semana o un mes cualquiera.
 */
export function usePayrollFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const cycleData = useSettingsSection("payrollCycle", payrollCycleSchema).data;
  const settings = React.useMemo<PayCycleSettings>(() => ({ cycle: cycleData?.cycle ?? "weekly", startDay: cycleData?.startDay ?? 1 }), [cycleData]);
  const granularityParam = searchParams.get("periodo");
  const byCycle = !GRANULARITIES.includes(granularityParam as PeriodGranularity);
  const granularity: PeriodGranularity = byCycle ? (settings.cycle === "monthly" ? "month" : "week") : (granularityParam as PeriodGranularity);
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

  const range = byCycle ? payCycleWindow(date, settings) : periodRange(date, granularity);
  const today = toIsoDate(new Date());

  return {
    granularity,
    /** Se mira un ciclo de pago (por defecto) y no un día, una semana o un mes cualquiera. */
    byCycle,
    cycle: settings.cycle,
    date,
    payout,
    memberId,
    from: toIsoDate(range.from),
    to: toIsoDate(range.to),
    setGranularity: (value: PeriodGranularity) => set({ periodo: value }),
    /** Volver a mirar por ciclo de pago. */
    showCycle: () => set({ periodo: undefined }),
    /** El ciclo anterior o el siguiente. */
    stepCycle: (delta: -1 | 1) => {
      const next = toIsoDate(shiftPayCycle(date, settings, delta).from);
      set({ fecha: next === today ? undefined : next });
    },
    /** El ciclo que sigue al que se mira ya empezó (no se avanza a un ciclo futuro). */
    nextCycleStarted: toIsoDate(shiftPayCycle(date, settings, 1).from) <= today,
    setDate: (value: Date) => {
      const iso = toIsoDate(value);
      set({ fecha: iso === today ? undefined : iso });
    },
    setPayout: (value: string) => set({ pago: value === "commission" ? undefined : value }),
    openMember: (id: string | null) => set({ miembro: id ?? undefined }),
  };
}
