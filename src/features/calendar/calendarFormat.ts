import * as React from "react";
import { useLocale } from "@/i18n";
import { atMinutes, formatClock, parseClock } from "@/components/scheduling";

/**
 * Formateadores y ayudas sin JSX del calendario: el dinero de la sucursal,
 * las medias horas de un select y la llave que reinicia un panel cada vez
 * que se abre.
 */

/** Dinero de la sucursal, con la convención del idioma activo. */
export function useMoney() {
  const { formatNumber } = useLocale();
  return React.useCallback(
    (value: number) => formatNumber(value, { style: "currency", currency: "USD", maximumFractionDigits: value % 1 === 0 ? 0 : 2 }),
    [formatNumber]
  );
}

/** Las medias horas del día como opciones «HH:mm», para los selects de hora. */
export function halfHourOptions(startHour = 6, endHour = 24): string[] {
  const options: string[] = [];
  for (let minute = startHour * 60; minute < endHour * 60; minute += 30) {
    options.push(`${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`);
  }
  return options;
}

/**
 * Un número que sube cada vez que `open` pasa a `true`. Sirve de `key` para
 * que un panel arranque limpio en cada apertura sin reiniciar su estado en
 * un efecto: el estado se ajusta durante el render, como recomienda React.
 */
export function useOpenKey(open: boolean): number {
  const [prevOpen, setPrevOpen] = React.useState(open);
  const [key, setKey] = React.useState(0);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setKey((current) => current + 1);
  }
  return key;
}

/** «13:00» como se lee en el idioma activo: «1:00 p. m.». */
export const clockLabel = (value: string, intl: string): string => formatClock(atMinutes(new Date(2000, 0, 1), parseClock(value)), intl);
