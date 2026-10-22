import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "../db";
import { hoursOn } from "../calendar/handlers";
import { notificationsFor } from "../notifications/handlers";
import { addDaysKey, mondayOf, patternRange, planOn } from "./scheduleModel";

const OWNER = "mock-acc_admin-plans";
const RECEPTION = "mock-acc_reception-plans";
const call = (token: string, path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${token}` } });
const send = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });
const NOW = new Date("2026-10-20T08:00:00");
const member = (id: string) => db.team.members.find((item) => item.id === id)!;
const week = (range: { start: string; end: string } | null) => Object.fromEntries(["0", "1", "2", "3", "4", "5", "6"].map((day) => [day, day === "0" ? null : range]));
const MORNING = { start: "08:00", end: "14:00" };
const AFTERNOON = { start: "14:00", end: "20:00" };

describe("horarios con vigencia, ciclos, festivos y avisos", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
    db.sessions.set(RECEPTION, "acc_reception");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  test("un ciclo de dos semanas alterna mañana y tarde desde su fecha", async () => {
    const from = "2026-11-02";
    const response = await call(OWNER, "/team/schedule/plans", send("POST", { memberIds: ["team-04"], from, to: null, weeks: [week(MORNING), week(AFTERNOON)] }));
    expect(response.status).toBe(201);
    expect(hoursOn(member("team-04"), "2026-11-03")).toEqual([MORNING]);
    expect(hoursOn(member("team-04"), "2026-11-10")).toEqual([AFTERNOON]);
    expect(hoursOn(member("team-04"), "2026-11-17")).toEqual([MORNING]);
  });

  test("un horario con fin deja que el anterior vuelva después, en la misma fase de su ciclo", async () => {
    await call(OWNER, "/team/schedule/plans", send("POST", { memberIds: ["team-04"], from: "2026-11-02", to: null, weeks: [week(MORNING), week(AFTERNOON)] }));
    await call(OWNER, "/team/schedule/plans", send("POST", { memberIds: ["team-04"], from: "2026-11-16", to: "2026-11-22", weeks: [week({ start: "10:00", end: "16:00" })] }));
    expect(hoursOn(member("team-04"), "2026-11-17")).toEqual([{ start: "10:00", end: "16:00" }]);
    // Semana 4 desde el 2 de noviembre: la del ciclo que toca es la de la tarde.
    expect(hoursOn(member("team-04"), "2026-11-24")).toEqual([AFTERNOON]);
    expect(hoursOn(member("team-04"), "2026-11-10")).toEqual([AFTERNOON]);
  });

  test("«este y los siguientes» no reescribe las semanas pasadas", async () => {
    const before = patternRange(member("team-04"), "2026-10-15");
    await call(OWNER, "/team/schedule/weekday", send("PUT", { memberId: "team-04", from: "2026-10-22", range: { start: "12:00", end: "20:00" } }));
    expect(patternRange(member("team-04"), "2026-10-15")).toEqual(before);
    expect(patternRange(member("team-04"), "2026-10-29")).toEqual({ start: "12:00", end: "20:00" });
    expect(planOn("team-04", "2026-10-29")?.from).toBe("2026-10-22");
  });

  test("un festivo cerrado deja a todos sin turno y un cierre con horario reducido los recorta", async () => {
    // La sede «ma» está en Estados Unidos: Acción de Gracias.
    const thanksgiving = "2026-11-26";
    expect(hoursOn(member("team-04"), thanksgiving).length).toBeGreaterThan(0);
    expect((await call(RECEPTION, "/team/schedule/holidays", send("PUT", { branchId: "ma", date: thanksgiving, closed: true }))).status).toBe(403);
    await call(OWNER, "/team/schedule/holidays", send("PUT", { branchId: "ma", date: thanksgiving, closed: true }));
    expect(hoursOn(member("team-04"), thanksgiving, "ma")).toEqual([]);

    const eve = "2026-12-24";
    await call(OWNER, "/team/schedule/closures", send("POST", { branchId: "ma", date: eve, name: "Nochebuena", open: { start: "09:00", end: "13:00" } }));
    const hours = hoursOn(member("team-04"), eve, "ma");
    expect(hours.every((range) => range.start >= "09:00" && range.end <= "13:00")).toBe(true);
    const year = await (await call(OWNER, "/team/schedule/closures?branchId=ma&year=2026")).json();
    expect(year.holidays.find((item: { date: string }) => item.date === thanksgiving).closed).toBe(true);
    expect(year.closures).toHaveLength(1);
  });

  test("al barbero le llega un aviso cuando otra persona le cambia el horario", async () => {
    const day = addDaysKey(mondayOf("2026-10-21"), 7);
    await call(OWNER, "/team/schedule/override", send("PUT", { memberId: "team-04", date: day, range: null }));
    await call(OWNER, "/team/schedule/override", send("PUT", { memberId: "team-05", date: day, range: null, notify: false }));
    const forBarber = (memberId: string) => notificationsFor("ma", "barbero-comision", memberId, NOW).filter((item) => item.kind === "scheduleChanged");
    expect(forBarber("team-04")).toHaveLength(1);
    expect(forBarber("team-05")).toHaveLength(0);
    const log = await (await call(OWNER, "/team/schedule/log?branchId=ma")).json();
    expect(log.items.length).toBeGreaterThanOrEqual(2);
  });
});
