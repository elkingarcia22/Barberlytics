import * as React from "react"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemaIcon } from "@/icons"
import type { IconName } from "@/icons"
import { toneBar, toneChip, toneText, type Tone } from "@/lib/tone"
import { cn } from "@/lib/utils"
import { DeltaPill, type DeltaTone } from "./DeltaPill"

/**
 * Los tonos que admite una métrica. `ai` queda fuera a propósito: su
 * degradado está reservado a las superficies de IA del producto y un número
 * no debería pedirlo prestado.
 */
export type MetricTone = Exclude<Tone, "ai">

export interface MetricCardProps {
  /** Qué se está midiendo. Corto: es el título de la tarjeta. */
  label: string
  /**
   * El valor principal. Un número se formatea en es-ES; cualquier otra cosa
   * se pinta tal cual, así que el símbolo o la unidad los pone quien llama.
   * Siempre visible como texto: el gráfico es contexto, nunca el dato.
   */
  value: React.ReactNode
  /** La variación con signo frente al periodo anterior, en su propia unidad. */
  delta?: number
  /** Texto de la píldora con su unidad, p. ej. «+3,2 pp». */
  deltaLabel?: string
  /**
   * Fuerza el tono de la píldora cuando el signo miente: una rotación que
   * sube es una mala noticia aunque el delta sea positivo.
   */
  deltaTone?: DeltaTone
  /** Una línea apagada bajo el número: sobre qué se calcula o con qué compara. */
  caption?: string
  /** Qué mide exactamente, en un tooltip tras el icono de información. */
  hint?: string
  /** Tiñe el acento, el chip del icono y el gráfico. `brand` por defecto. */
  tone?: MetricTone
  /** Icono del registro semántico, al final de la fila del título. */
  icon?: IconName
  /** Gráfico pequeño: anillo, línea, medidor. */
  chart?: React.ReactNode
  /**
   * `side` lo mete junto al número; `bottom` lo corre a sangre por el borde
   * inferior de la tarjeta, como una tarjeta de tendencia.
   */
  chartPlacement?: "side" | "bottom"
  className?: string
}

/** Miles con punto y decimales con coma, como el resto del producto. */
const valueFormatter = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 })

/**
 * MetricCard
 *
 * La tarjeta de la que se hace cualquier fila de indicadores: un acento
 * vertical del tono junto al título, el icono pequeño en un chip al final de
 * la fila, un número grande y neutro con sitio para su píldora de variación,
 * un pie apagado y, opcionalmente, un gráfico teñido del mismo tono —
 * al lado del número o a sangre por el borde inferior.
 *
 * El color se gasta solo donde significa algo (acento, chip, gráfico,
 * píldora); el número se queda neutro. Así una fila de cuatro tarjetas se lee
 * tranquila en vez de como un marcador de estadio.
 *
 * El gráfico se envuelve en el color del tono, de modo que cualquier SVG que
 * dibuje con `currentColor` queda teñido sin pasarle props. Los gráficos de
 * canvas (`EChart`) no heredan el color: ahí el tono va en las opciones.
 *
 * @example
 * <MetricCard
 *   label="Avance promedio"
 *   value="72 %"
 *   delta={3.2}
 *   deltaLabel="+3,2 pp"
 *   caption="Sobre 8 ciclos · frente al trimestre anterior"
 *   tone="positive"
 *   icon="trendUp"
 * />
 */
export function MetricCard({
  label,
  value,
  delta,
  deltaLabel,
  deltaTone,
  caption,
  hint,
  tone = "brand",
  icon,
  chart,
  chartPlacement = "side",
  className,
}: MetricCardProps) {
  const bleeds = chartPlacement === "bottom" && Boolean(chart)
  const tint = toneText(tone)

  return (
    <Card className={cn("relative flex flex-col overflow-hidden", className)}>
      {/* El relleno vive aquí y no en la Card para que el gráfico a sangre
          pueda salirse de él sin márgenes negativos. */}
      <div className={cn("flex flex-col gap-stack", bleeds ? "px-card pt-card" : "p-card")}>
        <div className="flex min-w-0 items-center gap-inline">
          <span aria-hidden className="h-4 w-[3px] shrink-0 rounded-full" style={toneBar(tone)} />
          <span className="truncate text-sm font-semibold text-text-primary">{label}</span>
          {hint && <MetricHint label={label} hint={hint} />}
          {icon && (
            <span
              aria-hidden
              className="ml-auto flex size-6 shrink-0 items-center justify-center rounded-md"
              style={toneChip(tone)}
            >
              <ThemaIcon name={icon} size="xs" className="size-3.5 text-current" />
            </span>
          )}
        </div>

        <div className="flex items-end justify-between gap-inline">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[26px] font-extrabold leading-none tracking-tight tabular-nums text-text-primary">
                {typeof value === "number" ? valueFormatter.format(value) : value}
              </span>
              {delta !== undefined && (
                <DeltaPill
                  value={delta}
                  label={deltaLabel}
                  tone={deltaTone}
                  size="xs"
                  className="shrink-0"
                />
              )}
            </div>
            {caption && <span className="truncate text-xs font-medium text-text-muted">{caption}</span>}
          </div>
          {chart && !bleeds && (
            <span className="flex shrink-0 items-end" style={tint}>
              {chart}
            </span>
          )}
        </div>
      </div>

      {bleeds && (
        <div className="mt-auto" style={tint}>
          {chart}
        </div>
      )}
    </Card>
  )
}

/** El icono de información del título y su tooltip. */
function MetricHint({ label, hint }: { label: string; hint: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Qué mide ${label}`}
            className="shrink-0 rounded-sm text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ThemaIcon name="info" size="xs" className="size-3.5 text-current" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{hint}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
