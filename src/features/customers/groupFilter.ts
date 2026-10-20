import { isOverdue } from "./overdue";

/**
 * Quién entra en un grupo de clientes (docs/API_CONTRACT.md, «Clientes › Grupos y campañas»): el segmento, un aviso
 * («le toca volver», «cumple esta semana»…), una etiqueta y el origen. Es la misma regla en la lista de Clientes y en
 * el servidor que arma la audiencia de una campaña, así el número que se ve es el que recibe. Sin dependencias.
 */

const DAY_MS = 86_400_000;
/** Cuántos días antes del cumpleaños entra en «cumple esta semana». */
export const BIRTHDAY_WINDOW_DAYS = 7;
/** Cancelaciones más inasistencias desde las que «falla seguido». */
export const UNRELIABLE_MISSES = 3;

export const ALERT_IDS = ["atRisk", "overdue", "birthday", "unreliable"] as const;
export type CustomerAlertId = (typeof ALERT_IDS)[number];

/** Lo que hace falta saber de un cliente para filtrarlo. */
export interface GroupCustomer {
  segment: string;
  lastVisitAt: string | null;
  visitEveryDays: number | null;
  birthDate: string | null;
  cancellations: number;
  noShows: number;
  tags?: readonly string[];
  source?: string | null;
}

export interface GroupFilters {
  segment: string | null;
  alert: CustomerAlertId | null;
  tag: string | null;
  /** Un origen (`instagram`…) o `unknown` para los que no lo tienen. */
  source: string | null;
}

export const EMPTY_FILTERS: GroupFilters = { segment: null, alert: null, tag: null, source: null };

/** Días que faltan para su cumpleaños (0 = hoy); `null` si no lo dejó. */
export function daysToBirthday(birthDate: string | null, now = new Date()): number | null {
  if (!birthDate) return null;
  const [, month, day] = birthDate.split("-").map(Number);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(today.getFullYear(), month - 1, day);
  if (next < today) next = new Date(today.getFullYear() + 1, month - 1, day);
  return Math.round((next.getTime() - today.getTime()) / DAY_MS);
}

const isActive = (customer: GroupCustomer) => customer.segment !== "blocked" && customer.segment !== "lost";

/** Cada aviso de la lista de Clientes, como regla. */
export const ALERT_MATCHERS: Readonly<Record<CustomerAlertId, (customer: GroupCustomer, now?: Date) => boolean>> = {
  atRisk: (customer) => customer.segment === "atRisk",
  overdue: (customer, now) => isOverdue(customer, now),
  birthday: (customer, now) => {
    const days = daysToBirthday(customer.birthDate, now);
    return isActive(customer) && days !== null && days <= BIRTHDAY_WINDOW_DAYS;
  },
  unreliable: (customer) => isActive(customer) && customer.cancellations + customer.noShows >= UNRELIABLE_MISSES,
};

/** Si un cliente entra en el grupo: cumple todos los filtros puestos (los vacíos no cuentan). */
export function matchesGroup(customer: GroupCustomer, filters: GroupFilters, now = new Date()): boolean {
  if (filters.segment && customer.segment !== filters.segment) return false;
  if (filters.alert && !ALERT_MATCHERS[filters.alert](customer, now)) return false;
  if (filters.tag && !(customer.tags ?? []).includes(filters.tag)) return false;
  if (filters.source && (customer.source ?? "unknown") !== filters.source) return false;
  return true;
}

/** Si no hay ningún filtro: un grupo así sería «todos». */
export const isEmptyFilter = (filters: GroupFilters): boolean => !filters.segment && !filters.alert && !filters.tag && !filters.source;

/** Si dos filtros son el mismo grupo. */
export const sameFilters = (a: GroupFilters, b: GroupFilters): boolean => a.segment === b.segment && a.alert === b.alert && a.tag === b.tag && a.source === b.source;
