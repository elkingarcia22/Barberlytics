import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { appointmentsOn } from "../calendar/handlers";
import { ledgerOf } from "./ledger";

const PAST_DAY = "2026-09-22";

describe("libro de pagos", () => {
  beforeEach(() => db.reset());

  test("cada cobro del día es un movimiento con medio, monto y quién; los totales cuadran", () => {
    const paid = appointmentsOn("ma", PAST_DAY).filter((item) => item.status === "paid" && item.payment);
    const { entries, totals } = ledgerOf("ma", PAST_DAY, PAST_DAY);
    const charges = entries.filter((entry) => entry.kind === "charge");
    expect(charges.length).toBeGreaterThan(0);
    expect(new Set(charges.map((entry) => entry.appointmentId)).size).toBeLessThanOrEqual(paid.length);
    expect(charges.every((entry) => entry.amount > 0 && entry.by.length > 0)).toBe(true);
    expect(totals.net).toBeCloseTo(totals.in - totals.out, 2);
    expect(Object.values(totals.byMethod).reduce((sum, value) => sum + value, 0)).toBeCloseTo(totals.net, 2);
    expect([...entries].map((entry) => entry.at)).toEqual([...entries].map((entry) => entry.at).sort());
  });

  test("una devolución es otro movimiento, en negativo; el cobro original no cambia", () => {
    const item = appointmentsOn("ma", PAST_DAY).find((entry) => entry.status === "paid" && entry.payment && !entry.payment.split)!;
    const before = ledgerOf("ma", PAST_DAY, PAST_DAY).entries.filter((entry) => entry.appointmentId === item.id);
    db.calendar.appointments = db.calendar.appointments.map((entry) => (entry.id === item.id ? { ...entry, refunds: [{ id: "rf_test", amount: 10, to: "cash", reason: "Queja", at: `${PAST_DAY}T20:00:00`, by: "Lucía" }] } : entry));
    const after = ledgerOf("ma", PAST_DAY, PAST_DAY).entries.filter((entry) => entry.appointmentId === item.id);
    expect(after.filter((entry) => entry.kind !== "refund")).toEqual(before);
    expect(after.find((entry) => entry.kind === "refund")).toMatchObject({ amount: -10, method: "cash", by: "Lucía" });
  });

  test("el barbero de renta ve solo los movimientos de sus cuentas, sin ventas de mostrador", () => {
    const renter = "team-30";
    const own = ledgerOf("ma", PAST_DAY, PAST_DAY, renter).entries;
    const owners = new Set(own.map((entry) => db.calendar.appointments.find((item) => item.id === entry.appointmentId)?.barberId));
    expect([...owners].every((id) => id === renter)).toBe(true);
    expect(own.some((entry) => entry.kind === "sale")).toBe(false);
  });
});
