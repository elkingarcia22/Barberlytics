import * as React from "react";
import { ImportCsvPanel, type CsvPreviewColumn, type CsvPreviewRow, type UploadProgressStatus } from "@/components/upload";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const STATUSES = ["idle", "validating", "uploading", "success", "error"] as const;
const TICK_MS = 100;
const STEP = 5;
const VALIDATING_MS = 800;
const PREVIEW_ROWS = 5;

const SAMPLE_CSV = `nombre,correo,area,cargo
Ana Rojas,ana.rojas@empresa.com,Talento,Analista
Luis Pérez,luis.perez@empresa.com,Ventas,Ejecutivo
Marta Díaz,marta.diaz@empresa.com,Tecnología,Líder técnico
Jorge Ruiz,jorge.ruiz@empresa.com,Finanzas,Contador
Sofía Mora,sofia.mora@empresa.com,Operaciones,Coordinadora
Diego León,diego.leon@empresa.com,Ventas,Ejecutivo`;

/** Parser mínimo para la demo: sin comillas ni comas escapadas. */
function parseCsv(text: string, limit = PREVIEW_ROWS): { columns: CsvPreviewColumn[]; rows: CsvPreviewRow[] } {
  const [header = "", ...lines] = text.trim().split(/\r?\n/);
  const keys = header.split(",").map((key) => key.trim());
  const columns = keys.map((key) => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1) }));
  const rows = lines.slice(0, limit).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(keys.map((key, i) => [key, cells[i]?.trim() ?? ""]));
  });
  return { columns, rows };
}

const sampleCsvFile = () => new File([SAMPLE_CSV], "colaboradores.csv", { type: "text/csv" });
const SAMPLE_PREVIEW = parseCsv(SAMPLE_CSV);

