/**
 * La escala de favorabilidad: cinco bandas que traducen un porcentaje a "qué
 * tan bien va esto". Los colores salen de los tokens `--fav-*` (definidos para
 * claro y oscuro en globals.css) y no de hex, porque el mismo mapa lo comparten
 * el heatmap, su leyenda y cualquier chip de resultado que se apoye en ella.
 */

export interface HeatBand {
  readonly id: string
  /** Valor mínimo, inclusive, que cae en esta banda. */
  readonly min: number
  readonly label: string
  readonly background: string
  readonly border: string
  readonly foreground: string
}

function band(id: string, min: number, label: string, token: string): HeatBand {
  return {
    id,
    min,
    label,
    background: `hsl(var(--fav-${token}-bg))`,
    border: `hsl(var(--fav-${token}-border))`,
    foreground: `hsl(var(--fav-${token}-fg))`,
  }
}

/** De peor a mejor. `bandForValue` asume este orden ascendente por `min`. */
export const FAVORABILITY_BANDS: readonly HeatBand[] = [
  band("critical", 0, "Crítico", "negative"),
  band("low", 25, "Bajo", "softer-negative"),
  band("medium", 50, "Medio", "yellow"),
  band("good", 80, "Bueno", "positive"),
  band("excellent", 95, "Excelente", "deep-positive"),
]

/** Fuera de escala: la celda existe en la matriz pero no hay dato que medir. */
export const NO_DATA_BAND: HeatBand = band("no-data", Number.NEGATIVE_INFINITY, "No aplica", "nsnr")

export function bandForValue(value: number, bands: readonly HeatBand[] = FAVORABILITY_BANDS): HeatBand {
  let match: HeatBand = NO_DATA_BAND
  for (const candidate of bands) {
    if (value >= candidate.min) match = candidate
  }
  return match
}

/** "25 – 49 %" para la leyenda, leyendo el techo de la banda siguiente. */
export function bandRangeLabel(
  band: HeatBand,
  bands: readonly HeatBand[] = FAVORABILITY_BANDS,
  unit = "%",
): string {
  const next = bands.find((candidate) => candidate.min > band.min)
  if (!next) return `≥ ${band.min} ${unit}`
  return `${band.min} – ${next.min - 1} ${unit}`
}
