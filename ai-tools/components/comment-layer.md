# CommentLayer

Capa envolvente que superpone los marcadores (pines) interactivos sobre la interfaz. Al activar el modo comentar (vía atajo C o botón), intercepta los clics para posicionar un borrador de comentario en coordenadas porcentuales.

Familia: Comentarios · Doc: `/docs#/components/comment-layer` · Fuente: `src/components/comments/CommentLayer.tsx`

```ts
import { CommentLayer } from "@/components/comments"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `hideHint` | `boolean` | `false` | Oculta el pill flotante inferior 'Haz clic donde quieras comentar' en modo comentar. |
| `className` | `string` |  | Clases para el contenedor relativo envolvente. |

## Guías

- Sí: Envuelve el contenedor principal de la vista o marco de trabajo que se desea revisar.
- Sí: Asegúrate de que el contenedor tenga dimensiones definidas relativas para calcular correctamente los porcentajes.
- No: No bloquees eventos de puntero esenciales si la persona está en modo navegar ('browse').

Relacionados: comments-panel, comments-toggle

## Ejemplos

### Superficie comentable

Los pines se sitúan con precisión de porcentaje y admiten hover, clic y selección.

```tsx
<CommentLayer>
  <div className="p-8">
    <h1>Título</h1>
    <p>Texto</p>
  </div>
</CommentLayer>
```
