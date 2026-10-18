import { describe, expect, test } from "vitest";
import { isOverdue } from "./overdue";

const now = new Date("2026-10-18T12:00:00Z");
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

describe("le toca volver", () => {
  test("pasó su ritmo de visita sin volver", () => {
    expect(isOverdue({ segment: "frequent", lastVisitAt: daysAgo(30), visitEveryDays: 21 }, now)).toBe(true);
    expect(isOverdue({ segment: "frequent", lastVisitAt: daysAgo(10), visitEveryDays: 21 }, now)).toBe(false);
  });

  test("los que ya están en riesgo, perdidos, bloqueados o sin ritmo no cuentan aquí", () => {
    for (const segment of ["atRisk", "lost", "blocked", "new"]) expect(isOverdue({ segment, lastVisitAt: daysAgo(60), visitEveryDays: 21 }, now)).toBe(false);
    expect(isOverdue({ segment: "retained", lastVisitAt: daysAgo(60), visitEveryDays: null }, now)).toBe(false);
  });
});
