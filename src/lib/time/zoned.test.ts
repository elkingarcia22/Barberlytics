import { describe, expect, test } from "vitest";
import { instantOf, isTimeZone, offsetLabel, wallClock } from "./zoned";

describe("hora de la sede", () => {
  test("de hora local a instante, con horario de verano y de invierno", () => {
    expect(instantOf("2026-10-20T10:30", "America/Denver").toISOString()).toBe("2026-10-20T16:30:00.000Z");
    expect(instantOf("2026-11-02T10:30", "America/Denver").toISOString()).toBe("2026-11-02T17:30:00.000Z");
    expect(instantOf("2026-10-20T10:30:00", "America/Bogota").toISOString()).toBe("2026-10-20T15:30:00.000Z");
  });

  test("de instante a hora de pared en cada sede", () => {
    const at = new Date("2026-10-20T16:30:00.000Z");
    expect(wallClock("America/Denver", at)).toBe("2026-10-20T10:30");
    expect(wallClock("America/New_York", at)).toBe("2026-10-20T12:30");
    expect(offsetLabel("America/New_York", at)).toBe("-04:00");
  });

  test("ida y vuelta da la misma hora local", () => {
    for (const zone of ["America/New_York", "America/Bogota", "America/Los_Angeles", "Europe/Madrid"]) expect(wallClock(zone, instantOf("2026-03-08T09:15", zone))).toBe("2026-03-08T09:15");
    expect(isTimeZone("America/Bogota")).toBe(true);
    expect(isTimeZone("Marte/Olympus")).toBe(false);
  });
});
