import * as React from "react";
import { UploadZone } from "@/components/upload";
import { defineEntry, definePlayground } from "../types";

interface DemoProps {
  multiple?: boolean;
  disabled?: boolean;
  isAI?: boolean;
  label?: string;
  accept?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  description?: string;
  error?: string;
  idleText?: string;
  activeText?: string;
  validate?: (files: File[]) => string | null;
}

function UploadZoneDemo(props: DemoProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  return <UploadZone value={files} onChange={setFiles} className="w-full max-w-xl" {...props} />;
}

/** Demo del `validate` extra: rechaza nombres repetidos dentro de la selección actual. */
function DuplicateGuardDemo() {
  const [files, setFiles] = React.useState<File[]>([]);
  const rejectDuplicates = (incoming: File[]) => {
    const names = new Set(files.map((file) => file.name));
    const dup = incoming.find((file) => names.has(file.name));
    return dup ? `"${dup.name}" ya está en la lista.` : null;
  };
  return (
    <UploadZone
      value={files}
      onChange={setFiles}
      multiple
      label="Evidencias"
      idleText="Arrastra las evidencias o haz clic"
      description="Cada archivo solo puede cargarse una vez."
      validate={rejectDuplicates}
      className="w-full max-w-xl"
    />
  );
}

const IDLE = "Arrastra archivos aquí o haz clic para buscar";
const ACTIVE = "Suelta para cargar…";

