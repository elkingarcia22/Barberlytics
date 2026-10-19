import { describe, expect, test } from "vitest";
import { countTotal, denominationsOf } from "./denominations";

describe("conteo por denominación", () => {
  test("suma billetes y monedas sin errores de coma flotante", () => {
    expect(countTotal({ "20": 3, "5": 1, "0.1": 3, "0.01": 2 })).toBe(65.32);
    expect(countTotal({ "50000": 2, "1000": 7, "50": 1 })).toBe(107_050);
    expect(countTotal({ "20": -2, "10": 1.7 })).toBe(10);
  });

  test("cada moneda trae sus billetes y monedas; una desconocida, ninguno", () => {
    expect(denominationsOf("cop")?.[0]).toEqual({ value: 100_000, kind: "bill" });
    expect(denominationsOf("USD")?.some((item) => item.value === 0.25 && item.kind === "coin")).toBe(true);
    expect(denominationsOf("XYZ")).toBeNull();
  });
});
