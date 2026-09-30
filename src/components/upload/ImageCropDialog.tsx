import * as React from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Text } from "@/components/typography"
import { ThemaIcon } from "@/icons"
import { cropImage, type CropImageOptions, type CroppedImage } from "./cropImage"
import { ImageCropper, type ImageCropperProps, type ImageCropValue } from "./ImageCropper"

export interface ImageCropDialogProps extends Omit<ImageCropperProps, "onChange" | "className"> {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Resultado final, ya recortado, girado y dentro de `output.maxBytes`. */
  onApply: (result: CroppedImage) => void
  title?: string
  description?: string
  applyLabel?: string
  cancelLabel?: string
  /** Ofrece usar la imagen tal cual (p. ej. un SVG que no conviene rasterizar). */
  onSkip?: () => void
  skipLabel?: string
  output?: CropImageOptions
  /**
   * Dónde se verá la imagen. Recibe la vista previa (o `null` mientras se
   * genera) y devuelve los huecos reales: el avatar, el menú, la ficha…
   */
  renderPreview?: (src: string | null) => React.ReactNode
}

const PREVIEW_SIZE = 160
const PREVIEW_DELAY_MS = 120

function DefaultPreview({ src }: { src: string | null }) {
  return (
    <div className="flex items-end gap-4">
      {[96, 48, 32].map((size) => (
        <div key={size} className="flex flex-col items-center gap-1.5">
          <span className="flex items-center justify-center overflow-hidden rounded-lg border border-border bg-surface" style={{ width: size, height: size }}>
            {src ? <img src={src} alt="" className="size-full object-contain" /> : <Loader2 className="size-4 animate-spin text-text-muted" />}
          </span>
          <Text as="span" size="xs" tone="muted" className="tabular-nums">
            {size} px
          </Text>
        </div>
      ))}
    </div>
  )
}

/**
 * Ventana de recorte: el `ImageCropper` a la izquierda y, al lado, cómo queda
 * en los tamaños reales. «Aplicar» exporta con `cropImage` (PNG con
 * transparencia por defecto) y devuelve el resultado.
 */
export function ImageCropDialog({
  open,
  onOpenChange,
  onApply,
  image,
  title = "Recorta la imagen",
  description = "Encuadra lo importante dentro del recuadro.",
  applyLabel = "Aplicar",
  cancelLabel = "Cancelar",
  onSkip,
  skipLabel = "Usar sin recortar",
  output,
  renderPreview,
  ...cropperProps
}: ImageCropDialogProps) {
  const [value, setValue] = React.useState<ImageCropValue | null>(null)
  const [preview, setPreview] = React.useState<string | null>(null)
  const [isApplying, setIsApplying] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!value) return
    let active = true
    const timer = window.setTimeout(() => {
      cropImage(image, value.area, value.rotation, { maxSize: PREVIEW_SIZE })
        .then((result) => active && setPreview(result.dataUrl))
        .catch(() => active && setPreview(null))
    }, PREVIEW_DELAY_MS)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [image, value])

  const apply = async () => {
    if (!value) return
    setError(null)
    setIsApplying(true)
    try {
      const result = await cropImage(image, value.area, value.rotation, output)
      onApply(result)
      onOpenChange(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo recortar la imagen.")
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isApplying && onOpenChange(next)}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_16rem]">
          <ImageCropper key={image} image={image} onChange={setValue} {...cropperProps} />
          <section aria-label="Vista previa" className="space-y-3">
            <Text size="sm" weight="semibold">
              Vista previa
            </Text>
            {renderPreview ? renderPreview(preview) : <DefaultPreview src={preview} />}
          </section>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          {onSkip && (
            <Button
              type="button"
              variant="ghost"
              className="sm:mr-auto"
              disabled={isApplying}
              onClick={() => {
                onSkip()
                onOpenChange(false)
              }}
            >
              {skipLabel}
            </Button>
          )}
          <Button type="button" variant="outline" disabled={isApplying} onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button type="button" disabled={!value || isApplying} onClick={() => void apply()} data-testid="image-crop-apply">
            {isApplying ? <Loader2 className="animate-spin" /> : <ThemaIcon name="crop" size="sm" tone="inverse" />}
            {applyLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
