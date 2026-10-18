import { beforeEach, describe, expect, test } from "vitest";
import { db } from "./db";
import { barberServicePrice, productPriceIn, servicePriceIn, withBranchPrice } from "./catalogPrices";

describe("precio por sucursal", () => {
  beforeEach(() => {
    db.reset();
  });

  test("sin precio propio, la sucursal usa el general", () => {
    const product = db.products.items[0];
    expect(productPriceIn(product.id, "nc")).toBe(product.price);
  });

  test("con precio propio, esa sucursal cobra el suyo y las demás el general", () => {
    const product = db.products.items[0];
    db.products = { ...db.products, items: db.products.items.map((item) => (item.id === product.id ? { ...item, branchPrices: { nc: 99000 } } : item)) };
    expect(productPriceIn(product.id, "nc")).toBe(99000);
    expect(productPriceIn(product.id, "ma")).toBe(product.price);
  });

  test("el barbero con precio propio cobra el suyo; sin él, el de la sucursal", () => {
    const service = db.services.items.find((item) => item.id === "svc_corte")!;
    db.services = { ...db.services, items: db.services.items.map((item) => (item.id === service.id ? { ...item, branchPrices: { ma: 50 } } : item)) };
    const withOwn = db.team.members.find((member) => member.services.some((row) => row.serviceId === service.id && row.price !== null))!;
    const own = withOwn.services.find((row) => row.serviceId === service.id)!.price!;
    expect(barberServicePrice(withOwn.id, service.id, "ma")).toBe(own);
    expect(barberServicePrice("nadie", service.id, "ma")).toBe(50);
    expect(servicePriceIn(service.id, "ma")).toBe(50);
  });

  test("vaciar el precio de una sucursal la devuelve al general, sin tocar las demás", () => {
    expect(withBranchPrice({ ma: 10, nc: 20 }, "ma", null)).toEqual({ nc: 20 });
    expect(withBranchPrice({ nc: 20 }, "nc", null)).toBeUndefined();
    expect(withBranchPrice(undefined, "ma", 12.345)).toEqual({ ma: 12.35 });
    expect(withBranchPrice({ ma: 10 }, "ma", undefined)).toEqual({ ma: 10 });
  });
});
