# EmptyGalleryState

El estado vacío especializado para colecciones multimedia: icono de imagen, textos por defecto en español y altura mínima para que la sección no colapse. Es lo que Gallery renderiza cuando `items` está vacío.

Familia: Media · Doc: `/docs#/components/empty-gallery-state` · Fuente: `src/components/media/EmptyGalleryState.tsx`

```ts
import { EmptyGalleryState } from "@/components/media"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` | `"Sin elementos multimedia"` | Título del estado vacío. |
| `description` | `string` | `"No se han encontrado recursos…"` | Explicación breve bajo el título. |
| `action` | `ReactNode` |  | Botón o enlace que resuelve el vacío. |
| `className` | `string` |  | Clases extra; por defecto trae `min-h-[300px]` y borde discontinuo. |

## Guías

- Sí: Adapta título y descripción al contexto (curso, actividad, filtros) en lugar de dejar el genérico.
- Sí: Ofrece siempre una acción cuando el usuario puede resolver el vacío.
- No: No lo uses fuera de colecciones multimedia: EmptyState es el genérico.
- No: No lo apiles con otro mensaje de aviso; ya explica por qué no hay nada.

Relacionados: gallery, empty-state, upload-zone, image-grid

## Ejemplos

### Por defecto

Sin props ya trae icono, título y descripción genéricos.

```tsx
<EmptyGalleryState />
```

### Con acción

La acción que llena la colección; normalmente la misma que en la cabecera de la Gallery.

```tsx
<EmptyGalleryState
  title="Aún no hay evidencias"
  description="Sube fotos o documentos para respaldar el cierre de esta actividad."
  action={<Button size="sm"><Upload /> Subir evidencias</Button>}
/>
```

### Sin resultados por filtros

Cuando el vacío viene de un filtro, la acción correcta es limpiarlo, no subir.

```tsx
<Gallery
  title="Recursos de Ventas"
  items={filtered}
  emptyState={
    <EmptyGalleryState
      title="Ningún recurso coincide"
      description="Prueba con otro tipo o quita los filtros activos."
      action={<Button size="sm" variant="outline"><FolderOpen /> Quitar filtros</Button>}
    />
  }
/>
```
