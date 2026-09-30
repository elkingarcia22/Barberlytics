/** Recorte en píxeles de la imagen original, como lo entrega `react-easy-crop`. */
export interface PixelArea {
  x: number
  y: number
  width: number
  height: number
}

export interface CropImageOptions {
  /** Lado mayor del resultado; la imagen nunca se agranda por encima de su recorte. */
  maxSize?: number
  /** Tope en bytes; se reduce el lado hasta cumplirlo. */
  maxBytes?: number
  /** `image/png` conserva la transparencia; `image/webp` pesa menos. */
  type?: "image/png" | "image/webp" | "image/jpeg"
  quality?: number
}

export interface CroppedImage {
  blob: Blob
  dataUrl: string
  width: number
  height: number
}

export const DEFAULT_CROP_MAX_SIZE = 1024
const MIN_SIZE = 64
const SHRINK_STEP = 0.8

/** Normaliza cualquier ángulo a [0, 360). */
export function normalizeRotation(degrees: number): number {
  return ((degrees % 360) + 360) % 360
}

/** Caja que ocupa un rectángulo al girarlo: el lienzo intermedio necesita ese tamaño. */
export function rotatedBounds(width: number, height: number, degrees: number): { width: number; height: number } {
  const radians = (degrees * Math.PI) / 180
  const cos = Math.abs(Math.cos(radians))
  const sin = Math.abs(Math.sin(radians))
  return { width: width * cos + height * sin, height: width * sin + height * cos }
}

/**
 * Zoom con el que la imagen entera cabe en el recorte. Con zoom 1 el recorte
 * llena la imagen por su lado corto; por debajo de este valor sobraría aire.
 */
export function fitZoom(width: number, height: number, aspect: number, quarterTurns = 0): number {
  const [w, h] = quarterTurns % 2 === 0 ? [width, height] : [height, width]
  const cropWidth = Math.min(w, h * aspect)
  const cropHeight = cropWidth / aspect
  return Math.min(cropWidth / w, cropHeight / h)
}

/** Lado final: el mayor posible sin pasar de `maxSize` ni agrandar el recorte. */
export function fitOutputSize(area: Pick<PixelArea, "width" | "height">, maxSize: number): { width: number; height: number } {
  const scale = Math.min(1, maxSize / Math.max(area.width, area.height))
  return { width: Math.max(1, Math.round(area.width * scale)), height: Math.max(1, Math.round(area.height * scale)) }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("No se pudo abrir la imagen."))
    image.src = src
  })
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la imagen."))), type, quality)
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("No se pudo leer la imagen recortada."))
    reader.readAsDataURL(blob)
  })
}

/** Dibuja la imagen girada y devuelve solo el recorte, a tamaño real. */
function renderCrop(image: HTMLImageElement, area: PixelArea, rotation: number): HTMLCanvasElement {
  const bounds = rotatedBounds(image.naturalWidth, image.naturalHeight, rotation)
  const rotated = document.createElement("canvas")
  rotated.width = Math.round(bounds.width)
  rotated.height = Math.round(bounds.height)
  const context = rotated.getContext("2d")
  if (!context) throw new Error("Este navegador no puede recortar imágenes.")
  context.translate(rotated.width / 2, rotated.height / 2)
  context.rotate((rotation * Math.PI) / 180)
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)

  const cropped = document.createElement("canvas")
  cropped.width = Math.max(1, Math.round(area.width))
  cropped.height = Math.max(1, Math.round(area.height))
  // Desplazar en vez de recortar la fuente: si el recorte sale de la imagen
  // (encajada entera), lo que sobra queda transparente en todos los navegadores.
  cropped.getContext("2d")?.drawImage(rotated, -Math.round(area.x), -Math.round(area.y))
  return cropped
}

function scaleCanvas(source: HTMLCanvasElement, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Este navegador no puede recortar imágenes.")
  context.imageSmoothingQuality = "high"
  context.drawImage(source, 0, 0, width, height)
  return canvas
}

/**
 * Aplica giro y recorte en un lienzo y exporta. En PNG la transparencia se
 * conserva. Si el archivo pasa de `maxBytes`, reduce el lado en pasos del 80 %
 * hasta cumplirlo (sin bajar de 64 px).
 */
export async function cropImage(src: string, area: PixelArea, rotation = 0, options: CropImageOptions = {}): Promise<CroppedImage> {
  const { maxSize = DEFAULT_CROP_MAX_SIZE, maxBytes, type = "image/png", quality = 0.92 } = options
  const image = await loadImage(src)
  const cropped = renderCrop(image, area, normalizeRotation(rotation))
  let size = fitOutputSize(area, maxSize)

  for (;;) {
    const canvas = scaleCanvas(cropped, size.width, size.height)
    const blob = await toBlob(canvas, type, quality)
    const canShrink = Math.max(size.width, size.height) * SHRINK_STEP >= MIN_SIZE
    if (!maxBytes || blob.size <= maxBytes || !canShrink) {
      if (maxBytes && blob.size > maxBytes) throw new Error("La imagen sigue pesando demasiado. Prueba con un recorte más pequeño o un archivo más liviano.")
      return { blob, dataUrl: await blobToDataUrl(blob), width: size.width, height: size.height }
    }
    size = { width: Math.round(size.width * SHRINK_STEP), height: Math.round(size.height * SHRINK_STEP) }
  }
}
