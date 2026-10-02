# ImageCropper (beta)

Recorte de imagen sobre `react-easy-crop`: mover con arrastre o flechas, acercar con rueda, pellizco, teclas + y − o la barra, girar en pasos de 90° o fino, y «Encajar entera» para meter una imagen ancha en un hueco cuadrado con el sobrante transparente. `ImageCropDialog` lo pone en una ventana con vista previa en los tamaños reales y exporta con `cropImage` a PNG (conserva la transparencia) dentro de un tope de bytes.

Familia: Archivos · Doc: `/docs#/components/image-cropper` · Fuente: `src/components/upload/ImageCropper.tsx`

```ts
import { ImageCropper, ImageCropDialog, cropImage } from "@/components/upload"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `image` | `string` |  | URL o data URL de la imagen. |
| `aspect` | `number` | `1` | Proporción del recorte (`1` cuadrado, `16 / 9`…). |
| `cropShape` | `"rect" \| "round"` | `"rect"` | Guía circular para avatares; el resultado sigue siendo rectangular. |
| `minZoom / maxZoom` | `number` | `1 / 4` | Límites del zoom. Con `allowFit` se puede bajar de `minZoom` hasta encajar la imagen entera. |
| `allowFit` | `boolean` | `true` | Botón «Encajar entera» y zoom por debajo de 1; lo que sobra sale transparente. |
| `fineRotation` | `boolean` | `true` | Barra de giro fino de −45° a 45°, además de los giros de 90°. |
| `onChange` | `(value: { area: PixelArea; rotation: number }) => void` |  | Recorte en píxeles de la imagen original y giro, al terminar cada gesto. |
| `labels` | `Partial<ImageCropperLabels>` |  | Textos de los controles; vienen en español. |
| `ImageCropDialog · onApply` | `(result: CroppedImage) => void` |  | `{ blob, dataUrl, width, height }` ya exportado. |
| `ImageCropDialog · output` | `CropImageOptions` |  | `maxSize` (lado mayor), `maxBytes` (reduce hasta cumplirlo), `type` (`image/png` por defecto) y `quality`. |
| `ImageCropDialog · renderPreview` | `(src: string \| null) => ReactNode` |  | Vista previa propia; por defecto, la imagen a 96, 48 y 32 px. |
| `ImageCropDialog · onSkip` | `() => void` |  | Ofrece usar el archivo sin recortar (p. ej. un SVG, que se rasterizaría). |

## Guías

- Sí: Pasa siempre por el recortador cuando la imagen va a un hueco de forma fija (logo, avatar, portada).
- Sí: Muestra con `renderPreview` el sitio real donde se verá, no solo la imagen suelta.
- Sí: Exporta en PNG si la imagen puede tener transparencia; WebP solo para fotos.
- No: No lo uses para documentos o adjuntos: ahí va `UploadZone` o `FileUpload`.
- No: No rasterices un SVG sin ofrecer `onSkip`: se pierde la nitidez del vector.

Relacionados: upload-zone, file-upload, file-preview

## Ejemplos

### En una ventana, con vista previa y exportación

`ImageCropDialog` es la forma habitual: elige el archivo, ábrela y recibe en `onApply` el PNG ya recortado, girado y dentro de `maxBytes`. Con `renderPreview` muestras los huecos reales donde irá la imagen (el menú, el avatar…).

```tsx
const [open, setOpen] = React.useState(false);

<ImageCropDialog
  open={open}
  onOpenChange={setOpen}
  image={src}
  aspect={1}
  cropShape="round"
  title="Foto de perfil"
  output={{ maxSize: 512, maxBytes: 1024 * 1024 }}
  onApply={(result) => save(result.blob)}
/>
```
