import { describe, expect, test } from "vitest";
import { computeTotals } from "@/features/booking/pricing";
import { settlementsOf } from "./settlement";

const base = { services: 70, products: 0, discount: 0, taxPercent: 0, tip: 0 };

describe("lo que una reserva en línea deja resuelto en cada cita", () => {
  test("pagada con tarjeta: lo pagado se reparte por lo que vale cada cita, sin propina ni recargo", () => {
    const totals = computeTotals({ ...base, tip: 7, cardFee: { name: "Recargo", rate: 3, type: "percent" } });
    const [first, second] = settlementsOf({ values: [40, 30], serviceValues: [40, 30], totals, payment: { method: "card", status: "paid", last4: "4242", brand: "Visa", paid: totals.total }, reservation: "BL-1001" });
    expect(first.paid + second.paid).toBe(70);
    expect(first.paid).toBe(40);
    expect(first.tip + second.tip).toBe(7);
    expect(first).toMatchObject({ reservation: "BL-1001", method: "card", discount: 0 });
  });

  test("con anticipo para pagar en la barbería: solo cuenta lo adelantado y no hay propina", () => {
    const totals = computeTotals(base);
    const [only] = settlementsOf({ values: [70], serviceValues: [70], totals, payment: { method: "shop", status: "pending", last4: "4242", brand: "Visa", paid: 21 }, reservation: "BL-1002" });
    expect(only).toMatchObject({ paid: 21, tip: 0 });
  });

  test("el cupón, la cortesía y el paquete quedan como descuento de la cita", () => {
    const totals = computeTotals({ ...base, discount: 10, reward: 5 });
    const [only] = settlementsOf({ values: [70], serviceValues: [70], totals, payment: { method: "shop", status: "pending", last4: null, brand: null, paid: 0 }, reservation: "BL-1003" });
    expect(only).toMatchObject({ paid: 0, discount: 15 });
  });

  test("los centavos que sobran al repartir van a la última cita: la suma cuadra exacta", () => {
    const totals = computeTotals({ ...base, services: 100 });
    const parts = settlementsOf({ values: [1, 1, 1], serviceValues: [1, 1, 1], totals, payment: { method: "card", status: "paid", last4: null, brand: null, paid: 100 }, reservation: "BL-1004" });
    expect(parts.reduce((sum, part) => sum + part.paid, 0)).toBeCloseTo(100, 10);
  });
});
