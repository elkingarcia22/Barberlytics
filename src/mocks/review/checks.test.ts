import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { appointmentsOn } from "../calendar/handlers";
import { dateKey, type MockAppointment } from "../calendar/seed";
import { barbersOf } from "../team/seed";
import { payrollReview, registerReview } from "./checks";

const DAY_MS = 86_400_000;
const day = (offset: number) => dateKey(new Date(Date.now() + offset * DAY_MS));
const kinds = (items: { kind: string }[]) => items.map((item) => item.kind);

/** Un día pasado con citas cobradas, para sembrar casos sobre él. */
function paidDay() {
  for (let offset = -1; offset > -10; offset--) {
    const paid = appointmentsOn("ma", day(offset)).filter((item) => item.status === "paid" && item.payment && !item.walkIn && !item.linkId);
    if (paid.length > 1) return { date: day(offset), paid };
  }
  throw new Error("La demo no trae días cobrados.");
}

describe("revisión de la nómina", () => {
  beforeEach(() => db.reset());

  test("en la demo no hay alertas graves; sí avisa de la regla «cliente nuevo» repetida", () => {
    const items = payrollReview("ma", day(-13), day(-7));
    expect(items.some((item) => item.severity === "high")).toBe(false);
    expect(kinds(items)).toContain("newClientRepeat");
  });

  test("un ajuste repetido (misma persona, tipo y valor) es grave y va primero", () => {
    const [from, to] = [day(-13), day(-7)];
    const member = barbersOf(db.team.members, db.team.orders, "ma").find((item) => item.role !== "barbero-renta" && item.compensation?.type !== "salary")!;
    const adjustment = { branchId: "ma", from, to, memberId: member.id, kind: "bonus" as const, amount: 40, note: "Bono", createdAt: new Date().toISOString(), createdBy: "Lucía" };
    db.payroll.adjustments = [...db.payroll.adjustments, { ...adjustment, id: "adj_a" }, { ...adjustment, id: "adj_b" }];
    const items = payrollReview("ma", from, to);
    expect(items[0]).toMatchObject({ severity: "high", kind: "duplicateAdjustment", memberId: member.id });
  });

  test("un ajuste mayor que la mitad de lo ganado pide revisión", () => {
    const [from, to] = [day(-13), day(-7)];
    const member = barbersOf(db.team.members, db.team.orders, "ma").find((item) => item.role !== "barbero-renta" && item.compensation?.type !== "salary")!;
    db.payroll.adjustments = [...db.payroll.adjustments, { id: "adj_big", branchId: "ma", from, to, memberId: member.id, kind: "advance", amount: 5000, note: "Adelanto", createdAt: new Date().toISOString(), createdBy: "Lucía" }];
    expect(payrollReview("ma", from, to).find((item) => item.kind === "bigAdjustment")).toMatchObject({ memberId: member.id, params: { amount: 5000 } });
  });
});

describe("revisión de la caja", () => {
  beforeEach(() => db.reset());

  test("la misma cita cobrada dos veces es posible doble cobro", () => {
    const { date, paid } = paidDay();
    expect(registerReview("ma", date).some((item) => item.kind === "duplicateCharge")).toBe(false);
    const copy: MockAppointment = { ...paid[0], id: `${paid[0].id}_dup` };
    db.calendar.appointments = [...db.calendar.appointments, copy];
    expect(registerReview("ma", date)[0]).toMatchObject({ severity: "high", kind: "duplicateCharge", appointmentId: copy.id });
  });

  test("dos ventas de mostrador iguales con minutos de diferencia", () => {
    const { date } = paidDay();
    const at = (minutes: number) => new Date(`${date}T15:${String(minutes).padStart(2, "0")}:00`).toISOString();
    const sale = { branchId: "ma", items: [{ productId: "prd_peine", qty: 1 }], method: "cash" as const, total: 18 };
    db.calendar.sales = [...db.calendar.sales, { ...sale, id: "sale_a", paidAt: at(0) }, { ...sale, id: "sale_b", paidAt: at(3) }];
    expect(kinds(registerReview("ma", date))).toContain("duplicateSale");
  });

  test("clientes en la silla sin cobrar y devolución en efectivo de quien cobró", () => {
    const { date, paid } = paidDay();
    const [open, refunded] = paid;
    const charger = [...refunded.history].reverse().find((entry) => entry.event === "status:paid")!.actor;
    db.calendar.appointments = db.calendar.appointments.map((item) =>
      item.id === open.id ? { ...item, status: "seated" } : item.id === refunded.id ? { ...item, refunds: [{ id: "rf_1", amount: refunded.payment!.total, to: "cash", reason: "Queja", at: new Date(`${date}T18:00:00`).toISOString(), by: charger }] } : item,
    );
    const found = kinds(registerReview("ma", date));
    expect(found).toEqual(expect.arrayContaining(["openAccounts", "bigRefund", "selfRefund"]));
    expect(found[0]).toBe("openAccounts");
  });
});
