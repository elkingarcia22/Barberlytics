import * as React from "react";
import { chargesCardFee, computeTotals, coverByPackages, promoDiscount, tipAmount, type Totals } from "./pricing";
import type { BookingState, DraftItem } from "./bookingState";
import type { BookingCatalog, BookingService, BookingShop } from "./types";

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

/** Lo más barato que cobra alguien de la sede por ese servicio: el «desde». */
export function fromPrice(service: BookingService, catalog: BookingCatalog | undefined): number {
  const values = (catalog?.barbers ?? []).map((barber) => barber.prices[service.id]).filter((value): value is number => value !== undefined);
  return values.length > 0 ? Math.min(...values) : service.price;
}

export const itemDuration = (serviceIds: readonly string[], catalog: BookingCatalog | undefined): number =>
  serviceIds.reduce((sum, id) => sum + (catalog?.services.find((service) => service.id === id)?.durationMin ?? 0), 0);

/** Lo que vale cada servicio de una cita, con el mismo criterio que `itemPrice`. */
function servicePrices(item: Pick<DraftItem, "serviceIds" | "barberId">, catalog: BookingCatalog | undefined): { serviceId: string; price: number }[] {
  const barbers = (catalog?.barbers ?? []).filter((barber) => (item.barberId ? barber.id === item.barberId : item.serviceIds.every((id) => barber.prices[id] !== undefined)));
  return item.serviceIds.map((serviceId) => {
    const prices = barbers.map((barber) => barber.prices[serviceId]).filter((price): price is number => price !== undefined);
    return { serviceId, price: prices.length > 0 ? Math.min(...prices) : (catalog?.services.find((service) => service.id === serviceId)?.price ?? 0) };
  });
}

/** Cuánto cubren sus paquetes de esta reserva (estimado; el servidor cobra con el barbero asignado). */
export function packageCoverage(state: BookingState, catalog: BookingCatalog | undefined): number {
  const owned = state.customer?.packages ?? [];
  if (!state.usePackages || owned.length === 0) return 0;
  return coverByPackages(state.items.map((item) => servicePrices(item, catalog)), owned).amount;
}

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
      giftBalance: state.gift?.balance ?? 0,
      prepaid: packageCoverage(state, catalog),
      reward: state.useReward && (state.customer?.loyalty?.available ?? 0) > 0 ? (state.customer?.loyalty?.rewardValue ?? 0) : 0,
    });
  }, [catalog, shop, state.items, state.products, state.promo, state.tipId, state.method, state.gift, state.useReward, state.usePackages, state.customer]);
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
