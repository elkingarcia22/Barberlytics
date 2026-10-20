import { describe, expect, it } from "vitest";
import { equalLines, giftOf, linesTotal, mixedLines, paymentOfLines } from "./payLines";

describe("payLines", () => {
  it("parte en iguales y deja el redondeo en la última", () => {
    const lines = equalLines(100, 3, () => ({ method: "cash" }));
    expect(lines.map((line) => line.amount)).toEqual([33.33, 33.33, 33.34]);
    expect(linesTotal(lines)).toBe(100);
  });

  it("en mixto la segunda forma se lleva lo que falta", () => {
    const lines = mixedLines([{ method: "gift", amount: 30 }, { method: "card", amount: 0 }], 80);
    expect(lines.map((line) => line.amount)).toEqual([30, 50]);
    expect(giftOf(lines)).toBe(30);
  });

  it("efectivo y tarjeta viajan como mixto con el recargo en la tarjeta", () => {
    expect(paymentOfLines([{ method: "cash", amount: 20 }, { method: "card", amount: 60, deviceId: "dev_caja" }], 2)).toEqual({ method: "mixed", split: { cash: 20, card: 62 }, deviceId: "dev_caja" });
  });

  it("sin la tarjeta de regalo, una sola forma es su método; varias, partes", () => {
    expect(paymentOfLines([{ method: "gift", amount: 30 }, { method: "card", amount: 50, deviceId: "dev_1" }])).toEqual({ method: "card", deviceId: "dev_1" });
    expect(paymentOfLines([{ method: "cash", amount: 30 }, { method: "link", amount: 20 }, { method: "cash", amount: 10 }])).toEqual({
      method: "mixed",
      parts: [{ method: "cash", amount: 30 }, { method: "link", amount: 20 }, { method: "cash", amount: 10 }],
    });
  });
});
