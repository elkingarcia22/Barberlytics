# GuidedTour (beta)

Recorrido de coachmarks: una tarjeta por paso con «Paso N de M», barra de progreso y el elemento del paso recortado del velo y rodeado por un anillo. El recorte también deja pasar los clics, así que un paso puede avanzar cuando se pulsa lo resaltado. La tarjeta se coloca debajo, encima o acoplada abajo según el sitio, y vuelve a medirse con scroll y cambios de tamaño.

Familia: Feedback de usuarios · Doc: `/docs#/components/guided-tour` · Fuente: `src/components/feedback-loop/GuidedTour.tsx`

```ts
import { GuidedTour, type TourStep } from "@/components/feedback-loop"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `steps` | `TourStep[]` |  | `{ id, title, description, icon?, target?, advanceOnTargetClick? }`. `target` es un selector CSS; admite una lista y gana el primero visible. |
| `open / onOpenChange` | `boolean / (open) => void` |  | Controlado. Cada apertura empieza en el primer paso. |
| `onComplete` | `() => void` |  | Solo al pulsar «Finalizar»; ✕, Escape o el velo cierran sin completar. |
| `labels` | `Partial<GuidedTourLabels>` |  | Textos de los botones y el formato de «Paso N de M». |

## Guías

- Sí: Marca los objetivos con `data-tour` en vez de depender de clases de estilo.
- Sí: Cuatro o cinco pasos como mucho; el último, hacia la acción que quieres (el botón de feedback).
- Sí: Da objetivos alternativos (`nav, aside`) cuando el elemento cambia entre escritorio y móvil.
- No: No lo relances en cada visita: recuerda que se vio (ver FeedbackCampaign).
- No: No escondas información imprescindible solo en el recorrido.

Relacionados: feedback-campaign, feedback-launcher, popover

## Ejemplos

### Recorrido con objetivos

El segundo paso señala «Filtros»; el tercero espera a que pulses «Crear cita».

```tsx
const pasos: TourStep[] = [
  { id: "hola", icon: "rocket", title: "Bienvenido", description: "…" },
  { id: "filtros", target: '[data-tour="filtros"]', title: "Filtra lo que ves", description: "…" },
  { id: "crear", target: '[data-tour="crear"]', advanceOnTargetClick: true, title: "Pruébalo tú", description: "…" },
]

<GuidedTour steps={pasos} open={open} onOpenChange={setOpen} onComplete={marcarVisto} />
```
