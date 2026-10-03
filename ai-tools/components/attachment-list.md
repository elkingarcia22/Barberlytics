# AttachmentList

Colección de archivos renderizada con FilePreview en tres layouts: lista de filas, grilla de tarjetas o chips compactos. Gestiona el estado vacío y delega la eliminación al padre por índice.

Familia: Archivos · Doc: `/docs#/components/attachment-list` · Fuente: `src/components/upload/AttachmentList.tsx`

```ts
import { AttachmentList } from "@/components/upload"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `files` | `Array<File \| UploadFileItem>` |  | Archivos a mostrar. Con lista vacía renderiza el estado vacío. |
| `variant` | `"list" \| "grid" \| "compact"` | `"list"` | Layout: filas, grilla de tarjetas o chips. |
| `removable` | `boolean` | `false` | Muestra el botón de quitar en cada archivo. |
| `onRemove` | `(index: number) => void` |  | Índice del archivo a quitar. |
| `emptyState` | `React.ReactNode` |  | Reemplaza el EmptyState por defecto. |
| `disabled` | `boolean` | `false` | Deshabilita todos los previews. |
| `className` | `string` |  | Clases extra para el contenedor (se añaden al layout). |

## Guías

- Sí: Úsalo junto a UploadZone o FileUpload para mostrar lo cargado con más detalle que la lista interna.
- Sí: Elige `grid` cuando importa reconocer el tipo de un vistazo; `list` cuando importa el nombre completo.
- No: No lo uses para archivos remotos con miniaturas reales: ahí va ImageGrid o Gallery.
- No: No ocultes el estado vacío con un `div` en blanco; explica qué hacer.

Relacionados: file-preview, upload-zone, file-upload, empty-state

## Ejemplos

### Lista con eliminación

`onRemove` recibe el índice; el padre filtra sin mutar el array original.

```tsx
// Archivos de ejemplo (en producción vienen del <input type="file">)
const files = [
  new File([new Uint8Array(1240 * 1024)], "informe-trimestral.pdf", { type: "application/pdf" }),
  new File([new Uint8Array(340 * 1024)], "portada-curso.png", { type: "image/png" }),
  new File([new Uint8Array(96 * 1024)], "nomina-marzo.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
];

const [attachments, setAttachments] = React.useState(files);

<AttachmentList
  files={attachments}
  removable
  onRemove={(index) => setAttachments((prev) => prev.filter((_, i) => i !== index))}
/>
```

### Grilla de tarjetas

Con `variant="grid"` cada archivo se muestra como FilePreview en tarjeta; la grilla es responsiva de 1 a 3 columnas.

```tsx
<AttachmentList files={files} variant="grid" removable onRemove={handleRemove} />
```

### Chips compactos

Para resúmenes en el pie de un formulario o dentro de un comentario.

```tsx
<AttachmentList files={files} variant="compact" removable onRemove={handleRemove} />
```

### Estado vacío

Sin archivos muestra un EmptyState por defecto; puedes sustituirlo con `emptyState`.

```tsx
<AttachmentList files={[]} />

<AttachmentList
  files={[]}
  emptyState={
    <EmptyState
      icon="file"
      title="Aún no hay soportes"
      description="Adjunta al menos un documento para enviar la solicitud."
      action={<Button size="sm">Adjuntar</Button>}
    />
  }
/>
```
