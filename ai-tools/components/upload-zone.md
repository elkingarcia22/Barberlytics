# UploadZone

Zona de arrastrar y soltar con la Drag & Drop API nativa y clic como alternativa. Valida tipo, tamaño y cantidad, acepta una comprobación extra síncrona y tiene una variante con la identidad de IA.

Familia: Archivos · Doc: `/docs#/components/upload-zone` · Fuente: `src/components/upload/UploadZone.tsx`

```ts
import { UploadZone } from "@/components/upload"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `File[]` | `[]` | Archivos seleccionados. El componente es controlado. |
| `onChange` | `(files: File[]) => void` |  | Nueva lista tras soltar, elegir o quitar un archivo. |
| `accept` | `string` |  | Extensiones o MIME admitidos (`.pdf,image/*`). |
| `multiple` | `boolean` | `false` | Permite varios archivos y acumula selecciones. |
| `maxFiles` | `number` |  | Cantidad máxima total, contando los ya seleccionados. |
| `maxSizeMB` | `number` |  | Tamaño máximo por archivo en megabytes. |
| `validate` | `(files: File[]) => string \| null \| undefined` |  | Comprobación síncrona extra. Devuelve un mensaje para rechazar la selección. |
| `idleText` | `string` | `"Drag and drop files here…"` | Texto en reposo. Pásalo en español. |
| `activeText` | `string` | `"Drop files here..."` | Texto mientras se arrastra encima. |
| `label` | `string` |  | Etiqueta sobre la zona. |
| `description` | `string` |  | Texto de ayuda; se oculta cuando hay error. |
| `error` | `string` |  | Error externo con prioridad sobre el local. |
| `isAI` | `boolean` | `false` | Aplica el borde y barrido con el gradiente de IA. |
| `disabled` | `boolean` | `false` | Bloquea arrastre, clic y eliminación. |
| `className` | `string` |  | Clases extra para el contenedor. |

## Guías

- Sí: Úsala como carga principal de una pantalla, con espacio suficiente para arrastrar.
- Sí: Traduce `idleText` y `activeText`: los valores por defecto están en inglés.
- Sí: Combina `validate` con reglas de negocio (duplicados, nombres, cuotas).
- No: No la pongas dentro de una fila de formulario estrecha; ahí va FileUpload.
- No: No uses `isAI` solo por estética: reserva el gradiente para funciones asistidas.

Relacionados: file-upload, attachment-list, import-csv-panel, ai-button

## Ejemplos

### Solo imágenes

Con `accept="image/*"` el mensaje de rechazo se genera solo: «Acepta imágenes».

```tsx
const [files, setFiles] = React.useState<File[]>([]);

<UploadZone
  value={files}
  onChange={setFiles}
  label="Portada"
  accept="image/*"
  maxSizeMB={2}
  idleText="Arrastra la portada o haz clic"
  activeText="Suelta la imagen"
  description="PNG, JPG o WebP de hasta 2 MB."
/>
```

### Validación extra con `validate`

Después de tipo y tamaño, puedes devolver un mensaje propio para rechazar la selección. Aquí, nombres duplicados.

```tsx
const [files, setFiles] = React.useState<File[]>([]);

const rejectDuplicates = (incoming: File[]) => {
  const names = new Set(files.map((file) => file.name));
  const dup = incoming.find((file) => names.has(file.name));
  return dup ? `"${dup.name}" ya está en la lista.` : null;
};

<UploadZone
  value={files}
  onChange={setFiles}
  multiple
  label="Evidencias"
  idleText="Arrastra las evidencias o haz clic"
  description="Cada archivo solo puede cargarse una vez."
  validate={rejectDuplicates}
/>
```

### Variante IA

Con `isAI` el borde y el barrido de hover usan el gradiente de IA; úsala cuando la carga alimenta una función asistida.

```tsx
<UploadZone
  value={files}
  onChange={setFiles}
  isAI
  multiple
  accept=".pdf,.docx"
  idleText="Sube los documentos para generar el resumen"
  description="La IA leerá PDF y Word."
/>
```

### Error externo y deshabilitada

```tsx
<UploadZone value={[]} idleText="Arrastra archivos aquí" error="No se pudo conectar con el almacenamiento." />
<UploadZone value={[]} idleText="Arrastra archivos aquí" description="Carga cerrada para este periodo." disabled />
```
