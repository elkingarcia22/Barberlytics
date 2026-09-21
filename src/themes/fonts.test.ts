import { describe, expect, test } from "vitest";
import { FONT_OPTIONS, DEFAULT_BODY_FONT, findFont, isFontId, resolveHeadingFont } from "./fonts";
import { THEME_PRESETS } from "./presets";

describe("catálogo de fuentes", () => {
  test("los ids son únicos", () => {
    const ids = FONT_OPTIONS.map((font) => font.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("toda fuente descargable declara su hoja de estilos, y las locales no", () => {
    for (const font of FONT_OPTIONS) {
      if (font.source === "google" || font.source === "fontshare") {
        expect(font.stylesheet, font.id).toMatch(/^https:\/\//);
      } else {
        expect(font.stylesheet, font.id).toBeUndefined();
      }
    }
  });

  test("cada hoja de estilos sale de un origen permitido por la CSP", () => {
    const allowed = ["https://fonts.googleapis.com/", "https://api.fontshare.com/"];
    for (const font of FONT_OPTIONS) {
      if (!font.stylesheet) continue;
      expect(allowed.some((origin) => font.stylesheet!.startsWith(origin)), font.id).toBe(true);
    }
  });

  test("la pila CSS nombra la familia y termina en un fallback genérico", () => {
    for (const font of FONT_OPTIONS) {
      expect(font.family, font.id).toMatch(/(sans-serif|serif)$/);
      if (font.source !== "system") expect(font.family, font.id).toContain("'");
    }
  });

  test("Inter es la fuente por defecto y el primer elemento del catálogo", () => {
    expect(DEFAULT_BODY_FONT).toBe("inter");
    expect(FONT_OPTIONS[0].id).toBe("inter");
  });

  test("todo preset apunta a fuentes que existen", () => {
    for (const preset of THEME_PRESETS) {
      if (preset.fonts?.body) expect(isFontId(preset.fonts.body), preset.id).toBe(true);
      const heading = preset.fonts?.heading;
      if (heading && heading !== "same") expect(isFontId(heading), preset.id).toBe(true);
    }
  });

  test("un id desconocido cae en Inter", () => {
    expect(findFont("comic-sans").id).toBe("inter");
    expect(isFontId("comic-sans")).toBe(false);
  });

  test("resolveHeadingFont resuelve 'same' al cuerpo", () => {
    expect(resolveHeadingFont("same", "dm-sans").id).toBe("dm-sans");
    expect(resolveHeadingFont("fraunces", "dm-sans").id).toBe("fraunces");
  });
});
