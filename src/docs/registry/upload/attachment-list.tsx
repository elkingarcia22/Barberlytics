import * as React from "react";
import { FolderOpen } from "lucide-react";
import { AttachmentList } from "@/components/upload";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback";
import { defineEntry, definePlayground } from "../types";
import { MAKE_FILE_SNIPPET, sampleFiles, type SampleFileKind } from "./fixtures";

const VARIANTS = ["list", "grid", "compact"] as const;
type Variant = (typeof VARIANTS)[number];

interface DemoProps {
  variant?: Variant;
  removable?: boolean;
  disabled?: boolean;
  kinds?: SampleFileKind[];
  emptyState?: React.ReactNode;
}

/** Lista controlada con eliminación por índice y restauración. */
function AttachmentListDemo({ kinds = ["pdf", "image", "spreadsheet"], ...props }: DemoProps) {
  const initial = React.useMemo(() => sampleFiles(kinds), [kinds]);
  const [files, setFiles] = React.useState<File[]>(initial);
  return (
    <div className="w-full space-y-3">
      <AttachmentList files={files} onRemove={(index) => setFiles((prev) => prev.filter((_, i) => i !== index))} {...props} />
      {files.length < initial.length && (
        <Button size="sm" variant="ghost" onClick={() => setFiles(initial)}>
          Restaurar {initial.length - files.length} archivo(s)
        </Button>
      )}
    </div>
  );
}

export const attachmentListEntry = defineEntry({
  id: "attachment-list",
  name: "AttachmentList",
  group: "upload",
  description:
    "Colección de archivos renderizada con FilePreview en tres layouts: lista de filas, grilla de tarjetas o chips compactos. Gestiona el estado vacío y delega la eliminación al padre por índice.",
  importPath: 'import { AttachmentList } from "@/components/upload"',
  sourcePath: "src/components/upload/AttachmentList.tsx",
  status: "stable",
  tags: ["presentacional", "composición"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", options: VARIANTS, default: "list" },
      removable: { type: "boolean", label: "Con quitar", default: true },
      disabled: { type: "boolean", default: false },
    },
    layout: "stretch",
    render: ({ variant, removable, disabled }) => <AttachmentListDemo variant={variant as Variant} removable={removable} disabled={disabled} />,
    code: ({ variant, removable, disabled }) =>
      `const [files, setFiles] = React.useState<File[]>(initialFiles);

<AttachmentList
  files={files}${variant !== "list" ? `\n  variant="${variant}"` : ""}${removable ? "\n  removable" : ""}
  onRemove={(index) => setFiles((prev) => prev.filter((_, i) => i !== index))}${disabled ? "\n  disabled" : ""}
/>`,
  }),
  examples: [
    {
      id: "list",
      title: "Lista con eliminación",
      description: "`onRemove` recibe el índice; el padre filtra sin mutar el array original.",
      layout: "stretch",
      code: `${MAKE_FILE_SNIPPET}

const [attachments, setAttachments] = React.useState(files);

<AttachmentList
  files={attachments}
  removable
  onRemove={(index) => setAttachments((prev) => prev.filter((_, i) => i !== index))}
/>`,
      render: () => <AttachmentListDemo removable />,
    },
    {
      id: "grid",
      title: "Grilla de tarjetas",
      description: "Con `variant=\"grid\"` cada archivo se muestra como FilePreview en tarjeta; la grilla es responsiva de 1 a 3 columnas.",
      layout: "stretch",
      code: `<AttachmentList files={files} variant="grid" removable onRemove={handleRemove} />`,
      render: () => <AttachmentListDemo variant="grid" removable kinds={["pdf", "image", "spreadsheet", "document", "archive", "video"]} />,
    },
    {
      id: "compact",
      title: "Chips compactos",
      description: "Para resúmenes en el pie de un formulario o dentro de un comentario.",
      layout: "stretch",
      code: `<AttachmentList files={files} variant="compact" removable onRemove={handleRemove} />`,
      render: () => <AttachmentListDemo variant="compact" removable kinds={["pdf", "image", "spreadsheet", "document"]} />,
    },
    {
      id: "empty",
      title: "Estado vacío",
      description: "Sin archivos muestra un EmptyState por defecto; puedes sustituirlo con `emptyState`.",
      layout: "stretch",
      code: `<AttachmentList files={[]} />

<AttachmentList
  files={[]}
  emptyState={
    <EmptyState
      icon={FolderOpen}
      title="Aún no hay soportes"
      description="Adjunta al menos un documento para enviar la solicitud."
      action={<Button size="sm">Adjuntar</Button>}
    />
  }
/>`,
      render: () => (
        <div className="grid w-full gap-4 lg:grid-cols-2">
          <AttachmentList files={[]} />
          <AttachmentList
            files={[]}
            emptyState={<EmptyState icon={FolderOpen} title="Aún no hay soportes" description="Adjunta al menos un documento para enviar la solicitud." action={<Button size="sm">Adjuntar</Button>} />}
          />
        </div>
      ),
    },
  ],
  props: [
    { name: "files", type: "Array<File | UploadFileItem>", description: "Archivos a mostrar. Con lista vacía renderiza el estado vacío." },
    { name: "variant", type: '"list" | "grid" | "compact"', default: '"list"', description: "Layout: filas, grilla de tarjetas o chips." },
    { name: "removable", type: "boolean", default: "false", description: "Muestra el botón de quitar en cada archivo." },
    { name: "onRemove", type: "(index: number) => void", description: "Índice del archivo a quitar." },
    { name: "emptyState", type: "React.ReactNode", description: "Reemplaza el EmptyState por defecto." },
    { name: "disabled", type: "boolean", default: "false", description: "Deshabilita todos los previews." },
    { name: "className", type: "string", description: "Clases extra para el contenedor (se añaden al layout)." },
  ],
  guidelines: {
    do: ["Úsalo junto a UploadZone o FileUpload para mostrar lo cargado con más detalle que la lista interna.", "Elige `grid` cuando importa reconocer el tipo de un vistazo; `list` cuando importa el nombre completo."],
    dont: ["No lo uses para archivos remotos con miniaturas reales: ahí va ImageGrid o Gallery.", "No ocultes el estado vacío con un `div` en blanco; explica qué hacer."],
  },
  related: ["file-preview", "upload-zone", "file-upload", "empty-state"],
});
