import { describe, expect, test } from "vitest";
import { PHONE_COUNTRIES } from "@/components/forms";
import { COUNTRY_TIMEZONES, describeTimezone, timezonesFor } from "./timezones";

describe("zonas horarias por país", () => {
  test("todos los países del celular tienen al menos una zona válida", () => {
    for (const country of PHONE_COUNTRIES) {
      const zones = COUNTRY_TIMEZONES[country.code];
      expect(zones.length, country.name).toBeGreaterThan(0);
      for (const zone of zones) expect(() => new Intl.DateTimeFormat("es", { timeZone: zone })).not.toThrow();
    }
  });

  test("un país sin elegir no ofrece zonas", () => {
    expect(timezonesFor("")).toEqual([]);
  });

  test("la etiqueta lleva la ciudad legible y el desfase", () => {
    expect(describeTimezone("America/Bogota")).toBe("Bogota (GMT-5)");
    expect(describeTimezone("America/Mexico_City")).toMatch(/^Mexico City \(GMT-\d\)$/);
  });
});
