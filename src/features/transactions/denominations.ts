/**
 * Los billetes y monedas de cada moneda, para contar la caja por denominación en vez de escribir un total
 * (contar por denominación encuentra el billete mal sumado; un total escrito, no). Lo usan la caja y el
 * backend simulado, que vuelve a sumar lo contado.
 */

export interface Denomination {
  value: number;
  kind: "bill" | "coin";
}

const bills = (...values: number[]): Denomination[] => values.map((value) => ({ value, kind: "bill" }));
const coins = (...values: number[]): Denomination[] => values.map((value) => ({ value, kind: "coin" }));

const BY_CURRENCY: Readonly<Record<string, readonly Denomination[]>> = {
  USD: [...bills(100, 50, 20, 10, 5, 1), ...coins(0.25, 0.1, 0.05, 0.01)],
  COP: [...bills(100_000, 50_000, 20_000, 10_000, 5_000, 2_000), ...coins(1_000, 500, 200, 100, 50)],
  MXN: [...bills(1_000, 500, 200, 100, 50, 20), ...coins(10, 5, 2, 1, 0.5)],
  EUR: [...bills(500, 200, 100, 50, 20, 10, 5), ...coins(2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01)],
};

/** Las denominaciones de la moneda; `null` si no las conocemos (se escribe el total). */
export const denominationsOf = (currency: string): readonly Denomination[] | null => BY_CURRENCY[currency.toUpperCase()] ?? null;

/** Lo contado: cada denominación por su cantidad, sin errores de coma flotante. */
export function countTotal(counts: Readonly<Record<string, number>>): number {
  const cents = Object.entries(counts).reduce((sum, [value, count]) => sum + Math.round(Number(value) * 100) * Math.max(0, Math.floor(count || 0)), 0);
  return cents / 100;
}
