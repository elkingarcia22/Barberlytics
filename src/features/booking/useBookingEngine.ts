import * as React from "react";
import { bookingReducer, initialBookingState } from "./bookingState";
import { useBookingFormat } from "./bookingFormat";
import type { BookingFlowValue, BookingLayout } from "./flow/BookingContext";
import { useFunnelTracking, type BookingSurface } from "./funnel";
import { useBookingCatalogQuery, useBookingShopQuery } from "./queries";
import { useBookingTotals } from "./useBookingTotals";

interface BookingEngineOptions {
  layout: BookingLayout;
  touch: "default" | "lg";
  surface: BookingSurface;
}

/**
 * El motor de la reserva, sin interfaz: la barbería, el catálogo de la sede, el
 * estado (quién reserva, el carrito), las cuentas y el embudo. Las tres versiones
 * lo montan igual; lo que cada una cambia es cómo se recorre.
 */
export function useBookingEngine({ layout, touch, surface }: BookingEngineOptions) {
  const shopQuery = useBookingShopQuery();
  const [state, dispatch] = React.useReducer(bookingReducer, undefined, () => initialBookingState());
  const shop = shopQuery.data;
  const catalogQuery = useBookingCatalogQuery(state.branchId);
  const totals = useBookingTotals(state, catalogQuery.data, shop);
  const fmt = useBookingFormat(shop?.currency);

  // La propina por defecto de la barbería, una vez que se sabe cuál es.
  const defaultTip = shop?.defaultTipId ?? null;
  const tipSeeded = React.useRef(false);
  React.useEffect(() => {
    if (tipSeeded.current || defaultTip === null) return;
    tipSeeded.current = true;
    dispatch({ type: "setTip", tipId: defaultTip });
  }, [defaultTip]);

  // La sesión vive en el estado de la reserva: empezar de nuevo («¿No eres tú?») la borra sola.
  const tracking = useFunnelTracking(state.step, surface);
  const setToken = React.useCallback((token: string | null) => dispatch({ type: "setToken", token }), []);
  const value = React.useMemo<BookingFlowValue | null>(
    () => (shop ? { state, dispatch, shop, catalog: catalogQuery.data, catalogLoading: catalogQuery.isLoading, totals, fmt, layout, touch, token: state.token, setToken, utm: tracking.utm } : null),
    [shop, state, catalogQuery.data, catalogQuery.isLoading, totals, fmt, layout, touch, setToken, tracking.utm]
  );

  return { shopQuery, value };
}
