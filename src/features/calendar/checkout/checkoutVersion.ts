import * as React from "react";

/**
 * Qué versión del cobro se ve, para compararlas (como las del panel de la
 * cita): «Actual» con todo a la vista, «Agregar» con lo de siempre y un botón
 * para lo ocasional, «Resumen» con la cuenta en una línea y «Rápido» con la
 * cuenta como ticket y las formas de pago en botones. Se recuerda en el
 * navegador.
 */

export const CHECKOUT_VERSIONS = ["full", "add", "summary", "quick"] as const;
export type CheckoutVersion = (typeof CHECKOUT_VERSIONS)[number];

const STORAGE_KEY = "thema.calendar.checkoutVersion.v1";
const DEFAULT_VERSION: CheckoutVersion = "add";

const isVersion = (value: unknown): value is CheckoutVersion => typeof value === "string" && (CHECKOUT_VERSIONS as readonly string[]).includes(value);

function read(): CheckoutVersion {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return isVersion(saved) ? saved : DEFAULT_VERSION;
  } catch {
    return DEFAULT_VERSION;
  }
}

export function useCheckoutVersion(): [CheckoutVersion, (next: CheckoutVersion) => void] {
  const [version, setVersion] = React.useState<CheckoutVersion>(read);
  const change = React.useCallback((next: CheckoutVersion) => {
    setVersion(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sin almacenamiento (modo privado): la versión vale solo mientras la pantalla esté abierta.
    }
  }, []);
  return [version, change];
}

/** Lo que el botón «Agregar» suma a la cuenta. */
export type AddKind = "service" | "product" | "visit" | "discount" | "giftSale";
