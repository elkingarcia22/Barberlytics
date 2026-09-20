import { describe, expect, test } from "vitest";
import { buildRadiusTokens, buildThemeTokens, RADIUS_FACTORS, themeToCss } from "./buildTokens";
import { findPreset, THEME_PRESETS } from "./presets";

const ubits = findPreset("ubits");

describe("buildThemeTokens", () => {
  test("uses the preset primary as brand and as the shadcn --primary channels", () => {
    const tokens = buildThemeTokens(ubits, "light");
    expect(tokens["--color-brand"]).toBe("#0C5BEF");
    expect(tokens["--primary"]).toBe(tokens["--color-brand-hsl"]);
    expect(tokens["--ring"]).toBe(tokens["--primary"]);
  });

  test("keeps the UBITS dark background on the original navy", () => {
    // globals.css: --background: 222 45% 9% in .dark
    expect(buildThemeTokens(ubits, "dark")["--background"]).toBe("222 45% 9%");
  });

  test("uses the dark primary and a lighter hover in dark mode", () => {
    const dark = buildThemeTokens(ubits, "dark");
    expect(dark["--color-brand"]).toBe("#3865F5");
    expect(dark["--color-brand-hover"]).not.toBe(dark["--color-brand"]);
  });

  test("gray presets produce near-neutral backgrounds", () => {
    const rose = findPreset("rose");
    const light = buildThemeTokens(rose, "light");
    const [, sat] = light["--background"].split(" ");
    expect(Number.parseFloat(sat)).toBeLessThanOrEqual(20);
  });

  test("every preset yields the same token names in both modes", () => {
    const reference = Object.keys(buildThemeTokens(ubits, "light")).sort();
    for (const preset of THEME_PRESETS) {
      expect(Object.keys(buildThemeTokens(preset, "light")).sort()).toEqual(reference);
      expect(Object.keys(buildThemeTokens(preset, "dark")).sort()).toEqual(reference);
    }
  });

  test("picks a readable foreground for a near-white dark primary", () => {
    const graphite = findPreset("graphite");
    expect(buildThemeTokens(graphite, "dark")["--primary-foreground"]).not.toBe("0 0% 100%");
  });
});

describe("buildRadiusTokens", () => {
  test("md keeps the documented scale", () => {
    const tokens = buildRadiusTokens("md");
    expect(tokens["--radius-md"]).toBe("10px");
    expect(tokens["--radius-2xl"]).toBe("16px");
  });

  test("none flattens everything and lg scales up", () => {
    expect(buildRadiusTokens("none")["--radius-3xl"]).toBe("0px");
    expect(buildRadiusTokens("lg")["--radius-md"]).toBe(`${Math.round(10 * RADIUS_FACTORS.lg)}px`);
  });
});

describe("themeToCss", () => {
  test("emits a :root block and a .dark block", () => {
    const css = themeToCss(ubits);
    expect(css).toMatch(/^\/\* Tema "UBITS Azul"/);
    expect(css).toContain(":root {");
    expect(css).toContain(".dark {");
    expect(css).toContain("--color-brand: #0C5BEF;");
    expect(css).toContain("--color-brand: #3865F5;");
  });
});

describe("findPreset", () => {
  test("falls back to the default preset", () => {
    expect(findPreset("no-existe").id).toBe("ubits");
    expect(findPreset(undefined).id).toBe("ubits");
  });
});
