import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "../db";
import { appointmentsOn, hoursOn } from "../calendar/handlers";
import { dateKey } from "../calendar/seed";

const OWNER = "mock-acc_admin-hours";
const BARBER = "mock-acc_barber-hours";
const RECEPTION = "mock-acc_reception-hours";
const call = (token: string, path: string, init: RequestInit = {}) => fetch(`http://localhost/api${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${token}` } });
const send = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });
const NOW = new Date("2026-10-20T08:00:00");
const member = (id: string) => db.team.members.find((item) => item.id === id)!;
/** El primer día desde mañana en que esa persona trabaja (con su horario fijo). */
function nextWorkday(id: string): string {
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = dateKey(new Date(NOW.getTime() + offset * 86_400_000));
    if (hoursOn(member(id), day).length > 0) return day;
  }
  return "";
}

describe("horario de trabajo", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(OWNER, "acc_admin");
    db.sessions.set(BARBER, "acc_barber");
    db.sessions.set(RECEPTION, "acc_reception");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  test("un día suelto guarda sus descansos y lo cambia recepción, no el barbero de comisión", async () => {
    const day = nextWorkday("team-04");
    const range = { start: "10:00", end: "19:00", breaks: [{ start: "13:00", end: "14:00" }] };
    expect((await call(BARBER, "/team/schedule/override", send("PUT", { memberId: "team-04", date: day, range }))).status).toBe(403);
    expect((await call(RECEPTION, "/team/schedule/override", send("PUT", { memberId: "team-04", date: day, range }))).status).toBe(200);
    expect(hoursOn(member("team-04"), day)).toEqual([
      { start: "10:00", end: "13:00" },
      { start: "14:00", end: "19:00" },
    ]);
  });

  test("«este y los siguientes» cambia el horario fijo de ese día de la semana; recepción no puede", async () => {
    const day = nextWorkday("team-04");
    const weekday = String(new Date(`${day}T00:00:00`).getDay());
    const range = { start: "12:00", end: "20:00" };
    expect((await call(RECEPTION, "/team/schedule/weekday", send("PUT", { memberId: "team-04", from: day, range }))).status).toBe(403);
    expect((await call(OWNER, "/team/schedule/weekday", send("PUT", { memberId: "team-04", from: day, range }))).status).toBe(200);
    expect(member("team-04").schedule[weekday]).toEqual(range);
  });

  test("antes de guardar, dice qué citas por atender quedarían fuera del turno", async () => {
    const day = nextWorkday("team-04");
    const own = appointmentsOn("ma", day).filter((item) => item.barberId === "team-04" && item.status === "scheduled");
    expect(own.length).toBeGreaterThan(0);
    const off = await (await call(OWNER, "/team/schedule/impact", send("POST", { memberId: "team-04", date: day, range: null, scope: "day" }))).json();
    expect(off.items.map((item: { id: string }) => item.id).sort()).toEqual(own.map((item) => item.id).sort());
    const wide = await (await call(OWNER, "/team/schedule/impact", send("POST", { memberId: "team-04", date: day, range: { start: "05:00", end: "23:45" }, scope: "day" }))).json();
    expect(wide.items).toEqual([]);
  });

  test("copiar la semana pasa los cambios de día a la semana siguiente", async () => {
    const day = nextWorkday("team-04");
    await call(OWNER, "/team/schedule/override", send("PUT", { memberId: "team-04", date: day, range: null }));
    const monday = (date: string) => {
      const value = new Date(`${date}T00:00:00`);
      value.setDate(value.getDate() - ((value.getDay() + 6) % 7));
      return dateKey(value);
    };
    const from = monday(day);
    const to = dateKey(new Date(new Date(`${from}T00:00:00`).getTime() + 7 * 86_400_000));
    const result = await (await call(OWNER, "/team/schedule/copy-week", send("POST", { branchId: "ma", from, to }))).json();
    expect(result.changed).toBeGreaterThan(0);
    const next = dateKey(new Date(new Date(`${day}T00:00:00`).getTime() + 7 * 86_400_000));
    expect(hoursOn(member("team-04"), next)).toEqual([]);
  });
});
