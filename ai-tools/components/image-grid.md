# ImageGrid

La grilla técnica que pinta una lista de `MediaItem` en tarjetas, miniaturas compactas o un bento con spans. Soporta selección múltiple controlada y estado deshabilitado por ítem o global.

Familia: Media · Doc: `/docs#/components/image-grid` · Fuente: `src/components/media/ImageGrid.tsx`

```ts
import { ImageGrid } from "@/components/media"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `items` | `MediaItem[]` |  | Lista de ítems: `id`, `title`, `src`, `kind`, `badge`, `metadata`, `colSpan`, `rowSpan`… |
| `columns` | `2 \| 3 \| 4` | `3` | Columnas en escritorio (se reducen en móvil). Ignorado en bento. |
| `variant` | `"cards" \| "compact" \| "bento"` | `"cards"` | Tarjeta completa, miniatura cuadrada o bento con spans. |
| `selectable` | `boolean` | `false` | Activa el click y el indicador de selección. |
| `selectedIds` | `string[]` | `[]` | Ids seleccionados (controlado). |
| `onSelect` | `(id: string) => void` |  | Se llama con el id pulsado; el padre decide si añade o quita. |
| `disabled` | `boolean` | `false` | Deshabilita toda la grilla. Cada ítem puede traer su propio `disabled`. |
| `className` | `string` |  | Clases del contenedor grid. |

## Guías

- Sí: Usa `compact` para elegir entre muchos recursos y `cards` cuando la descripción importa.
- Sí: En bento, limita los ítems con span a uno o dos por bloque para que la composición respire.
- Sí: Provee `alt` en los ítems cuando la imagen aporta información.
- No: No uses ImageGrid suelto en una página: Gallery añade cabecera y estado vacío.
- No: No mezcles `colSpan`/`rowSpan` fuera de la variante bento; se ignoran.

Relacionados: gallery, preview-card, card, thema-carousel

## Ejemplos

### Tarjetas

Imagen 16:9, título, metadato y descripción. El `badge` se pinta sobre la imagen.

```tsx
// Placeholder SVG inline; en producción `src` es la URL real
const placeholder = (label: string) =>
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
    <rect width="640" height="360" fill="#2563eb"/>
    <text x="320" y="180" fill="#fff" font-size="40" text-anchor="middle">${label}</text>
  </svg>`);

const items: MediaItem[] = [
  { id: "liderazgo", title: "Liderazgo situacional", src: placeholder("Liderazgo"), kind: "video", badge: "Nuevo", metadata: "12 lecciones" },
  // …
];

<ImageGrid items={items} columns={3} />
```

### Miniaturas compactas

Cuadradas y con solo el título: para selectores de recursos o bibliotecas densas.

```tsx
<ImageGrid items={items} variant="compact" columns={4} />
```

### Bento

Los ítems con `colSpan`/`rowSpan` ocupan más celdas; `grid-flow-dense` rellena los huecos. Las columnas se fijan en 4.

```tsx
const bentoItems: MediaItem[] = [
  { ...items[0], colSpan: 2, rowSpan: 2 },
  items[1],
  items[2],
  { ...items[3], colSpan: 2 },
  items[4],
  items[5],
];

<ImageGrid items={bentoItems} variant="bento" />
```

### Selección múltiple

`selectedIds` y `onSelect` viven en el padre; la grilla solo avisa qué id se pulsó.

```tsx
const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
const toggle = (id: string) =>
  setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

<ImageGrid items={items} variant="compact" columns={4} selectable selectedIds={selectedIds} onSelect={toggle} />
```

### Sin miniatura

Cuando un ítem no trae `src`, se muestra el icono según `kind`.

```tsx
const items: MediaItem[] = [
  { id: "img", title: "Imagen sin miniatura", kind: "image", metadata: "PNG" },
  { id: "vid", title: "Video sin miniatura", kind: "video", metadata: "MP4" },
  { id: "doc", title: "Documento", kind: "document", metadata: "PDF" },
  { id: "oth", title: "Otro recurso", kind: "other", metadata: "ZIP" },
];

<ImageGrid items={items} columns={4} />
```
