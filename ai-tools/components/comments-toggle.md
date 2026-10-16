# CommentsToggle

Botón para la cabecera o barra de herramientas que abre o cierra el panel de comentarios. Incluye un indicador con la cantidad de hilos no leídos pendientes.

Familia: Comentarios · Doc: `/docs#/components/comments-toggle` · Fuente: `src/components/comments/CommentsToggle.tsx`

```ts
import { CommentsToggle } from "@/components/comments"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `iconOnly` | `boolean` | `false` | Muestra únicamente el icono de chat con el badge flotante. |
| `className` | `string` |  | Clases adicionales para el botón. |

## Guías

- Sí: Ubícalo en el header o barra de acciones de la página para que siempre esté accesible.
- No: No coloques un badge duplicado por fuera; el componente gestiona el contador automáticamente.

Relacionados: comments-panel, comment-layer

## Ejemplos

### Con texto y solo icono

En pantallas compactas o barras densas se puede usar `iconOnly` sin perder el badge de no leídos.

```tsx
<CommentsToggle />
<CommentsToggle iconOnly />
```
