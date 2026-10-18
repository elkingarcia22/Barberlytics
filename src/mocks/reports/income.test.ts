import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { incomeStatement } from "./income";

const NOW = new Date(2026, 9, 18, 18, 0);

describe("estado de resultados", () => {
  beforeEach(() => db.reset());

  test("cuadra: ingresos − variables = contribución; contribución − fijos = utilidad", () => {
    const report = incomeStatement("ma", "2026-09", NOW);
    expect(report.elapsedDays).toBe(30);
    expect(report.revenue.total).toBeGreaterThan(0);
    expect(report.revenue.total).toBeCloseTo(report.revenue.services + report.revenue.products + report.revenue.rent - report.revenue.refunds, 1);
    expect(report.contribution).toBeCloseTo(report.revenue.total - report.costs.products - report.costs.commissions, 1);
    expect(report.net).toBeCloseTo(report.contribution - report.fixedCosts, 1);
    expect(report.fixedCosts).toBeCloseTo(report.costs.salaries + report.costs.adjustments + report.costs.expensesFixed + report.costs.expensesVariable, 1);
  });

  test("el punto de equilibrio cubre lo fijo con el margen de contribución", () => {
    const report = incomeStatement("ma", "2026-09", NOW);
    const breakEven = report.breakEven!;
    expect(breakEven).not.toBeNull();
    expect((breakEven.revenue * breakEven.contributionPercent) / 100).toBeCloseTo(report.fixedCosts, 0);
    expect(breakEven.servicesPerDay).toBe(Math.ceil(breakEven.revenue / breakEven.avgTicket / breakEven.openDays));
  });

  test("a mitad de mes, los fijos van en proporción a los días vividos; un mes por venir sale en cero", () => {
    const mid = incomeStatement("ma", "2026-10", NOW);
    const full = incomeStatement("ma", "2026-09", NOW);
    expect(mid.elapsedDays).toBe(18);
    expect(mid.costs.expensesFixed).toBeLessThan(full.costs.expensesFixed);
    const future = incomeStatement("ma", "2026-12", NOW);
    expect(future.revenue.total).toBe(0);
    expect(future.breakEven).toBeNull();
  });
});
