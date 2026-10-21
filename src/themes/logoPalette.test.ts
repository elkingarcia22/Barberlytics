import { describe, expect, test } from "vitest";
import { hexToHsl, hexToRgb } from "./color";
import { paletteFromPixels, proposeAiColors, proposeBrandColors } from "./logoPalette";

/** Píxeles RGBA: `count` veces cada color, en orden. */
function pixels(...runs: [color: string, count: number, alpha?: number][]): number[] {
  return runs.flatMap(([color, count, alpha = 255]) => Array.from({ length: count }, () => [...hexToRgb(color), alpha]).flat());
}

describe("paletteFromPixels", () => {
  test("devuelve los colores de la marca de mayor a menor e ignora fondo, negro y gris", () => {
    const palette = paletteFromPixels(pixels(["#FFFFFF", 500], ["#111111", 200], ["#888888", 100], ["#C8102E", 300], ["#0B3D91", 150]));
    expect(palette).toHaveLength(2);
    expect(hexToHsl(palette[0]).h).toBeCloseTo(hexToHsl("#C8102E").h, 0);
    expect(hexToHsl(palette[1]).h).toBeCloseTo(hexToHsl("#0B3D91").h, 0);
  });

  test("lo transparente no cuenta", () => {
    expect(paletteFromPixels(pixels(["#C8102E", 400, 0]))).toEqual([]);
  });

  test("un logo sin color no propone nada", () => {
    expect(paletteFromPixels(pixels(["#FFFFFF", 300], ["#000000", 300]))).toEqual([]);
  });

  test("dos tonos del mismo color se proponen una sola vez", () => {
    expect(paletteFromPixels(pixels(["#C8102E", 300], ["#D42A3A", 300]))).toHaveLength(1);
  });

  test("un detalle mínimo no llega a la propuesta", () => {
    expect(paletteFromPixels(pixels(["#C8102E", 990], ["#22AA44", 10]))).toHaveLength(1);
  });
});

describe("proposeBrandColors", () => {
  test("con dos colores propone esos dos", () => {
    expect(proposeBrandColors(["#C8102E", "#0B3D91"])).toEqual({ primary: "#C8102E", secondary: "#0B3D91", singleColor: false });
  });

  test("con un solo color, el secundario es un tono del mismo matiz, no otro color", () => {
    const { primary, secondary, singleColor } = proposeBrandColors(["#C8102E"]);
    expect(singleColor).toBe(true);
    expect(primary).toBe("#C8102E");
    expect(Math.abs(hexToHsl(secondary).h - hexToHsl(primary).h)).toBeLessThan(2);
    expect(hexToHsl(secondary).l).toBeLessThan(hexToHsl(primary).l);
  });

  test("si el único color ya es oscuro, el tono va hacia lo claro", () => {
    const { primary, secondary } = proposeBrandColors(["#0B1F4D"]);
    expect(hexToHsl(secondary).l).toBeGreaterThan(hexToHsl(primary).l);
  });
});

describe("proposeAiColors", () => {
  test("dos tonos del mismo color no dan un degradado plano", () => {
    const ai = proposeAiColors(["#D9B36A", "#6B4312"]);
    expect(Math.abs(hexToHsl(ai.end).h - hexToHsl(ai.start).h)).toBeGreaterThanOrEqual(28);
  });

  test("los colores de IA salen del logo y se avivan", () => {
    const ai = proposeAiColors(["#8A6420", "#1F7A5A"]);
    expect(Math.abs(hexToHsl(ai.start).h - hexToHsl("#8A6420").h)).toBeLessThan(2);
    expect(hexToHsl(ai.start).s).toBeGreaterThanOrEqual(70);
  });

  test("con tres colores usa el segundo y el tercero", () => {
    const ai = proposeAiColors(["#C8102E", "#0B3D91", "#1F7A5A"]);
    expect(Math.abs(hexToHsl(ai.start).h - hexToHsl("#0B3D91").h)).toBeLessThan(2);
    expect(Math.abs(hexToHsl(ai.end).h - hexToHsl("#1F7A5A").h)).toBeLessThan(2);
  });

  test("con un solo color, el fin se aleja en el círculo para que se vea el degradado", () => {
    const ai = proposeAiColors(["#C8102E"]);
    expect(ai.start).not.toBe(ai.end);
  });
});
