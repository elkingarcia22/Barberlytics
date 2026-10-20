import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { dueDatesIn, payableStatus } from "@/features/expenses/payables";
import { db } from "./db";
import type { MockAppointment } from "./calendar/seed";
import { payrollOf } from "./payroll/compute";
import { incomeStatement } from "./reports/income";

const OWNER = "mock-acc_admin-eleven";
const RECEPTION = "mock-acc_reception-eleven";
const call = (token: string | null, path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) } });
const send = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });
const FIXED = { kind: "fixed" as const, start: "2026-01-10" };

function paidVisit(id: string, barberId: string, method: "cash" | "card", tip: number): MockAppointment {
  return { id, branchId: "ma", clientId: db.calendar.clients[0].id, barberId, requestedBarberId: barberId, serviceIds: ["svc_corte"], products: [], start: "2026-10-14T10:00:00", durationMin: 30, status: "paid", barberReady: false, walkIn: false, source: "online", repeat: "none", seriesId: null, notes: null, createdAt: "2026-10-10T15:00:00.000Z", createdBy: "Recepción", history: [], payment: { method, tip, tax: 0, total: 30 + tip, paidAt: "2026-10-14T10:40:00.000Z" } };
}

describe("dinero: cuentas por pagar, propinas por medio, comprobante y meta del mes", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
    db.sessions.set(RECEPTION, "acc_reception");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-20T16:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  test("cada frecuencia vence en sus días del mes; el variable no vence", () => {
    expect(dueDatesIn({ ...FIXED, frequency: "monthly", dueDay: 5 }, "2026-10")).toEqual(["2026-10-05"]);
    expect(dueDatesIn({ ...FIXED, frequency: "monthly", dueDay: 31 }, "2026-02")).toEqual(["2026-02-28"]);
    expect(dueDatesIn({ ...FIXED, frequency: "quarterly" }, "2026-04")).toEqual(["2026-04-10"]);
    expect(dueDatesIn({ ...FIXED, frequency: "quarterly" }, "2026-05")).toEqual([]);
    expect(dueDatesIn({ ...FIXED, frequency: "weekly", start: "2026-10-01" }, "2026-10")).toEqual(["2026-10-01", "2026-10-08", "2026-10-15", "2026-10-22", "2026-10-29"]);
    expect(dueDatesIn({ ...FIXED, frequency: "biweekly", start: "2026-09-24" }, "2026-10")).toEqual(["2026-10-08", "2026-10-22"]);
    expect(dueDatesIn({ ...FIXED, frequency: "monthly", endDate: "2026-09-30" }, "2026-10")).toEqual([]);
    expect(dueDatesIn({ kind: "variable", frequency: null, start: "2026-10-01" }, "2026-10")).toEqual([]);
    expect(payableStatus("2026-10-05", "2026-10-20", false)).toBe("overdue");
    expect(payableStatus("2026-10-25", "2026-10-20", false)).toBe("dueSoon");
    expect(payableStatus("2026-10-31", "2026-10-20", false)).toBe("upcoming");
    expect(payableStatus("2026-10-05", "2026-10-20", true)).toBe("paid");
  });

  test("marcar pagado un vencimiento lo pasa a pagados con quién; dos veces no; deshacer lo devuelve", async () => {
    expect((await call(RECEPTION, "/expenses/payables?branchId=ma&month=2026-10")).status).toBe(403);
    const before = await (await call(OWNER, "/expenses/payables?branchId=ma&month=2026-10")).json();
    const item = before.items.find((entry: { status: string }) => entry.status !== "paid");
    expect(item).toBeTruthy();
    const paid = await call(OWNER, `/expenses/${item.expenseId}/payments`, send("POST", { dueDate: item.dueDate, method: "bank" }));
    expect(paid.status).toBe(201);
    const payment = await paid.json();
    expect((await call(OWNER, `/expenses/${item.expenseId}/payments`, send("POST", { dueDate: item.dueDate }))).status).toBe(409);
    expect((await call(OWNER, `/expenses/${item.expenseId}/payments`, send("POST", { dueDate: "2026-10-02" }))).status).toBe(422);
    const after = await (await call(OWNER, "/expenses/payables?branchId=ma&month=2026-10")).json();
    expect(after.items.find((entry: { expenseId: string; dueDate: string }) => entry.expenseId === item.expenseId && entry.dueDate === item.dueDate)).toMatchObject({ status: "paid", payment: { method: "bank" } });
    expect(after.totals.paid).toBeCloseTo(before.totals.paid + item.amount, 2);
    expect((await call(OWNER, `/expenses/${item.expenseId}/payments/${payment.id}`, { method: "DELETE" })).status).toBeLessThan(300);
    const undone = await (await call(OWNER, "/expenses/payables?branchId=ma&month=2026-10")).json();
    expect(undone.totals).toEqual(before.totals);
  });

  test("la propina se separa por medio de pago; si la barbería paga en caja la de efectivo, sale del neto", () => {
    const member = db.team.members.find((entry) => entry.compensation && !entry.payments)!;
    const visits = [paidVisit("apt_tip_cash", member.id, "cash", 5), paidVisit("apt_tip_card", member.id, "card", 3)];
    const base = payrollOf(member, visits, 1, "ma", []);
    expect(base).toMatchObject({ tips: 8, tipsCash: 5, tipsCard: 3, tipsPaidOut: 0 });
    db.settings.sections.payrollCycle = { ...db.settings.sections.payrollCycle, cashTipsPaidOut: true };
    const paidOut = payrollOf(member, visits, 1, "ma", []);
    expect(paidOut.tipsPaidOut).toBe(5);
    expect(paidOut.net).toBeCloseTo(base.net - 5, 2);
  });

  test("la meta del mes: la pone gerencia, dice cuánto va, la proyección y cuánto falta por día", async () => {
    expect((await call(RECEPTION, "/reports/goal?branchId=ma&month=2026-10")).status).toBe(403);
    const empty = await (await call(OWNER, "/reports/goal?branchId=ma&month=2026-10")).json();
    expect(empty).toMatchObject({ goal: null, progress: null, neededPerDay: null, onTrack: null });
    expect(empty.revenue).toBeCloseTo(incomeStatement("ma", "2026-10").revenue.total, 2);
    expect((await call(OWNER, "/reports/goal", send("PUT", { branchId: "ma", month: "2026-10", revenue: 0 }))).status).toBe(422);

    const target = Math.round(empty.projected * 2);
    const set = await (await call(OWNER, "/reports/goal", send("PUT", { branchId: "ma", month: "2026-10", revenue: target }))).json();
    expect(set.goal).toMatchObject({ revenue: target, month: "2026-10" });
    expect(set.onTrack).toBe(false);
    expect(set.progress).toBeCloseTo((empty.revenue / target) * 100, 1);
    expect(set.neededPerDay).toBeCloseTo((target - empty.revenue) / (set.days - set.elapsedDays), 1);

    const easy = await (await call(OWNER, "/reports/goal", send("PUT", { branchId: "ma", month: "2026-10", revenue: 1 }))).json();
    expect(easy).toMatchObject({ onTrack: true, neededPerDay: 0 });
    expect(db.goals).toHaveLength(1);
    const removed = await (await call(OWNER, "/reports/goal", send("PUT", { branchId: "ma", month: "2026-10", revenue: null }))).json();
    expect(removed.goal).toBeNull();
    expect(db.goals).toHaveLength(0);
  });
});
