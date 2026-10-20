import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { loanInstallmentsIn } from "./compute";

const OWNER = "mock-acc_admin-payroll-extras";
const BARBER = "mock-acc_barber-payroll-extras";
const call = (token: string, path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${token}` } });
const post = (body: unknown) => ({ method: "POST", body: JSON.stringify(body) });
const QUINCENA = { cycle: "biweekly", startDay: 1 };

describe("nómina: quincena, mostrador, préstamos y faltante", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
    db.sessions.set(BARBER, "acc_barber");
    db.settings.sections = { ...db.settings.sections, payrollCycle: QUINCENA };
  });

  const memberOf = async (from: string, to: string, memberId = "team-04") =>
    ((await (await call(OWNER, `/payroll?branchId=ma&from=${from}&to=${to}`)).json()).members as { memberId: string; productSales: number; productCommission: number; counterSales?: number; adjustments: { kind: string; amount: number; note: string }[]; net: number }[]).find((item) => item.memberId === memberId)!;

  test("una venta de mostrador con vendedor comisiona en su nómina como producto", async () => {
    const product = db.products.items.find((item) => item.sellable && item.activeBranchIds.includes("ma"))!;
    db.calendar.sales = [...db.calendar.sales, { id: "sale_test", branchId: "ma", items: [{ productId: product.id, qty: 2 }], method: "cash", total: product.price * 2, paidAt: "2026-10-05T15:00:00.000Z", sellerId: "team-04" }];
    const withSale = await memberOf("2026-10-01", "2026-10-15");
    db.calendar.sales = db.calendar.sales.map((sale) => (sale.id === "sale_test" ? { ...sale, sellerId: null } : sale));
    const without = await memberOf("2026-10-01", "2026-10-15");
    expect(withSale.counterSales).toBe(1);
    expect(withSale.productSales).toBeGreaterThan(without.productSales);
    expect(withSale.productCommission).toBeGreaterThan(without.productCommission);
  });

  test("el barbero vende a su nombre; recepción o gerencia eligen el vendedor", async () => {
    const product = db.products.items.find((item) => item.sellable && item.activeBranchIds.includes("ma"))!;
    const mine = await (await call(BARBER, "/sales", post({ branchId: "ma", items: [{ productId: product.id, qty: 1 }], method: "cash", sellerId: "team-05" }))).json();
    expect(mine.sellerId).toBe("team-04");
    const chosen = await (await call(OWNER, "/sales", post({ branchId: "ma", items: [{ productId: product.id, qty: 1 }], method: "cash", sellerId: "team-05" }))).json();
    expect(chosen.sellerId).toBe("team-05");
  });

  test("un préstamo se descuenta en cuotas, una por quincena, y cancelarlo frena lo que falta", async () => {
    const loan = await (await call(OWNER, "/payroll/loans", post({ branchId: "ma", memberId: "team-04", amount: 100, installments: 3, startDate: "2026-10-03", note: "Para el arriendo" }))).json();
    expect(loan).toMatchObject({ installments: 3, amount: 100 });
    const first = await memberOf("2026-10-01", "2026-10-15");
    expect(first.adjustments).toContainEqual(expect.objectContaining({ kind: "loan", amount: 33.33, note: "1/3 · Para el arriendo" }));
    const third = await memberOf("2026-11-01", "2026-11-15");
    expect(third.adjustments).toContainEqual(expect.objectContaining({ kind: "loan", amount: 33.34 }));
    expect((await memberOf("2026-11-16", "2026-11-30")).adjustments.some((item) => item.kind === "loan")).toBe(false);
    // Un barbero no presta; ve los suyos.
    expect((await call(BARBER, "/payroll/loans", post({ branchId: "ma", memberId: "team-04", amount: 10, installments: 1, note: "Yo mismo" }))).status).toBe(403);
    expect((await (await call(BARBER, "/payroll/loans?branchId=ma")).json()).items).toHaveLength(1);
    // Cancelado hoy (19 de octubre): la cuota de la segunda quincena de octubre ya no sale.
    await call(OWNER, `/payroll/loans/${loan.id}/cancel`, post({}));
    expect(loanInstallmentsIn(db.payroll.loans ?? [], "2026-10-16", "2026-11-15")).toEqual([]);
  });

  test("el faltante de un cierre de caja se descuenta en la nómina de su ciclo, una sola vez", async () => {
    db.register = { closures: [{ id: "reg_test", branchId: "ma", date: "2026-10-06", opening: 0, expectedCash: 200, counted: 180, difference: -20, note: "Faltan 20", closedAt: "2026-10-06T23:00:00.000Z", closedBy: "Lucía Bernal" }], movements: [] };
    expect((await call(BARBER, "/register/reg_test/shortage", post({ memberId: "team-03" }))).status).toBe(403);
    const charged = await (await call(OWNER, "/register/reg_test/shortage", post({ memberId: "team-04" }))).json();
    expect(charged.shortage).toMatchObject({ memberId: "team-04" });
    expect((await memberOf("2026-10-01", "2026-10-15")).adjustments).toContainEqual(expect.objectContaining({ kind: "shortage", amount: 20 }));
    expect((await call(OWNER, "/register/reg_test/shortage", post({ memberId: "team-04" }))).status).toBe(409);
  });
});
