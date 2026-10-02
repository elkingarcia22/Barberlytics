import * as React from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Heading, Text } from "@/components/typography"
import { ThemaIcon, type IconName } from "@/icons"
import { cn } from "@/lib/utils"
import { useResetOnChange } from "@/lib/useResetOnChange"
import {
  computeCardPosition,
  padRect,
  spotlightClipPath,
  type TourCardPosition,
  type TourRect,
} from "./tourGeometry"

export interface TourStep {
  id: string
  title: string
  description: React.ReactNode
  /** Icono de la baldosa junto al título. */
  icon?: IconName
  /**
   * Selector CSS del elemento a resaltar (`[data-tour="feedback-launcher"]`).
   * Admite una lista (`nav, aside`): gana el primero que esté a la vista.
   * Sin él, o si nada coincide en pantalla, la tarjeta sale centrada.
   */
  target?: string
  /**
   * El paso avanza cuando se pulsa el objetivo, no con «Continuar»: para
   * enseñar un gesto haciéndolo. Si el objetivo no aparece, vuelve el botón.
   */
  advanceOnTargetClick?: boolean
}

export interface GuidedTourLabels {
  next: string
  back: string
  finish: string
  close: string
  step: (current: number, total: number) => string
}

export interface GuidedTourProps {
  steps: readonly TourStep[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Se llama al pulsar «Finalizar» en el último paso (no al cerrar con ✕ o Escape). */
  onComplete?: () => void
  labels?: Partial<GuidedTourLabels>
}

const DEFAULT_LABELS: GuidedTourLabels = {
  next: "Continuar",
  back: "Atrás",
  finish: "Finalizar",
  close: "Cerrar el recorrido",
  step: (current, total) => `Paso ${current} de ${total}`,
}

/** Mide el objetivo y lo vuelve a medir con scroll, cambios de tamaño o de su propia caja. */
function useTargetRect(element: Element | null): TourRect | null {
  const [rect, setRect] = React.useState<TourRect | null>(null)

  React.useLayoutEffect(() => {
    if (!element) return
    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const box = element.getBoundingClientRect()
        // Oculto (p. ej. el menú lateral en móvil): mejor tarjeta centrada que un foco en la nada.
        const hidden = box.width === 0 && box.height === 0
        setRect(hidden ? null : { top: box.top, left: box.left, width: box.width, height: box.height })
      })
    }
    measure()
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure)
    observer?.observe(element)
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure, true)
    }
  }, [element])

  return element ? rect : null
}

/** Visible y dentro de la ventana: un menú plegado fuera de pantalla no sirve de objetivo. */
function isOnScreen(element: Element): boolean {
  const box = element.getBoundingClientRect()
  if (box.width === 0 && box.height === 0) return false
  return box.right > 0 && box.bottom > 0 && box.left < window.innerWidth && box.top < window.innerHeight
}

/** Busca el objetivo del paso; lo reintenta un momento por si la pantalla aún se está montando. */
function useStepTarget(selector: string | undefined, active: boolean): Element | null {
  const [element, setElement] = React.useState<Element | null>(null)

  React.useEffect(() => {
    if (!active || !selector) return
    let attempts = 0
    let timer = 0
    const find = () => {
      const found = [...document.querySelectorAll(selector)].find(isOnScreen) ?? null
      if (found || attempts >= 10) {
        setElement(found)
        return
      }
      attempts += 1
      timer = window.setTimeout(find, 100)
    }
    find()
    return () => window.clearTimeout(timer)
  }, [selector, active])

  return active && selector && element?.matches(selector) ? element : null
}

/**
 * GuidedTour
 *
 * Recorrido de coachmarks: una tarjeta por paso, con el elemento del paso
 * recortado del velo y rodeado por un anillo. Sirve para presentar algo que
 * se acaba de lanzar y pedir que lo prueben: cada paso dice qué mirar y el
 * último suele apuntar al botón de feedback.
 *
 * El velo no tapa el objetivo (el recorte también deja pasar los clics), así
 * que un paso puede avanzar cuando la persona pulsa lo resaltado
 * (`advanceOnTargetClick`). Escape y ✕ cierran sin completar; solo «Finalizar»
 * llama a `onComplete`.
 *
 * @example
 * <GuidedTour steps={pasos} open={open} onOpenChange={setOpen} onComplete={marcarVisto} />
 */
