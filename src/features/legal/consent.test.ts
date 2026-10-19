import { describe, expect, test } from "vitest";
import { consentCountryOf, consentPack, consentVersionOf } from "./consent";

describe("texto del consentimiento según el país", () => {
  test("el país sale del código o del nombre, y sin país va el general", () => {
    expect(consentCountryOf("Colombia")).toBe("CO");
    expect(consentCountryOf("CO")).toBe("CO");
    expect(consentCountryOf("Estados Unidos")).toBe("US");
    expect(consentCountryOf("México")).toBe("MX");
    expect(consentCountryOf("Chile")).toBe("GENERIC");
    expect(consentCountryOf(null)).toBe("GENERIC");
  });

  test("cada país dice lo que pide su norma, con el nombre de la barbería", () => {
    const co = consentPack("Colombia", "es", "Barbería Demo");
    expect(co.privacyShort).toContain("Ley 1581");
    expect(co.privacyNotice.join(" ")).toMatch(/rectificar.*suprimir/);
    expect(co.marketingLabel).toContain("Barbería Demo");
    const us = consentPack("Estados Unidos", "en", "Barbería Demo");
    expect(us.marketingDisclosure).toMatch(/not a condition/);
    expect(us.marketingDisclosure).toMatch(/STOP/);
    expect(us.marketingDisclosure).toMatch(/rates may apply/);
    expect(consentPack("México", "es", "X").privacyNotice.join(" ")).toContain("ARCO");
  });

  test("la versión es por país y se guarda con la aceptación", () => {
    expect(consentVersionOf("Colombia")).toMatch(/^co-/);
    expect(consentVersionOf("Estados Unidos")).toMatch(/^us-/);
    expect(consentPack("Colombia", "en", "X").version).toBe(consentVersionOf("CO"));
  });
});
