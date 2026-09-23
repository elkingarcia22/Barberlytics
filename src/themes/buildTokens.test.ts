import { describe, expect, test } from "vitest";
import { buildFontTokens, buildRadiusTokens, buildSpacingTokens, buildThemeTokens, DENSITY_FACTORS, RADIUS_FACTORS, themeToCss } from "./buildTokens";
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

  test("the nav chrome stays dark in both modes, so the rail keeps floating over light UI", () => {
    for (const preset of THEME_PRESETS) {
      for (const mode of ["light", "dark"] as const) {
        const [, , lightness] = buildThemeTokens(preset, mode)["--nav"].split(" ");
        expect(Number.parseFloat(lightness), `${preset.id} en ${mode}`).toBeLessThanOrEqual(12);
      }
    }
  });

  test("the nav chrome takes the hue of each theme instead of a fixed navy", () => {
    const navHue = (id: string) => Number.parseFloat(buildThemeTokens(findPreset(id), "dark")["--nav"].split(" ")[0]!);
    expect(navHue("thema")).toBe(222);
    expect(navHue("premium")).toBe(40);
    expect(navHue("premium-jade")).toBe(160);
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

  test("every preset emits a brand gradient and a brand glow shadow", () => {
    for (const preset of THEME_PRESETS) {
      const tokens = buildThemeTokens(preset, "dark");
      expect(tokens["--color-brand-gradient"]).toMatch(/^linear-gradient\(/);
      expect(tokens["--color-brand-gradient-via"]).toBe(tokens["--color-brand"]);
      expect(tokens["--shadow-glow-brand"]).toContain(tokens["--color-brand-rgb"]);
    }
  });
});

describe("Premium preset", () => {
  const premium = findPreset("premium");

  test("dark mode sinks the app background below the standard 9% lightness", () => {
    const [, , lightness] = buildThemeTokens(premium, "dark")["--background"].split(" ");
    expect(Number.parseFloat(lightness)).toBeLessThanOrEqual(6);
    const [, , standard] = buildThemeTokens(findPreset("amber"), "dark")["--background"].split(" ");
    expect(Number.parseFloat(standard)).toBe(9);
  });

  test("dark neutrals stay warm but nearly desaturated", () => {
    const [hue, sat] = buildThemeTokens(premium, "dark")["--card"].split(" ");
    expect(Number.parseFloat(hue)).toBe(40);
    expect(Number.parseFloat(sat)).toBeLessThanOrEqual(10);
  });

  test("light mode is a warm ivory, not a saturated cream", () => {
    const [hue, sat, lightness] = buildThemeTokens(premium, "light")["--background"].split(" ");
    expect(Number.parseFloat(hue)).toBe(40);
    expect(Number.parseFloat(sat)).toBeLessThan(100);
    expect(Number.parseFloat(lightness)).toBeGreaterThanOrEqual(98);
  });

  test("champagne gold gets dark text on buttons, antique gold gets white", () => {
    expect(buildThemeTokens(premium, "dark")["--primary-foreground"]).not.toBe("0 0% 100%");
    expect(buildThemeTokens(premium, "light")["--primary-foreground"]).toBe("0 0% 100%");
  });

  test("uses its explicit gradient, AI stops and AI surfaces", () => {
    const dark = buildThemeTokens(premium, "dark");
    expect(dark["--color-brand-gradient-from"]).toBe(premium.brandGradient?.dark[0]);
    expect(dark["--color-ai-stop-1"]).toBe(dark["--color-ai-gradient-start"]);
    expect(dark["--color-ai-stop-5"]).toBe(dark["--color-ai-gradient-end"]);
    expect(dark["--color-ai-bg"]).toBe(premium.ai?.bg?.dark);
    expect(buildThemeTokens(premium, "light")["--color-ai-border"]).toBe(premium.ai?.border?.light);
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

describe("buildSpacingTokens", () => {
  test("normal density is a 4px unit with the documented aliases", () => {
    const tokens = buildSpacingTokens("normal");
    expect(tokens["--space-unit"]).toBe("4px");
    expect(tokens["--space-4"]).toBe("16px");
    expect(tokens["--space-card"]).toBe("24px");
    expect(tokens["--space-page"]).toBe("24px");
    expect(tokens["--space-section"]).toBe("32px");
  });

  test("the aliases keep climbing: nothing between sections is tighter than inside a card", () => {
    const tokens = buildSpacingTokens("normal");
    const px = (name: string) => Number.parseFloat(tokens[name]!);
    expect(px("--space-inline")).toBeLessThan(px("--space-stack"));
    expect(px("--space-stack")).toBeLessThan(px("--space-card"));
    expect(px("--space-card")).toBeLessThan(px("--space-section"));
  });

  test("compact and comfortable scale every step by their factor", () => {
    expect(buildSpacingTokens("compact")["--space-4"]).toBe(`${16 * DENSITY_FACTORS.compact}px`);
    expect(buildSpacingTokens("comfortable")["--space-8"]).toBe(`${32 * DENSITY_FACTORS.comfortable}px`);
    expect(Object.keys(buildSpacingTokens("compact"))).toEqual(Object.keys(buildSpacingTokens("normal")));
  });
});

describe("page atmosphere", () => {
  test("every preset emits a radial glow built from its primary and a shadow tint", () => {
    for (const preset of THEME_PRESETS) {
      for (const mode of ["light", "dark"] as const) {
        const tokens = buildThemeTokens(preset, mode);
        expect(tokens["--page-atmosphere"]).toContain(`rgba(${tokens["--color-brand-rgb"]}`);
        expect(tokens["--shadow-tint-rgb"]).toMatch(/^\d+, \d+, \d+$/);
      }
    }
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

  test("includes the spacing scale for the requested density", () => {
    expect(themeToCss(thema, "md", undefined, "compact")).toContain("--space-unit: 3.5px;");
    expect(themeToCss(thema)).toContain("--space-card: 24px;");
  });
});

describe("findPreset", () => {
  test("falls back to the default preset", () => {
    expect(findPreset("no-existe").id).toBe("thema");
    expect(findPreset(undefined).id).toBe("thema");
  });
});
