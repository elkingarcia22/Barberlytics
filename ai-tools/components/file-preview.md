# FilePreview

Muestra los metadatos de un archivo (nombre, tamaño y familia) con un icono por tipo. Tres variantes de densidad: tarjeta para grillas, fila para listas y chip compacto para resúmenes.

Familia: Archivos · Doc: `/docs#/components/file-preview` · Fuente: `src/components/upload/FilePreview.tsx`

```ts
import { FilePreview } from "@/components/upload"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `file` | `File \| UploadFileItem` |  | El archivo o sus metadatos. Solo se leen `name`, `size` y `type`. |
| `variant` | `"card" \| "row" \| "compact"` | `"card"` | Densidad visual: tarjeta, fila o chip. |
| `removable` | `boolean` | `false` | Muestra el botón de quitar. |
| `onRemove` | `() => void` |  | Se llama al pulsar quitar. El padre decide qué hacer. |
| `disabled` | `boolean` | `false` | Baja la opacidad y oculta el botón de quitar. |
| `error` | `string` |  | Mensaje de error por archivo; cambia el borde y el icono. |
| `className` | `string` |  | Clases extra (p. ej. un ancho fijo). |

## Guías

- Sí: Usa `row` en listas verticales y `compact` cuando el espacio es un resumen o un chip de filtro.
- Sí: Muestra el `error` aquí cuando el fallo es de un archivo, no de toda la carga.
- No: No lo uses para previsualizar el contenido de la imagen: para eso está MediaPreview.
- No: No mezcles variantes dentro de la misma lista.

Relacionados: attachment-list, upload-zone, media-preview, card

## Ejemplos

### Variantes

El mismo archivo en tarjeta, fila y chip. AttachmentList elige la variante según su layout.

```tsx
<FilePreview file={file} variant="card" removable />
<FilePreview file={file} variant="row" removable />
<FilePreview file={file} variant="compact" removable />
```

### Icono por tipo de archivo

La familia se resuelve con `getFileKind` a partir del MIME o la extensión: imagen, PDF, hoja de cálculo, documento, comprimido, audio y video.

```tsx
{files.map((file) => (
  <FilePreview key={file.name} file={file} variant="card" />
))}
```

### Filas con eliminación

`onRemove` no muta nada: el padre filtra la lista y vuelve a renderizar.

```tsx
const [files, setFiles] = React.useState<File[]>(initialFiles);

{files.map((file) => (
  <FilePreview
    key={file.name}
    file={file}
    variant="row"
    removable
    onRemove={() => setFiles((prev) => prev.filter((item) => item !== file))}
  />
))}
```

### Con error

El mensaje se pinta dentro del componente; útil para validaciones por archivo (virus, corrupto, formato).

```tsx
<FilePreview file={file} variant="row" error="Excede el límite de 5 MB." removable />
<FilePreview file={file} variant="card" error="No se pudo escanear el archivo." />
```
