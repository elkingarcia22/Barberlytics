import { describe, expect, it } from "vitest";
import { RHYTHM_WEEKS, rhythmOf } from "./handlers";

describe("rhythmOf", () => {
  it("promedia las citas de cada día de la semana en las últimas semanas", () => {
    const rhythm = rhythmOf("ma", null, new Date(2026, 9, 19));
    expect(rhythm.weeks).toBe(RHYTHM_WEEKS);
    expect(rhythm.weekdays).toHaveLength(7);
    expect(rhythm.average).toBeGreaterThan(0);
    const open = rhythm.weekdays.filter((item) => item.samples > 0);
    expect(open.length).toBeGreaterThan(0);
  });
});
