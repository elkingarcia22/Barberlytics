# MediaPreview

La previsualización en detalle de un único `MediaItem`: imagen a tamaño completo o icono de tipo, título, metadatos, descripción y acciones. Sin `item` muestra un estado vacío listo para drawers y paneles maestro-detalle.

Familia: Media · Doc: `/docs#/components/media-preview` · Fuente: `src/components/media/MediaPreview.tsx`

```ts
import { MediaPreview } from "@/components/media"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `item` | `MediaItem` |  | El recurso a previsualizar. Si falta, se muestra el estado vacío. |
| `title` | `string` |  | Sobrescribe `item.title`. |
| `description` | `string` |  | Sobrescribe `item.description`. |
| `metadata` | `ReactNode` |  | Sobrescribe `item.metadata`; admite nodos (badges, iconos). |
| `actions` | `ReactNode` |  | Botones a la derecha del bloque de información. |
| `emptyState` | `ReactNode` |  | Reemplaza el EmptyState por defecto cuando no hay `item`. |
| `className` | `string` |  | Clases del contenedor raíz. |

## Guías

- Sí: Úsalo como panel de detalle junto a una lista o grilla seleccionable.
- Sí: Pon la acción principal (descargar, asignar) como botón primario y el resto en contorno.
- No: No lo uses para listar varios recursos: para eso están ImageGrid y Gallery.
- No: No lo metas en un contenedor sin ancho definido dentro de un flex; la imagen necesita ancho para escalar.

Relacionados: preview-card, dialog, file-preview, empty-gallery-state

## Ejemplos

### Imagen con acciones

La imagen se ajusta con `object-contain` hasta 600px de alto; el badge del ítem se pinta encima.

```tsx
<MediaPreview
  item={item}
  actions={
    <>
      <Button size="sm" variant="outline"><Share2 /> Compartir</Button>
      <Button size="sm"><Download /> Descargar</Button>
    </>
  }
/>
```

### Documento sin vista previa

Sin `src` se muestra el icono grande según `kind` y el texto de sin vista previa.

```tsx
<MediaPreview
  item={{ id: "doc", title: "Documento", kind: "document", metadata: "PDF · 2.1 MB" }}
  title="Política de teletrabajo 2026"
  description="Versión aprobada por el comité. Aplica a todas las sedes."
/>
```

### Maestro-detalle

Sin selección se ve el estado vacío por defecto; al elegir una tarjeta aparece su detalle.

```tsx
const [selectedId, setSelectedId] = React.useState<string | null>(null);
const selected = items.find((item) => item.id === selectedId);

<div className="grid gap-6 lg:grid-cols-[240px_1fr]">
  <div className="space-y-3">
    {items.map((item) => (
      <PreviewCard key={item.id} item={item} selected={item.id === selectedId} onSelect={setSelectedId} />
    ))}
  </div>
  <MediaPreview item={selected} />
</div>
```

### Dentro de un Dialog

El componente no trae contenedor propio, así que encaja en modales y drawers sin ajustes.

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Abrir previsualización</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-2xl">
    <DialogHeader>
      <DialogTitle>Detalle del recurso</DialogTitle>
    </DialogHeader>
    <MediaPreview item={item} actions={<Button size="sm"><Download /> Descargar</Button>} />
  </DialogContent>
</Dialog>
```
