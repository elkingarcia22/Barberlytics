import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { menuEngineering } from "./menu";

describe("margen por hora de silla y matriz del catálogo", () => {
  beforeEach(() => db.reset());

  test("cada servicio con su margen por hora y su cuadrante; los cuadrantes salen de los umbrales", () => {
    const report = menuEngineering("ma", 30, new Date(2026, 9, 17, 20));
    expect(report.items.length).toBeGreaterThan(3);
    expect(report.avgMarginPerHour).toBeGreaterThan(0);
    const bar = (report.units / report.items.length) * 0.7;
    for (const item of report.items) {
      expect(item.marginPerHour).toBeCloseTo((item.unitMargin * item.units) / item.hours, 0);
      const popular = item.units >= bar;
      const profitable = item.marginPerHour >= report.avgMarginPerHour;
      expect(item.quadrant).toBe(popular ? (profitable ? "star" : "plowhorse") : profitable ? "puzzle" : "dog");
      if (item.targetPrice !== null) expect(item.targetPrice).toBeGreaterThan(item.avgPrice);
    }
  });
});
