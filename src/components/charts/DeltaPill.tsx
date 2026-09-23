import { ThemaIcon } from "@/icons"
import type { IconName } from "@/icons"
import { cn } from "@/lib/utils"

/** Hacia dónde apunta la flecha de la píldora. */
export type DeltaDirection = "up" | "down" | "flat"

/** Los tres tonos que puede tomar una variación. */
export type DeltaTone = "positive" | "negative" | "neutral"

/**
 * Por debajo de este umbral la variación se considera plana.
 *
 * Sin él, un +0,2 pp de ruido estadístico se pintaba en verde con flecha
 * arriba y se leía como una mejora. Vive dentro del componente y no en cada
 * pantalla que lo usa, así que todos los deltas del producto comparten el
 * mismo criterio de «esto no se movió».
 */
export const DELTA_FLAT_THRESHOLD = 0.5

export interface DeltaPillProps {
  /** La variación con signo, en la unidad que ya trae el dato (pp, %, puntos). */
  value: number
  /** Texto de la píldora. Si falta, se formatea `value` en es-ES con su signo. */
  label?: string
  /** Fuerza el tono cuando el signo no basta: una rotación que sube es negativa. */
  tone?: DeltaTone
  /** Fuerza la dirección de la flecha; por defecto la deduce de `value`. */
  direction?: DeltaDirection
  /** Oculta el icono y deja solo el texto. */
  showIcon?: boolean
  size?: "xs" | "sm" | "md"
  className?: string
}

const TONE_CLASSES: Readonly<Record<DeltaTone, string>> = {
  positive: "border-status-positive/20 bg-status-positive/10 text-status-positive",
  negative: "border-status-negative/20 bg-status-negative/10 text-status-negative",
  neutral: "border-border/60 bg-surface-muted text-text-secondary",
}

const SIZE_CLASSES: Readonly<Record<NonNullable<DeltaPillProps["size"]>, string>> = {
  xs: "gap-0.5 px-1.5 py-0 text-[10px]",
  sm: "gap-1 px-2 py-0.5 text-[11px]",
  md: "gap-1.5 px-2.5 py-1 text-xs",
}

const ICON_CLASSES: Readonly<Record<NonNullable<DeltaPillProps["size"]>, string>> = {
  xs: "size-2.5",
  sm: "size-3",
  md: "size-3.5",
}

const DIRECTION_ICONS: Readonly<Record<DeltaDirection, IconName>> = {
  up: "trendUp",
  down: "trendDown",
  flat: "neutral",
}

/** Decimal con coma y signo explícito salvo en el cero: «+3,2», «-1,4», «0». */
const deltaFormatter = new Intl.NumberFormat("es-ES", {
  signDisplay: "exceptZero",
  maximumFractionDigits: 1,
})

/**
 * Arriba, abajo o plano, con el umbral del sistema.
 *
 * Interna a propósito: la dirección y el tono son una decisión de la píldora,
 * no un cálculo que cada pantalla deba repetir. Quien necesite otro criterio
 * pasa `direction` o `tone`.
 */
function resolveDirection(value: number): DeltaDirection {
  if (value > DELTA_FLAT_THRESHOLD) return "up"
  if (value < -DELTA_FLAT_THRESHOLD) return "down"
  return "flat"
}

/** El tono que le toca a una variación cuando subir es bueno. */
function resolveTone(direction: DeltaDirection): DeltaTone {
  if (direction === "up") return "positive"
  if (direction === "down") return "negative"
  return "neutral"
}

/**
 * DeltaPill
 *
 * La variación de una métrica frente a su periodo anterior, como píldora
 * contorneada: flecha, texto y un fondo al 10 % de su propio tono.
 *
 * Calcula sola su flecha y su tono a partir del signo de `value`, con el
 * umbral de {@link DELTA_FLAT_THRESHOLD}: un cambio menor se dibuja plano y
 * en gris en vez de teñirse de verde o rojo por ruido. `tone` y `direction`
 * están ahí para las métricas invertidas, donde subir es malo.
 *
 * Es contorno y fondo tenue, no un bloque de color: al lado de un número
 * grande tiene que acompañarlo, no competir con él.
 *
 * @example
 * <DeltaPill value={3.2} label="+3,2 pp" />
 * <DeltaPill value={1.7} tone="negative" label="+1,7 pp" />
 */
export function DeltaPill({
  value,
  label,
  tone,
  direction,
  showIcon = true,
  size = "sm",
  className,
}: DeltaPillProps) {
  const resolvedDirection = direction ?? resolveDirection(value)
  const resolvedTone = tone ?? resolveTone(resolveDirection(value))
  const text = label ?? deltaFormatter.format(value)

  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border font-semibold tabular-nums",
        TONE_CLASSES[resolvedTone],
        SIZE_CLASSES[size],
        className
      )}
    >
      {showIcon && (
        <ThemaIcon
          name={DIRECTION_ICONS[resolvedDirection]}
          size="xs"
          className={cn(ICON_CLASSES[size], "text-current")}
        />
      )}
      <span>{text}</span>
    </span>
  )
}
