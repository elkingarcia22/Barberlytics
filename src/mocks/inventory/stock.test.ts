import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { catalog } from "../booking/logic";
import { releaseAppointmentStock, stockLevel, syncAppointmentStock } from "./stock";
import type { MockAppointment } from "../calendar/seed";

const TOKEN = "mock-acc_admin-test";
const api = (path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` } });
const sellable = () => db.products.items.find((item) => item.id === "prd_cera")!;

describe("inventario ligero", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  test("la venta rápida descuenta y deja la línea en el historial", async () => {
    const product = sellable();
    const before = stockLevel("ma", product.id).onHand;
    const sale = await (await api("/sales", { method: "POST", body: JSON.stringify({ branchId: "ma", items: [{ productId: product.id, qty: 2 }], method: "cash" }) })).json();
    expect(stockLevel("ma", product.id).onHand).toBe(before - 2);
    expect(db.inventory.movements[0]).toMatchObject({ productId: product.id, delta: -2, reason: "sale", ref: sale.id });
  });

  test("lo apartado por una cita se descuenta una vez, al cobrar solo la diferencia, y vuelve si se anula", () => {
    const product = sellable();
    const before = stockLevel("ma", product.id).onHand;
    const appointment = { id: "apt_x", branchId: "ma", products: [{ productId: product.id, qty: 2 }] } as MockAppointment;
    const held = syncAppointmentStock(appointment, "online", "Cliente");
    expect(stockLevel("ma", product.id).onHand).toBe(before - 2);
    const charged = syncAppointmentStock({ ...held, products: [{ productId: product.id, qty: 3 }] }, "sale", "Recepción");
    expect(stockLevel("ma", product.id).onHand).toBe(before - 3);
    releaseAppointmentStock(charged, "Recepción");
    expect(stockLevel("ma", product.id).onHand).toBe(before);
  });

  test("un conteo fija lo que hay y anota la diferencia; merma pide motivo; el mínimo marca «por reponer»", async () => {
    const product = sellable();
    const counted = await (await api("/inventory/movements", { method: "POST", body: JSON.stringify({ branchId: "ma", productId: product.id, kind: "count", qty: 3 }) })).json();
    expect(counted).toMatchObject({ onHand: 3, status: "low" });
    expect((await api("/inventory/movements", { method: "POST", body: JSON.stringify({ branchId: "ma", productId: product.id, kind: "waste", qty: 1 }) })).status).toBe(422);
    await api(`/inventory/${product.id}`, { method: "PATCH", body: JSON.stringify({ branchId: "ma", min: 2 }) });
    const list = await (await api("/inventory?branchId=ma")).json();
    expect(list.items.find((item: { productId: string }) => item.productId === product.id)).toMatchObject({ onHand: 3, min: 2, status: "ok" });
  });

  test("lo agotado no se ofrece en la reserva en línea", async () => {
    const product = sellable();
    expect(catalog("ma").products.some((item) => item.id === product.id)).toBe(true);
    await api("/inventory/movements", { method: "POST", body: JSON.stringify({ branchId: "ma", productId: product.id, kind: "count", qty: 0 }) });
    expect(catalog("ma").products.some((item) => item.id === product.id)).toBe(false);
  });
});
