import * as React from "react"
import { getChartTheme } from "./theme"
import type { Tone } from "@/lib/tone"

/** Los tonos que un gráfico puede pintar; `ai` queda fuera, como en `MetricCard`. */
export type ChartTone = Exclude<Tone, "ai">

export interface ChartPalette extends Readonly<Record<ChartTone, string>> {
  /** El color de un tono, o el del ciclo cuando la serie no tiene tono propio. */
  forTone: (tone: ChartTone | undefined, index: number) => string
}

/**
 * El orden en que se reparten los colores a las series sin tono: marca,
 * positivo, aviso, neutro y negativo. El rojo va al final a propósito, para
 * que un reparto de tres partes no acabe con una en rojo por pura posición.
 */
const CYCLE: readonly ChartTone[] = ["brand", "positive", "warning", "neutral", "negative"]

/**
 * Los colores de serie del tema, resueltos una vez al montar y nombrados por
 * tono. ECharts pinta en canvas y no entiende `var(--token)`, así que un
 * gráfico que quiera «el verde del sistema» lo pide de aquí.
 */
export function useChartPalette(): ChartPalette {
  return React.useMemo(() => {
    const [brand, positive, warning, negative, neutral] = getChartTheme().color
    const palette = { brand, positive, warning, negative, neutral }
    return {
      ...palette,
      forTone: (tone, index) => palette[tone ?? CYCLE[index % CYCLE.length]],
    }
  }, [])
}
