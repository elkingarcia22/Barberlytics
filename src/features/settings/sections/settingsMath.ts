import type { Closure, TaxGroup, TipOption } from "../settingsTypes";

/** Las cuentas pequeñas de los ajustes, sin JSX: lo que dura un cierre, lo que suma un impuesto y cómo se lee una propina. */

const DAY_MS = 86_400_000;
const asDate = (day: string) => new Date(`${day}T12:00:00`);

/** Cuántos días dura un cierre, contando el primero y el último. */
export const closureDays = (closure: Pick<Closure, "startDate" | "endDate">): number => Math.round((asDate(closure.endDate).getTime() - asDate(closure.startDate).getTime()) / DAY_MS) + 1;

/** Lo que suman las tasas de un impuesto; una tasa a medio escribir cuenta cero. */
export const taxTotal = (group: Pick<TaxGroup, "taxes">): number => Math.round(group.taxes.reduce((sum, tax) => sum + (Number.isFinite(tax.percent) ? tax.percent : 0), 0) * 100) / 100;

export const tipLabel = (option: TipOption): string => (option.type === "percent" ? `${option.value}%` : `$${option.value}`);
