# Tag

Una etiqueta compacta para metadatos, filtros activos o categorías ligeras, con cinco tonos y una X opcional. A diferencia de un StatusBadge no representa el estado de una entidad, sino información que la acompaña o un filtro que el usuario puede quitar.

Familia: Utilidades · Doc: `/docs#/components/tag` · Fuente: `src/components/utility/Tag.tsx`

```ts
import { Tag } from "@/components/utility"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `label` | `string` |  | Texto de la etiqueta; también forma el aria-label del botón de cierre. |
| `tone` | `"neutral" \| "info" \| "success" \| "warning" \| "danger"` | `"neutral"` | Color semántico del fondo y el texto. |
| `removable` | `boolean` | `false` | Muestra la X al final. |
| `onRemove` | `() => void` |  | Se llama al pulsar la X; el click no se propaga al contenedor. |
| `...props` | `React.HTMLAttributes<HTMLDivElement>` |  | Atributos del contenedor. |

## Guías

- Sí: Usa neutral por defecto y un tono de color solo si comunica algo.
- Sí: Mantén los labels en una o dos palabras.
- Sí: Si es removible, ofrece una forma de restablecer los filtros.
- No: No lo uses para estados de una entidad (Activo, Pendiente): eso es un badge de estado.
- No: No hagas clickeable el Tag entero; solo la X tiene acción.

Relacionados: badge, multi-select, page-header

## Ejemplos

### Tonos

neutral para categorías; info, success, warning y danger cuando el color aporta significado.

```tsx
<Tag label="Categoría" />
<Tag label="Informativo" tone="info" />
<Tag label="Completado" tone="success" />
<Tag label="Por vencer" tone="warning" />
<Tag label="Bloqueado" tone="danger" />
```

### Filtros removibles

Cada X llama a onRemove; el consumidor actualiza la lista.

```tsx
const [tags, setTags] = React.useState(["Liderazgo", "Ventas", "Bogotá", "Q3 2026"]);
const remove = (label: string) => setTags((prev) => prev.filter((t) => t !== label));

{tags.map((label) => (
  <Tag key={label} label={label} tone="info" removable onRemove={() => remove(label)} />
))}
```

### Como metadato en una fila

```tsx
<div className="flex items-center gap-3">
  <span className="text-sm font-medium">Onboarding comercial</span>
  <Tag label="Ruta" />
  <Tag label="12 lecciones" />
  <Tag label="Obligatorio" tone="warning" />
</div>
```
