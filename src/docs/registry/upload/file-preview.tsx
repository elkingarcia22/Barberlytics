import * as React from "react";
import { FilePreview, type FilePreviewVariant } from "@/components/upload";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";
import { SAMPLE_FILES, SAMPLE_FILE_KINDS, sampleFiles, type SampleFileKind } from "./fixtures";

const VARIANTS = ["card", "row", "compact"] as const;

/** Lista de filas con eliminación real y botón para restaurar. */
function RemovableRows() {
  const initial = React.useMemo(() => sampleFiles(["pdf", "image", "archive"]), []);
  const [files, setFiles] = React.useState<File[]>(initial);
  return (
    <div className="w-full max-w-md space-y-2">
      {files.map((file) => (
        <FilePreview key={file.name} file={file} variant="row" removable onRemove={() => setFiles((prev) => prev.filter((item) => item !== file))} />
      ))}
      {files.length < initial.length && (
        <Button size="sm" variant="ghost" onClick={() => setFiles(initial)}>
          Restaurar archivos
        </Button>
      )}
    </div>
  );
}

export const filePreviewEntry = defineEntry({
  id: "file-preview",
  name: "FilePreview",
  group: "upload",
  description:
    "Muestra los metadatos de un archivo (nombre, tamaño y familia) con un icono por tipo. Tres variantes de densidad: tarjeta para grillas, fila para listas y chip compacto para resúmenes.",
  importPath: 'import { FilePreview } from "@/components/upload"',
  sourcePath: "src/components/upload/FilePreview.tsx",
  status: "stable",
  tags: ["presentacional"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", options: VARIANTS, default: "card" },
      kind: { type: "select", label: "Tipo", options: SAMPLE_FILE_KINDS, default: "pdf" },
      removable: { type: "boolean", label: "Con quitar", default: true },
      withError: { type: "boolean", label: "Con error", default: false },
      disabled: { type: "boolean", default: false },
    },
    render: ({ variant, kind, removable, withError, disabled }) => (
      <FilePreview
        file={SAMPLE_FILES[kind as SampleFileKind]()}
        variant={variant as FilePreviewVariant}
        removable={removable}
        disabled={disabled}
        error={withError ? "El archivo está dañado o incompleto." : undefined}
        className={variant === "card" ? "w-64" : variant === "row" ? "w-80" : undefined}
      />
    ),
    code: ({ variant, kind, removable, withError, disabled }) => {
      const file = SAMPLE_FILES[kind as SampleFileKind]();
      const attrs = [
        variant !== "card" ? `variant="${variant}"` : "",
        removable ? "removable onRemove={handleRemove}" : "",
        withError ? 'error="El archivo está dañado o incompleto."' : "",
        disabled ? "disabled" : "",
      ]
        .filter(Boolean)
        .map((attr) => `\n  ${attr}`)
        .join("");
      return `const file = new File([...], "${file.name}", { type: "${file.type}" });

<FilePreview file={file}${attrs}
/>`;
    },
  }),
  examples: [
    {
      id: "variants",
      title: "Variantes",
      description: "El mismo archivo en tarjeta, fila y chip. AttachmentList elige la variante según su layout.",
      layout: "stretch",
      code: `<FilePreview file={file} variant="card" removable />
<FilePreview file={file} variant="row" removable />
<FilePreview file={file} variant="compact" removable />`,
      render: () => (
        <div className="flex w-full flex-wrap items-start gap-4">
          <FilePreview file={SAMPLE_FILES.pdf()} variant="card" removable className="w-60" />
          <FilePreview file={SAMPLE_FILES.pdf()} variant="row" removable className="w-72" />
          <FilePreview file={SAMPLE_FILES.pdf()} variant="compact" removable />
        </div>
      ),
    },
    {
      id: "kinds",
      title: "Icono por tipo de archivo",
      description: "La familia se resuelve con `getFileKind` a partir del MIME o la extensión: imagen, PDF, hoja de cálculo, documento, comprimido, audio y video.",
      layout: "stretch",
      code: `{files.map((file) => (
  <FilePreview key={file.name} file={file} variant="card" />
))}`,
      render: () => (
        <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_FILE_KINDS.map((kind) => (
            <FilePreview key={kind} file={SAMPLE_FILES[kind]()} variant="card" />
          ))}
        </div>
      ),
    },
    {
      id: "removable",
      title: "Filas con eliminación",
      description: "`onRemove` no muta nada: el padre filtra la lista y vuelve a renderizar.",
      layout: "stretch",
      code: `const [files, setFiles] = React.useState<File[]>(initialFiles);

{files.map((file) => (
  <FilePreview
    key={file.name}
    file={file}
    variant="row"
    removable
    onRemove={() => setFiles((prev) => prev.filter((item) => item !== file))}
  />
))}`,
      render: () => <RemovableRows />,
    },
    {
      id: "error",
      title: "Con error",
      description: "El mensaje se pinta dentro del componente; útil para validaciones por archivo (virus, corrupto, formato).",
      layout: "stretch",
      code: `<FilePreview file={file} variant="row" error="Excede el límite de 5 MB." removable />
<FilePreview file={file} variant="card" error="No se pudo escanear el archivo." />`,
      render: () => (
        <div className="flex w-full flex-wrap items-start gap-4">
          <FilePreview file={SAMPLE_FILES.archive()} variant="row" error="Excede el límite de 5 MB." removable className="w-80" />
          <FilePreview file={SAMPLE_FILES.video()} variant="card" error="No se pudo escanear el archivo." className="w-60" />
        </div>
      ),
    },
  ],
  props: [
    { name: "file", type: "File | UploadFileItem", description: "El archivo o sus metadatos. Solo se leen `name`, `size` y `type`." },
    { name: "variant", type: '"card" | "row" | "compact"', default: '"card"', description: "Densidad visual: tarjeta, fila o chip." },
    { name: "removable", type: "boolean", default: "false", description: "Muestra el botón de quitar." },
    { name: "onRemove", type: "() => void", description: "Se llama al pulsar quitar. El padre decide qué hacer." },
    { name: "disabled", type: "boolean", default: "false", description: "Baja la opacidad y oculta el botón de quitar." },
    { name: "error", type: "string", description: "Mensaje de error por archivo; cambia el borde y el icono." },
    { name: "className", type: "string", description: "Clases extra (p. ej. un ancho fijo)." },
  ],
  guidelines: {
    do: ["Usa `row` en listas verticales y `compact` cuando el espacio es un resumen o un chip de filtro.", "Muestra el `error` aquí cuando el fallo es de un archivo, no de toda la carga."],
    dont: ["No lo uses para previsualizar el contenido de la imagen: para eso está MediaPreview.", "No mezcles variantes dentro de la misma lista."],
  },
  related: ["attachment-list", "upload-zone", "media-preview", "card"],
});
