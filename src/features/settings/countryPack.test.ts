import { describe, expect, test } from "vitest";
import { holidayOn, holidaysOf } from "@/features/legal/sendWindow";
import { branchDefaultsFor, closedForHoliday, findUsualTaxGroup, gatewaysFor, isValidTaxId, nitCheckDigit, packCountryOf, timezonesFor, upcomingClosures } from "./countryPack";

describe("paquete por país", () => {
  test("reconoce el país por código o por nombre", () => {
    expect(packCountryOf("CO")).toBe("CO");
    expect(packCountryOf("Estados Unidos")).toBe("US");
    expect(packCountryOf("México")).toBe("MX");
    expect(packCountryOf("Argentina")).toBeNull();
  });

  test("elegir el país pone moneda y zona, y respeta la zona si es de allí", () => {
    expect(branchDefaultsFor("CO", { timezone: "America/New_York" })).toEqual({ currency: "COP", timezone: "America/Bogota", language: "es" });
    expect(branchDefaultsFor("MX", { timezone: "America/Tijuana", language: "en" })).toEqual({ currency: "MXN", timezone: "America/Tijuana", language: "en" });
    // La zona actual se ofrece aunque sea de otro país, para no perderla al editar.
    expect(timezonesFor("CO", "America/Chicago")).toEqual(["America/Chicago", "America/Bogota"]);
  });

  test("las pasarelas que operan en cada país", () => {
    expect(gatewaysFor("CO")).toEqual(["wompi", "bold", "mercadopago"]);
    expect(gatewaysFor("US")).toEqual(["stripe", "square"]);
  });

  test("el impuesto habitual reusa uno igual aunque se llame distinto", () => {
    const groups = [{ id: "a", name: "IVA Colombia", taxes: [{ name: "IVA", percent: 19 }] }, { id: "b", name: "Estatal MA", taxes: [{ name: "Sales tax", percent: 6.25 }] }];
    expect(findUsualTaxGroup("CO", groups)?.id).toBe("a");
    expect(findUsualTaxGroup("MX", groups)).toBeUndefined();
    expect(findUsualTaxGroup("US", groups)).toBeUndefined();
  });

  test("NIT con dígito de verificación, RFC y EIN", () => {
    expect(nitCheckDigit("860002964")).toBe(4);
    expect(isValidTaxId("CO", "860002964-4")).toBe(true);
    expect(isValidTaxId("CO", "860.002.964-5")).toBe(false);
    expect(isValidTaxId("MX", "BDE240115AB1")).toBe(true);
    expect(isValidTaxId("MX", "BDE241315AB1")).toBe(false);
    expect(isValidTaxId("US", "12-3456789")).toBe(true);
    expect(isValidTaxId("US", "07-3456789")).toBe(false);
    // Vacía vale (no es obligatoria) y sin país no se juzga.
    expect(isValidTaxId("CO", "")).toBe(true);
    expect(isValidTaxId("Argentina", "20-12345678-9")).toBe(true);
  });
});

describe("festivos por país", () => {
  test("Colombia tiene 18 festivos con la Ley Emiliani", () => {
    const days = holidaysOf("CO", 2026);
    expect(days).toHaveLength(18);
    // Reyes (6 de enero, martes) se corre al lunes 12.
    expect(days.find((item) => item.id === "epiphany")?.date).toBe("2026-01-12");
    expect(holidayOn("CO", "2026-07-20")?.id).toBe("independence");
  });

  test("el mismo motivo cierra a cada sede el día de su país, y en EE. UU. cuenta el observado", () => {
    expect(closedForHoliday("CO", ["independence"], "2026-07-20")?.id).toBe("independence");
    expect(closedForHoliday("Estados Unidos", ["independence"], "2026-07-20")).toBeNull();
    // El 4 de julio de 2026 cae sábado: se descansa el viernes 3.
    expect(closedForHoliday("US", ["independence"], "2026-07-03")?.id).toBe("independence");
    expect(closedForHoliday("MX", ["independence"], "2026-09-16")?.id).toBe("independence");
    expect(closedForHoliday("CO", [], "2026-07-20")).toBeNull();
  });

  test("los próximos cierres siguen al año siguiente", () => {
    expect(upcomingClosures("CO", ["christmas", "new-year"], "2026-12-26", 2).map((item) => item.date)).toEqual(["2027-01-01", "2027-12-25"]);
  });
});
