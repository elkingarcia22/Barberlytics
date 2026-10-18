import * as React from "react";
import { useSearchParams } from "react-router";
import { fromIsoDate, toIsoDate, type PeriodGranularity } from "@/components/date";
import { useAccess } from "@/features/access";
import { useBranchId } from "@/features/team/teamUtils";
import type { TeamRole } from "@/features/team/types";
import { ALL_BARBERS, periodGranularitySchema, type MetricsParams } from "./types";

export const METRICS_TABS = ["business", "customers", "barbers", "marketing", "insights"] as const;
export type MetricsTab = (typeof METRICS_TABS)[number];

/**
 * Las pestañas que ve cada rol (docs/roles/02-metricas-caja-nomina.md):
 * - el barbero por comisión, como en producción: Negocio, Clientes y Barberos, con sus cifras;
 * - el de renta, lo mismo más Marketing (sus reservas online): es su negocio;
 * - la IA (salud, riesgo de clientes, capacidad) son las alertas del dueño: ningún barbero la ve.
 */
export function metricsTabsFor(role: TeamRole): readonly MetricsTab[] {
  if (role === "barbero-comision") return ["business", "customers", "barbers"];
  if (role === "barbero-renta") return ["business", "customers", "barbers", "marketing"];
  return METRICS_TABS;
}

/** Sin ficha de equipo no hay «lo suyo»: se pide un barbero que no existe y no sale nada de nadie. */
const NO_MEMBER = "none";

/**
 * Lo que decide qué se ve, en la URL: la pestaña, el grano del periodo, la
 * fecha ancla y el barbero. Copiar el enlace reproduce el mismo tablero y
 * las flechas de periodo funcionan con «atrás».
 *
 * La fecha solo se escribe cuando no es hoy: así el enlace del menú se queda
 * limpio y siempre abre el periodo actual.
 *
 * Un barbero (alcance «own») mira siempre sus cifras: el barbero queda fijo
 * en su ficha y `?barber=` se ignora, así que un enlace ajeno no abre las de
 * otro. Una pestaña que su rol no tiene cae en Negocio.
 */
export function useMetricsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const access = useAccess();
  const tabs = metricsTabsFor(access.role);
  const isOwn = access.scope === "own";

  const tabParam = searchParams.get("tab");
  const tab: MetricsTab = tabs.includes(tabParam as MetricsTab) ? (tabParam as MetricsTab) : "business";
  const granularityParam = searchParams.get("period");
  const granularity: PeriodGranularity = periodGranularitySchema.safeParse(granularityParam).success
    ? (granularityParam as PeriodGranularity)
    : "month";
  const date = React.useMemo(() => fromIsoDate(searchParams.get("date")) ?? new Date(), [searchParams]);
  const barberId = isOwn ? (access.member?.id ?? NO_MEMBER) : (searchParams.get("barber") ?? ALL_BARBERS);

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

  // La sucursal de la cabecera viaja en la consulta: cada una tiene sus cifras.
  const branchId = useBranchId();
  const params: MetricsParams = { granularity, date: toIsoDate(date), barberId, branchId };
  const today = toIsoDate(new Date());

  return {
    tabs,
    /** Solo sus cifras: sin selector de barbero. */
    isOwn,
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
