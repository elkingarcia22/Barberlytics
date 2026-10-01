# EmptyState

La tarjeta punteada que ocupa el lugar de una lista vacía: un icono, un título, una explicación breve y, si aplica, la acción que la llena. Reutiliza `Card` con borde discontinuo y fondo sutil.

Familia: Feedback · Doc: `/docs#/components/empty-state` · Fuente: `src/components/feedback/EmptyState.tsx`

```ts
import { EmptyState } from "@/components/feedback/EmptyState"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | El titular del estado vacío. |
| `description` | `string` |  | Explicación breve de por qué está vacío o qué hacer. |
| `icon` | `LucideIcon` |  | Icono en el disco superior; se omite si no se pasa. |
| `action` | `React.ReactNode` |  | Botón o grupo de botones bajo la descripción. |
| `className` | `string` |  | Clases extra sobre la `Card` (p. ej. para quitar el marco). |
| `...props` | `React.HTMLAttributes<HTMLDivElement>` |  | Cualquier atributo nativo del contenedor. |

## Guías

- Sí: Di qué está vacío y qué lo llenaría, en una o dos frases.
- Sí: Ofrece la acción que resuelve el vacío cuando el usuario puede hacerla desde aquí.
- Sí: Quita el marco con `className` si el contenedor ya dibuja uno.
- No: No lo uses como pantalla de error: para fallos está Alert o un toast.
- No: No metas más de dos acciones; el estado vacío no es un menú.

Relacionados: empty-state-action-button, table-shell, card, button

## Ejemplos

### Sin acción

Cuando no hay nada que el usuario pueda hacer aquí, basta con explicar por qué está vacío.

```tsx
<EmptyState icon={FolderOpen} title="Sin evaluaciones recibidas" description="Cuando tu líder envíe la evaluación aparecerá aquí." />
```

### Resultado de búsqueda vacío

El estado vacío reemplaza la lista y ofrece deshacer el filtro que la dejó sin resultados.

```tsx
const [query, setQuery] = React.useState("marketing");
const matches = items.filter((item) => item.toLowerCase().includes(query.toLowerCase()));

{matches.length === 0 && (
  <EmptyState
    icon={Search}
    title={`Sin resultados para "${query}"`}
    description="Revisa la ortografía o prueba con otro término."
    action={<Button variant="outline" size="sm" onClick={() => setQuery("")}>Limpiar búsqueda</Button>}
  />
)}
```

### Dos formas de empezar

Dos `EmptyStateActionButton` con el mismo peso: crear a mano o dejar que la IA proponga.

```tsx
<EmptyState
  icon={Inbox}
  title="Aún no hay objetivos"
  description="Empieza con uno propio o deja que la IA proponga a partir del rol."
  action={
    <div className="flex flex-wrap justify-center gap-2">
      <EmptyStateActionButton icon={<Plus className="size-4" />}>Crear objetivo</EmptyStateActionButton>
      <EmptyStateActionButton icon={<Sparkles className="size-4" />}>Sugerir con IA</EmptyStateActionButton>
    </div>
  }
/>
```

### Compacto dentro de un panel

Con `className` se quita el marco cuando el contenedor ya lo pone (es lo que hace TableShell).

```tsx
<EmptyState icon={Inbox} title="Sin información" description="No se encontraron registros." className="border-none bg-transparent p-6 shadow-none" />
```
