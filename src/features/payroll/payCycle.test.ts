import { describe, expect, test } from "vitest";
import { cyclesBetween, payCycleWindow, shiftPayCycle } from "./payCycle";

const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const range = (window: { from: Date; to: Date }) => `${iso(window.from)}..${iso(window.to)}`;
const day = (value: string) => new Date(`${value}T12:00:00`);

describe("ciclo de pago", () => {
  test("quincena: del 1 al 15 y del 16 a fin de mes (febrero incluido)", () => {
    const quincena = { cycle: "biweekly" as const, startDay: 1 };
    expect(range(payCycleWindow(day("2026-10-07"), quincena))).toBe("2026-10-01..2026-10-15");
    expect(range(payCycleWindow(day("2026-10-16"), quincena))).toBe("2026-10-16..2026-10-31");
    expect(range(payCycleWindow(day("2026-02-20"), quincena))).toBe("2026-02-16..2026-02-28");
    expect(range(shiftPayCycle(day("2026-10-07"), quincena, -1))).toBe("2026-09-16..2026-09-30");
    expect(range(shiftPayCycle(day("2026-10-20"), quincena, 1))).toBe("2026-11-01..2026-11-15");
  });

  test("quincena con otro día de inicio: del 5 al 19 y del 20 al 4", () => {
    const fromFifth = { cycle: "biweekly" as const, startDay: 5 };
    expect(range(payCycleWindow(day("2026-10-10"), fromFifth))).toBe("2026-10-05..2026-10-19");
    expect(range(payCycleWindow(day("2026-11-02"), fromFifth))).toBe("2026-10-20..2026-11-04");
  });

  test("semanal desde el día elegido y mensual desde el día del mes", () => {
    // 19 de octubre de 2026 es lunes.
    expect(range(payCycleWindow(day("2026-10-21"), { cycle: "weekly", startDay: 1 }))).toBe("2026-10-19..2026-10-25");
    expect(range(payCycleWindow(day("2026-10-21"), { cycle: "weekly", startDay: 5 }))).toBe("2026-10-16..2026-10-22");
    expect(range(payCycleWindow(day("2026-10-03"), { cycle: "monthly", startDay: 10 }))).toBe("2026-09-10..2026-10-09");
  });

  test("cuántos ciclos van de una fecha a otra", () => {
    const quincena = { cycle: "biweekly" as const, startDay: 1 };
    expect(cyclesBetween(day("2026-10-03"), day("2026-10-14"), quincena)).toBe(0);
    expect(cyclesBetween(day("2026-10-03"), day("2026-11-02"), quincena)).toBe(2);
    expect(cyclesBetween(day("2026-10-20"), day("2026-10-03"), quincena)).toBe(-1);
  });
});
