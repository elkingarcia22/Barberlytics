import * as React from "react";
import type { BookingAction, BookingState } from "../bookingState";
import type { BookingFormatters } from "../bookingFormat";
import type { BookingCatalog, BookingShop } from "../types";
import type { Totals } from "../pricing";
import type { BookingUtm } from "../funnel";

/**
 * Lo que comparten los pasos de la reserva: el estado, la barbería, el
 * catálogo de la sede elegida, los formatos y cómo se está viendo (una
 * columna en celular, tablet y widget; dos en monitor).
 */
export type BookingLayout = "compact" | "wide";

export interface BookingFlowValue {
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
  shop: BookingShop;
  catalog: BookingCatalog | undefined;
  catalogLoading: boolean;
  totals: Totals;
  fmt: BookingFormatters;
  layout: BookingLayout;
  /** `lg` en pantallas táctiles grandes (tablet, kiosco): todo más grande para el dedo. */
  touch: "default" | "lg";
  /** En un celular (la vista previa de celular o la página abierta en uno): hay menos espacio para detalles. */
  isPhone: boolean;
  /** El token de «Mis citas», una vez que el cliente confirma su código. */
  token: string | null;
  setToken: (token: string | null) => void;
  /** De dónde vino (UTM del enlace): viaja con la reserva. */
  utm: BookingUtm | null;
}

const BookingFlowContext = React.createContext<BookingFlowValue | null>(null);

export const BookingFlowProvider = BookingFlowContext.Provider;

export function useBookingFlow(): BookingFlowValue {
  const value = React.useContext(BookingFlowContext);
  if (!value) throw new Error("useBookingFlow va dentro de <BookingFlow>.");
  return value;
}
