import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { ledgerOf } from "../transactions/ledger";
import { expectedOf } from "./handlers";
import { dateKey } from "../calendar/seed";

const OWNER = "mock-acc_admin-register";
const RECEPTION = "mock-acc_reception-register";
const BARBER = "mock-acc_barber-register";
const DAY = "2026-09-22";

const call = (token: string, path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${token}` } });
const post = (body: unknown) => ({ method: "POST", body: JSON.stringify(body) });

describe("caja: a ciegas, por denominación y con entradas y salidas", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
    db.sessions.set(RECEPTION, "acc_reception");
    db.sessions.set(BARBER, "acc_barber");
  });

  test("recepción cuenta a ciegas: no ve el efectivo esperado y cierra sin explicar; la diferencia queda para gerencia", async () => {
    const blind = await (await call(RECEPTION, `/register?branchId=ma&date=${DAY}`)).json();
    expect(blind).toMatchObject({ blind: true, expected: { cash: null } });
    const seen = await (await call(OWNER, `/register?branchId=ma&date=${DAY}`)).json();
    expect(seen.blind).toBe(false);
    const expected = seen.expected.cash as number;

    // Cuenta por billetes: el servidor vuelve a sumar, no se fía del total que manda la pantalla.
    const closure = await (await call(RECEPTION, "/register/close", post({ branchId: "ma", date: DAY, opening: 0, counted: 999_999, denominations: { "20": 2, "1": 3 }, note: "" }))).json();
    expect(closure).toMatchObject({ counted: 43, blind: true, denominations: { "20": 2, "1": 3 }, difference: Math.round((43 - expected) * 100) / 100 });
    // Cerrada, ya no es a ciegas: se ve el resultado.
    expect((await (await call(RECEPTION, `/register?branchId=ma&date=${DAY}`)).json()).blind).toBe(false);
  });

  test("quien ve lo esperado explica la diferencia antes de cerrar", async () => {
    const expected = expectedOf("ma", DAY).cash;
    expect((await call(OWNER, "/register/close", post({ branchId: "ma", date: DAY, opening: 0, counted: expected + 5, note: "" }))).status).toBe(422);
    expect((await call(OWNER, "/register/close", post({ branchId: "ma", date: DAY, opening: 0, counted: expected + 5, note: "Sobró sencillo" }))).status).toBe(201);
  });

  test("las entradas y salidas de efectivo mueven lo esperado y quedan con quién y por qué", async () => {
    const before = expectedOf("ma", DAY).cash;
    expect((await call(RECEPTION, "/register/movements", post({ branchId: "ma", date: DAY, type: "in", amount: 50, reason: "Sencillo del banco" }))).status).toBe(201);
    expect((await call(RECEPTION, "/register/movements", post({ branchId: "ma", date: DAY, type: "out", amount: 12.5, reason: "Pago al proveedor de toallas" }))).status).toBe(201);
    const after = expectedOf("ma", DAY);
    expect(after).toMatchObject({ movementsIn: 50, movementsOut: 12.5 });
    expect(after.cash).toBeCloseTo(before + 37.5, 2);
    const day = await (await call(OWNER, `/register?branchId=ma&date=${DAY}`)).json();
    expect(day.movements).toEqual([expect.objectContaining({ type: "in", reason: "Sencillo del banco", by: "Lucía Bernal" }), expect.objectContaining({ type: "out", amount: 12.5 })]);
    expect((await call(RECEPTION, "/register/movements", post({ branchId: "ma", date: DAY, type: "out", amount: 5, reason: "x" }))).status).toBe(422);
    expect((await call(BARBER, "/register/movements", post({ branchId: "ma", date: DAY, type: "in", amount: 5, reason: "Sencillo" }))).status).toBe(403);
    await call(OWNER, "/register/close", post({ branchId: "ma", date: DAY, opening: 0, counted: after.cash, note: "" }));
    expect((await call(RECEPTION, "/register/movements", post({ branchId: "ma", date: DAY, type: "in", amount: 5, reason: "Tarde" }))).status).toBe(409);
  });

  test("borrar una venta no la saca del libro: queda el cobro y su anulación", async () => {
    ledgerOf("ma", DAY, DAY);
    const paid = db.calendar.appointments.find((item) => item.branchId === "ma" && item.status === "paid" && item.payment && !item.payment.split && !(item.refunds ?? []).length && item.payment.paidAt.startsWith(DAY))!;
    const before = ledgerOf("ma", DAY, DAY).entries.filter((entry) => entry.appointmentId === paid.id && (entry.kind === "charge" || entry.kind === "tip"));
    expect(before.length).toBeGreaterThan(0);
    const voided = await call(OWNER, `/appointments/${paid.id}/void-payment`, post({ reason: "Cobrado a otro cliente" }));
    expect(voided.ok).toBe(true);
    // El libro cuenta por día local (como la caja), no por día UTC.
    const day = dateKey(new Date());
    const original = ledgerOf("ma", DAY, DAY).entries.filter((entry) => entry.appointmentId === paid.id);
    expect(original.map((entry) => [entry.kind, entry.amount])).toEqual(expect.arrayContaining(before.map((entry) => [entry.kind, entry.amount])));
    const reversals = ledgerOf("ma", day, day).entries.filter((entry) => entry.appointmentId === paid.id && entry.kind === "void");
    expect(reversals.map((entry) => entry.amount)).toEqual(before.map((entry) => -entry.amount));
    expect(reversals[0]).toMatchObject({ by: "Carolina Vargas", concept: expect.stringContaining("Cobrado a otro cliente") });
  });
});