/** Flujo completo: elegir archivo (real o de ejemplo), leerlo, previsualizar e importar con progreso simulado. */
function ImportCsvFlow() {
  const [file, setFile] = React.useState<File>();
  const [preview, setPreview] = React.useState<ReturnType<typeof parseCsv>>();
  const [status, setStatus] = React.useState<UploadProgressStatus>("idle");
  const [progress, setProgress] = React.useState(0);

  const loadFile = async (files: File[]) => {
    const next = files[0];
    setStatus("idle");
    setProgress(0);
    setFile(next);
    setPreview(next ? parseCsv(await next.text()) : undefined);
  };

  React.useEffect(() => {
    if (status !== "uploading") return;
    const timer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev + STEP >= 100) {
          window.clearInterval(timer);
          setStatus("validating");
          return 100;
        }
        return prev + STEP;
      });
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [status]);

  React.useEffect(() => {
    if (status !== "validating") return;
    const timer = window.setTimeout(() => setStatus("success"), VALIDATING_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  const isBusy = status === "uploading" || status === "validating";

  return (
    <ImportCsvPanel
      file={file}
      onFileChange={loadFile}
      previewColumns={preview?.columns}
      previewRows={preview?.rows}
      status={status}
      progress={progress}
      className="w-full"
      actions={
        <>
          {!file && (
            <Button variant="outline" onClick={() => loadFile([sampleCsvFile()])}>
              Usar archivo de ejemplo
            </Button>
          )}
          <Button disabled={!file || isBusy || status === "success"} onClick={() => setStatus("uploading")}>
            {status === "success" ? "Importado" : "Importar"}
          </Button>
        </>
      }
    />
  );
}

export const importCsvPanelEntry = defineEntry({
  id: "import-csv-panel",
  name: "ImportCsvPanel",
  group: "upload",
  description:
    "Panel completo de importación CSV que orquesta UploadZone, FilePreview, UploadProgress y una tabla de previsualización. No parsea el archivo: el padre le entrega columnas y filas ya leídas, además del estado y el progreso.",
  importPath: 'import { ImportCsvPanel } from "@/components/upload"',
  sourcePath: "src/components/upload/ImportCsvPanel.tsx",
  status: "stable",
  tags: ["composición", "controlado"],
  playground: definePlayground({
    controls: {
      status: { type: "select", options: STATUSES, default: "idle" },
      progress: { type: "number", label: "Progreso", default: 0, min: 0, max: 100, step: 5 },
      withPreview: { type: "boolean", label: "Con previsualización", default: true },
      disabled: { type: "boolean", default: false },
    },
    layout: "stretch",
    render: ({ status, progress, withPreview, disabled }) => (
      <ImportCsvPanel
        file={sampleCsvFile()}
        previewColumns={withPreview ? SAMPLE_PREVIEW.columns : undefined}
        previewRows={withPreview ? SAMPLE_PREVIEW.rows : undefined}
        status={status as UploadProgressStatus}
        progress={progress}
        error="La columna «correo» tiene 2 valores inválidos."
        disabled={disabled}
        className="w-full"
        actions={<Button disabled={disabled}>Importar</Button>}
      />
    ),
    code: ({ status, progress, withPreview, disabled }) =>
      `<ImportCsvPanel
  file={file}
  onFileChange={handleFileChange}${withPreview ? "\n  previewColumns={columns}\n  previewRows={rows}" : ""}
  status="${status}"
  progress={${progress}}${status === "error" ? '\n  error="La columna «correo» tiene 2 valores inválidos."' : ""}${disabled ? "\n  disabled" : ""}
  actions={<Button>Importar</Button>}
/>`,
  }),
  examples: [
    {
      id: "flow",
      title: "Flujo completo",
      description: "Arrastra un CSV real o usa el de ejemplo: se lee con `file.text()`, se parsea en cliente y «Importar» simula la carga con un intervalo.",
      layout: "stretch",
      code: `const csv = \`nombre,correo,area
Ana Rojas,ana.rojas@empresa.com,Talento
Luis Pérez,luis.perez@empresa.com,Ventas\`;
const sampleFile = new File([csv], "colaboradores.csv", { type: "text/csv" });

const [file, setFile] = React.useState<File>();
const [preview, setPreview] = React.useState<{ columns: CsvPreviewColumn[]; rows: CsvPreviewRow[] }>();
const [status, setStatus] = React.useState<UploadProgressStatus>("idle");
const [progress, setProgress] = React.useState(0);

const loadFile = async (files: File[]) => {
  const next = files[0];
  setFile(next);
  setPreview(next ? parseCsv(await next.text()) : undefined);
};

<ImportCsvPanel
  file={file}
  onFileChange={loadFile}
  previewColumns={preview?.columns}
  previewRows={preview?.rows}
  status={status}
  progress={progress}
  actions={<Button onClick={() => setStatus("uploading")}>Importar</Button>}
/>`,
      render: () => <ImportCsvFlow />,
    },
    {
      id: "preview",
      title: "Archivo cargado con previsualización",
      description: "Con `file`, `previewColumns` y `previewRows` el panel muestra la fila del archivo y la tabla, listo para confirmar.",
      layout: "stretch",
      code: `<ImportCsvPanel
  file={file}
  onFileChange={handleFileChange}
  previewColumns={columns}
  previewRows={rows}
  actions={
    <>
      <Button variant="ghost">Cancelar</Button>
      <Button>Importar 6 registros</Button>
    </>
  }
/>`,
      render: () => (
        <ImportCsvPanel
          file={sampleCsvFile()}
          previewColumns={SAMPLE_PREVIEW.columns}
          previewRows={SAMPLE_PREVIEW.rows}
          className="w-full"
          actions={
            <>
              <Button variant="ghost">Cancelar</Button>
              <Button>Importar 6 registros</Button>
            </>
          }
        />
      ),
    },
    {
      id: "error",
      title: "Error de validación",
      description: "En `error` el archivo vuelve a ser removible y la barra muestra el mensaje; la previsualización sigue visible para corregir.",
      layout: "stretch",
      code: `<ImportCsvPanel
  file={file}
  previewColumns={columns}
  previewRows={rows}
  status="error"
  progress={100}
  error="La columna «correo» tiene 2 valores inválidos."
  actions={<Button variant="outline">Descargar reporte de errores</Button>}
/>`,
      render: () => (
        <ImportCsvPanel
          file={sampleCsvFile()}
          previewColumns={SAMPLE_PREVIEW.columns}
          previewRows={SAMPLE_PREVIEW.rows}
          status="error"
          progress={100}
          error="La columna «correo» tiene 2 valores inválidos."
          className="w-full"
          actions={<Button variant="outline">Descargar reporte de errores</Button>}
        />
      ),
    },
  ],
  props: [
    { name: "file", type: "File | UploadFileItem", description: "Archivo elegido. Sin él se muestra la UploadZone." },
    { name: "onFileChange", type: "(files: File[]) => void", description: "Se llama al soltar/elegir y con `[]` al quitar el archivo." },
    { name: "previewColumns", type: "CsvPreviewColumn[]", description: "Columnas `{ key, label }` de la tabla de previsualización." },
    { name: "previewRows", type: "CsvPreviewRow[]", description: "Filas ya parseadas (solo las primeras N)." },
    { name: "progress", type: "number", default: "0", description: "Progreso 0–100 para la UploadProgress interna." },
    { name: "status", type: "UploadProgressStatus", default: '"idle"', description: "Estado de la operación; en `uploading` se oculta la tabla." },
    { name: "error", type: "string", description: "Mensaje mostrado cuando `status` es `error`." },
    { name: "disabled", type: "boolean", default: "false", description: "Deshabilita zona y preview." },
    { name: "maxSizeMB", type: "number", default: "10", description: "Límite de tamaño para la UploadZone interna." },
    { name: "actions", type: "React.ReactNode", description: "Botones del pie (importar, cancelar)." },
    { name: "className", type: "string", description: "Clases extra para la Card." },
  ],
  guidelines: {
    do: ["Parsea en cliente solo para la previsualización; la validación definitiva va en el servidor.", "Limita `previewRows` a las primeras 5–10 filas: la tabla no pagina.", "Deshabilita el botón de importar mientras `status` sea `uploading` o `validating`."],
    dont: ["No pases el archivo completo como filas: para miles de registros usa DataTable con paginación.", "No ocultes el `error` del servidor; el usuario debe poder corregir y reintentar."],
  },
  related: ["upload-zone", "upload-progress", "file-preview", "table"],
});