export const uploadZoneEntry = defineEntry({
  id: "upload-zone",
  name: "UploadZone",
  group: "upload",
  description:
    "Zona de arrastrar y soltar con la Drag & Drop API nativa y clic como alternativa. Valida tipo, tamaño y cantidad, acepta una comprobación extra síncrona y tiene una variante con la identidad de IA.",
  importPath: 'import { UploadZone } from "@/components/upload"',
  sourcePath: "src/components/upload/UploadZone.tsx",
  status: "stable",
  tags: ["controlado", "drag-drop", "ai"],
  playground: definePlayground({
    controls: {
      label: { type: "text", default: "Material del curso" },
      multiple: { type: "boolean", label: "Múltiple", default: true },
      maxSizeMB: { type: "number", label: "Máx. MB", default: 10, min: 1, max: 100 },
      isAI: { type: "boolean", label: "Estilo IA", default: false },
      disabled: { type: "boolean", default: false },
    },
    layout: "stretch",
    render: ({ label, multiple, maxSizeMB, isAI, disabled }) => (
      <UploadZoneDemo key={String(multiple)} label={label} multiple={multiple} maxSizeMB={maxSizeMB} isAI={isAI} disabled={disabled} idleText={IDLE} activeText={ACTIVE} description={`Hasta ${maxSizeMB} MB por archivo.`} />
    ),
    code: ({ label, multiple, maxSizeMB, isAI, disabled }) =>
      `const [files, setFiles] = React.useState<File[]>([]);

<UploadZone
  value={files}
  onChange={setFiles}
  label="${label}"${multiple ? "\n  multiple" : ""}
  maxSizeMB={${maxSizeMB}}
  idleText="${IDLE}"
  activeText="${ACTIVE}"
  description="Hasta ${maxSizeMB} MB por archivo."${isAI ? "\n  isAI" : ""}${disabled ? "\n  disabled" : ""}
/>`,
  }),
  examples: [
    {
      id: "images",
      title: "Solo imágenes",
      description: "Con `accept=\"image/*\"` el mensaje de rechazo se genera solo: «Acepta imágenes».",
      layout: "stretch",
      code: `const [files, setFiles] = React.useState<File[]>([]);

<UploadZone
  value={files}
  onChange={setFiles}
  label="Portada"
  accept="image/*"
  maxSizeMB={2}
  idleText="Arrastra la portada o haz clic"
  activeText="Suelta la imagen"
  description="PNG, JPG o WebP de hasta 2 MB."
/>`,
      render: () => <UploadZoneDemo label="Portada" accept="image/*" maxSizeMB={2} idleText="Arrastra la portada o haz clic" activeText="Suelta la imagen" description="PNG, JPG o WebP de hasta 2 MB." />,
    },
    {
      id: "validate",
      title: "Validación extra con `validate`",
      description: "Después de tipo y tamaño, puedes devolver un mensaje propio para rechazar la selección. Aquí, nombres duplicados.",
      layout: "stretch",
      code: `const [files, setFiles] = React.useState<File[]>([]);

const rejectDuplicates = (incoming: File[]) => {
  const names = new Set(files.map((file) => file.name));
  const dup = incoming.find((file) => names.has(file.name));
  return dup ? \`"\${dup.name}" ya está en la lista.\` : null;
};

<UploadZone
  value={files}
  onChange={setFiles}
  multiple
  label="Evidencias"
  idleText="Arrastra las evidencias o haz clic"
  description="Cada archivo solo puede cargarse una vez."
  validate={rejectDuplicates}
/>`,
      render: () => <DuplicateGuardDemo />,
    },
    {
      id: "ai",
      title: "Variante IA",
      description: "Con `isAI` el borde y el barrido de hover usan el gradiente de IA; úsala cuando la carga alimenta una función asistida.",
      layout: "stretch",
      code: `<UploadZone
  value={files}
  onChange={setFiles}
  isAI
  multiple
  accept=".pdf,.docx"
  idleText="Sube los documentos para generar el resumen"
  description="La IA leerá PDF y Word."
/>`,
      render: () => <UploadZoneDemo isAI multiple accept=".pdf,.docx" idleText="Sube los documentos para generar el resumen" activeText={ACTIVE} description="La IA leerá PDF y Word." />,
    },
    {
      id: "states",
      title: "Error externo y deshabilitada",
      layout: "stretch",
      code: `<UploadZone value={[]} idleText="Arrastra archivos aquí" error="No se pudo conectar con el almacenamiento." />
<UploadZone value={[]} idleText="Arrastra archivos aquí" description="Carga cerrada para este periodo." disabled />`,
      render: () => (
        <div className="grid w-full gap-4 md:grid-cols-2">
          <UploadZone value={[]} idleText="Arrastra archivos aquí" error="No se pudo conectar con el almacenamiento." />
          <UploadZone value={[]} idleText="Arrastra archivos aquí" description="Carga cerrada para este periodo." disabled />
        </div>
      ),
    },
  ],
  props: [
    { name: "value", type: "File[]", default: "[]", description: "Archivos seleccionados. El componente es controlado." },
    { name: "onChange", type: "(files: File[]) => void", description: "Nueva lista tras soltar, elegir o quitar un archivo." },
    { name: "accept", type: "string", description: "Extensiones o MIME admitidos (`.pdf,image/*`)." },
    { name: "multiple", type: "boolean", default: "false", description: "Permite varios archivos y acumula selecciones." },
    { name: "maxFiles", type: "number", description: "Cantidad máxima total, contando los ya seleccionados." },
    { name: "maxSizeMB", type: "number", description: "Tamaño máximo por archivo en megabytes." },
    { name: "validate", type: "(files: File[]) => string | null | undefined", description: "Comprobación síncrona extra. Devuelve un mensaje para rechazar la selección." },
    { name: "idleText", type: "string", default: '"Drag and drop files here…"', description: "Texto en reposo. Pásalo en español." },
    { name: "activeText", type: "string", default: '"Drop files here..."', description: "Texto mientras se arrastra encima." },
    { name: "label", type: "string", description: "Etiqueta sobre la zona." },
    { name: "description", type: "string", description: "Texto de ayuda; se oculta cuando hay error." },
    { name: "error", type: "string", description: "Error externo con prioridad sobre el local." },
    { name: "isAI", type: "boolean", default: "false", description: "Aplica el borde y barrido con el gradiente de IA." },
    { name: "disabled", type: "boolean", default: "false", description: "Bloquea arrastre, clic y eliminación." },
    { name: "className", type: "string", description: "Clases extra para el contenedor." },
  ],
  guidelines: {
    do: ["Úsala como carga principal de una pantalla, con espacio suficiente para arrastrar.", "Traduce `idleText` y `activeText`: los valores por defecto están en inglés.", "Combina `validate` con reglas de negocio (duplicados, nombres, cuotas)."],
    dont: ["No la pongas dentro de una fila de formulario estrecha; ahí va FileUpload.", "No uses `isAI` solo por estética: reserva el gradiente para funciones asistidas."],
  },
  related: ["file-upload", "attachment-list", "import-csv-panel", "ai-button"],
});
