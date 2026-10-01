# FeedbackPanel (beta)

El panel flotante donde se deja el feedback: sección a evaluar y comentario, con la página en la que estás a la vista. No es modal —la pantalla sigue visible para señalar lo que se comenta—, conserva el texto si el envío falla y, al acertar, agradece y deja escribir otro.

Familia: Feedback de usuarios · Doc: `/docs#/components/feedback-panel` · Fuente: `src/components/feedback-loop/FeedbackPanel.tsx`

```ts
import { FeedbackPanel } from "@/components/feedback-loop"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / onOpenChange` | `boolean / (open) => void` |  | Controlado. Escape, ✕ y «Cancelar» piden cerrar. |
| `sections` | `{ value; label }[]` |  | Partes evaluables. Con una sola, el selector no se enseña. |
| `defaultSection` | `string` |  | La preseleccionada; por defecto, la primera. |
| `context` | `string` |  | Dónde está la persona («Métricas»). |
| `onSubmit` | `(values: { section; comment }) => Promise<void> \| void` |  | Envía. El comentario llega recortado. Si la promesa falla, su `message` se enseña. |
| `minLength / maxLength` | `number` | `5 / 1000` | Límites del comentario, con contador. |
| `labels` | `Partial<FeedbackPanelLabels>` |  | Todos los textos, para traducir o ajustar el tono. |

## Guías

- Sí: Traduce los errores a lenguaje de persona antes de lanzarlos desde `onSubmit`.
- Sí: Ofrece pocas secciones (5–7) y una para «algo que falta».
- No: No pidas la página en un campo: `context` ya la dice y viaja sola.
- No: No lo metas en un Dialog: debe dejar ver la pantalla.

Relacionados: feedback-launcher, feedback-campaign, textarea, select

## Ejemplos

### Si el envío falla

Escribe un comentario con la palabra «error» y envíalo: el texto se queda y el mensaje de `onSubmit` sale debajo.

```tsx
const enviar = async (values) => {
  await api.post("/feedback", values) // si lanza, el panel enseña error.message
}
```
