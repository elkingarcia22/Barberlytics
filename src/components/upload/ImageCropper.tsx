import * as React from "react"
import Cropper, { type Area, type Point } from "react-easy-crop"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Text } from "@/components/typography"
import { ThemaIcon } from "@/icons"
import { fitZoom, normalizeRotation, type PixelArea } from "./cropImage"
import { DEFAULT_IMAGE_CROPPER_LABELS, type ImageCropperLabels } from "./imageCropperLabels"

export interface ImageCropValue {
  /** Recorte en píxeles de la imagen original, listo para `cropImage`. */
  area: PixelArea
  /** Giro total en grados, de 0 a 359. */
  rotation: number
}

export interface ImageCropperProps {
  /** URL o data URL de la imagen. */
  image: string
  /** Proporción del recorte; `1` es cuadrado. */
  aspect?: number
  /** `round` dibuja la guía circular (el resultado sigue siendo un cuadrado). */
  cropShape?: "rect" | "round"
  minZoom?: number
  maxZoom?: number
  /**
   * Deja alejar hasta que la imagen entera quepa en el recorte; lo que sobra
   * sale transparente. Útil para logos horizontales en un hueco cuadrado.
   */
  allowFit?: boolean
  /** Muestra la barra de giro fino de −45° a 45°, además de los giros de 90°. */
  fineRotation?: boolean
  /** Se llama al terminar cada gesto con el recorte y el giro vigentes. */
  onChange?: (value: ImageCropValue) => void
  labels?: Partial<ImageCropperLabels>
  className?: string
}

const ZOOM_STEP = 0.1
const FINE_LIMIT = 45

/**
 * Recortador de imagen sobre `react-easy-crop`: mover con arrastre o flechas,
 * acercar con rueda, pellizco, teclas + y − o la barra, y girar en pasos de
 * 90° o fino. No exporta: entrega el recorte para `cropImage`.
 */
export function ImageCropper({
  image,
  aspect = 1,
  cropShape = "rect",
  minZoom = 1,
  maxZoom = 4,
  fineRotation = true,
  allowFit = true,
  onChange,
  labels: labelsProp,
  className,
}: ImageCropperProps) {
  const labels = { ...DEFAULT_IMAGE_CROPPER_LABELS, ...labelsProp }
  const hintId = React.useId()
  const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = React.useState(minZoom)
  const [quarterTurns, setQuarterTurns] = React.useState(0)
  const [fine, setFine] = React.useState(0)
  const [media, setMedia] = React.useState<{ width: number; height: number } | null>(null)
  const rotation = normalizeRotation(quarterTurns * 90 + fine)
  const fit = media ? fitZoom(media.width, media.height, aspect, quarterTurns) : 1
  const lowestZoom = allowFit ? Math.min(minZoom, Math.floor(fit * 100) / 100) : minZoom

  const clampZoom = (value: number) => Math.min(maxZoom, Math.max(lowestZoom, Math.round(value * 100) / 100))

  const handleComplete = (_area: Area, pixels: Area) => {
    onChange?.({ area: pixels, rotation })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "+" || event.key === "=") {
      event.preventDefault()
      setZoom((value) => clampZoom(value + ZOOM_STEP))
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault()
      setZoom((value) => clampZoom(value - ZOOM_STEP))
    }
  }

  const reset = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(minZoom)
    setQuarterTurns(0)
    setFine(0)
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface-subtle bg-[conic-gradient(var(--color-border)_25%,transparent_0_50%,var(--color-border)_0_75%,transparent_0)] bg-[length:16px_16px]"
        onKeyDown={handleKeyDown}
      >
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          cropShape={cropShape}
          minZoom={lowestZoom}
          maxZoom={maxZoom}
          restrictPosition={zoom >= 1}
          onMediaLoaded={(size) => setMedia({ width: size.naturalWidth, height: size.naturalHeight })}
          showGrid
          keyboardStep={8}
          onCropChange={setCrop}
          onZoomChange={(value) => setZoom(clampZoom(value))}
          onRotationChange={(value) => {
            const total = normalizeRotation(value)
            const turns = Math.round(total / 90)
            setQuarterTurns(turns % 4)
            setFine(Math.max(-FINE_LIMIT, Math.min(FINE_LIMIT, Math.round(total - turns * 90))))
          }}
          onCropComplete={handleComplete}
          cropperProps={{ "aria-label": labels.area, "aria-describedby": hintId }}
          classes={{ cropAreaClassName: "!border-primary-foreground/90" }}
        />
      </div>
      <Text id={hintId} variant="caption">
        {labels.hint}
      </Text>

      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" aria-label={labels.zoomOut} disabled={zoom <= lowestZoom} onClick={() => setZoom((value) => clampZoom(value - ZOOM_STEP * 2))}>
          <ThemaIcon name="zoomOut" size="sm" />
        </Button>
        <Slider
          aria-label={labels.zoom}
          className="flex-1"
          min={lowestZoom}
          max={maxZoom}
          step={0.01}
          value={[zoom]}
          onValueChange={([value]) => setZoom(clampZoom(value))}
        />
        <Button type="button" variant="ghost" size="icon" aria-label={labels.zoomIn} disabled={zoom >= maxZoom} onClick={() => setZoom((value) => clampZoom(value + ZOOM_STEP * 2))}>
          <ThemaIcon name="zoomIn" size="sm" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" aria-label={labels.rotateLeft} onClick={() => setQuarterTurns((turns) => (turns + 3) % 4)}>
          <ThemaIcon name="rotateLeft" size="sm" />
        </Button>
        {fineRotation ? (
          <Slider aria-label={labels.rotation} className="flex-1" min={-FINE_LIMIT} max={FINE_LIMIT} step={1} value={[fine]} onValueChange={([value]) => setFine(value)} />
        ) : (
          <span className="flex-1" />
        )}
        <Button type="button" variant="ghost" size="icon" aria-label={labels.rotateRight} onClick={() => setQuarterTurns((turns) => (turns + 1) % 4)}>
          <ThemaIcon name="rotateRight" size="sm" />
        </Button>
        <Text as="span" size="xs" tone="secondary" className="w-10 text-right tabular-nums" aria-live="polite">
          {rotation}°
        </Text>
      </div>

      <div className="flex items-center justify-between gap-3">
        {allowFit && fit < 1 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setCrop({ x: 0, y: 0 })
              setZoom(clampZoom(fit))
            }}
            data-testid="image-cropper-fit"
          >
            <ThemaIcon name="crop" size="sm" />
            {labels.fit}
          </Button>
        ) : (
          <span />
        )}
        <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={reset}>
          {labels.reset}
        </Button>
      </div>
    </div>
  )
}
