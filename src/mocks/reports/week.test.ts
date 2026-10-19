import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { weekFacts } from "./week";

describe("cifras de «Cómo te fue»", () => {
  beforeEach(() => db.reset());

  test("los últimos 7 días contra los 7 anteriores, con quien más vendió", () => {
    const facts = weekFacts("ma", new Date(2026, 9, 17, 20));
    expect(facts.revenue).toBeGreaterThan(0);
    expect(facts.revenuePrev).toBeGreaterThan(0);
    expect(facts.services).toBeGreaterThan(0);
    expect(facts.topBarber?.revenue).toBeGreaterThan(0);
    expect(facts.to).toBe("2026-10-17");
  });
});
