import { describe, expect, test } from "vitest";
import { contrastRatio, hexToChannels, hexToHsl, hexToRgb, hslToHex, mix, readableForeground, rgbToHex, shiftLightness } from "./color";

describe("hexToRgb / rgbToHex", () => {
  test("parses a 6-digit hex", () => {
    expect(hexToRgb("#0C5BEF")).toEqual([12, 91, 239]);
  });

  test("expands a 3-digit hex", () => {
    expect(hexToRgb("#fff")).toEqual([255, 255, 255]);
  });

  test("throws on an invalid value", () => {
    expect(() => hexToRgb("#zzz")).toThrow(/inválido/);
  });

  test("round-trips through rgbToHex", () => {
    expect(rgbToHex(...hexToRgb("#0c5bef"))).toBe("#0c5bef");
  });
});

describe("hexToHsl / hslToHex", () => {
  test("converts the Thema brand blue to its documented channels", () => {
    // tokens.css documents --color-brand-hsl as 219 90% 49%
    expect(hexToChannels("#0C5BEF")).toBe("219 90.4% 49.2%");
  });

  test("treats grays as zero saturation", () => {
    expect(hexToHsl("#808080")).toMatchObject({ h: 0, s: 0 });
  });

  test("round-trips a saturated color within one unit per channel", () => {
    const [r, g, b] = hexToRgb(hslToHex(hexToHsl("#E11D48")));
    expect(Math.abs(r - 0xe1)).toBeLessThanOrEqual(1);
    expect(Math.abs(g - 0x1d)).toBeLessThanOrEqual(1);
    expect(Math.abs(b - 0x48)).toBeLessThanOrEqual(1);
  });
});

describe("shiftLightness", () => {
  test("darkens with a negative delta", () => {
    expect(hexToHsl(shiftLightness("#0C5BEF", -8)).l).toBeCloseTo(hexToHsl("#0C5BEF").l - 8, 0);
  });

  test("clamps at the ends of the range", () => {
    expect(shiftLightness("#ffffff", 20)).toBe("#ffffff");
    expect(shiftLightness("#000000", -20)).toBe("#000000");
  });
});

describe("mix", () => {
  test("returns the endpoints at t=0 and t=1", () => {
    expect(mix("#000000", "#ffffff", 0)).toBe("#000000");
    expect(mix("#000000", "#ffffff", 1)).toBe("#ffffff");
  });

  test("blends halfway", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
  });
});

describe("contrast", () => {
  test("black on white is 21:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  test("picks white text on the brand blue and dark text on a pale yellow", () => {
    expect(readableForeground("#0C5BEF")).toBe("#ffffff");
    expect(readableForeground("#FBBF24")).toBe("#111827");
  });
});
