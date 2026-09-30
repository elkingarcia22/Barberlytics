import { describe, expect, test } from "vitest"
import { computeCardPosition, padRect, spotlightClipPath } from "./tourGeometry"

const VIEWPORT = { width: 1024, height: 768 }
const CARD = { width: 380, height: 220 }

describe("computeCardPosition", () => {
  test("sin objetivo, la tarjeta sale centrada", () => {
    expect(computeCardPosition(null, CARD, VIEWPORT)).toEqual({ top: 274, left: 322, placement: "center" })
  })

  test("prefiere debajo del objetivo, centrada respecto a él", () => {
    const position = computeCardPosition({ top: 80, left: 400, width: 200, height: 40 }, CARD, VIEWPORT)
    expect(position).toEqual({ top: 136, left: 310, placement: "bottom" })
  })

  test("si abajo no cabe, va encima", () => {
    const position = computeCardPosition({ top: 700, left: 900, width: 100, height: 48 }, CARD, VIEWPORT)
    expect(position.placement).toBe("top")
    expect(position.top).toBe(700 - 16 - 220)
    // Recortada al borde derecho con su margen.
    expect(position.left).toBe(1024 - 380 - 16)
  })

  test("un objetivo que ocupa casi toda la altura acopla la tarjeta abajo", () => {
    const position = computeCardPosition({ top: 0, left: 0, width: 64, height: 768 }, CARD, VIEWPORT)
    expect(position).toEqual({ top: 768 - 220 - 16, left: 16, placement: "dock" })
  })
})

describe("spotlight", () => {
  test("padRect agranda por los cuatro lados", () => {
    expect(padRect({ top: 10, left: 10, width: 20, height: 20 }, 4)).toEqual({ top: 6, left: 6, width: 28, height: 28 })
  })

  test("el recorte es un polígono evenodd con el agujero del objetivo", () => {
    const clip = spotlightClipPath({ top: 10, left: 20, width: 30, height: 40 })
    expect(clip).toContain("polygon(evenodd")
    expect(clip).toContain("20px 10px, 50px 10px, 50px 50px, 20px 50px")
    expect(spotlightClipPath(null)).toBeUndefined()
  })
})
