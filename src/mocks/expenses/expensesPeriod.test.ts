import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";

const OWNER = "mock-acc_admin-expenses";
const RECEPTION = "mock-acc_reception-expenses";
const call = (token: string, path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${token}` } });
const post = (body: unknown) => ({ method: "POST", body: JSON.stringify(body) });

describe("gastos: periodo, día de pago y categorías propias", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
    db.sessions.set(RECEPTION, "acc_reception");
  });

  test("con from y to solo sale lo vivo en el periodo: variables de esas fechas y fijos que corrían", async () => {
    const variable = await (await call(OWNER, "/expenses", post({ branchId: "ma", kind: "variable", name: "Toallas", amount: 40, date: "2026-09-10", categoryId: "supplies" }))).json();
    const fixed = await (await call(OWNER, "/expenses", post({ branchId: "ma", kind: "fixed", name: "Seguro", amount: 90, frequency: "monthly", date: "2026-08-01", categoryId: "other", dueDay: 5 }))).json();
    expect(fixed.dueDay).toBe(5);
    await call(OWNER, `/expenses/${fixed.id}/end`, post({ endDate: "2026-09-15" }));
    const september = (await (await call(OWNER, "/expenses?branchId=ma&from=2026-09-01&to=2026-09-30")).json()).items.map((item: { id: string }) => item.id);
    expect(september).toEqual(expect.arrayContaining([variable.id, fixed.id]));
    const october = (await (await call(OWNER, "/expenses?branchId=ma&from=2026-10-01&to=2026-10-31")).json()).items.map((item: { id: string }) => item.id);
    expect(october).not.toContain(variable.id);
    expect(october).not.toContain(fixed.id);
  });

  test("el día de pago va del 1 al 31 y solo en los fijos", async () => {
    expect((await call(OWNER, "/expenses", post({ branchId: "ma", kind: "fixed", name: "Arriendo", amount: 900, frequency: "monthly", dueDay: 32 }))).status).toBe(422);
    const variable = await (await call(OWNER, "/expenses", post({ branchId: "ma", kind: "variable", name: "Café", amount: 8, dueDay: 10, date: "2026-09-01" }))).json();
    expect(variable.dueDay).toBeNull();
  });

  test("categorías propias: las crea gerencia, se usan en un gasto y al borrarlas sus gastos pasan a «Otros»", async () => {
    expect((await call(RECEPTION, "/expenses/categories", post({ name: "Uniformes" }))).status).toBe(403);
    const category = await (await call(OWNER, "/expenses/categories", post({ name: "Uniformes" }))).json();
    expect((await call(OWNER, "/expenses/categories", post({ name: "uniformes" }))).status).toBe(409);
    const expense = await (await call(OWNER, "/expenses", post({ branchId: "ma", kind: "variable", name: "Camisetas", amount: 120, date: "2026-09-12", categoryId: category.id }))).json();
    expect(expense.categoryId).toBe(category.id);
    // Una categoría inventada cae en «Otros».
    expect((await (await call(OWNER, "/expenses", post({ branchId: "ma", kind: "variable", name: "Varios", amount: 1, date: "2026-09-12", categoryId: "cat_inventada" }))).json()).categoryId).toBe("other");
    expect((await (await call(OWNER, "/expenses/categories")).json()).custom).toEqual([expect.objectContaining({ id: category.id, name: "Uniformes" })]);
    expect((await call(OWNER, `/expenses/categories/${category.id}`, { method: "DELETE" })).status).toBe(204);
    expect(db.expenses.find((item) => item.id === expense.id)?.categoryId).toBe("other");
  });
});
