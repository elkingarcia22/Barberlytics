import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { incomeStatement } from "../reports/income";

const TOKEN = "mock-acc_admin-test";
const api = (path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` } });
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

describe("gastos con fecha, categoría y comprobantes", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  test("un gasto guarda su fecha, categoría, proveedor, método y comprobante", async () => {
    const response = await api("/expenses", { method: "POST", body: JSON.stringify({ branchId: "ma", kind: "variable", name: "Toallas", amount: 80, date: "2026-10-02", categoryId: "cleaning", supplier: "Textiles SAS", paymentMethod: "wallet", attachments: [{ name: "recibo.png", dataUrl: PNG }] }) });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ date: "2026-10-02", categoryId: "cleaning", supplier: "Textiles SAS", paymentMethod: "wallet", attachments: [expect.objectContaining({ name: "recibo.png", type: "image/png" })], createdBy: expect.any(String) });
  });

  test("rechaza un variable con fecha futura y más de 3 comprobantes", async () => {
    const future = await api("/expenses", { method: "POST", body: JSON.stringify({ branchId: "ma", kind: "variable", name: "Compra", amount: 10, date: "2999-01-01" }) });
    expect(future.status).toBe(422);
    const many = await api("/expenses", { method: "POST", body: JSON.stringify({ branchId: "ma", kind: "variable", name: "Compra", amount: 10, attachments: Array.from({ length: 4 }, () => ({ name: "x.png", dataUrl: PNG })) }) });
    expect(many.status).toBe(422);
  });

  test("terminar un fijo lo saca de los meses siguientes pero no de los pasados", async () => {
    const rent = db.expenses.find((item) => item.branchId === "ma" && item.name === "Renta del local")!;
    const before = incomeStatement("ma", "2026-09", new Date(2026, 9, 18)).costs.expensesFixed;
    const ended = await (await api(`/expenses/${rent.id}/end`, { method: "POST", body: JSON.stringify({ endDate: "2026-09-30" }) })).json();
    expect(ended.endDate).toBe("2026-09-30");
    expect(incomeStatement("ma", "2026-09", new Date(2026, 9, 18)).costs.expensesFixed).toBe(before);
    const october = incomeStatement("ma", "2026-10", new Date(2026, 9, 18)).costs.expensesFixed;
    db.expenses = db.expenses.map((item) => (item.id === rent.id ? { ...item, endDate: null } : item));
    expect(incomeStatement("ma", "2026-10", new Date(2026, 9, 18)).costs.expensesFixed).toBeGreaterThan(october);
  });
});
