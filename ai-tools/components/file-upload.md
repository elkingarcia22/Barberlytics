# FileUpload

Selección de archivos mediante un botón y la File API nativa, sin arrastrar. Valida tipo, tamaño y cantidad antes de avisar al padre y lista lo elegido con opción de quitarlo.

Familia: Archivos · Doc: `/docs#/components/file-upload` · Fuente: `src/components/upload/FileUpload.tsx`

```ts
import { FileUpload } from "@/components/upload"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `File[]` | `[]` | Archivos seleccionados. El componente es controlado. |
| `onChange` | `(files: File[]) => void` |  | Se llama con la nueva lista tras validar o al quitar un archivo. |
| `accept` | `string` |  | Extensiones o MIME admitidos, como en el atributo nativo (`.pdf,image/*`). |
| `multiple` | `boolean` | `false` | Permite varios archivos; las selecciones se acumulan. |
| `maxFiles` | `number` |  | Cantidad máxima de archivos permitida. |
| `maxSizeMB` | `number` |  | Tamaño máximo por archivo en megabytes. |
| `disabled` | `boolean` | `false` | Desactiva el botón y oculta los botones de quitar. |
| `label` | `string` |  | Etiqueta sobre el botón. |
| `description` | `string` |  | Texto de ayuda; se oculta cuando hay error. |
| `error` | `string` |  | Error externo. Tiene prioridad sobre el de validación local. |
| `buttonLabel` | `string` | `"Choose file"` | Texto del botón de selección. |
| `className` | `string` |  | Clases extra para el contenedor. |

## Guías

- Sí: Úsalo en formularios densos donde una zona de arrastre ocuparía demasiado.
- Sí: Define `accept` y `maxSizeMB` siempre: el mensaje de error se deriva de ellos.
- Sí: Pasa `buttonLabel` en español; el valor por defecto está en inglés.
- No: No lo uses para cargas masivas: ahí conviene UploadZone o ImportCsvPanel.
- No: No dupliques la lista de archivos fuera del componente; ya la muestra.

Relacionados: upload-zone, attachment-list, button

## Ejemplos

### Un solo archivo

Con `accept` la validación rechaza en cliente y muestra qué tipos sí se admiten.

```tsx
const [files, setFiles] = React.useState<File[]>([]);

<FileUpload
  value={files}
  onChange={setFiles}
  label="Certificado"
  buttonLabel="Elegir PDF"
  accept=".pdf"
  maxSizeMB={5}
  description="Solo PDF, hasta 5 MB."
/>
```

### Varios archivos con límite

Con `multiple` cada selección se suma a la anterior y el botón cambia a «Add more». `maxFiles` corta el exceso.

```tsx
const [files, setFiles] = React.useState<File[]>([]);

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
/>
```

### Con valor inicial y error externo

El padre puede inyectar archivos ya elegidos y un `error` propio (p. ej. del servidor); este tiene prioridad sobre la validación local.

```tsx
// Archivos de ejemplo (en producción vienen del <input type="file">)
const files = [
  new File([new Uint8Array(1240 * 1024)], "informe-trimestral.pdf", { type: "application/pdf" }),
  new File([new Uint8Array(340 * 1024)], "portada-curso.png", { type: "image/png" }),
  new File([new Uint8Array(96 * 1024)], "nomina-marzo.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
];

<FileUpload
  value={files}
  onChange={setFiles}
  label="Documentos del contrato"
  multiple
  error="El servidor rechazó la carga: sesión expirada."
/>
```
