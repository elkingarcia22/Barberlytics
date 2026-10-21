import { describe, expect, test } from "vitest";
import { hexToHsl, hexToRgb } from "./color";
import { paletteFromPixels } from "./logoPalette";

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
