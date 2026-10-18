import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../db";
import { onboardingOf } from "./handlers";

describe("puesta en marcha", () => {
  beforeEach(() => db.reset());

  test("la barbería de la demo está lista", () => {
    expect(onboardingOf("ma").every((step) => step.done)).toBe(true);
  });

  test("cada paso se marca solo con el dato real: sin pasarela conectada falta «pagos»", () => {
    db.settings.lists.gateways = (db.settings.lists.gateways as unknown as Record<string, unknown>[]).map((item) => ({ ...item, connected: false })) as never;
    const steps = onboardingOf("ma");
    expect(steps.find((step) => step.id === "payments")?.done).toBe(false);
    expect(steps.find((step) => step.id === "services")?.done).toBe(true);
  });
});
