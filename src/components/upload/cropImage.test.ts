import { describe, expect, test } from "vitest"
import { fitOutputSize, fitZoom, normalizeRotation, rotatedBounds } from "./cropImage"

describe("cropImage: cálculos", () => {
  test("normaliza cualquier giro a 0–359", () => {
    expect(normalizeRotation(-90)).toBe(270)
    expect(normalizeRotation(450)).toBe(90)
    expect(normalizeRotation(0)).toBe(0)
  })

  test("un giro de 90° intercambia ancho y alto del lienzo", () => {
    const bounds = rotatedBounds(800, 500, 90)
    expect(bounds.width).toBeCloseTo(500)
    expect(bounds.height).toBeCloseTo(800)
  })

  test("un giro de 45° agranda el lienzo para que no se corte ninguna esquina", () => {
    const bounds = rotatedBounds(100, 100, 45)
    expect(bounds.width).toBeCloseTo(141.42, 1)
  })

  test("el tamaño final no pasa del máximo ni agranda un recorte pequeño", () => {
    expect(fitOutputSize({ width: 2000, height: 2000 }, 512)).toEqual({ width: 512, height: 512 })
    expect(fitOutputSize({ width: 300, height: 300 }, 512)).toEqual({ width: 300, height: 300 })
    expect(fitOutputSize({ width: 1000, height: 500 }, 500)).toEqual({ width: 500, height: 250 })
  })

  test("encajar entera un logo horizontal en un cuadrado aleja al lado corto sobre el largo", () => {
    expect(fitZoom(800, 500, 1)).toBeCloseTo(0.625)
    expect(fitZoom(500, 500, 1)).toBe(1)
  })

  test("con un cuarto de vuelta el encaje usa la imagen girada", () => {
    expect(fitZoom(800, 500, 16 / 9, 1)).toBeCloseTo(fitZoom(500, 800, 16 / 9))
  })
})
