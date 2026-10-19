import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { lineupTurn } from "./workforce";

const OWNER = "mock-acc_admin-test";
const BARBER = "mock-acc_barber-test";
const RENTER = "mock-acc_renter-test";
const call = (token: string, path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${token}` } });
const future = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

describe("equipo en operación", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
    db.sessions.set(BARBER, "acc_barber");
    db.sessions.set(RENTER, "acc_renter");
  });

  test("a quién le toca: el que menos lleva hoy entre los que trabajan, en el orden de la fila", () => {
    const turn = lineupTurn("ma", "walkIn");
    const counts = turn.items.map((item) => item.count);
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
    if (turn.next) expect(turn.items.some((item) => item.memberId === turn.next)).toBe(true);
  });

  test("el barbero pide una ausencia y queda pendiente; no la puede aprobar; el dueño sí, y bloquea su agenda", async () => {
    const created = await (await call(BARBER, "/team/absences", { method: "POST", body: JSON.stringify({ branchId: "ma", kind: "vacation", startDate: future(20), endDate: future(22), memberId: "team-05" }) })).json();
    expect(created).toMatchObject({ status: "pending", memberId: "team-04" });
    expect((await call(BARBER, `/team/absences/${created.id}/approve`, { method: "POST" })).status).toBe(403);
    const approved = await (await call(OWNER, `/team/absences/${created.id}/approve`, { method: "POST" })).json();
    expect(approved.status).toBe("approved");
    expect(db.calendar.blocks.some((block) => block.barberId === "team-04" && block.category === "vacation" && block.startDate === future(20))).toBe(true);
    expect((await call(BARBER, "/team/absences", { method: "POST", body: JSON.stringify({ branchId: "ma", kind: "personal", startDate: future(21) }) })).status).toBe(409);
  });

  test("el barbero de renta registra su ausencia sin aprobación", async () => {
    const created = await (await call(RENTER, "/team/absences", { method: "POST", body: JSON.stringify({ branchId: "ma", kind: "personal", startDate: future(10) }) })).json();
    expect(created).toMatchObject({ status: "approved", memberId: "team-30" });
  });

  test("rendimiento: el barbero ve el suyo, no el de un colega", async () => {
    expect((await call(BARBER, "/team/members/team-04/performance?branchId=ma")).status).toBe(200);
    expect((await call(BARBER, "/team/members/team-05/performance?branchId=ma")).status).toBe(403);
  });

  test("la portada trae personas reales con su semana y la serie de 7 semanas", async () => {
    const home = await (await call(OWNER, "/team/home?branchId=ma")).json();
    expect(home.members.find((item: { id: string }) => item.id === "team-04")).toMatchObject({ role: "barbero-comision", chair: expect.any(Number), occupancy: expect.any(Number) });
    expect(home.series.ocupacion).toHaveLength(7);
  });
});

describe("permisos en el servidor", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
    db.sessions.set(BARBER, "acc_barber");
  });

  test("nómina: el barbero recibe solo la suya y no la puede mover", async () => {
    const payroll = await (await call(BARBER, "/payroll?branchId=ma&from=2026-09-01&to=2026-09-07")).json();
    expect(payroll.members.map((item: { memberId: string }) => item.memberId)).toEqual(["team-04"]);
    expect((await call(BARBER, "/payroll/runs", { method: "POST", body: JSON.stringify({ branchId: "ma", from: "2026-09-01", to: "2026-09-07" }) })).status).toBe(403);
  });

  test("clientes, transacciones y métricas se recortan a lo suyo", async () => {
    const all = (await (await call(OWNER, "/customers")).json()).items.length;
    const mine = (await (await call(BARBER, "/customers")).json()).items as { preferredBarberId: string | null; barberIds: string[] }[];
    expect(mine.length).toBeLessThan(all);
    expect(mine.every((item) => item.preferredBarberId === "team-04" || item.barberIds.includes("team-04"))).toBe(true);
    const tx = (await (await call(BARBER, "/transactions?branchId=ma&from=2026-09-01&to=2026-09-03")).json()).items as { barberId: string | null }[];
    expect(tx.every((item) => item.barberId === "team-04")).toBe(true);
    expect((await call(BARBER, "/metrics/insights?branchId=ma")).status).toBe(403);
  });

  test("configuración y gastos: el barbero por comisión no escribe ni lee lo de la barbería", async () => {
    expect((await call(BARBER, "/settings/tips", { method: "PUT", body: JSON.stringify({}) })).status).toBe(403);
    expect((await call(BARBER, "/expenses?branchId=ma")).status).toBe(403);
  });

  test("equipo: sin gestionar no se ven el dinero ni los contactos de los colegas", async () => {
    const items = (await (await call(BARBER, "/team/members?branchId=ma")).json()).items as { id: string; email: string; compensation: unknown }[];
    expect(items.find((item) => item.id === "team-05")).toMatchObject({ email: "", compensation: null });
    expect(items.find((item) => item.id === "team-04")?.email).not.toBe("");
  });
});
