# FeedbackCampaign (beta)

El circuito completo para pedir feedback masivo sobre algo recién lanzado: recorrido guiado la primera vez, botón flotante en todas las páginas y panel de comentarios. Recuerda por campaña —en el navegador— si ya se vio el recorrido y si ya se abrió el panel; una campaña con otro `id` empieza de cero. En la app lo monta `FeedbackHost` (src/features/feedback), que añade página, campaña y persona y lo envía a `POST /feedback`, donde una función de Vercel lo guarda en la hoja de Google de la campaña y un cron semanal lo resume con Claude (docs/FEEDBACK_LOOP.md).

Familia: Feedback de usuarios · Doc: `/docs#/components/feedback-campaign` · Fuente: `src/components/feedback-loop/FeedbackCampaign.tsx`

```ts
import { FeedbackCampaign, type FeedbackCampaignConfig } from "@/components/feedback-loop"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `campaign` | `FeedbackCampaignConfig` |  | `{ id, name, sections, tour? }`. El `id` separa respuestas y memoria. |
| `context` | `string` |  | La página actual; se enseña en el panel. |
| `onSubmit` | `(values) => Promise<void> \| void` |  | Recibe sección y comentario; quien monta añade lo demás. |
| `autoStartTour` | `boolean` | `true` | Lanza el recorrido la primera vez. |
| `tourDelayMs` | `number` | `700` | Espera antes del recorrido, para que la pantalla termine de pintarse. |
| `startTourRef` | `Ref<(() => void) \| null>` |  | Recibe una función para relanzar el recorrido desde otro sitio. |

## Guías

- Sí: Cambia el `id` al lanzar otra cosa: así todos ven el nuevo recorrido.
- Sí: Apunta el último paso al botón con `FEEDBACK_LAUNCHER_TARGET`.
- No: No montes dos campañas a la vez: habría dos botones en la misma esquina.

Relacionados: guided-tour, feedback-launcher, feedback-panel

## Ejemplos

### Campaña montada

Al montarla sale el recorrido y el botón aparece en la esquina de la ventana (es fijo, no vive en este marco).

```tsx
const campana: FeedbackCampaignConfig = {
  id: "rediseno-2026-09",
  name: "Rediseño",
  sections: [{ value: "general", label: "Impresión general" }],
  tour: [
    { id: "hola", icon: "rocket", title: "Lanzamos algo nuevo", description: "…" },
    { id: "boton", icon: "feedback", target: FEEDBACK_LAUNCHER_TARGET, title: "Tu opinión, aquí", description: "…" },
  ],
}

<FeedbackCampaign campaign={campana} context="Métricas" onSubmit={enviar} />
```
