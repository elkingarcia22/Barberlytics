import * as React from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/typography"
import { cn } from "@/lib/utils"
import type { CropFraction } from "./screenCapture"

/** Por debajo de esto el arrastre fue un clic sin querer, no un recorte. */
const MIN_SELECTION_PX = 12

export interface AreaSelectorLabels {
  hint: string
  use: string
  useAll: string
  retry: string
  cancel: string
  image: string
}

export interface AreaSelectorProps {
  /** El fotograma capturado sobre el que se marca el área. */
  frame: HTMLCanvasElement
  onConfirm: (crop: CropFraction) => void
  onCancel: () => void
  labels?: Partial<AreaSelectorLabels>
}

const DEFAULT_LABELS: AreaSelectorLabels = {
  hint: "Arrastra para marcar lo que quieres enseñar",
  use: "Usar este recorte",
  useAll: "Usar toda la captura",
  retry: "Marcar de nuevo",
  cancel: "Cancelar",
  image: "Captura de pantalla",
}

interface Box {
  left: number
  top: number
  width: number
  height: number
}

const FULL_FRAME: CropFraction = { x: 0, y: 0, width: 1, height: 1 }

function toBox(a: { x: number; y: number }, b: { x: number; y: number }): Box {
  return { left: Math.min(a.x, b.x), top: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) }
}

/**
 * AreaSelector
 *
 * La captura a pantalla completa, para marcar arrastrando qué parte se
 * adjunta. Se recorta sobre el fotograma ya tomado y no sobre la página viva:
 * así lo que se envía es exactamente lo que se ve aquí, sin que nada cambie
 * entre el gesto y el recorte.
 *
 * @example
 * <AreaSelector frame={fotograma} onConfirm={recortar} onCancel={volver} />
 */
export function AreaSelector({ frame, onConfirm, onCancel, labels }: AreaSelectorProps) {
  const text = { ...DEFAULT_LABELS, ...labels }
  const source = React.useMemo(() => frame.toDataURL("image/png"), [frame])
  const imageRef = React.useRef<HTMLImageElement>(null)
  const [origin, setOrigin] = React.useState<{ x: number; y: number } | null>(null)
  const [selection, setSelection] = React.useState<Box | null>(null)
  // El tamaño al que se pinta la imagen, tomado al empezar a arrastrar: la
  // copia de dentro del marco tiene que medir lo mismo para casar con ella.
  const [shown, setShown] = React.useState({ width: 0, height: 0 })
  const isDragging = origin !== null
  const hasSelection = selection !== null && selection.width >= MIN_SELECTION_PX && selection.height >= MIN_SELECTION_PX

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.preventDefault()
      onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onCancel])

  /** La posición del puntero dentro de la imagen, sin salirse de ella. */
  const pointIn = (event: React.PointerEvent) => {
    const rect = imageRef.current?.getBoundingClientRect()
    if (!rect) return null
    return {
      x: Math.min(rect.width, Math.max(0, event.clientX - rect.left)),
      y: Math.min(rect.height, Math.max(0, event.clientY - rect.top)),
    }
  }

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = pointIn(event)
    const rect = imageRef.current?.getBoundingClientRect()
    if (!point || !rect) return
    setShown({ width: rect.width, height: rect.height })
    event.currentTarget.setPointerCapture(event.pointerId)
    setOrigin(point)
    setSelection({ left: point.x, top: point.y, width: 0, height: 0 })
  }

  const onPointerMove = (event: React.PointerEvent) => {
    if (!origin) return
    const point = pointIn(event)
    if (point) setSelection(toBox(origin, point))
  }

  const confirm = () => {
    if (!selection || !hasSelection || shown.width === 0) return onConfirm(FULL_FRAME)
    onConfirm({
      x: selection.left / shown.width,
      y: selection.top / shown.height,
      width: selection.width / shown.width,
      height: selection.height / shown.height,
    })
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={text.hint}
      data-slot="area-selector"
      className="fixed inset-0 z-toast flex flex-col items-center justify-center gap-3 bg-foreground/80 p-4 animate-in fade-in duration-normal motion-reduce:animate-none"
    >
      <div
        className="relative max-h-full min-h-0 cursor-crosshair touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => setOrigin(null)}
      >
        <img
          ref={imageRef}
          src={source}
          alt={text.image}
          width={frame.width}
          height={frame.height}
          draggable={false}
          className={cn("block max-h-[calc(100dvh-7rem)] w-auto max-w-full rounded-lg shadow-drawer", selection && "opacity-60")}
        />
        {selection && (
          <div
            aria-hidden
            className="pointer-events-none absolute overflow-hidden rounded-sm ring-2 ring-primary"
            style={{ left: selection.left, top: selection.top, width: selection.width, height: selection.height }}
          >
            {/* La misma imagen, desplazada: dentro del marco se ve a plena luz. */}
            <img
              src={source}
              alt=""
              draggable={false}
              className="absolute max-w-none"
              style={{ left: -selection.left, top: -selection.top, width: shown.width, height: shown.height }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl bg-surface px-3 py-2 shadow-drawer">
        {!hasSelection && (
          <Text size="sm" tone="secondary" className="px-1">
            {text.hint}
          </Text>
        )}
        <Button variant="ghost" onClick={onCancel}>
          {text.cancel}
        </Button>
        {hasSelection && !isDragging && (
          <Button variant="outline" onClick={() => setSelection(null)}>
            {text.retry}
          </Button>
        )}
        <Button onClick={confirm} disabled={isDragging}>
          {hasSelection ? text.use : text.useAll}
        </Button>
      </div>
    </div>,
    document.body
  )
}
