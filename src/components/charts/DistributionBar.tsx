import * as React from "react"
import { Card } from "@/components/ui/card"
import { toneAccent, type Tone } from "@/lib/tone"
import { cn } from "@/lib/utils"
import { PanelHeading } from "./PanelHeading"

export interface DistributionSegment {
  id: string
  label: string
  value: number
  /** El tono del tramo. Sin él, sale por posición del ciclo. */
  tone?: Exclude<Tone, "ai">
  /** Una palabra apagada bajo el nombre: la franja horaria, la condición. */
  hint?: string
}

export interface DistributionBarProps {
  /** Sin título es solo la barra con su leyenda, para otra tarjeta. */
  title?: string
  description?: string
  segments: readonly DistributionSegment[]
  /** Cómo se escribe cada valor; por defecto en es-ES. */
  formatValue?: (value: number) => string
  /** Qué unidad acompaña al valor en la leyenda: «citas», «ventas». */
  unit?: string
  /** Controles a la derecha del título. */
  actions?: React.ReactNode
  emptyLabel?: string
  ariaLabel?: string
  className?: string
}

const CYCLE: readonly Exclude<Tone, "ai">[] = ["warning", "brand", "neutral", "positive", "negative"]
const defaultFormatter = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 })

/**
 * DistributionBar
 *
 * Un total repartido en pocos tramos contiguos —mañana, tarde y noche; con
 * cita, sin cita— como una sola barra donde cada tramo ocupa lo que le toca,
 * y debajo la leyenda con cada parte, su valor y su porcentaje.
 *
 * Es el hermano lineal de `CompositionDonut`: la misma pregunta («de qué
 * está hecho el total») cuando las partes tienen un orden natural, que en un
 * anillo se pierde y en una barra se lee de izquierda a derecha.
 *
 * @example
 * <DistributionBar
 *   title="Cuándo se reservan las citas"
 *   unit="citas"
 *   segments={[
 *     { id: "morning", label: "Mañana", value: 47, tone: "warning" },
 *     { id: "afternoon", label: "Tarde", value: 145, tone: "brand" },
 *     { id: "evening", label: "Noche", value: 60, tone: "neutral" },
 *   ]}
 * />
 */
export function DistributionBar({
  title,
  description,
  segments,
  formatValue = (value) => defaultFormatter.format(value),
  unit,
  actions,
  emptyLabel = "Sin datos en este periodo",
  ariaLabel,
  className,
}: DistributionBarProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  const isEmpty = total <= 0
  const toneOf = (segment: DistributionSegment, index: number) => segment.tone ?? CYCLE[index % CYCLE.length]
  const summary = segments.map((segment) => `${segment.label}: ${formatValue(segment.value)}`).join(", ")

  const body = isEmpty ? (
    <p className="text-sm text-text-muted">{emptyLabel}</p>
  ) : (
    <div className="flex flex-col gap-stack">
      <div
        role="img"
        aria-label={ariaLabel ?? `${title ?? ""} ${summary}`.trim()}
        className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full"
      >
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment, index) => (
            <span
              key={segment.id}
              title={`${segment.label}: ${formatValue(segment.value)}${unit ? ` ${unit}` : ""} · ${Math.round((segment.value / total) * 100)}%`}
              className="h-full rounded-full transition-[flex-grow,opacity] duration-slow ease-out-expo hover:opacity-80 motion-reduce:transition-none"
              style={{ flexGrow: segment.value, backgroundColor: toneAccent(toneOf(segment, index)) }}
            />
          ))}
      </div>

      {/* Una fila por tramo, en el orden de la barra: el nombre con su franja
          a la izquierda y la cifra a la derecha. En columna a propósito: en
          una tarjeta de tercio de fila tres columnas truncaban los nombres. */}
      <ul className="flex flex-col gap-2" aria-hidden>
        {segments.map((segment, index) => (
          <li
            key={segment.id}
            title={`${segment.label}: ${formatValue(segment.value)}${unit ? ` ${unit}` : ""} · ${Math.round((segment.value / total) * 100)}%`}
            className="-mx-1.5 flex min-w-0 items-start gap-inline rounded-md px-1.5 py-0.5 transition-colors duration-fast hover:bg-muted/60"
          >
            <span
              aria-hidden
              className="mt-1.5 size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: toneAccent(toneOf(segment, index)) }}
            />
            {/* Nombre arriba y cifra abajo, como la leyenda del anillo: así
                cabe en una tarjeta estrecha sin recortar el nombre. */}
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-xs text-text-secondary">
                {segment.label}
                {segment.hint && <span className="ml-1 text-text-muted">{segment.hint}</span>}
              </span>
              <span className="text-sm">
                <span className="font-semibold tabular-nums text-text-primary">{formatValue(segment.value)}</span>
                {unit && <span className="text-xs text-text-secondary"> {unit}</span>}
                <span className="text-xs tabular-nums text-text-muted"> · {Math.round((segment.value / total) * 100)}%</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )

  if (!title) return <div className={className}>{body}</div>

  return (
    <Card className={cn("flex flex-col gap-stack p-card", className)}>
      <PanelHeading title={title} description={description} actions={actions} />
      {body}
    </Card>
  )
}
