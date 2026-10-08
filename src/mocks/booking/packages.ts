import { db } from "../db";
import type { MockOwnedPackage } from "./state";

/**
 * Paquetes prepagados: la barbería los ofrece en Ajustes (N visitas de un servicio con descuento y
 * vencimiento), el cliente los compra en línea y cada reserva que incluye ese servicio gasta una
 * visita. Lo vencido o agotado ya no se ofrece.
 */

export interface PackageOffer {
  id: string;
  name: string;
  serviceId: string;
  sessions: number;
  price: number;
  validDays: number;
}

const DAY_MS = 86_400_000;

export const packageOffers = (): PackageOffer[] => ((db.settings.sections.booking as { packages?: PackageOffer[] }).packages ?? []);

/** Sus paquetes vigentes y con visitas por usar. */
export function activePackages(clientId: string, now = new Date()): MockOwnedPackage[] {
  return (db.booking.ownedPackages?.[clientId] ?? []).filter((item) => item.remaining > 0 && new Date(item.expiresAt).getTime() > now.getTime());
}

export function buyPackage(clientId: string, offer: PackageOffer, now = new Date()): MockOwnedPackage {
  const owned: MockOwnedPackage = {
    id: `own_${Date.now().toString(36)}`,
    packageId: offer.id,
    name: offer.name,
    serviceId: offer.serviceId,
    remaining: offer.sessions,
    total: offer.sessions,
    expiresAt: new Date(now.getTime() + offer.validDays * DAY_MS).toISOString(),
  };
  db.booking.ownedPackages = { ...(db.booking.ownedPackages ?? {}), [clientId]: [...(db.booking.ownedPackages?.[clientId] ?? []), owned] };
  return owned;
}

/** Gasta las visitas usadas en una reserva. */
export function spendPackages(clientId: string, used: Record<string, number>): void {
  db.booking.ownedPackages = {
    ...(db.booking.ownedPackages ?? {}),
    [clientId]: (db.booking.ownedPackages?.[clientId] ?? []).map((item) => (used[item.id] ? { ...item, remaining: Math.max(0, item.remaining - used[item.id]) } : item)),
  };
}
