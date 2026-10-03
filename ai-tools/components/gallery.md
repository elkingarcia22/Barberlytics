# Gallery

El contenedor de página para colecciones multimedia: SectionHeader con título y acciones, ImageGrid debajo y un estado vacío automático cuando no hay ítems. Acepta las mismas props de grilla y selección que ImageGrid.

Familia: Media · Doc: `/docs#/components/gallery` · Fuente: `src/components/media/Gallery.tsx`

```ts
import { Gallery } from "@/components/media"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `items` | `MediaItem[]` |  | Ítems a mostrar. Vacío o indefinido activa el estado vacío. |
| `title` | `string` |  | Título de la sección; activa el SectionHeader. |
| `description` | `string` |  | Subtítulo bajo el título. |
| `actions` | `ReactNode` |  | Botones alineados a la derecha de la cabecera. |
| `emptyState` | `ReactNode` |  | Reemplaza el EmptyGalleryState por defecto. |
| `columns` | `2 \| 3 \| 4` | `3` | Columnas de la grilla (ignorado en bento). |
| `variant` | `"cards" \| "compact" \| "bento"` | `"cards"` | Variante visual que se pasa a ImageGrid. |
| `selectable` | `boolean` | `false` | Habilita la selección de ítems. |
| `selectedIds` | `string[]` | `[]` | Ids seleccionados (controlado). |
| `onSelect` | `(id: string) => void` |  | Avisa el id pulsado. |
| `disabled` | `boolean` | `false` | Deshabilita toda la grilla. |
| `className` | `string` |  | Clases del contenedor. |

## Guías

- Sí: Coloca la acción principal (subir, crear) en `actions`, y repítela en el `emptyState` para no dejar al usuario sin salida.
- Sí: Usa `title` siempre que la galería sea una sección de página; sin él usa ImageGrid directamente.
- No: No pongas más de dos acciones en la cabecera; el resto va a un menú.
- No: No uses Gallery para un único recurso: para eso está MediaPreview.

Relacionados: image-grid, empty-gallery-state, preview-card, upload-zone

## Ejemplos

### Sección con acciones

Título, descripción y botones a la derecha. Sin `title` la cabecera no se renderiza.

```tsx
<Gallery
  title="Biblioteca de recursos"
  description="Todo lo que tu equipo ha compartido."
  actions={<Button size="sm"><Upload /> Subir</Button>}
  items={items}
/>
```

### Selección única

Con un solo id en `selectedIds` la galería funciona como selector; la acción se habilita al elegir.

```tsx
const [selectedId, setSelectedId] = React.useState<string | null>(null);

<Gallery
  title="Elige la portada"
  actions={<Button size="sm" disabled={!selectedId}>Usar portada</Button>}
  items={items}
  variant="compact"
  columns={4}
  selectable
  selectedIds={selectedId ? [selectedId] : []}
  onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
/>
```

### Estado vacío

Con `items` vacío aparece EmptyGalleryState; pásalo por `emptyState` para personalizar texto y acción.

```tsx
<Gallery
  title="Material del curso"
  items={items}
  emptyState={
    <EmptyGalleryState
      title="Este curso aún no tiene material"
      description="Sube el primer recurso para que aparezca aquí."
      action={<Button size="sm"><Upload /> Subir material</Button>}
    />
  }
/>
```
