import * as React from "react"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Puntuación con estrellas para encuestas y evaluaciones.
 *
 * Editable es un `radiogroup` con tabulación itinerante: una sola parada de
 * teclado y las flechas mueven la nota. De solo lectura no es un control, es un
 * dato: `role="img"` con la puntuación escrita en el `aria-label`.
 */

export type RatingSize = "sm" | "default" | "lg"
export type RatingTone = "warning" | "primary"

export interface RatingProps {
  /** Valor controlado. */
  value?: number
  /** Valor inicial cuando no está controlado. */
  defaultValue?: number
  onValueChange?: (value: number) => void
  /** Número de estrellas. */
  max?: number
  /** Permite medias estrellas (0,5). */
  allowHalf?: boolean
  readOnly?: boolean
  disabled?: boolean
  size?: RatingSize
  /** Icono a repetir; por defecto una estrella. */
  icon?: React.ReactNode
  tone?: RatingTone
  /** Etiqueta accesible del grupo. */
  label?: string
  /** Muestra «4,2 de 5» junto a las estrellas. */
  showValue?: boolean
  id?: string
  className?: string
  "aria-describedby"?: string
}

const SIZES: Record<RatingSize, { icon: string; text: string; gap: string }> = {
  sm: { icon: "[&_svg]:size-3.5", text: "text-xs", gap: "gap-0.5" },
  default: { icon: "[&_svg]:size-5", text: "text-sm", gap: "gap-1" },
  lg: { icon: "[&_svg]:size-7", text: "text-base", gap: "gap-1.5" },
}

const TONES: Record<RatingTone, string> = {
  warning: "text-warning",
  primary: "text-primary",
}

/** «4,2 de 5» con el formato numérico de es-CO. */
function formatScore(value: number, max: number): string {
  return `${value.toLocaleString("es-CO", { maximumFractionDigits: 1 })} de ${max}`
}

export function Rating({
  value,
  defaultValue,
  onValueChange,
  max = 5,
  allowHalf = false,
  readOnly = false,
  disabled = false,
  size = "default",
  icon,
  tone = "warning",
  label,
  showValue = false,
  id,
  className,
  "aria-describedby": ariaDescribedBy,
}: RatingProps) {
  const isControlled = value !== undefined
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? 0)
  const current = isControlled ? value : uncontrolled

  const sizes = SIZES[size]
  const stepSize = allowHalf ? 0.5 : 1
  const interactive = !readOnly && !disabled
  const optionRefs = React.useRef<Map<number, HTMLButtonElement | null>>(new Map())

  const glyph = icon ?? <Star aria-hidden="true" strokeWidth={1.5} />

  const select = (next: number) => {
    if (!interactive) return
    if (!isControlled) setUncontrolled(next)
    onValueChange?.(next)
  }

  const moveTo = (next: number) => {
    const clamped = Math.min(Math.max(next, stepSize), max)
    select(clamped)
    optionRefs.current.get(clamped)?.focus()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return
    const base = current || 0
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault()
      moveTo(base + stepSize)
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault()
      moveTo(base - stepSize)
    } else if (event.key === "Home") {
      event.preventDefault()
      moveTo(stepSize)
    } else if (event.key === "End") {
      event.preventDefault()
      moveTo(max)
    }
  }

  /** La estrella `index` (0-based) se rellena entera, a medias o nada. */
  const fillPercent = (index: number): number => {
    const filled = Math.min(Math.max(current - index, 0), 1)
    return filled * 100
  }

  /** Solo una parada de tabulación: la estrella elegida, o la primera. */
  const tabbableValue = current >= stepSize ? Math.min(current, max) : stepSize

  const stars = Array.from({ length: max }, (_, index) => {
    const percent = fillPercent(index)
    return (
      <span key={index} className={cn("relative inline-flex shrink-0", sizes.icon)}>
        <span className="inline-flex text-text-muted">{glyph}</span>
        <span
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 inline-flex items-center overflow-hidden [&_svg]:shrink-0 [&_svg]:fill-current",
            TONES[tone]
          )}
          style={{ width: `${percent}%` }}
          aria-hidden="true"
        >
          {glyph}
        </span>

        {interactive
          ? (allowHalf ? [0.5, 1] : [1]).map((fraction) => {
              const optionValue = index + fraction
              return (
                <button
                  key={fraction}
                  ref={(node) => {
                    optionRefs.current.set(optionValue, node)
                  }}
                  type="button"
                  role="radio"
                  aria-checked={current === optionValue}
                  aria-label={formatScore(optionValue, max)}
                  tabIndex={optionValue === tabbableValue ? 0 : -1}
                  onClick={() => select(optionValue)}
                  className={cn(
                    "absolute inset-y-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    allowHalf ? "w-1/2" : "inset-x-0",
                    allowHalf && fraction === 0.5 && "left-0",
                    allowHalf && fraction === 1 && "right-0"
                  )}
                />
              )
            })
          : null}
      </span>
    )
  })

  const score = formatScore(current, max)

  return (
    <div
      data-slot="rating"
      id={id}
      className={cn("inline-flex items-center gap-2", disabled && "opacity-50", className)}
    >
      <div
        role={interactive ? "radiogroup" : "img"}
        aria-label={label ?? (interactive ? "Puntuación" : score)}
        aria-describedby={ariaDescribedBy}
        aria-readonly={readOnly || undefined}
        onKeyDown={handleKeyDown}
        className={cn("inline-flex items-center", sizes.gap, interactive ? "cursor-pointer" : "cursor-default")}
      >
        {stars}
      </div>

      {showValue ? (
        <span className={cn("tabular-nums text-text-secondary", sizes.text)}>{score}</span>
      ) : null}
    </div>
  )
}