export function GuidedTour({ steps, open, onOpenChange, onComplete, labels }: GuidedTourProps) {
  const text = { ...DEFAULT_LABELS, ...labels }
  const [index, setIndex] = React.useState(0)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState<TourCardPosition | null>(null)
  const titleId = React.useId()

  // Cada apertura empieza por el primer paso.
  useResetOnChange(String(open), () => {
    if (open) setIndex(0)
  })

  const step = steps[Math.min(index, steps.length - 1)]
  const isLast = index >= steps.length - 1
  const target = useStepTarget(step?.target, open)
  const targetRect = useTargetRect(target)
  const hole = React.useMemo(() => (targetRect ? padRect(targetRect) : null), [targetRect])
  const waitsForClick = Boolean(step?.advanceOnTargetClick && targetRect)

  const close = React.useCallback(() => onOpenChange(false), [onOpenChange])
  const next = React.useCallback(() => {
    if (isLast) {
      onComplete?.()
      onOpenChange(false)
      return
    }
    setIndex((value) => value + 1)
  }, [isLast, onComplete, onOpenChange])
  const back = () => setIndex((value) => Math.max(0, value - 1))

  // El objetivo a la vista antes de medirlo: si está fuera, el foco quedaría en el vacío.
  React.useEffect(() => {
    if (!target || typeof (target as HTMLElement).scrollIntoView !== "function") return
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ;(target as HTMLElement).scrollIntoView({ block: "center", inline: "nearest", behavior: reduced ? "auto" : "smooth" })
  }, [target])

  React.useEffect(() => {
    if (!waitsForClick || !target) return
    target.addEventListener("click", next, { once: true })
    return () => target.removeEventListener("click", next)
  }, [waitsForClick, target, next])

  React.useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, close])

  // Cada paso nuevo lleva el foco a su tarjeta, para que el lector de pantalla lo anuncie.
  React.useEffect(() => {
    if (open) cardRef.current?.focus({ preventScroll: true })
  }, [open, index])

  React.useLayoutEffect(() => {
    if (!open || !cardRef.current) return
    const card = cardRef.current
    const place = () =>
      setPosition(
        computeCardPosition(
          hole,
          { width: card.offsetWidth, height: card.offsetHeight },
          { width: window.innerWidth, height: window.innerHeight }
        )
      )
    place()
    window.addEventListener("resize", place)
    return () => window.removeEventListener("resize", place)
  }, [open, index, hole])

  if (!open || !step || typeof document === "undefined") return null

  const progress = (index + 1) / steps.length

  return createPortal(
    <div data-slot="guided-tour">
      <div
        aria-hidden
        onClick={close}
        style={{ clipPath: spotlightClipPath(hole) }}
        className="fixed inset-0 z-overlay bg-black/50 animate-in fade-in duration-normal motion-reduce:animate-none"
      />
      {hole && (
        <div
          aria-hidden
          style={{
            width: hole.width,
            height: hole.height,
            transform: `translate3d(${hole.left}px, ${hole.top}px, 0)`,
          }}
          className="pointer-events-none fixed left-0 top-0 z-overlay rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-background transition-transform duration-normal ease-out-expo motion-reduce:transition-none"
        />
      )}

      <div
        ref={cardRef}
        key={step.id}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{ top: position?.top ?? 0, left: position?.left ?? 0, visibility: position ? "visible" : "hidden" }}
        className="fixed z-dialog w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-premium outline-none animate-in fade-in zoom-in-95 duration-normal ease-out-expo motion-reduce:animate-none"
      >
        <div className="h-1 w-full bg-surface-subtle">
          <div
            style={{ transform: `scaleX(${progress})` }}
            className="h-full w-full origin-left bg-primary transition-transform duration-normal ease-out-expo motion-reduce:transition-none"
          />
        </div>

        <div className="flex flex-col gap-4 p-card">
          <div className="flex items-start gap-3">
            {step.icon && (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-card">
                <ThemaIcon name={step.icon} size="sm" tone="inverse" />
              </span>
            )}
            <div className="min-w-0 flex-1 space-y-0.5">
              <Text variant="small" tone="primary" className="uppercase tracking-wider">
                {text.step(index + 1, steps.length)}
              </Text>
              <Heading level={6} id={titleId} weight="semibold">
                {step.title}
              </Heading>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={close} aria-label={text.close} className="-mr-1 -mt-1 shrink-0">
              <ThemaIcon name="close" size="sm" tone="muted" />
            </Button>
          </div>

          <Text tone="secondary" className="leading-relaxed">
            {step.description}
          </Text>

          <div className={cn("flex items-center gap-2 border-t border-border/60 pt-4", index > 0 ? "justify-between" : "justify-end")}>
            {index > 0 && (
              <Button variant="ghost" onClick={back}>
                <ThemaIcon name="chevronLeft" size="sm" />
                {text.back}
              </Button>
            )}
            {!waitsForClick && (
              <Button size="lg" onClick={next}>
                {isLast ? text.finish : text.next}
                <ThemaIcon name="chevronRight" size="sm" tone="inverse" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
