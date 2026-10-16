# CommentsPanel

Panel lateral derecho para la gestión de comentarios colaborativos tipo Figma. Permite filtrar por estado (pendientes, resueltos, todos) y por lectura (leídos, no leídos), explorar hilos con sus respuestas y responder directamente.

Familia: Comentarios · Doc: `/docs#/components/comments-panel` · Fuente: `src/components/comments/CommentsPanel.tsx`

```ts
import { CommentsPanel } from "@/components/comments"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `onNavigate` | `(thread: CommentThread) => void` |  | Se ejecuta al seleccionar un hilo de otro contexto/dispositivo para navegar a él. |
| `className` | `string` |  | Clases adicionales para el contenedor del panel lateral. |

## Guías

- Sí: Combínalo con CommentsProvider, CommentLayer y CommentsToggle para una experiencia completa.
- Sí: Usa la propiedad context si los comentarios aplican a diferentes vistas o dispositivos.
- No: No utilices coordenadas absolutas en px para los pines; el sistema usa porcentajes para responder a cambios de pantalla.

Relacionados: comment-layer, comments-toggle

## Ejemplos

### Flujo colaborativo completo

Hilos anclados a posiciones en porcentaje, modo comentar con tecla C o botón, y panel con filtrado reactivo.

```tsx
<CommentsProvider currentUser={{ id: "1", name: "Tú" }} defaultThreads={hilos}>
  <div className="flex h-[400px]">
    <div className="flex-1">
      <CommentsToggle />
      <CommentLayer>
        <Contenido />
      </CommentLayer>
    </div>
    <CommentsPanel />
  </div>
</CommentsProvider>
```
