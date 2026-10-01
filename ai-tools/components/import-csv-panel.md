# ImportCsvPanel

Panel completo de importación CSV que orquesta UploadZone, FilePreview, UploadProgress y una tabla de previsualización. No parsea el archivo: el padre le entrega columnas y filas ya leídas, además del estado y el progreso.

Familia: Archivos · Doc: `/docs#/components/import-csv-panel` · Fuente: `src/components/upload/ImportCsvPanel.tsx`

```ts
import { ImportCsvPanel } from "@/components/upload"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `file` | `File \| UploadFileItem` |  | Archivo elegido. Sin él se muestra la UploadZone. |
| `onFileChange` | `(files: File[]) => void` |  | Se llama al soltar/elegir y con `[]` al quitar el archivo. |
| `previewColumns` | `CsvPreviewColumn[]` |  | Columnas `{ key, label }` de la tabla de previsualización. |
| `previewRows` | `CsvPreviewRow[]` |  | Filas ya parseadas (solo las primeras N). |
| `progress` | `number` | `0` | Progreso 0–100 para la UploadProgress interna. |
| `status` | `UploadProgressStatus` | `"idle"` | Estado de la operación; en `uploading` se oculta la tabla. |
| `error` | `string` |  | Mensaje mostrado cuando `status` es `error`. |
| `disabled` | `boolean` | `false` | Deshabilita zona y preview. |
| `maxSizeMB` | `number` | `10` | Límite de tamaño para la UploadZone interna. |
| `actions` | `React.ReactNode` |  | Botones del pie (importar, cancelar). |
| `className` | `string` |  | Clases extra para la Card. |

## Guías

- Sí: Parsea en cliente solo para la previsualización; la validación definitiva va en el servidor.
- Sí: Limita `previewRows` a las primeras 5–10 filas: la tabla no pagina.
- Sí: Deshabilita el botón de importar mientras `status` sea `uploading` o `validating`.
- No: No pases el archivo completo como filas: para miles de registros usa DataTable con paginación.
- No: No ocultes el `error` del servidor; el usuario debe poder corregir y reintentar.

Relacionados: upload-zone, upload-progress, file-preview, table

## Ejemplos

### Flujo completo

Arrastra un CSV real o usa el de ejemplo: se lee con `file.text()`, se parsea en cliente y «Importar» simula la carga con un intervalo.

```tsx
const csv = `nombre,correo,area
Ana Rojas,ana.rojas@empresa.com,Talento
Luis Pérez,luis.perez@empresa.com,Ventas`;
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
/>
```

### Archivo cargado con previsualización

Con `file`, `previewColumns` y `previewRows` el panel muestra la fila del archivo y la tabla, listo para confirmar.

```tsx
<ImportCsvPanel
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
/>
```

### Error de validación

En `error` el archivo vuelve a ser removible y la barra muestra el mensaje; la previsualización sigue visible para corregir.

```tsx
<ImportCsvPanel
  file={file}
  previewColumns={columns}
  previewRows={rows}
  status="error"
  progress={100}
  error="La columna «correo» tiene 2 valores inválidos."
  actions={<Button variant="outline">Descargar reporte de errores</Button>}
/>
```
