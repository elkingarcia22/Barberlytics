import { describe, expect, test } from "vitest";
import { GATEWAY_SPECS, keyLooksValid } from "./gatewayProviders";

describe("pasarelas de pago", () => {
  test("reconoce las claves de cada proveedor y rechaza las de otro", () => {
    expect(keyLooksValid("stripe", "public", "pk_test_123")).toBe(true);
    expect(keyLooksValid("stripe", "secret", "prv_test_123")).toBe(false);
    expect(keyLooksValid("wompi", "public", "pub_prod_abc")).toBe(true);
    expect(keyLooksValid("wompi", "secret", "prv_test_abc")).toBe(true);
    expect(keyLooksValid("wompi", "public", "pk_test_123")).toBe(false);
    // Un prefijo solo no es una clave.
    expect(keyLooksValid("stripe", "public", "pk_")).toBe(false);
  });

  test("sin prefijo fijo, basta con que la clave tenga largo de clave", () => {
    expect(keyLooksValid("bold", "public", "corta")).toBe(false);
    expect(keyLooksValid("bold", "public", "0123456789abcdef")).toBe(true);
  });

  test("las pasarelas de Colombia ofrecen PSE; las de Estados Unidos, tarjeta y billetera", () => {
    expect(GATEWAY_SPECS.wompi.methods).toEqual(expect.arrayContaining(["pse", "nequi"]));
    expect(GATEWAY_SPECS.stripe.methods).toEqual(["card", "wallet"]);
  });
});
