import { describe, expect, test } from "vitest";
import { buildThemeTokens } from "./buildTokens";
import { contrastRatio } from "./color";
import { automaticAiColors, buildCustomPreset, CUSTOM_THEME_ID, fitToMode, isCustomColors } from "./customTheme";

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

describe("colores de IA", () => {
  test("sin `ai`, el degradado de IA va del primario al secundario", () => {
    const colors = { primary: "#C8102E", secondary: "#0B3D91" };
    const preset = buildCustomPreset(colors);
    expect(preset.ai?.start).toBe(automaticAiColors(colors).start);
    expect(preset.ai?.end).toBe(automaticAiColors(colors).end);
  });

  test("con `ai`, manda ese degradado y la marca no cambia", () => {
    const base = buildCustomPreset({ primary: "#C8102E", secondary: "#0B3D91" });
    const preset = buildCustomPreset({ primary: "#C8102E", secondary: "#0B3D91", ai: { start: "#7C3AED", end: "#06B6D4" } });
    expect(preset.ai?.start).toBe("#7C3AED");
    expect(preset.ai?.end).toBe("#06B6D4");
    expect(preset.primary).toEqual(base.primary);
  });

  test("un `ai` mal formado no se acepta al leer lo guardado", () => {
    expect(isCustomColors({ primary: "#C8102E", secondary: "#0B3D91", ai: { start: "violeta" } })).toBe(false);
    expect(isCustomColors({ primary: "#C8102E", secondary: "#0B3D91", ai: { start: "#7C3AED", end: "#06B6D4" } })).toBe(true);
  });
});

describe("paradas fijas de IA", () => {
  test("si el degradado trae paradas, se usan tal cual en vez de interpolar", () => {
    const stops = ["#F0CE86", "#DE8C3A", "#2E9CB0", "#2E9CB0", "#3F72D8"] as const;
    const preset = buildCustomPreset({ primary: "#D9B36A", secondary: "#6B4312", ai: { start: "#F0CE86", end: "#3F72D8", stops } });
    expect(preset.ai?.stops).toEqual(stops);
  });
});
