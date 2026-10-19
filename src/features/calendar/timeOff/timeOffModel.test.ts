import { describe, expect, test } from "vitest";
import type { Barber } from "../types";
import { blockAppliesOn, coverageFor, daysOf, isShortHanded } from "./timeOffModel";

const weekdays = { "1": [{ start: "09:00", end: "18:00" }], "2": [{ start: "09:00", end: "18:00" }], "3": [{ start: "09:00", end: "18:00" }] };
const barber = (id: string, name: string): Barber => ({ id, branchId: "ma", name, avatarUrl: null, level: null, workingHours: weekdays, acceptsWalkIns: true });
const team = [barber("b1", "Emilio Arango"), barber("b2", "Valeria Marín"), barber("b3", "Andrés Beltrán"), barber("b4", "Paola Zuluaga")];

describe("daysOf", () => {
  test("lists every day of the range, both ends included", () => {
    expect(daysOf("2026-10-26", "2026-10-28").map((date) => date.getDate())).toEqual([26, 27, 28]);
  });
});

describe("coverageFor", () => {
  test("says how many stay working each day and who else is off", () => {
    // Lunes 26 a miércoles 28 de octubre de 2026; Valeria ya tiene aprobado el martes.
    const absences = [{ id: "a2", memberId: "b2", memberName: "Valeria Marín", kind: "personal" as const, startDate: "2026-10-27", endDate: "2026-10-27", status: "approved" as const }];
    const coverage = coverageFor({ id: "a1", memberId: "b1", startDate: "2026-10-26", endDate: "2026-10-28" }, team, absences);
    expect(coverage.map((day) => day.available)).toEqual([3, 2, 3]);
    expect(coverage[1].alsoOff).toEqual([{ name: "Valeria", kind: "personal", pending: false }]);
    expect(coverage.every((day) => day.works && day.scheduled === 4)).toBe(true);
  });

  test("a day the barber doesn't work costs nothing", () => {
    // Jueves 29: nadie trabaja ese día en este equipo.
    const [thursday] = coverageFor({ id: "a1", memberId: "b1", startDate: "2026-10-29", endDate: "2026-10-29" }, team, []);
    expect(thursday.works).toBe(false);
    expect(thursday.scheduled).toBe(0);
  });

  test("less than half the team is short-handed", () => {
    expect(isShortHanded({ scheduled: 4, available: 1 })).toBe(true);
    expect(isShortHanded({ scheduled: 4, available: 2 })).toBe(false);
  });
});

describe("blockAppliesOn", () => {
  test("respects the range and the weekly repeat", () => {
    const weekly = { startDate: "2026-10-26", endDate: "2026-11-30", repeat: "weekly" as const };
    expect(blockAppliesOn(weekly, new Date(2026, 10, 2))).toBe(true);
    expect(blockAppliesOn(weekly, new Date(2026, 10, 3))).toBe(false);
    expect(blockAppliesOn({ ...weekly, repeat: "none" }, new Date(2026, 11, 1))).toBe(false);
  });
});
