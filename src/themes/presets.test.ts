import { describe, expect, test } from "vitest";
import { buildThemeTokens } from "./buildTokens";
import { contrastRatio, hslToHex } from "./color";
import { findPreset, THEME_PRESETS } from "./presets";

/** "h s% l%" → HEX, para medir contraste sobre los canales que emite el tema. */
function channelsToHex(channels: string): string {
  const [h, s, l] = channels.split(" ").map((part) => Number.parseFloat(part));
  return hslToHex({ h, s, l });
}

describe("THEME_PRESETS", () => {
  test("ids are unique and every preset has both primaries", () => {
    const ids = THEME_PRESETS.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const preset of THEME_PRESETS) {
      expect(preset.primary.light).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(preset.primary.dark).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  test("includes a red theme and three premium-tier themes", () => {
    expect(findPreset("crimson").name).toBe("Rojo");
    expect(THEME_PRESETS.filter((preset) => preset.tier === "premium").map((p) => p.id)).toEqual([
      "premium",
      "premium-jade",
      "premium-platino",
    ]);
  });

  test.each(THEME_PRESETS.map((preset) => [preset.id, preset] as const))(
    "%s: primary button text reaches AA (4.5:1) in both modes",
    (_id, preset) => {
      for (const mode of ["light", "dark"] as const) {
        const tokens = buildThemeTokens(preset, mode);
        const ratio = contrastRatio(tokens["--color-brand"], channelsToHex(tokens["--primary-foreground"]));
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    }
  );

  test.each(THEME_PRESETS.map((preset) => [preset.id, preset] as const))(
    "%s: primary and secondary text read on the app background and on cards",
    (_id, preset) => {
      for (const mode of ["light", "dark"] as const) {
        const tokens = buildThemeTokens(preset, mode);
        for (const surface of [tokens["--color-bg-app"], tokens["--color-surface"]]) {
          expect(contrastRatio(tokens["--color-text-primary"], surface)).toBeGreaterThanOrEqual(7);
          expect(contrastRatio(tokens["--color-text-secondary"], surface)).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  );

  test.each(THEME_PRESETS.map((preset) => [preset.id, preset] as const))(
    "%s: the primary itself reads as text on the app background (links, active nav)",
    (_id, preset) => {
      for (const mode of ["light", "dark"] as const) {
        const tokens = buildThemeTokens(preset, mode);
        expect(contrastRatio(tokens["--color-brand"], tokens["--color-bg-app"])).toBeGreaterThanOrEqual(3);
      }
    }
  );
});
