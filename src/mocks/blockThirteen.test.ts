import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { rangesOf, validBreaks, workedMinutes } from "@/features/team/shiftRanges";
import { db } from "./db";
import { appointmentsOn, hoursOn } from "./calendar/handlers";
import { dateKey } from "./calendar/seed";
import { barberFree } from "./booking/logic";
import { notificationsFor } from "./notifications/handlers";
import type { MockAbsence } from "./team/seed";

const OWNER = "mock-acc_admin-thirteen";
const BARBER = "mock-acc_barber-thirteen";
const RENTER = "mock-acc_renter-thirteen";
const RECEPTION = "mock-acc_reception-thirteen";
const call = (token: string | null, path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) } });
const send = (method: string, body: unknown = {}) => ({ method, body: JSON.stringify(body) });
const json = async (response: Response) => response.json();
const NOW = new Date("2026-10-20T15:00:00Z");
const member = (id: string) => db.team.members.find((item) => item.id === id)!;
/** El primer día desde mañana con ese día de la semana (0 = domingo). */
const nextWeekday = (weekday: number) => {
  for (let offset = 1; offset <= 7; offset += 1) {
    const date = new Date(NOW.getTime() + offset * 86_400_000);
    if (date.getDay() === weekday) return dateKey(date);
  }
  return "";
};

