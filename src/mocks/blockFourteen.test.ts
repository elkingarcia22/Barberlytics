import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "./db";
import { appointmentsOn } from "./calendar/handlers";
import { dateKey, type MockAppointment } from "./calendar/seed";
import { expectedOf } from "./register/handlers";
import { notificationsFor } from "./notifications/handlers";
import { transferAppsFor } from "@/features/payments/transferApps";

const OWNER = "mock-acc_admin-fourteen";
const RECEPTION = "mock-acc_reception-fourteen";
const BARBER = "mock-acc_barber-fourteen";
const RENTER = "mock-acc_renter-fourteen";
const call = (token: string | null, path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) } });
const send = (method: string, body: unknown = {}) => ({ method, body: JSON.stringify(body) });
const json = async (response: Response) => response.json();
const NOW = new Date("2026-10-20T15:00:00Z");
const TODAY = "2026-10-20";

/** Citas de hoy por cobrar (no cobradas, canceladas ni inasistencias), de barberos de comisión. */
function openToday(count: number): MockAppointment[] {
  const commission = new Set(db.team.members.filter((member) => member.role === "barbero-comision").map((member) => member.id));
  return appointmentsOn("ma", TODAY).filter((item) => !["paid", "cancelled", "no_show"].includes(item.status) && commission.has(item.barberId)).slice(0, count);
}

