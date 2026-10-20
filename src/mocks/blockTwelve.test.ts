import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "./db";
import { cycleWindow } from "./payroll/compute";
import { dateKey } from "./calendar/seed";
import { notificationsFor } from "./notifications/handlers";
import { reputationOf } from "./team/barberHome";

const OWNER = "mock-acc_admin-twelve";
const RECEPTION = "mock-acc_reception-twelve";
const BARBER = "mock-acc_barber-twelve";
const RENTER = "mock-acc_renter-twelve";
const call = (token: string | null, path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) } });
const send = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });
const json = async (response: Response) => response.json();
const NOW = new Date("2026-10-20T16:00:00Z");

/** El ciclo en curso y el anterior (semanales por defecto). */
function cycles() {
  const current = cycleWindow(NOW);
  const previous = cycleWindow(new Date(current.from.getTime() - 86_400_000));
  return { current: { from: dateKey(current.from), to: dateKey(current.to) }, previous: { from: dateKey(previous.from), to: dateKey(previous.to) } };
}

describe("el dinero del barbero", () => {
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

  test("el de renta ve el % de cada deducción y lo que le queda restando los gastos de su silla", async () => {
    const { current } = cycles();
    const data = await json(await call(RENTER, `/payroll?branchId=ma&from=${current.from}&to=${current.to}`));
    const member = data.members[0];
    expect(member.memberId).toBe("team-30");
    expect(member.deductionRates).toEqual({ walkIn: 20, noPreference: 15, newClient: 20 });
    // La máquina de hoy (160) cae en el ciclo; la cuchilla fija se lleva a los días.
    expect(member.chairExpenses.variable).toBe(160);
    expect(member.chairExpenses.fixed).toBeGreaterThan(0);
    expect(member.profit).toBeCloseTo(member.serviceSales + member.productSales + member.tips - member.rent - member.deductions - member.chairExpenses.total, 2);
  });

  test("el estado de cuenta arrastra el saldo ciclo a ciclo y descuenta lo que la barbería ya pagó", async () => {
    expect((await call(BARBER, "/payroll/rent-statement?branchId=ma")).status).toBe(409);
    expect((await call(RECEPTION, "/payroll/rent-statement?branchId=ma&memberId=team-30")).status).toBe(403);
    const before = await json(await call(RENTER, "/payroll/rent-statement?branchId=ma&cycles=3"));
    expect(before.rows).toHaveLength(3);
    expect(before.rows.at(-1).running).toBeCloseTo(before.rows.reduce((sum: number, row: { balance: number }) => sum + row.balance, 0), 2);

    const { previous } = cycles();
    const run = await json(await call(OWNER, "/payroll/runs", send("POST", { branchId: "ma", ...previous })));
    expect((await call(OWNER, `/payroll/runs/${run.id}/pay`, send("POST", { method: "transfer" }))).status).toBe(200);
    const after = await json(await call(RENTER, "/payroll/rent-statement?branchId=ma&cycles=3"));
    const row = after.rows.find((item: { from: string }) => item.from === previous.from);
    expect(row.status).toBe("paid");
    if (row.paidOut > 0) expect(row.balance).toBeCloseTo(row.held - row.rent - row.deductions + row.adjustments + row.paid - row.paidOut, 2);
  });

  test("el certificado va mes por mes, hasta un año, y el barbero solo pide el suyo", async () => {
    expect((await call(BARBER, "/payroll/certificate?branchId=ma&from=2025-01-01&to=2026-10-20")).status).toBe(422);
    const data = await json(await call(BARBER, "/payroll/certificate?branchId=ma&memberId=team-30&from=2026-08-01&to=2026-12-31"));
    expect(data.memberId).toBe("team-04");
    expect(data.to).toBe("2026-10-20");
    expect(data.rows.map((row: { month: string }) => row.month)).toEqual(["2026-08", "2026-09", "2026-10"]);
    expect(data.totals.earned).toBeCloseTo(data.rows.reduce((sum: number, row: { earned: number }) => sum + row.earned, 0), 2);
    const row = data.rows[0];
    expect(row.earned).toBeCloseTo(row.sales + row.tips + row.adjustments, 2);
    const rent = await json(await call(OWNER, "/payroll/certificate?branchId=ma&memberId=team-30&from=2026-09-01&to=2026-09-30"));
    expect(rent.payout).toBe("rent");
    expect(rent.rows[0].costs).toBeGreaterThan(0);
  });

  test("la meta la pone gerencia; el barbero ve su avance y, en escala, cuánto le falta al siguiente tramo", async () => {
    expect((await call(BARBER, "/payroll/goals", send("PUT", { branchId: "ma", memberId: "team-04", serviceSales: 100 }))).status).toBe(403);
    expect((await call(OWNER, "/payroll/goals", send("PUT", { branchId: "ma", memberId: "team-04", rebookRate: 120 }))).status).toBe(422);
    db.team = { ...db.team, members: db.team.members.map((member) => (member.id === "team-04" && member.compensation ? { ...member, compensation: { ...member.compensation, type: "scale", scale: [{ from: 0, percent: 40 }, { from: 100_000, percent: 45 }] } } : member)) };
    const saved = await json(await call(OWNER, "/payroll/goals", send("PUT", { branchId: "ma", memberId: "team-04", serviceSales: 2500, productSales: null, rebookRate: 40 })));
    expect(saved.goal).toMatchObject({ serviceSales: 2500, productSales: null, rebookRate: 40 });
    const mine = await json(await call(BARBER, "/payroll/goals?branchId=ma"));
    expect(mine.goal.serviceSales).toBe(2500);
    expect(mine.nextTier).toMatchObject({ percent: 45, from: 100_000, currentPercent: 40 });
    expect(mine.nextTier.missing).toBeCloseTo(100_000 - mine.progress.serviceSales, 2);
    const removed = await json(await call(OWNER, "/payroll/goals", send("PUT", { branchId: "ma", memberId: "team-04", serviceSales: null, productSales: null, rebookRate: null })));
    expect(removed.goal).toBeNull();
  });

  test("«Esto no cuadra»: el barbero reclama una cita suya, gerencia responde y a cada uno le llega el aviso", async () => {
    const { current } = cycles();
    const pay = await json(await call(BARBER, `/payroll?branchId=ma&from=${current.from}&to=${current.to}`));
    const line = pay.members[0].lines[0];
    const foreign = db.calendar.appointments.find((item) => item.barberId !== "team-04");
    const base = { branchId: "ma", ...current };
    expect((await call(OWNER, "/payroll/disputes", send("POST", { ...base, message: "Algo no cuadra aquí." }))).status).toBe(403);
    expect((await call(BARBER, "/payroll/disputes", send("POST", { ...base, message: "corto" }))).status).toBe(422);
    if (foreign) expect((await call(BARBER, "/payroll/disputes", send("POST", { ...base, appointmentId: foreign.id, message: "Esta cita no es mía pero reclamo." }))).status).toBe(422);
    const created = await call(BARBER, "/payroll/disputes", send("POST", { ...base, appointmentId: line.appointmentId, message: "Este cliente era recurrente, no nuevo." }));
    expect(created.status).toBe(201);
    const dispute = await json(created);
    expect(dispute.appointmentLabel).toContain(line.client);
    expect((await call(BARBER, "/payroll/disputes", send("POST", { ...base, appointmentId: line.appointmentId, message: "Otra vez lo mismo, por favor." }))).status).toBe(409);
    expect(notificationsFor("ma", "owner", null).some((item) => item.kind === "payDispute")).toBe(true);

    expect((await call(BARBER, `/payroll/disputes/${dispute.id}/answer`, send("POST", { answer: "Me respondo solo." }))).status).toBe(403);
    const answered = await json(await call(OWNER, `/payroll/disputes/${dispute.id}/answer`, send("POST", { answer: "Revisado: va un ajuste." })));
    expect(answered).toMatchObject({ status: "answered", answer: "Revisado: va un ajuste." });
    expect(notificationsFor("ma", "barbero-comision", "team-04").some((item) => item.kind === "payDisputeAnswered")).toBe(true);
    const list = await json(await call(BARBER, "/payroll/disputes?branchId=ma&memberId=team-30"));
    expect(list.items.every((item: { memberId: string }) => item.memberId === "team-04")).toBe(true);
  });

  test("avisos de dinero: aprobado, ajuste nuevo y la renta por vencer cuando va debiendo", async () => {
    const { previous } = cycles();
    await call(OWNER, "/payroll/adjustments", send("POST", { branchId: "ma", ...cycles().current, memberId: "team-04", kind: "bonus", amount: 20, note: "Bono de la semana" }));
    await call(OWNER, "/payroll/runs", send("POST", { branchId: "ma", ...previous }));
    const barber = notificationsFor("ma", "barbero-comision", "team-04").map((item) => item.kind);
    expect(barber).toEqual(expect.arrayContaining(["payrollApproved", "payAdjustment"]));
    // El último día del ciclo, el de renta que va debiendo recibe el aviso (hoy debe la renta de la semana).
    vi.setSystemTime(new Date(`${cycles().current.to}T15:00:00Z`));
    const renter = notificationsFor("ma", "barbero-renta", "team-30");
    const due = renter.find((item) => item.kind === "rentDue");
    const statement = await json(await call(RENTER, "/payroll/rent-statement?branchId=ma&cycles=1"));
    expect(Boolean(due)).toBe(statement.rows[0].balance < 0);
  });

  test("reputación y clientes por volver salen de sus reseñas y de la regla de Clientes", async () => {
    const reputation = reputationOf("team-04", NOW);
    expect(reputation.distribution.reduce((sum, row) => sum + row.count, 0)).toBe(reputation.total);
    expect(reputation.recent.length).toBeLessThanOrEqual(10);
    expect((await call(BARBER, "/team/members/team-30/reputation")).status).toBe(403);
    expect((await call(OWNER, "/team/members/team-30/reputation")).status).toBe(200);
    const due = await json(await call(BARBER, "/team/members/team-04/due-clients?branchId=ma"));
    expect(due.items.every((item: { segment: string; barberIds: string[]; preferredBarberId: string | null }) => item.preferredBarberId === "team-04" || item.barberIds.includes("team-04"))).toBe(true);
    if (due.nextSlot) expect(due.nextSlot.day >= "2026-10-20").toBe(true);
  });
});
