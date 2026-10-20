import { describe, expect, test } from "vitest";
import type { Barber } from "../types";
import { blockAppliesOn, coverageFor, daysOf, isAbsenceBlock, isShortHanded, previewSpanOn } from "./timeOffModel";

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

describe("isAbsenceBlock", () => {
  test("cuenta como ausencia la que deja una ausencia aprobada y las vacaciones o incapacidades puestas a mano", () => {
    expect(isAbsenceBlock({ id: "blk_abs_abs-1", category: "personal" })).toBe(true);
    expect(isAbsenceBlock({ id: "blk_1", category: "vacation" })).toBe(true);
    expect(isAbsenceBlock({ id: "blk_2", category: "sick" })).toBe(true);
  });

  test("el almuerzo, una reunión o un permiso corto son bloqueos", () => {
    expect(isAbsenceBlock({ id: "blk_3", category: "lunch" })).toBe(false);
    expect(isAbsenceBlock({ id: "blk_4", category: "meeting" })).toBe(false);
    expect(isAbsenceBlock({ id: "blk_5", category: "personal" })).toBe(false);
  });
});

describe("lo que se está creando, en la agenda", () => {
  const hours = [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }];
  test("una ausencia ocupa la jornada entera de cada día del rango", () => {
    const preview = { barberId: "b1", label: "Vacaciones", startDate: "2026-10-20", endDate: "2026-10-22" };
    expect(previewSpanOn(preview, new Date(2026, 9, 21), hours)).toEqual({ start: "09:00", end: "19:00" });
    expect(previewSpanOn(preview, new Date(2026, 9, 23), hours)).toBeNull();
    expect(previewSpanOn(preview, new Date(2026, 9, 21), [])).toBeNull();
  });
  test("un bloqueo ocupa sus horas y respeta la repetición", () => {
    const preview = { barberId: "b1", label: "Almuerzo", startDate: "2026-10-20", endDate: "2026-11-30", repeat: "weekly" as const, startTime: "13:00", endTime: "14:00" };
    expect(previewSpanOn(preview, new Date(2026, 9, 27), hours)).toEqual({ start: "13:00", end: "14:00" });
    expect(previewSpanOn(preview, new Date(2026, 9, 28), hours)).toBeNull();
    expect(previewSpanOn({ ...preview, startTime: "15:00", endTime: "14:00" }, new Date(2026, 9, 20), hours)).toBeNull();
  });
});