describe("caja y gastos", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
    db.sessions.set(RECEPTION, "acc_reception");
    db.sessions.set(BARBER, "acc_barber");
    db.sessions.set(RENTER, "acc_renter");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  test("transferencia: pide por dónde llegó, queda en el pago y en su línea de la caja", async () => {
    expect(transferAppsFor("Colombia")).toEqual(["nequi", "breb", "daviplata", "bank"]);
    expect(transferAppsFor("Estados Unidos")[0]).toBe("zelle");
    const [item] = openToday(1);
    const before = expectedOf("ma", TODAY).transfer;
    expect((await call(RECEPTION, `/appointments/${item.id}/checkout`, send("POST", { method: "transfer", tip: 0 }))).status).toBe(422);
    const paid = await json(await call(RECEPTION, `/appointments/${item.id}/checkout`, send("POST", { method: "transfer", tip: 0, transfer: { via: "zelle", reference: "ZL-4821" } })));
    expect(paid.payment).toMatchObject({ method: "transfer", transfer: { via: "zelle", reference: "ZL-4821" } });
    expect(expectedOf("ma", TODAY).transfer).toBeCloseTo(before + paid.payment.total - (paid.payment.prepaid ?? 0), 2);
  });

  test("cobrar una visita es todo o nada: si una cita no cuadra, ninguna se cobra", async () => {
    const [first, second] = openToday(2);
    db.calendar.appointments = db.calendar.appointments.map((item) => (item.id === second.id ? { ...item, status: "cancelled" } : item));
    const failed = await call(RECEPTION, "/visits/checkout", send("POST", { items: [{ id: first.id, input: { method: "cash", tip: 0 } }, { id: second.id, input: { method: "cash", tip: 0 } }] }));
    expect(failed.status).toBe(409);
    expect((await json(failed)).details).toMatchObject({ index: 1, appointmentId: second.id });
    expect(db.calendar.appointments.find((item) => item.id === first.id)?.status).not.toBe("paid");
    db.calendar.appointments = db.calendar.appointments.map((item) => (item.id === second.id ? { ...item, status: "scheduled" } : item));
    const ok = await json(await call(RECEPTION, "/visits/checkout", send("POST", { items: [{ id: first.id, input: { method: "cash", tip: 5 } }, { id: second.id, input: { method: "card", tip: 0 } }] })));
    expect(ok.items.map((item: { status: string }) => item.status)).toEqual(["paid", "paid"]);
  });

  test("cuentas sin cobrar de días anteriores: se listan y avisan a quien cobra", async () => {
    const yesterday = dateKey(new Date(NOW.getTime() - 86_400_000));
    const [item] = appointmentsOn("ma", yesterday).filter((entry) => entry.status === "paid");
    db.calendar.appointments = db.calendar.appointments.map((entry) => (entry.id === item.id ? { ...entry, status: "arrived", payment: null } : entry));
    const unpaid = await json(await call(RECEPTION, "/transactions/unpaid?branchId=ma"));
    expect(unpaid.items.map((entry: { appointmentId: string }) => entry.appointmentId)).toContain(item.id);
    expect(unpaid.total).toBeGreaterThan(0);
    expect(notificationsFor("ma", "recepcion", null).some((entry) => entry.kind === "unpaidAccounts")).toBe(true);
    const mine = await json(await call(BARBER, "/transactions/unpaid?branchId=ma"));
    expect(mine.items.every((entry: { barberId: string }) => entry.barberId === "team-04")).toBe(true);
  });

  test("bolsa de propinas: los empleados aportan su parte y la bolsa se reparte entera; el de renta no entra", async () => {
    const week = { from: "2026-10-12", to: "2026-10-18" };
    const before = await json(await call(OWNER, `/payroll?branchId=ma&from=${week.from}&to=${week.to}`));
    db.settings.sections.payrollCycle = { ...db.settings.sections.payrollCycle, tipPool: { enabled: true, percent: 20, split: "hours" } };
    const data = await json(await call(OWNER, `/payroll?branchId=ma&from=${week.from}&to=${week.to}`));
    const members = data.members as { memberId: string; payout: string; tips: number; net: number; tipPoolGiven: number; tipPoolReceived: number }[];
    const employees = members.filter((member) => member.payout !== "rent");
    const given = employees.reduce((sum, member) => sum + member.tipPoolGiven, 0);
    const received = employees.reduce((sum, member) => sum + member.tipPoolReceived, 0);
    expect(given).toBeGreaterThan(0);
    expect(received).toBeCloseTo(given, 1);
    for (const member of employees) expect(member.tipPoolGiven).toBeCloseTo(member.tips * 0.2, 1);
    expect(members.filter((member) => member.payout === "rent").every((member) => member.tipPoolGiven === 0 && member.tipPoolReceived === 0)).toBe(true);
    const andres = members.find((member) => member.memberId === "team-04")!;
    const andresBefore = (before.members as typeof members).find((member) => member.memberId === "team-04")!;
    expect(andres.net).toBeCloseTo(andresBefore.net - andres.tipPoolGiven + andres.tipPoolReceived, 2);
  });

  test("caja menor: una salida que es gasto queda en Gastos, unida al movimiento", async () => {
    const before = expectedOf("ma", TODAY).cash;
    const created = await json(await call(RECEPTION, "/register/movements", send("POST", { branchId: "ma", date: TODAY, type: "out", amount: 12, reason: "Café y vasos", expense: { categoryId: "supplies", supplier: "Costco" } })));
    expect(created.expenseId).toBeTruthy();
    const expense = db.expenses.find((item) => item.id === created.expenseId)!;
    expect(expense).toMatchObject({ kind: "variable", amount: 12, paymentMethod: "cash", categoryId: "supplies", supplier: "Costco", movementId: created.id, date: TODAY });
    expect(expectedOf("ma", TODAY).cash).toBeCloseTo(before - 12, 2);
    const plain = await json(await call(RECEPTION, "/register/movements", send("POST", { branchId: "ma", date: TODAY, type: "out", amount: 5, reason: "Retiro del dueño" })));
    expect(plain.expenseId).toBeUndefined();
  });

  test("proveedores: lista con lo que se les paga, sin repetir nombres; renombrar arrastra sus gastos", async () => {
    const list = await json(await call(OWNER, "/expenses/suppliers?branchId=ma"));
    const newbury = list.items.find((item: { name: string }) => item.name === "Inmobiliaria Newbury");
    expect(newbury.perMonth).toBe(3200);
    expect((await call(BARBER, "/expenses/suppliers?branchId=ma")).status).toBe(403);
    expect((await call(OWNER, "/expenses/suppliers", send("POST", { name: "clean pro" }))).status).toBe(409);
    expect((await call(OWNER, "/expenses/suppliers", send("POST", { name: "Barbicide", email: "nope" }))).status).toBe(422);
    expect((await call(OWNER, "/expenses/suppliers", send("POST", { name: "Barbicide", taxId: "12-999", categoryId: "supplies" }))).status).toBe(201);
    await call(OWNER, `/expenses/suppliers/${newbury.id}`, send("PATCH", { name: "Newbury Realty" }));
    expect(db.expenses.filter((item) => item.supplierId === newbury.id).every((item) => item.supplier === "Newbury Realty")).toBe(true);
    const expenses = await json(await call(OWNER, "/expenses?branchId=ma"));
    expect(expenses.items.find((item: { name: string }) => item.name === "Renta del local").supplierId).toBe(newbury.id);
    expect((await call(RENTER, `/expenses/suppliers/${newbury.id}`, send("DELETE"))).status).toBe(403);
    expect((await call(OWNER, `/expenses/suppliers/${newbury.id}`, send("DELETE"))).status).toBe(204);
    expect(db.expenses.find((item) => item.name === "Renta del local" && item.branchId === "ma")?.supplier).toBe("Newbury Realty");
  });

  test("pagos por vencer: gerencia recibe el aviso de lo vencido y de lo que vence en tres días", async () => {
    const payables = await json(await call(OWNER, "/expenses/payables?branchId=ma&month=2026-10"));
    const soon = payables.items.filter((item: { status: string; dueDate: string }) => item.status !== "paid" && item.dueDate <= "2026-10-23");
    const notices = notificationsFor("ma", "owner", null).filter((item) => item.kind === "payableDue");
    expect(notices.length).toBe(soon.length);
    if (soon.length > 0) {
      const target = soon[0];
      await call(OWNER, `/expenses/${target.expenseId}/payments`, send("POST", { dueDate: target.dueDate }));
      expect(notificationsFor("ma", "owner", null).some((item) => item.id === `payable:${target.expenseId}:${target.dueDate}`)).toBe(false);
    }
  });
});
