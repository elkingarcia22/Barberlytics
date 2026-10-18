import { describe, expect, test } from "vitest";
import { blendedPercent, cartTotals, linePercent, taxOn } from "./tax";

describe("impuesto por sucursal", () => {
  test("un artículo sin tasa propia usa la de la sucursal; con tasa, la suya (0 = exento)", () => {
    expect(linePercent(null, 19)).toBe(19);
    expect(linePercent(8, 19)).toBe(8);
    expect(linePercent(0, 19)).toBe(0);
  });

  test("una cuenta con tasas distintas se grava con la media ponderada", () => {
    // 100 al 10 % y 100 al 0 %: 5 % sobre 200.
    expect(blendedPercent([{ amount: 100, percent: 10 }, { amount: 100, percent: 0 }])).toBe(5);
    expect(blendedPercent([])).toBe(0);
  });

  test("el impuesto encima se suma; el incluido sale de dentro del precio", () => {
    expect(taxOn(100, 6.25, false)).toBe(6.25);
    // IVA del 19 % incluido en 119: 19.
    expect(taxOn(119, 19, true)).toBe(19);
  });

  test("el descuento baja la base antes del impuesto y el incluido no se vuelve a sumar", () => {
    expect(cartTotals([{ amount: 100, percent: 10 }], 20, false)).toEqual({ subtotal: 100, discount: 20, tax: 8, total: 88 });
    expect(cartTotals([{ amount: 119, percent: 19 }], 0, true)).toEqual({ subtotal: 119, discount: 0, tax: 19, total: 119 });
    // Un descuento mayor que la cuenta la deja en cero, sin impuesto negativo.
    expect(cartTotals([{ amount: 30, percent: 10 }], 50, false)).toEqual({ subtotal: 30, discount: 30, tax: 0, total: 0 });
  });
});
