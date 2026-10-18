import * as React from "react";
import { useLocale } from "@/i18n";
import { useBranchCurrency } from "@/features/branches";
import type { Compared } from "./types";

export interface MetricsFormatters {
  money: (value: number) => string;
  /** Sin decimales: para cifras grandes de tarjeta. */
  moneyRound: (value: number) => string;
  percent: (value: number) => string;
  count: (value: number) => string;
  /** «+12,4 %» o «−3 pp»: la variación relativa de un valor comparado. */
  delta: (compared: Compared, unit?: "percent" | "pp") => { value: number; label: string } | undefined;
}

/**
 * Cómo se escriben las cifras del tablero, con la convención del idioma
 * activo. Un solo sitio para que «$4.242» y «28,0 %» salgan igual en la
 * tarjeta, la leyenda y el tooltip.
 */
export function useMetricsFormatters(): MetricsFormatters {
  const { formatNumber } = useLocale();
  // La moneda de la sucursal activa: cada una cobra en la suya.
  const currency = useBranchCurrency();
  return React.useMemo(() => {
    const money = (value: number) => formatNumber(value, { style: "currency", currency, maximumFractionDigits: 2, minimumFractionDigits: 0 });
    const moneyRound = (value: number) => formatNumber(value, { style: "currency", currency, maximumFractionDigits: 0 });
    const percent = (value: number) => `${formatNumber(value, { maximumFractionDigits: 1 })} %`;
    const count = (value: number) => formatNumber(value, { maximumFractionDigits: 0 });
    const signed = (value: number, suffix: string) =>
      `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatNumber(Math.abs(value), { maximumFractionDigits: 1 })}${suffix}`;
    return {
      money,
      moneyRound,
      percent,
      count,
      delta: (compared, unit = "percent") => {
        if (unit === "pp") {
          const diff = compared.value - compared.previous;
          return { value: diff, label: signed(diff, " pp") };
        }
        if (compared.previous === 0) return undefined;
        const change = ((compared.value - compared.previous) / compared.previous) * 100;
        return { value: change, label: signed(change, " %") };
      },
    };
  }, [formatNumber, currency]);
}
