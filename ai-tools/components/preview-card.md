# PreviewCard

La tarjeta individual de un `MediaItem`: imagen 16:9 o icono por tipo, badge, título, metadato y descripción, con un pie opcional de acciones. Es la pieza que usan los carruseles y las grillas cuando necesitas control ítem a ítem.

Familia: Media · Doc: `/docs#/components/preview-card` · Fuente: `src/components/media/PreviewCard.tsx`

```ts
import { PreviewCard } from "@/components/media"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `item` | `MediaItem` |  | El recurso: `title`, `src`, `alt`, `kind`, `badge`, `metadata`, `description`. |
| `selected` | `boolean` | `false` | Marca la tarjeta con borde primario e indicador. |
| `disabled` | `boolean` | `false` | Opacidad reducida, escala de grises y sin click. |
| `onSelect` | `(id: string) => void` |  | Hace la tarjeta clicable y muestra el indicador de selección. |
| `actions` | `ReactNode` |  | Botones en el pie; no propagan el click a la tarjeta. |
| `className` | `string` |  | Clases extra (p. ej. un ancho fijo). |

## Guías

- Sí: Usa botones `size="xs"` en `actions` para respetar la densidad de la tarjeta.
- Sí: Fija el ancho desde fuera (grid o `className`); la tarjeta se estira al contenedor.
- No: No pongas `onSelect` si no hay una selección real: el indicador confunde.
- No: No metas más de tres acciones en el pie; el resto va a un menú.

Relacionados: image-grid, thema-carousel, card, file-preview

## Ejemplos

### Tarjeta básica

Sin `onSelect` la tarjeta es solo informativa: no cambia el cursor ni muestra el indicador.

```tsx
<PreviewCard item={item} className="w-72" />
```

### Selección única

Con `onSelect` aparece el círculo al pasar el ratón; `selected` lo marca y resalta el borde.

```tsx
const [selectedId, setSelectedId] = React.useState<string | null>(null);

{items.map((item) => (
  <PreviewCard
    key={item.id}
    item={item}
    selected={item.id === selectedId}
    onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
  />
))}
```

### Con acciones

El pie de acciones detiene la propagación del click, así los botones no disparan `onSelect`.

```tsx
<PreviewCard
  item={item}
  onSelect={handleSelect}
  actions={
    <>
      <Button size="xs" variant="outline"><Eye /> Ver</Button>
      <Button size="xs" variant="ghost"><Download /> Descargar</Button>
      <Button size="xs" variant="ghost" className="ml-auto text-destructive" aria-label="Eliminar"><Trash2 /></Button>
    </>
  }
/>
```

### Sin miniatura y deshabilitada

Sin `src` se muestra el icono de `kind`. `disabled` baja la opacidad, desatura y bloquea el click.

```tsx
<PreviewCard item={{ id: "doc", title: "Documento", kind: "document", metadata: "PDF" }} />
<PreviewCard item={{ id: "vid", title: "Video sin miniatura", kind: "video" }} disabled />
```
