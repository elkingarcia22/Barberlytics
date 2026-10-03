# FeedbackLauncher (beta)

El botón flotante que abre el panel de feedback, fijo en la esquina inferior derecha (`z-rail`). Empieza como pastilla con texto y, una vez usado, se contrae a un círculo; `highlight` añade un pulso para una campaña que aún no tiene tu opinión. En móvil sube para no pisar el `ActionFab`.

Familia: Feedback de usuarios · Doc: `/docs#/components/feedback-launcher` · Fuente: `src/components/feedback-loop/FeedbackLauncher.tsx`

```ts
import { FeedbackLauncher } from "@/components/feedback-loop"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `collapsed` | `boolean` | `false` | Solo el icono, con `aria-label` y `title`. |
| `highlight` | `boolean` | `false` | Pulso suave alrededor; se apaga con `prefers-reduced-motion`. |
| `expanded` | `boolean` |  | El panel que abre está abierto (`aria-expanded`). |
| `label` | `string` | `"Feedback"` | Texto visible y nombre accesible. |
| `...props` | `React.ComponentProps<"button">` |  | Atributos del botón: `onClick`, `data-tour` para que el recorrido lo señale. |

## Guías

- Sí: Móntalo una sola vez, en el layout, para que acompañe a todas las páginas.
- Sí: Pásale `data-tour` si el recorrido debe señalarlo.
- No: No lo pongas dentro del contenido de una pantalla: es un elemento del marco.
- No: No cambies su color: es la llamada a la acción de la campaña.

Relacionados: feedback-panel, feedback-campaign, action-fab

## Ejemplos

### Primera vez y ya usado

Con texto mientras nadie lo ha abierto; contraído a icono después. El nombre accesible es el mismo en los dos.

```tsx
<FeedbackLauncher highlight onClick={abrir} />
<FeedbackLauncher collapsed onClick={abrir} />
```
