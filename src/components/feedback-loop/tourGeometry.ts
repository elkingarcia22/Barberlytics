/**
 * La geometría del recorrido guiado, sin DOM: dónde cae la tarjeta respecto al
 * elemento resaltado y qué agujero se recorta en el velo. Separada del
 * componente para poder probarla con números y no con un navegador.
 */

export interface TourRect {
  top: number
  left: number
  width: number
  height: number
}

export interface TourSize {
  width: number
  height: number
}

/** Dónde quedó la tarjeta: debajo o encima del objetivo, centrada o pegada abajo si no cabe. */
export type TourPlacement = "bottom" | "top" | "center" | "dock"

export interface TourCardPosition {
  top: number
  left: number
  placement: TourPlacement
}

/** Separación entre el objetivo y la tarjeta. */
export const TOUR_GAP = 16
/** Distancia mínima a los bordes de la ventana. */
export const TOUR_MARGIN = 16
/** Holgura del foco alrededor del objetivo, para que el anillo no lo pise. */
export const TOUR_SPOTLIGHT_PADDING = 8

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max))

/** El objetivo con su holgura, recortado a la ventana. */
export function padRect(rect: TourRect, padding = TOUR_SPOTLIGHT_PADDING): TourRect {
  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  }
}

/**
 * Coloca la tarjeta. Sin objetivo, al centro. Con objetivo, prefiere debajo,
 * luego encima; si ninguno cabe (un objetivo que ocupa media pantalla) se
 * acopla al borde inferior, que es donde menos estorba a lo que se lee.
 */
export function computeCardPosition(
  target: TourRect | null,
  card: TourSize,
  viewport: TourSize,
  gap = TOUR_GAP,
  margin = TOUR_MARGIN
): TourCardPosition {
  const centeredLeft = clamp((viewport.width - card.width) / 2, margin, viewport.width - card.width - margin)
  if (!target) {
    return {
      top: clamp((viewport.height - card.height) / 2, margin, viewport.height - card.height - margin),
      left: centeredLeft,
      placement: "center",
    }
  }

  const left = clamp(target.left + target.width / 2 - card.width / 2, margin, viewport.width - card.width - margin)
  const below = target.top + target.height + gap
  if (below + card.height <= viewport.height - margin) return { top: below, left, placement: "bottom" }

  const above = target.top - gap - card.height
  if (above >= margin) return { top: above, left, placement: "top" }

  return { top: Math.max(margin, viewport.height - card.height - margin), left, placement: "dock" }
}

/**
 * El velo con un agujero rectangular: un polígono `evenodd` que recorre la
 * ventana y luego el objetivo. `clip-path` también recorta los clics, así que
 * lo resaltado sigue siendo pulsable y el resto no.
 */
export function spotlightClipPath(hole: TourRect | null): string | undefined {
  if (!hole) return undefined
  const x1 = Math.round(hole.left)
  const y1 = Math.round(hole.top)
  const x2 = Math.round(hole.left + hole.width)
  const y2 = Math.round(hole.top + hole.height)
  return `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${x1}px ${y1}px, ${x2}px ${y1}px, ${x2}px ${y2}px, ${x1}px ${y2}px, ${x1}px ${y1}px)`
}
