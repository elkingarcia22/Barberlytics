import { describe, expect, test } from "vitest";
import { buildFontTokens, buildRadiusTokens, buildThemeTokens, RADIUS_FACTORS, themeToCss } from "./buildTokens";
import { hexToHsl } from "./color";
import { findPreset, THEME_PRESETS } from "./presets";

const thema = findPreset("thema");

describe("buildThemeTokens", () => {
  test("uses the preset primary as brand and as the shadcn --primary channels", () => {
    const tokens = buildThemeTokens(thema, "light");
    expect(tokens["--color-brand"]).toBe("#0C5BEF");
    expect(tokens["--primary"]).toBe(tokens["--color-brand-hsl"]);
    expect(tokens["--ring"]).toBe(tokens["--primary"]);
  });

  test("keeps the Thema dark background on the original navy", () => {
    // globals.css: --background: 222 45% 9% in .dark
    expect(buildThemeTokens(thema, "dark")["--background"]).toBe("222 45% 9%");
  });

  test("uses the dark primary and a lighter hover in dark mode", () => {
    const dark = buildThemeTokens(thema, "dark");
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
    const reference = Object.keys(buildThemeTokens(thema, "light")).sort();
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

describe("AI gradient", () => {
  test("the default preset keeps the original blue → rose gradient", () => {
    const tokens = buildThemeTokens(thema, "light");
    expect(tokens["--color-ai-gradient-start"]).toBe("#2d5cf7");
    expect(tokens["--color-ai-gradient-end"]).toBe("#e11d48");
    expect(tokens["--color-ai-stop-1-rgb"]).toBe("45, 92, 247");
  });

  test("derived gradients start on the primary hue and end ~120° away", () => {
    const emerald = findPreset("emerald");
    const tokens = buildThemeTokens(emerald, "light");
    const start = hexToHsl(tokens["--color-ai-gradient-start"]).h;
    const end = hexToHsl(tokens["--color-ai-gradient-end"]).h;
    expect(Math.abs(start - hexToHsl(emerald.primary.light).h)).toBeLessThan(2);
    expect(((end - start + 360) % 360)).toBeCloseTo(120, 0);
  });

  test("emits the five mesh stops with rgb triplets", () => {
    const tokens = buildThemeTokens(findPreset("rose"), "dark");
    for (let i = 1; i <= 5; i++) {
      expect(tokens[`--color-ai-stop-${i}`]).toMatch(/^#[0-9a-f]{6}$/);
      expect(tokens[`--color-ai-stop-${i}-rgb`]).toMatch(/^\d+, \d+, \d+$/);
    }
  });
});

describe("buildFontTokens", () => {
  test("heading 'same' reuses the body family", () => {
    const tokens = buildFontTokens({ body: "plus-jakarta", heading: "same" });
    expect(tokens["--font-body"]).toContain("Plus Jakarta Sans");
    expect(tokens["--font-heading"]).toBe(tokens["--font-body"]);
  });

  test("a serif heading pairs with a sans body", () => {
    const tokens = buildFontTokens({ body: "geist", heading: "fraunces" });
    expect(tokens["--font-body"]).toContain("Geist");
    expect(tokens["--font-heading"]).toContain("Fraunces");
  });

  test("unknown ids fall back to Inter", () => {
    expect(buildFontTokens({ body: "nope" as never, heading: "same" })["--font-body"]).toContain("Inter");
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
    const css = themeToCss(thema);
    expect(css).toMatch(/^\/\* Tema "Azul"/);
    expect(css).toContain(":root {");
    expect(css).toContain(".dark {");
    expect(css).toContain("--color-brand: #0C5BEF;");
    expect(css).toContain("--color-brand: #3865F5;");
  });

  test("includes font tokens when asked", () => {
    const css = themeToCss(thema, "md", { body: "dm-sans", heading: "fraunces" });
    expect(css).toContain("--font-body: 'DM Sans'");
    expect(css).toContain("--font-heading: 'Fraunces'");
  });
});

describe("findPreset", () => {
  test("falls back to the default preset", () => {
    expect(findPreset("no-existe").id).toBe("thema");
    expect(findPreset(undefined).id).toBe("thema");
  });
});
