import * as React from "react";
import { FileUpload } from "@/components/upload";
import { defineEntry, definePlayground } from "../types";
import { MAKE_FILE_SNIPPET, sampleFiles } from "./fixtures";

interface DemoProps {
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  buttonLabel?: string;
  accept?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  description?: string;
  error?: string;
  initial?: File[];
}

/** Envuelve el componente controlado con su propio estado para la demo. */
function FileUploadDemo({ initial = [], ...props }: DemoProps) {
  const [files, setFiles] = React.useState<File[]>(initial);
  return <FileUpload value={files} onChange={setFiles} className="w-full max-w-md" {...props} />;
}

export const fileUploadEntry = defineEntry({
  id: "file-upload",
  name: "FileUpload",
  group: "upload",
  description:
    "Selección de archivos mediante un botón y la File API nativa, sin arrastrar. Valida tipo, tamaño y cantidad antes de avisar al padre y lista lo elegido con opción de quitarlo.",
  importPath: 'import { FileUpload } from "@/components/upload"',
  sourcePath: "src/components/upload/FileUpload.tsx",
  status: "stable",
  tags: ["controlado", "file-api"],
  playground: definePlayground({
    controls: {
      label: { type: "text", default: "Adjuntar evidencia" },
      buttonLabel: { type: "text", label: "Texto del botón", default: "Elegir archivo" },
      multiple: { type: "boolean", label: "Múltiple", default: false },
      maxSizeMB: { type: "number", label: "Máx. MB", default: 5, min: 1, max: 50 },
      disabled: { type: "boolean", default: false },
    },
    layout: "start",
    render: ({ label, buttonLabel, multiple, maxSizeMB, disabled }) => (
      <FileUploadDemo
        key={String(multiple)}
        label={label}
        buttonLabel={buttonLabel}
        multiple={multiple}
        maxSizeMB={maxSizeMB}
        disabled={disabled}
        description={`Hasta ${maxSizeMB} MB por archivo.`}
      />
    ),
    code: ({ label, buttonLabel, multiple, maxSizeMB, disabled }) =>
      `const [files, setFiles] = React.useState<File[]>([]);

<FileUpload
  value={files}
  onChange={setFiles}
  label="${label}"
  buttonLabel="${buttonLabel}"${multiple ? "\n  multiple" : ""}
  maxSizeMB={${maxSizeMB}}
  description="Hasta ${maxSizeMB} MB por archivo."${disabled ? "\n  disabled" : ""}
/>`,
  }),
  examples: [
    {
      id: "single",
      title: "Un solo archivo",
      description: "Con `accept` la validación rechaza en cliente y muestra qué tipos sí se admiten.",
      layout: "start",
      code: `const [files, setFiles] = React.useState<File[]>([]);

<FileUpload
  value={files}
  onChange={setFiles}
  label="Certificado"
  buttonLabel="Elegir PDF"
  accept=".pdf"
  maxSizeMB={5}
  description="Solo PDF, hasta 5 MB."
/>`,
      render: () => <FileUploadDemo label="Certificado" buttonLabel="Elegir PDF" accept=".pdf" maxSizeMB={5} description="Solo PDF, hasta 5 MB." />,
    },
    {
      id: "multiple",
      title: "Varios archivos con límite",
      description: "Con `multiple` cada selección se suma a la anterior y el botón cambia a «Add more». `maxFiles` corta el exceso.",
      layout: "start",
      code: `const [files, setFiles] = React.useState<File[]>([]);

<FileUpload
  value={files}
  onChange={setFiles}
  label="Soportes"
  buttonLabel="Agregar soportes"
  multiple
  maxFiles={3}
  maxSizeMB={10}
  accept=".pdf,.png,.jpg"
  description="Hasta 3 archivos de máximo 10 MB."
/>`,
      render: () => (
        <FileUploadDemo label="Soportes" buttonLabel="Agregar soportes" multiple maxFiles={3} maxSizeMB={10} accept=".pdf,.png,.jpg" description="Hasta 3 archivos de máximo 10 MB." />
      ),
    },
    {
      id: "prefilled",
      title: "Con valor inicial y error externo",
      description: "El padre puede inyectar archivos ya elegidos y un `error` propio (p. ej. del servidor); este tiene prioridad sobre la validación local.",
      layout: "start",
      code: `${MAKE_FILE_SNIPPET}

<FileUpload
  value={files}
  onChange={setFiles}
  label="Documentos del contrato"
  multiple
  error="El servidor rechazó la carga: sesión expirada."
/>`,
      render: () => <FileUploadDemo label="Documentos del contrato" multiple initial={sampleFiles(["pdf", "spreadsheet"])} error="El servidor rechazó la carga: sesión expirada." />,
    },
  ],
  props: [
    { name: "value", type: "File[]", default: "[]", description: "Archivos seleccionados. El componente es controlado." },
    { name: "onChange", type: "(files: File[]) => void", description: "Se llama con la nueva lista tras validar o al quitar un archivo." },
    { name: "accept", type: "string", description: "Extensiones o MIME admitidos, como en el atributo nativo (`.pdf,image/*`)." },
    { name: "multiple", type: "boolean", default: "false", description: "Permite varios archivos; las selecciones se acumulan." },
    { name: "maxFiles", type: "number", description: "Cantidad máxima de archivos permitida." },
    { name: "maxSizeMB", type: "number", description: "Tamaño máximo por archivo en megabytes." },
    { name: "disabled", type: "boolean", default: "false", description: "Desactiva el botón y oculta los botones de quitar." },
    { name: "label", type: "string", description: "Etiqueta sobre el botón." },
    { name: "description", type: "string", description: "Texto de ayuda; se oculta cuando hay error." },
    { name: "error", type: "string", description: "Error externo. Tiene prioridad sobre el de validación local." },
    { name: "buttonLabel", type: "string", default: '"Choose file"', description: "Texto del botón de selección." },
    { name: "className", type: "string", description: "Clases extra para el contenedor." },
  ],
  guidelines: {
    do: ["Úsalo en formularios densos donde una zona de arrastre ocuparía demasiado.", "Define `accept` y `maxSizeMB` siempre: el mensaje de error se deriva de ellos.", "Pasa `buttonLabel` en español; el valor por defecto está en inglés."],
    dont: ["No lo uses para cargas masivas: ahí conviene UploadZone o ImportCsvPanel.", "No dupliques la lista de archivos fuera del componente; ya la muestra."],
  },
  related: ["upload-zone", "attachment-list", "button"],
});
