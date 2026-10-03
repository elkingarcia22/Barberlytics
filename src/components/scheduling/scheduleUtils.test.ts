import { describe, expect, test } from "vitest";
import {
  atMinutes,
  earliestWorkingMinute,
  findConflicts,
  rangesOverlap,
  isWorkingAt,
  layoutEvents,
  nowPercent,
  occupancyRate,
  parseClock,
  slotMinutes,
  snapMinutes,
  workingMinutes,
} from "./scheduleUtils";
import type { ScheduleEvent } from "./scheduleTypes";

const DAY = new Date(2026, 8, 25);
const event = (id: string, start: number, end: number, extra: Partial<ScheduleEvent> = {}): ScheduleEvent => ({
  id,
  resourceId: "b1",
  start: atMinutes(DAY, start),
  end: atMinutes(DAY, end),
  title: id,
  ...extra,
});

describe("scheduleUtils", () => {
  test("lee horas «HH:mm» y redondea a la franja", () => {
    expect(parseClock("09:30")).toBe(570);
    expect(parseClock("mal")).toBe(0);
    expect(snapMinutes(583, 15)).toBe(585);
    expect(snapMinutes(583, 30)).toBe(570);
  });

  test("las franjas cubren la jornada visible sin pasarse", () => {
    const slots = slotMinutes(6, 24, 30);
    expect(slots).toHaveLength(36);
    expect(slots[0]).toBe(360);
    expect(slots.at(-1)).toBe(1410);
  });

  test("el horario decide si se trabaja a una hora", () => {
    const hours = [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "18:00" }];
    expect(isWorkingAt(hours, 600)).toBe(true);
    expect(isWorkingAt(hours, 800)).toBe(false);
    expect(isWorkingAt(undefined, 600)).toBe(false);
    expect(workingMinutes(hours)).toBe(480);
    expect(earliestWorkingMinute([{ id: "a", name: "A", workingHours: hours }, { id: "b", name: "B" }])).toBe(540);
    expect(earliestWorkingMinute([{ id: "b", name: "B" }])).toBeNull();
  });

  test("dos citas que se pisan se reparten la columna y un bloqueo va a todo el ancho", () => {
    const placed = layoutEvents(
      [event("a", 600, 660), event("b", 630, 690), event("c", 720, 750), event("blk", 600, 720, { kind: "block" })],
      360,
      1440
    );
    const byId = Object.fromEntries(placed.map((item) => [item.event.id, item]));
    expect(byId.a.columns).toBe(2);
    expect(byId.b.column).toBe(1);
    expect(byId.c.columns).toBe(1);
    expect(byId.blk.columns).toBe(1);
    expect(byId.a.top).toBeCloseTo(((600 - 360) / 1080) * 100);
  });

  test("la ocupación es minutos de cita sobre minutos de jornada", () => {
    const hours = [{ start: "09:00", end: "17:00" }];
    expect(occupancyRate([event("a", 600, 660), event("b", 660, 780), event("x", 780, 840, { muted: true })], hours)).toBeCloseTo(180 / 480);
    expect(occupancyRate([event("a", 600, 660)], undefined)).toBeNull();
  });

  test("la línea de ahora solo se dibuja dentro del día y de la franja", () => {
    expect(nowPercent(atMinutes(DAY, 720), DAY, 360, 1440)).toBeCloseTo((360 / 1080) * 100);
    expect(nowPercent(atMinutes(DAY, 100), DAY, 360, 1440)).toBeNull();
    expect(nowPercent(atMinutes(new Date(2026, 8, 26), 720), DAY, 360, 1440)).toBeNull();
  });

  test("un choque es otra cita viva de la misma columna en el mismo tramo", () => {
    const events = [event("a", 600, 660), event("x", 600, 660, { muted: true }), event("g", 600, 660, { ghost: true }), event("blk", 720, 780, { kind: "block" })];
    expect(rangesOverlap(600, 660, 660, 690)).toBe(false);
    expect(rangesOverlap(600, 660, 630, 690)).toBe(true);
    expect(findConflicts(events, "b1", atMinutes(DAY, 630), atMinutes(DAY, 690)).map((item) => item.id)).toEqual(["a"]);
    expect(findConflicts(events, "b1", atMinutes(DAY, 630), atMinutes(DAY, 690), "a")).toEqual([]);
    expect(findConflicts(events, "b1", atMinutes(DAY, 750), atMinutes(DAY, 800)).map((item) => item.id)).toEqual(["blk"]);
    expect(findConflicts(events, "otra", atMinutes(DAY, 630), atMinutes(DAY, 690))).toEqual([]);
  });

  test("una propuesta no reparte sitio con las citas ni cuenta como ocupación", () => {
    const placed = layoutEvents([event("a", 600, 660), event("g", 600, 660, { ghost: true })], 360, 1440);
    expect(placed.every((item) => item.columns === 1)).toBe(true);
    expect(occupancyRate([event("a", 600, 660), event("g", 660, 720, { ghost: true })], [{ start: "09:00", end: "17:00" }])).toBeCloseTo(60 / 480);
  });
});
