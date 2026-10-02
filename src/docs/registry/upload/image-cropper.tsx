import * as React from "react";
import { ImageCropDialog, ImageCropper, type CroppedImage, type ImageCropValue } from "@/components/upload";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { defineEntry, definePlayground } from "../types";

/** Foto horizontal que ya sirve la app; basta para probar recorte, zoom y encaje. */
const SAMPLE = "/login-barberia.webp";

function CropperDemo({ aspect, cropShape, fineRotation, allowFit }: { aspect: number; cropShape: "rect" | "round"; fineRotation: boolean; allowFit: boolean }) {
  const [value, setValue] = React.useState<ImageCropValue | null>(null);
  return (
    <div className="w-full max-w-md space-y-2">
      <ImageCropper key={`${aspect}-${String(allowFit)}`} image={SAMPLE} aspect={aspect} cropShape={cropShape} fineRotation={fineRotation} allowFit={allowFit} onChange={setValue} />
      <Text variant="caption" className="tabular-nums">
        {value ? `${Math.round(value.area.width)} × ${Math.round(value.area.height)} px · ${value.rotation}°` : "Mueve, acerca o gira la imagen"}
      </Text>
    </div>
  );
}

function DialogDemo() {
  const [open, setOpen] = React.useState(false);
  const [result, setResult] = React.useState<CroppedImage | null>(null);
  return (
    <div className="flex items-center gap-4">
      <Button type="button" onClick={() => setOpen(true)}>
        Recortar foto
      </Button>
      {result && (
        <div className="flex items-center gap-3">
          <img src={result.dataUrl} alt="Resultado del recorte" className="size-16 rounded-lg border border-border object-contain" />
          <Text size="sm" tone="secondary" className="tabular-nums">
            {result.width} × {result.height} px · {Math.round(result.blob.size / 1024)} KB
          </Text>
        </div>
      )}
      <ImageCropDialog
        open={open}
        onOpenChange={setOpen}
        image={SAMPLE}
        aspect={1}
        cropShape="round"
        title="Foto de perfil"
        description="Encuadra tu cara dentro del círculo."
        output={{ maxSize: 512, maxBytes: 1024 * 1024 }}
        onApply={setResult}
      />
    </div>
  );
}

export const imageCropperEntry = defineEntry({
  id: "image-cropper",
  name: "ImageCropper",
  group: "upload",
  description:
    "Recorte de imagen sobre `react-easy-crop`: mover con arrastre o flechas, acercar con rueda, pellizco, teclas + y − o la barra, girar en pasos de 90° o fino, y «Encajar entera» para meter una imagen ancha en un hueco cuadrado con el sobrante transparente. `ImageCropDialog` lo pone en una ventana con vista previa en los tamaños reales y exporta con `cropImage` a PNG (conserva la transparencia) dentro de un tope de bytes.",
  importPath: 'import { ImageCropper, ImageCropDialog, cropImage } from "@/components/upload"',
  sourcePath: "src/components/upload/ImageCropper.tsx",
  status: "beta",
  tags: ["recorte", "imagen", "logo", "avatar", "zoom", "giro"],
  playground: definePlayground({
    controls: {
      aspect: { type: "select", label: "Proporción", default: "1", options: ["1", "1.7778", "0.75"] },
      cropShape: { type: "select", label: "Guía", default: "rect", options: ["rect", "round"] },
      fineRotation: { type: "boolean", label: "Giro fino", default: true },
      allowFit: { type: "boolean", label: "Encajar entera", default: true },
    },
    layout: "center",
    render: ({ aspect, cropShape, fineRotation, allowFit }) => (
      <CropperDemo aspect={Number(aspect)} cropShape={cropShape as "rect" | "round"} fineRotation={fineRotation} allowFit={allowFit} />
    ),
    code: ({ aspect, cropShape, fineRotation, allowFit }) => `const [value, setValue] = React.useState<ImageCropValue | null>(null);

<ImageCropper
  image={src}
  aspect={${aspect}}${cropShape === "round" ? '\n  cropShape="round"' : ""}${fineRotation ? "" : "\n  fineRotation={false}"}${allowFit ? "" : "\n  allowFit={false}"}
  onChange={setValue}
/>

// Al confirmar:
const result = await cropImage(src, value.area, value.rotation, { maxSize: 1024, maxBytes: 1024 * 1024 });`,
  }),
  examples: [
    {
      id: "dialog",
      title: "En una ventana, con vista previa y exportación",
      description:
        "`ImageCropDialog` es la forma habitual: elige el archivo, ábrela y recibe en `onApply` el PNG ya recortado, girado y dentro de `maxBytes`. Con `renderPreview` muestras los huecos reales donde irá la imagen (el menú, el avatar…).",
      code: `const [open, setOpen] = React.useState(false);

<ImageCropDialog
  open={open}
  onOpenChange={setOpen}
  image={src}
  aspect={1}
  cropShape="round"
  title="Foto de perfil"
  output={{ maxSize: 512, maxBytes: 1024 * 1024 }}
  onApply={(result) => save(result.blob)}
/>`,
      render: () => <DialogDemo />,
    },
  ],
  props: [
    { name: "image", type: "string", description: "URL o data URL de la imagen." },
    { name: "aspect", type: "number", default: "1", description: "Proporción del recorte (`1` cuadrado, `16 / 9`…)." },
    { name: "cropShape", type: '"rect" | "round"', default: '"rect"', description: "Guía circular para avatares; el resultado sigue siendo rectangular." },
    { name: "minZoom / maxZoom", type: "number", default: "1 / 4", description: "Límites del zoom. Con `allowFit` se puede bajar de `minZoom` hasta encajar la imagen entera." },
    { name: "allowFit", type: "boolean", default: "true", description: "Botón «Encajar entera» y zoom por debajo de 1; lo que sobra sale transparente." },
    { name: "fineRotation", type: "boolean", default: "true", description: "Barra de giro fino de −45° a 45°, además de los giros de 90°." },
    { name: "onChange", type: "(value: { area: PixelArea; rotation: number }) => void", description: "Recorte en píxeles de la imagen original y giro, al terminar cada gesto." },
    { name: "labels", type: "Partial<ImageCropperLabels>", description: "Textos de los controles; vienen en español." },
    { name: "ImageCropDialog · onApply", type: "(result: CroppedImage) => void", description: "`{ blob, dataUrl, width, height }` ya exportado." },
    { name: "ImageCropDialog · output", type: "CropImageOptions", description: "`maxSize` (lado mayor), `maxBytes` (reduce hasta cumplirlo), `type` (`image/png` por defecto) y `quality`." },
    { name: "ImageCropDialog · renderPreview", type: "(src: string | null) => ReactNode", description: "Vista previa propia; por defecto, la imagen a 96, 48 y 32 px." },
    { name: "ImageCropDialog · onSkip", type: "() => void", description: "Ofrece usar el archivo sin recortar (p. ej. un SVG, que se rasterizaría)." },
  ],
  guidelines: {
    do: [
      "Pasa siempre por el recortador cuando la imagen va a un hueco de forma fija (logo, avatar, portada).",
      "Muestra con `renderPreview` el sitio real donde se verá, no solo la imagen suelta.",
      "Exporta en PNG si la imagen puede tener transparencia; WebP solo para fotos.",
    ],
    dont: [
      "No lo uses para documentos o adjuntos: ahí va `UploadZone` o `FileUpload`.",
      "No rasterices un SVG sin ofrecer `onSkip`: se pierde la nitidez del vector.",
    ],
  },
  related: ["upload-zone", "file-upload", "file-preview"],
});
