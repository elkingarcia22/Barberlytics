# FeedbackDialog (beta)

El único diálogo donde se deja feedback, lo abra el menú lateral o el botón de una campaña: tipo (mejora, error o idea), comentario y, si ayuda, lo que se ve —un recorte de la pantalla, un video de hasta un minuto o imágenes subidas—. Mientras se captura o se graba se aparta para dejar ver la página y vuelve con el adjunto puesto. Conserva todo si el envío falla y, al acertar, agradece y deja escribir otro.

Familia: Feedback de usuarios · Doc: `/docs#/components/feedback-dialog` · Fuente: `src/components/feedback-loop/FeedbackDialog.tsx`

```ts
import { FeedbackDialog } from "@/components/feedback-loop"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / onOpenChange` | `boolean / (open) => void` |  | Controlado. Escape, ✕ y «Cancelar» piden cerrar. |
| `sections` | `{ value; label }[]` |  | Partes evaluables. Con una o ninguna, el selector no se enseña. |
| `defaultSection` | `string` |  | La preseleccionada; por defecto, la primera. |
| `context` | `string` |  | Dónde está la persona («Métricas»). Va con el comentario salvo que desmarque la casilla. |
| `onSubmit` | `(values: { type; section; comment; attachments: File[]; includePage; canContact }) => Promise<void> \| void` |  | Envía. El comentario llega recortado y los adjuntos como archivos. Si la promesa falla, su `message` se enseña. |
| `minLength / maxLength` | `number` | `5 / 1000` | Límites del comentario, con contador. |
| `labels` | `Partial<FeedbackDialogLabels>` |  | Todos los textos, para traducir o ajustar el tono. |

## Guías

- Sí: Usa este mismo diálogo desde cualquier puerta: menú lateral, campaña o un enlace de ayuda.
- Sí: Traduce los errores a lenguaje de persona antes de lanzarlos desde `onSubmit`.
- Sí: Ofrece pocas secciones (5–7) y una para «algo que falta».
- No: No pidas la página en un campo: `context` ya la dice y viaja sola.
- No: No montes otro formulario de feedback al lado: dos experiencias distintas dan dos calidades de comentario.

Relacionados: feedback-launcher, feedback-campaign, textarea, toggle-group

## Ejemplos

### Si el envío falla

Escribe un comentario con la palabra «error» y envíalo: el texto y los adjuntos se quedan y el mensaje de `onSubmit` sale debajo.

```tsx
const enviar = async (values) => {
  await api.post("/feedback", values) // si lanza, el diálogo enseña error.message
}
```
