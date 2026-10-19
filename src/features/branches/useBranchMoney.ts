import * as React from "react";
import { useShellConfig } from "@/components/app-shell";
import { useLocale } from "@/i18n";
import { useSettingsList } from "@/features/settings/settingsQueries";
import { branchSchema } from "@/features/settings/settingsTypes";
import { wallClock } from "@/lib/time/zoned";
import { DEFAULT_BRANCH_ID } from "./branches";
import { useBranchCurrency } from "./useBranchCurrency";

/**
 * Cómo se escribe el dinero en un campo de la sucursal activa: el símbolo de su moneda («$», «€») y cuántos
 * decimales lleva (el peso colombiano, ninguno). Nada de un `$` y dos decimales fijos.
 */
export function useCurrencyInput(): { symbol: string; decimals: number; currency: string } {
  const currency = useBranchCurrency();
  const { current } = useLocale();
  return React.useMemo(() => {
    const format = new Intl.NumberFormat(current.intl, { style: "currency", currency, currencyDisplay: "narrowSymbol" });
    const symbol = format.formatToParts(0).find((part) => part.type === "currency")?.value ?? currency;
    return { symbol, decimals: format.resolvedOptions().maximumFractionDigits ?? 2, currency };
  }, [currency, current.intl]);
}

/** El día de hoy en la sucursal activa («AAAA-MM-DD»), con su zona y no la del dispositivo. */
export function useBranchToday(): string {
  const { activeCompanyId } = useShellConfig();
  const branchId = activeCompanyId ?? DEFAULT_BRANCH_ID;
  const branches = useSettingsList("branches", branchSchema);
  const timeZone = branches.data?.items.find((branch) => branch.id === branchId)?.timezone;
  // «Hoy» se fija al montar: no cambia mientras se llena un formulario.
  const [now] = React.useState(() => new Date());
  return React.useMemo(() => {
    try {
      return wallClock(timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone, now).slice(0, 10);
    } catch {
      return wallClock(Intl.DateTimeFormat().resolvedOptions().timeZone, now).slice(0, 10);
    }
  }, [timeZone, now]);
}
