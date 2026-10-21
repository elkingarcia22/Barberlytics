import { describe, expect, test } from "vitest";
import { buildThemeTokens } from "./buildTokens";
import { contrastRatio } from "./color";
import { buildCustomPreset, CUSTOM_THEME_ID, fitToMode, isCustomColors } from "./customTheme";

describe("buildCustomPreset", () => {
  test("arma un preset con el id custom y los dos colores en el degradado de marca", () => {
    const preset = buildCustomPreset({ primary: "#C8102E", secondary: "#0B3D91" });
    expect(preset.id).toBe(CUSTOM_THEME_ID);
    expect(preset.brandGradient?.light[1]).toBe(preset.primary.light);
    expect(preset.ai?.start).toBe(preset.primary.dark);
  });

  test("el primario se ajusta hasta leerse como texto en cada modo", () => {
    // Un amarillo claro no contrasta con blanco y un azul marino no contrasta con carbón.
    for (const primary of ["#FFE066", "#0B1F4D", "#808080"]) {
      const preset = buildCustomPreset({ primary, secondary: "#3F72D8" });
      expect(contrastRatio(preset.primary.light, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(preset.primary.dark, "#15171B")).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("un color que ya contrasta se queda como está", () => {
    expect(fitToMode("#1F7A5A", "light")).toBe("#1F7A5A");
  });

  test("un primario gris no tiñe los neutros", () => {
    expect(buildCustomPreset({ primary: "#6B6B6B", secondary: "#3F72D8" }).neutral).toBe("gray");
  });

  test("da tokens completos en claro y en oscuro", () => {
    const preset = buildCustomPreset({ primary: "#C8102E", secondary: "#0B3D91" });
    expect(buildThemeTokens(preset, "light")["--color-brand"]).toBe(preset.primary.light);
    expect(buildThemeTokens(preset, "dark")["--color-brand"]).toBe(preset.primary.dark);
  });
});

describe("isCustomColors", () => {
  test("acepta dos HEX de seis dígitos y rechaza lo demás", () => {
    expect(isCustomColors({ primary: "#C8102E", secondary: "#0b3d91" })).toBe(true);
    expect(isCustomColors({ primary: "red", secondary: "#0B3D91" })).toBe(false);
    expect(isCustomColors({ primary: "#C8102E" })).toBe(false);
    expect(isCustomColors(null)).toBe(false);
  });
});
