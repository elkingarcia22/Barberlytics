import * as React from "react"
import * as echarts from "echarts/core"
import { GaugeChart } from "echarts/charts"
import { EChart } from "./EChart"
import { getChartTheme } from "./theme"
import type { EChartsOption } from "./types"

/**
 * Los dos gráficos diminutos que acompañan a una `MetricCard`.
 *
 * Son el `DonutChart` y un medidor reducidos a su serie: sin cabecera, sin
 * leyenda y sin etiquetas, porque el número ya está escrito al lado en la
 * tarjeta. Viven en el sistema y no en la ficha de la documentación porque
 * cualquier pantalla con una fila de indicadores los necesita igual, y dos
 * copias del mismo `option` se separan al primer ajuste.
 *
 * `registerECharts` solo registra lo que el sistema usa de serie; el medidor
 * se registra aquí, al importarse, porque el registro de `echarts/core` es
 * global y así no carga para quien nunca pinta uno.
 */
echarts.use([GaugeChart])

/** Los cinco colores de serie del tema, resueltos al montar. */
function usePalette() {
  return React.useMemo(() => {
    const [brand, positive, warning, negative, neutral] = getChartTheme().color
    return { brand, positive, warning, negative, neutral }
  }, [])
}

export interface MetricRingProps {
  /** De 0 a 100: cuánto del círculo se llena. */
  value: number
  /** El color del tramo lleno; el resto queda en neutro al 16 %. */
  color: string
  /** Qué representa el anillo, para quien no lo ve. */
  ariaLabel: string
}

/** Un reparto sobre el total, dibujado como cuánto del círculo llena. */
export function MetricRing({ value, color, ariaLabel }: MetricRingProps) {
  const palette = usePalette()
  const option: EChartsOption = React.useMemo(
    () => ({
      series: [
        {
          type: "pie",
          radius: ["68%", "100%"],
          center: ["50%", "50%"],
          silent: true,
          label: { show: false },
          labelLine: { show: false },
          data: [
            { value, itemStyle: { color, borderRadius: 8 } },
            { value: Math.max(0, 100 - value), itemStyle: { color: palette.neutral, opacity: 0.16 } },
          ],
        },
      ],
    }),
    [value, color, palette.neutral]
  )

  return (
    <div role="img" aria-label={ariaLabel} className="size-14">
      <EChart option={option} height={56} />
    </div>
  )
}

export interface MetricDialProps {
  /** De 0 a 100. Bajo 50 es riesgo, hasta 80 en camino, por encima en meta. */
  value: number
  ariaLabel: string
}

/**
 * Un 0–100 por zonas: riesgo, en camino y en meta. La aguja toma el color de
 * la banda en la que cae, así que el tono lo decide el propio dato.
 */
export function MetricDial({ value, ariaLabel }: MetricDialProps) {
  const palette = usePalette()
  const option: EChartsOption = React.useMemo(
    () => ({
      series: [
        {
          type: "gauge",
          min: 0,
          max: 100,
          startAngle: 200,
          endAngle: -20,
          radius: "100%",
          center: ["50%", "78%"],
          axisLine: {
            roundCap: true,
            lineStyle: {
              width: 6,
              color: [
                [0.5, palette.negative],
                [0.8, palette.warning],
                [1, palette.positive],
              ],
            },
          },
          pointer: { show: true, length: "62%", width: 3, itemStyle: { color: "auto" } },
          anchor: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          title: { show: false },
          detail: { show: false },
          data: [{ value }],
        },
      ],
    }),
    [value, palette.negative, palette.positive, palette.warning]
  )

  return (
    <div role="img" aria-label={ariaLabel} className="h-14 w-20">
      <EChart option={option} height={56} />
    </div>
  )
}
