import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { appointmentAccount } from "../calendar/account";
import type { MockAppointment } from "../calendar/seed";
import { branchCurrency, branchOnlineMethods, branchTaxPercent, itemTaxPercent } from "./branchRules";

const appointment = (overrides: Partial<MockAppointment> = {}): MockAppointment => ({
  id: "apt_test",
  branchId: "ma",
  clientId: "cli_test",
  barberId: "brb_test",
  requestedBarberId: null,
  serviceIds: ["svc_corte"],
  products: [],
  start: "2026-10-20T10:00",
  durationMin: 30,
  status: "seated",
  barberReady: false,
  walkIn: false,
  source: "online",
  repeat: "none",
  seriesId: null,
  notes: null,
  createdAt: "2026-10-17T12:00:00.000Z",
  createdBy: "Reserva en línea",
  history: [],
  payment: null,
  ...overrides,
});

const corte = () => db.services.items.find((item) => item.id === "svc_corte")!;

describe("cada sucursal cobra con lo suyo", () => {
  beforeEach(() => {
    db.reset();
  });

  test("moneda e impuesto salen de la sucursal, no de la barbería", () => {
    expect(branchCurrency("ma")).toBe("USD");
    expect(branchTaxPercent("ma")).toBe(6.25);
    // Estatal más condado.
    expect(branchTaxPercent("nc")).toBe(7.25);
    db.settings = { ...db.settings, lists: { ...db.settings.lists, branches: db.settings.lists.branches.map((item) => (item.id === "ma" ? { ...item, currency: "COP", taxGroupId: "tax_co_iva" } : item)) } };
    expect(branchCurrency("ma")).toBe("COP");
    expect(branchTaxPercent("ma")).toBe(19);
  });

  test("un artículo con tasa propia la conserva en cualquier sucursal", () => {
    expect(itemTaxPercent(8, "nc")).toBe(8);
    expect(itemTaxPercent(null, "nc")).toBe(7.25);
  });

  test("los métodos en línea son los de la pasarela conectada de la sucursal", () => {
    expect(branchOnlineMethods("ma")).toEqual(["card", "wallet"]);
    db.settings = {
      ...db.settings,
      lists: {
        ...db.settings.lists,
        gateways: [...db.settings.lists.gateways, { id: "gw_wompi", provider: "wompi", name: "Wompi", publicKey: "pub_test_x", hasSecret: true, connected: true }],
        branches: db.settings.lists.branches.map((item) => (item.id === "ma" ? { ...item, gatewayId: "gw_wompi" } : item.id === "nc" ? { ...item, gatewayId: null } : item)),
      },
    };
    expect(branchOnlineMethods("ma")).toEqual(["card", "pse", "nequi"]);
    // Sin pasarela no se cobra en línea: solo en la barbería.
    expect(branchOnlineMethods("nc")).toEqual([]);
  });
});

describe("la cuenta de una cita reservada en línea", () => {
  beforeEach(() => {
    db.reset();
  });

  test("pagada entera al reservar: en caja no queda nada por cobrar", () => {
    const price = corte().price;
    const total = Math.round(price * 1.0625 * 100) / 100;
    const account = appointmentAccount(appointment({ online: { reservation: "BL-1001", method: "card", paid: total, tip: 5, discount: 0 } }));
    expect(account).toMatchObject({ subtotal: price, tax: Math.round(price * 6.25) / 100, total, prepaid: total, prepaidTip: 5, due: 0 });
  });

  test("con anticipo: en caja se cobra solo el resto", () => {
    const account = appointmentAccount(appointment({ online: { reservation: "BL-1002", method: "shop", paid: 10, tip: 0, discount: 0 } }));
    expect(account.prepaid).toBe(10);
    expect(account.due).toBeCloseTo(account.total - 10, 10);
  });

  test("sin reserva en línea se cobra todo, con el impuesto de su sucursal", () => {
    const inMa = appointmentAccount(appointment());
    const inNc = appointmentAccount(appointment({ branchId: "nc" }));
    expect(inMa.prepaid).toBe(0);
    expect(inMa.due).toBe(inMa.total);
    expect(inNc.tax).toBeGreaterThan(inMa.tax);
  });
});
