import { GATEWAY_SPECS, isGatewayProvider, type OnlineMethod } from "@/features/settings/gatewayProviders";
import { blendedPercent, linePercent } from "@/features/branches/tax";
import { db } from "../db";
import type { MockListItem } from "./seed";

/**
 * Lo que cada sucursal decide en Configuración y el resto del backend
 * respeta: en qué moneda cobra, con qué impuesto y con qué pasarela. Una
 * barbería con sucursales en Estados Unidos y en Colombia cobra cada una con
 * lo suyo.
 */

const FALLBACK_CURRENCY = "USD";

export const branchOf = (branchId: string): MockListItem | undefined => db.settings.lists.branches.find((item) => item.id === branchId);

export const branchCurrency = (branchId: string): string => {
  const currency = branchOf(branchId)?.currency;
  return typeof currency === "string" && currency ? currency : FALLBACK_CURRENCY;
};

/** El impuesto de la sucursal: la suma de las tasas de su grupo (estatal + condado, por ejemplo). */
export function branchTaxPercent(branchId: string): number {
  const group = db.settings.lists.taxGroups.find((item) => item.id === branchOf(branchId)?.taxGroupId);
  return ((group?.taxes as { percent: number }[] | undefined) ?? []).reduce((sum, tax) => sum + tax.percent, 0);
}

/** Si los precios ya traen el impuesto (Configuración › Precios). */
export const taxInclusive = (): boolean => (db.settings.sections.pricing as { taxInclusive?: boolean }).taxInclusive === true;

/** La tasa de un servicio o producto en esa sucursal: la suya, o la de la sucursal si no tiene. */
export const itemTaxPercent = (itemTaxRate: number | null | undefined, branchId: string): number => linePercent(itemTaxRate, branchTaxPercent(branchId));

const serviceRate = (id: string): number | null => db.services.items.find((item) => item.id === id)?.taxRate ?? null;
const productRate = (id: string): number | null => db.products.items.find((item) => item.id === id)?.taxRate ?? null;

export interface TaxableAccount {
  services: readonly { id: string; amount: number }[];
  products: readonly { id: string; amount: number }[];
}

/** La tasa media de una cuenta en esa sucursal (cada línea con la suya). */
export function accountTaxPercent(branchId: string, account: TaxableAccount): number {
  return blendedPercent([
    ...account.services.map((line) => ({ amount: line.amount, percent: itemTaxPercent(serviceRate(line.id), branchId) })),
    ...account.products.map((line) => ({ amount: line.amount, percent: itemTaxPercent(productRate(line.id), branchId) })),
  ]);
}

/** Con qué se puede pagar en línea en esa sucursal: lo de su pasarela, si está conectada. */
export function branchOnlineMethods(branchId: string): OnlineMethod[] {
  const gateway = db.settings.lists.gateways.find((item) => item.id === branchOf(branchId)?.gatewayId);
  if (!gateway || gateway.connected !== true || !isGatewayProvider(gateway.provider)) return [];
  return [...GATEWAY_SPECS[gateway.provider].methods];
}
