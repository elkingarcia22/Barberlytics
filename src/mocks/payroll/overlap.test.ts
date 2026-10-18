import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { expectedOf } from "../register/handlers";
import { appointmentsOn } from "../calendar/handlers";

const TOKEN = "mock-acc_admin-test";
const api = (path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` } });

describe("nómina y caja coherentes", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  test("no se aprueba un periodo que se cruza con otro aprobado", async () => {
    expect((await api("/payroll/runs", { method: "POST", body: JSON.stringify({ branchId: "ma", from: "2026-09-01", to: "2026-09-07" }) })).status).toBe(201);
    const overlap = await api("/payroll/runs", { method: "POST", body: JSON.stringify({ branchId: "ma", from: "2026-09-05", to: "2026-09-11" }) });
    expect(overlap.status).toBe(409);
  });

  test("el efectivo que cobra un barbero de renta no se espera en el cajón", () => {
    const day = "2026-09-15";
    const renter = appointmentsOn("ma", day).find((item) => item.status === "paid" && item.payment?.method === "cash" && db.team.members.find((member) => member.id === item.barberId)?.role === "barbero-renta");
    const expected = expectedOf("ma", day);
    if (renter) expect(expected.renterCash).toBeGreaterThan(0);
    else expect(expected.renterCash).toBe(0);
  });
});
