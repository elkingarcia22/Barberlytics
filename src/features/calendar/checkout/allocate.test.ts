import { describe, expect, test } from "vitest";
import { discountAmount, equalParts } from "../checkoutMath";
import { allocateParts, paymentOf } from "./allocate";

describe("allocateParts", () => {
  test("fills each appointment in order with the parts", () => {
    const parts = [
      { method: "cash" as const, amount: 50 },
      { method: "card" as const, amount: 50, deviceId: "dev_caja" },
    ];
    expect(allocateParts(parts, [70, 30])).toEqual([
      [
        { method: "cash", amount: 50 },
        { method: "card", amount: 20, deviceId: "dev_caja" },
      ],
      [{ method: "card", amount: 30, deviceId: "dev_caja" }],
    ]);
  });

  test("a single appointment keeps all its parts", () => {
    const parts = [
      { method: "card" as const, amount: 41.5 },
      { method: "card" as const, amount: 41.5 },
    ];
    expect(allocateParts(parts, [83])).toEqual([parts]);
  });
});

describe("paymentOf", () => {
  test("one part is its method; several of different methods are mixed", () => {
    expect(paymentOf([{ method: "card", amount: 30, deviceId: "dev_movil" }])).toEqual({ method: "card", deviceId: "dev_movil" });
    expect(paymentOf([{ method: "cash", amount: 10 }, { method: "card", amount: 20 }]).method).toBe("mixed");
    expect(paymentOf([{ method: "card", amount: 10 }, { method: "card", amount: 20 }]).method).toBe("card");
  });
});

describe("discountAmount and equalParts", () => {
  test("a discount never goes over the bill", () => {
    expect(discountAmount({ type: "percent", value: 10 }, 80)).toBe(8);
    expect(discountAmount({ type: "amount", value: 120 }, 80)).toBe(80);
    expect(discountAmount(null, 80)).toBe(0);
  });

  test("equal parts add up to the total, the last one takes the cents", () => {
    expect(equalParts(100, 3)).toEqual([33.33, 33.33, 33.34]);
    expect(equalParts(83, 2).reduce((sum, part) => sum + part, 0)).toBe(83);
  });
});
