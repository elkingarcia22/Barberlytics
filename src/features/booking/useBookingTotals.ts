import * as React from "react";
import { chargesCardFee, computeTotals, promoDiscount, tipAmount, type Totals } from "./pricing";
import type { BookingState, DraftItem } from "./bookingState";
import type { BookingCatalog, BookingShop } from "./types";

/**
 * Lo que vale una cita: con barbero elegido, su precio; sin preferencia, el
 * más bajo de quienes la pueden hacer (el que se ve como «desde»). El cobro
 * real lo calcula el servidor con el barbero que asigne.
 */
export function itemPrice(item: Pick<DraftItem, "serviceIds" | "barberId">, catalog: BookingCatalog | undefined): number {
  if (!catalog) return 0;
  const barbers = item.barberId ? catalog.barbers.filter((barber) => barber.id === item.barberId) : catalog.barbers;
  const totals = barbers
    .filter((barber) => item.serviceIds.every((id) => barber.prices[id] !== undefined))
    .map((barber) => item.serviceIds.reduce((sum, id) => sum + (barber.prices[id] ?? 0), 0));
  if (totals.length > 0) return Math.min(...totals);
  return item.serviceIds.reduce((sum, id) => sum + (catalog.services.find((service) => service.id === id)?.price ?? 0), 0);
}

export const itemDuration = (serviceIds: readonly string[], catalog: BookingCatalog | undefined): number =>
  serviceIds.reduce((sum, id) => sum + (catalog?.services.find((service) => service.id === id)?.durationMin ?? 0), 0);

export function useBookingTotals(state: BookingState, catalog: BookingCatalog | undefined, shop: BookingShop | undefined): Totals {
  return React.useMemo(() => {
    const services = state.items.reduce((sum, item) => sum + itemPrice(item, catalog), 0);
    const products = Object.entries(state.products).reduce((sum, [id, qty]) => sum + (catalog?.products.find((product) => product.id === id)?.price ?? 0) * qty, 0);
    const tip = shop?.tipOptions.find((option) => option.id === state.tipId) ?? null;
    // Sin método elegido, el pago abre en tarjeta si la barbería cobra en línea (como el paso de pago).
    const method = state.method ?? (shop?.payment.card ? "card" : "shop");
    return computeTotals({
      services,
      products,
      discount: promoDiscount(state.promo, services + products),
      taxPercent: shop?.taxPercent ?? 0,
      tip: tipAmount(tip, services),
      cardFee: chargesCardFee(method) ? (shop?.cardFee ?? null) : null,
    });
  }, [catalog, shop, state.items, state.products, state.promo, state.tipId, state.method]);
}

export interface DraftOrderLine {
  id: string;
  label: string;
  detail: string;
  amount: number;
}

/** Las líneas del ticket antes de reservar: una por cita y una por producto. */
export function draftOrderLines(state: BookingState, catalog: BookingCatalog | undefined, describe: (item: DraftItem) => string): DraftOrderLine[] {
  const appointments = state.items.map((item) => ({
    id: item.key,
    label: item.serviceIds.map((id) => catalog?.services.find((service) => service.id === id)?.name ?? id).join(" + "),
    detail: describe(item),
    amount: itemPrice(item, catalog),
  }));
  const products = Object.entries(state.products).flatMap(([id, qty]) => {
    const product = catalog?.products.find((entry) => entry.id === id);
    return product ? [{ id, label: qty > 1 ? `${product.name} × ${qty}` : product.name, detail: "", amount: product.price * qty }] : [];
  });
  return [...appointments, ...products];
}