describe("operación del equipo", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
    db.sessions.set(BARBER, "acc_barber");
    db.sessions.set(RENTER, "acc_renter");
    db.sessions.set(RECEPTION, "acc_reception");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  test("turno partido: los descansos parten la franja y la reserva no ofrece esa hora", async () => {
    const day = { start: "10:00", end: "20:00", breaks: [{ start: "14:00", end: "15:00" }] };
    expect(rangesOf(day)).toEqual([
      { start: "10:00", end: "14:00" },
      { start: "15:00", end: "20:00" },
    ]);
    expect(workedMinutes(day)).toBe(540);
    expect(validBreaks({ start: "10:00", end: "20:00", breaks: [{ start: "09:00", end: "11:00" }] })).toBe(false);
    const tuesday = nextWeekday(2);
    expect(hoursOn(member("team-05"), tuesday)).toHaveLength(2);
    expect(barberFree("ma", "team-05", tuesday, 14 * 60, 30)).toBe(false);
    const saved = await call(OWNER, "/team/members/team-05", send("PATCH", { schedule: { ...member("team-05").schedule, "2": { start: "10:00", end: "20:00", breaks: [{ start: "19:00", end: "21:00" }] } } }));
    expect(saved.status).toBe(422);
  });

  test("fichaje: el empleado marca entrada y salida; el de renta no ficha; gerencia ve la hoja", async () => {
    expect((await call(RENTER, "/team/clock", send("POST", { action: "in" }))).status).toBe(403);
    const status = await json(await call(BARBER, "/team/clock/me?branchId=ma"));
    expect(status.canClock).toBe(true);
    expect((await json(await call(BARBER, "/team/clock", send("POST", { branchId: "ma", action: "in" })))).open).not.toBeNull();
    expect((await call(BARBER, "/team/clock", send("POST", { branchId: "ma", action: "in" }))).status).toBe(409);
    vi.setSystemTime(new Date(NOW.getTime() + 3 * 3_600_000));
    expect((await json(await call(BARBER, "/team/clock", send("POST", { branchId: "ma", action: "out" })))).open).toBeNull();
    expect((await call(BARBER, "/team/timesheet?branchId=ma&from=2026-10-12&to=2026-10-20")).status).toBe(403);
    const sheet = await json(await call(OWNER, "/team/timesheet?branchId=ma&from=2026-10-12&to=2026-10-20"));
    const andres = sheet.rows.find((row: { memberId: string }) => row.memberId === "team-04");
    expect(andres.workedMinutes).toBeGreaterThan(180);
    expect(andres.daysWorked).toBeGreaterThan(1);
    expect(sheet.rows.some((row: { memberId: string }) => row.memberId === "team-30")).toBe(false);
  });

  test("turno abierto: un barbero libre lo pide, gerencia aprueba y las citas pasan a él", async () => {
    const friday = nextWeekday(5);
    const absence: MockAbsence = { id: "abs_test", memberId: "team-04", branchId: "ma", kind: "personal", startDate: friday, endDate: friday, note: "", status: "approved", requestedBy: "x", requestedAt: NOW.toISOString(), decidedBy: "x", decidedAt: NOW.toISOString(), reason: null, blockId: null };
    db.team = { ...db.team, absences: [absence], overrides: [...db.team.overrides, { id: "ovr_free", memberId: "team-30", date: friday, range: null }] };
    const before = appointmentsOn("ma", friday).filter((item) => item.barberId === "team-04" && item.status === "scheduled").length;
    const shifts = await json(await call(RENTER, "/team/shifts?branchId=ma"));
    const shift = shifts.open.find((item: { id: string }) => item.id === `abs_test:${friday}`);
    expect(shift.available.map((item: { memberId: string }) => item.memberId)).toContain("team-30");
    expect((await call(BARBER, "/team/shifts/cover", send("POST", { shiftId: shift.id }))).status).toBe(422);
    const created = await json(await call(RENTER, "/team/shifts/cover", send("POST", { shiftId: shift.id })));
    expect(created.status).toBe("pending");
    expect(notificationsFor("ma", "owner", null).some((item) => item.kind === "shiftRequested")).toBe(true);
    const approved = await json(await call(OWNER, `/team/shifts/requests/${created.id}/approve`, send("POST")));
    expect(approved.status).toBe("approved");
    expect(hoursOn(member("team-30"), friday).length).toBeGreaterThan(0);
    expect(appointmentsOn("ma", friday).filter((item) => item.barberId === "team-30" && item.status === "scheduled").length).toBeGreaterThanOrEqual(before);
    const after = await json(await call(OWNER, "/team/shifts?branchId=ma"));
    expect(after.open.some((item: { id: string }) => item.id === shift.id)).toBe(false);
    expect(notificationsFor("ma", "barbero-renta", "team-30").some((item) => item.kind === "shiftDecided")).toBe(true);
  });

  test("intercambio: propone uno, acepta el compañero, aprueba gerencia y se cruzan los días", async () => {
    const monday = nextWeekday(1);
    const wednesday = nextWeekday(3);
    // Andrés (lun–sáb) libra ese miércoles; Paola (mar–sáb) no trabaja los lunes.
    db.team = { ...db.team, overrides: [...db.team.overrides, { id: "ovr_wed", memberId: "team-04", date: wednesday, range: null }] };
    const created = await json(await call(BARBER, "/team/shifts/swap", send("POST", { date: monday, withMemberId: "team-30", withDate: wednesday })));
    expect(created.status).toBe("pending");
    expect(notificationsFor("ma", "barbero-renta", "team-30").some((item) => item.kind === "shiftSwapAsked")).toBe(true);
    expect((await call(OWNER, `/team/shifts/requests/${created.id}/approve`, send("POST"))).status).toBe(409);
    expect((await call(BARBER, `/team/shifts/requests/${created.id}/accept`, send("POST"))).status).toBe(403);
    expect((await json(await call(RENTER, `/team/shifts/requests/${created.id}/accept`, send("POST")))).status).toBe("accepted");
    expect((await json(await call(OWNER, `/team/shifts/requests/${created.id}/approve`, send("POST")))).status).toBe("approved");
    expect(hoursOn(member("team-04"), monday)).toHaveLength(0);
    expect(hoursOn(member("team-30"), monday).length).toBeGreaterThan(0);
    expect(hoursOn(member("team-30"), wednesday)).toHaveLength(0);
    expect(hoursOn(member("team-04"), wednesday).length).toBeGreaterThan(0);
  });

  test("niveles: reglas con validación, avance hacia el siguiente y ascenso que ajusta precios", async () => {
    expect((await call(BARBER, "/team/levels/lvl_master/rules", send("PUT", { priceFactor: 1.3, criteria: {} }))).status).toBe(403);
    expect((await call(OWNER, "/team/levels/lvl_master/rules", send("PUT", { priceFactor: 9, criteria: {} }))).status).toBe(422);
    const saved = await json(await call(OWNER, "/team/levels/lvl_senior/rules", send("PUT", { priceFactor: 1.1, criteria: { services90: 1, rebookRate: null, rating: null, months: null } })));
    expect(saved).toMatchObject({ priceFactor: 1.1, criteria: { services90: 1, rebookRate: null } });
    const mine = await json(await call(RENTER, "/team/levels/progress?branchId=ma"));
    expect(mine.items).toHaveLength(1);
    expect(mine.items[0].memberId).toBe("team-30");
    const all = await json(await call(OWNER, "/team/levels/progress?branchId=ma"));
    const emilio = all.items.find((item: { memberId: string }) => item.memberId === "team-29");
    expect(emilio.next.id).toBe("lvl_senior");
    expect(emilio.ready).toBe(true);
    await call(OWNER, "/team/members/team-29/promote", send("POST", { levelId: "lvl_senior", reprice: true }));
    const promoted = member("team-29");
    expect(promoted.levelId).toBe("lvl_senior");
    const corte = db.services.items.find((item) => item.id === "svc_corte")!;
    expect(promoted.services.find((row) => row.serviceId === "svc_corte")?.price).toBe(Math.round(corte.price * 1.1));
  });

  test("forma de pago con fecha: hoy se aplica (y la sesión sigue a la ficha); la nómina anterior conserva la de entonces", async () => {
    const previousWeek = { from: "2026-10-12", to: "2026-10-18" };
    const before = await json(await call(OWNER, `/payroll?branchId=ma&from=${previousWeek.from}&to=${previousWeek.to}&memberId=team-30`));
    expect(before.members[0].payout).toBe("rent");
    expect((await call(RENTER, "/team/members/team-30/payout-change", send("POST", { to: "commission", effectiveDate: "2026-10-19" }))).status).toBe(403);
    const change = await json(await call(OWNER, "/team/members/team-30/payout-change", send("POST", { to: "commission", effectiveDate: "2026-10-19", amount: 50 })));
    expect(change.status).toBe("applied");
    expect(member("team-30").role).toBe("barbero-comision");
    expect(member("team-30").compensation?.basic).toBe(50);
    const me = await json(await call(RENTER, "/auth/me"));
    expect(me.teamRole).toBe("barbero-comision");
    const old = await json(await call(OWNER, `/payroll?branchId=ma&from=${previousWeek.from}&to=${previousWeek.to}&memberId=team-30`));
    expect(old.members[0].payout).toBe("rent");
    const now = await json(await call(OWNER, "/payroll?branchId=ma&from=2026-10-19&to=2026-10-25&memberId=team-30"));
    expect(now.members[0].payout).toBe("commission");

    const scheduled = await json(await call(OWNER, "/team/members/team-04/payout-change", send("POST", { to: "rent", effectiveDate: "2026-11-02", amount: 300 })));
    expect(scheduled.status).toBe("scheduled");
    expect(member("team-04").role).toBe("barbero-comision");
    vi.setSystemTime(new Date("2026-11-02T15:00:00Z"));
    await call(BARBER, "/team/clock/me?branchId=ma");
    expect(member("team-04").role).toBe("barbero-renta");
    expect(member("team-04").payments?.rentBase).toBe(300);
  });

  test("Mi ficha: el de renta cambia su horario y sus precios (sin tocar el reparto); el de comisión no", async () => {
    const paola = member("team-30");
    const schedule = { ...paola.schedule, "1": { start: "10:00", end: "14:00" } };
    expect((await call(RENTER, "/team/members/team-30", send("PATCH", { schedule }))).status).toBe(200);
    expect(member("team-30").schedule["1"]).toMatchObject({ start: "10:00", end: "14:00" });
    const services = paola.services.map((row) => ({ ...row, price: (row.price ?? 10) + 1, splitCommission: 99 }));
    expect((await call(RENTER, "/team/members/team-30", send("PATCH", { services }))).status).toBe(200);
    expect(member("team-30").services[0].splitCommission).toBe(paola.services[0].splitCommission);
    expect(member("team-30").services[0].price).toBe((paola.services[0].price ?? 10) + 1);
    const andres = member("team-04");
    expect((await call(BARBER, "/team/members/team-04", send("PATCH", { schedule: { ...andres.schedule, "1": null } }))).status).toBe(403);
  });

  test("pedir reseñas: a sus clientes atendidos sin calificar, una vez al mes", async () => {
    for (let back = 1; back <= 10; back += 1) appointmentsOn("ma", dateKey(new Date(NOW.getTime() - back * 86_400_000)));
    const candidates = await json(await call(BARBER, "/team/members/team-04/review-candidates?branchId=ma"));
    expect(candidates.items.length).toBeGreaterThan(0);
    expect((await call(BARBER, "/team/members/team-30/review-candidates?branchId=ma")).status).toBe(403);
    const sent = await json(await call(BARBER, "/team/members/team-04/review-requests", send("POST", { branchId: "ma" })));
    expect(sent.sent).toBe(candidates.items.length);
    expect((db.booking.outbox ?? []).filter((item) => item.kind === "reviewRequest").length).toBeGreaterThanOrEqual(sent.sent);
    const again = await json(await call(BARBER, "/team/members/team-04/review-requests", send("POST", { branchId: "ma" })));
    expect(again.sent).toBe(0);
    expect((await call(RECEPTION, "/team/members/team-04/review-candidates?branchId=ma")).status).toBe(403);
  });
});
