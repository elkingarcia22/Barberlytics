import * as React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { EChart } from "./EChart"
import { PanelHeading } from "./PanelHeading"
import { useChartPalette, type ChartTone } from "./useChartPalette"
import type { EChartsOption } from "./types"

export interface CompositionSlice {
  id: string
  label: string
  value: number
  /** El tono de la porción. Sin él, sale por posición del ciclo del tema. */
  tone?: ChartTone
}

export interface CompositionDonutProps {
  title: string
  description?: string
  slices: readonly CompositionSlice[]
  /**
   * Lo que va escrito en el centro del anillo. Por defecto es la suma de las
   * porciones formateada; se pasa cuando el total tiene otra unidad o nombre
   * («75 clientes» sobre un reparto de citas).
   */
  center?: { value: React.ReactNode; label?: string }
  /** Cómo se escribe cada valor de la leyenda; por defecto en es-ES. */
  formatValue?: (value: number) => string
  /** Añade el porcentaje sobre el total a cada fila de la leyenda. */
  showShare?: boolean
  /** Diámetro del anillo en píxeles. */
  size?: number
  /** Controles a la derecha del título. */
  actions?: React.ReactNode
  /** Qué decir cuando no hay porciones o todas valen cero. */
  emptyLabel?: string
  ariaLabel?: string
  className?: string
}

const defaultFormatter = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 })

/**
 * CompositionDonut
 *
 * El reparto de un total en pocas partes —cómo se pagó, en qué acabaron las
 * citas, por dónde entraron— como un anillo con el total escrito en el centro
 * y una leyenda al lado con cada parte, su valor y su porcentaje.
 *
 * Se diferencia de `DonutChart` en para qué sirve: aquel es un gráfico con
 * etiquetas sobre las porciones, para analizar; este es un panel de tablero
 * donde el dato es la leyenda y el anillo es contexto. Por eso el anillo va
 * mudo (sin etiquetas ni leyenda propia) y el texto lo pone el DOM, que sigue
 * al tema y a la densidad sin pasar por el canvas.
 *
 * @example
 * <CompositionDonut
 *   title="Citas"
 *   center={{ value: 75, label: "clientes" }}
 *   slices={[
 *     { id: "completed", label: "Completadas", value: 50, tone: "positive" },
 *     { id: "cancelled", label: "Canceladas", value: 19, tone: "negative" },
 *   ]}
 *   showShare
 * />
 */
export function CompositionDonut({
  title,
  description,
  slices,
  center,
  formatValue = (value) => defaultFormatter.format(value),
  showShare = false,
  size = 136,
  actions,
  emptyLabel = "Sin datos en este periodo",
  ariaLabel,
  className,
}: CompositionDonutProps) {
  const palette = useChartPalette()
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const isEmpty = total <= 0

  const option: EChartsOption = React.useMemo(
    () => ({
      /* El mismo tooltip que el resto de gráficas del tablero: pasar por una
         porción dice qué es, cuánto vale y qué parte del total. */
      tooltip: {
        trigger: "item",
        confine: true,
        formatter: (params: { name: string; value: number; percent: number; marker: string }) =>
          `${params.marker} ${params.name}<br/><b>${formatValue(params.value)}</b> · ${Math.round(params.percent)}%`,
      },
      series: [
        {
          type: "pie",
          radius: ["72%", "100%"],
          center: ["50%", "50%"],
          silent: isEmpty,
          label: { show: false },
          labelLine: { show: false },
          padAngle: 2,
          emphasis: { scale: true, scaleSize: 4 },
          data: isEmpty
            ? [{ value: 1, itemStyle: { color: palette.neutral, opacity: 0.16 } }]
            : slices
                .filter((slice) => slice.value > 0)
                .map((slice, index) => ({
                  name: slice.label,
                  value: slice.value,
                  itemStyle: { color: palette.forTone(slice.tone, index), borderRadius: 6 },
                })),
        },
      ],
    }),
    [slices, isEmpty, palette, formatValue]
  )

  const summary = slices.map((slice) => `${slice.label}: ${formatValue(slice.value)}`).join(", ")
  const centerValue = center?.value ?? formatValue(total)
  // Una cifra larga («US$ 14.641») no cabe al tamaño de un «75»: baja un paso.
  const centerIsLong = typeof centerValue === "string" && centerValue.length > 6

  return (
    <Card className={cn("flex flex-col gap-stack p-card", className)}>
      <PanelHeading title={title} description={description} actions={actions} />

      <div className="flex flex-wrap items-center gap-stack">
        <div
          role="img"
          aria-label={ariaLabel ?? `${title}: ${isEmpty ? emptyLabel : summary}`}
          className="relative shrink-0"
          style={{ width: size, height: size }}
        >
          <EChart option={option} height={size} />
          {/* El centro no captura el ratón: el hueco del anillo deja pasar el
              hover a las porciones que quedan debajo. */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
            <span
              className={cn(
                "max-w-full truncate font-extrabold leading-none tracking-tight tabular-nums text-text-primary",
                centerIsLong ? "text-sm" : "text-xl"
              )}
            >
              {centerValue}
            </span>
            {center?.label && <span className="mt-1 text-[11px] font-medium text-text-muted">{center.label}</span>}
          </div>
        </div>

        {isEmpty ? (
          <p className="text-sm text-text-muted">{emptyLabel}</p>
        ) : (
          /* Dos líneas por porción —nombre arriba, valor y porcentaje abajo—
             para que la leyenda quepa al lado del anillo en una tarjeta de
             tercio de fila sin truncar las cifras. */
          <ul className="flex min-w-[7rem] flex-1 flex-col gap-2" aria-hidden>
            {slices.map((slice, index) => (
              <li
                key={slice.id}
                title={`${slice.label}: ${formatValue(slice.value)} · ${Math.round((slice.value / total) * 100)}%`}
                className="-mx-1.5 flex items-start gap-inline rounded-md px-1.5 py-0.5 transition-colors duration-fast hover:bg-muted/60"
              >
                <span
                  aria-hidden
                  className="mt-1.5 size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: palette.forTone(slice.tone, index) }}
                />
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate text-xs text-text-secondary">{slice.label}</span>
                  <span className="text-sm">
                    <span className="font-semibold tabular-nums text-text-primary">{formatValue(slice.value)}</span>
                    {showShare && (
                      <span className="text-xs tabular-nums text-text-muted"> · {Math.round((slice.value / total) * 100)}%</span>
                    )}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
