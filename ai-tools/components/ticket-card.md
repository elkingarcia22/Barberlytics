# TicketCard

Una entrada: a la izquierda el talón —un número, una etiqueta— y, tras una línea de puntos con sus dos muescas, el cuerpo con lo que importa. Sirve para decir «en qué parte vas» sin parecer otra tarjeta más; la reserva la usa para marcar cada parte de una visita en la que cada servicio va con su barbero. En oscuro el cuerpo es grafito; en claro, una superficie blanca con filo: el gris suave se confundía con el fondo.

Familia: Datos · Doc: `/docs#/components/ticket-card` · Fuente: `src/components/data-display/TicketCard.tsx`

```ts
import { TicketCard } from "@/components/data-display"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `stub` | `ReactNode` |  | El talón: número y etiqueta. Es decorativo para el lector de pantalla: repite lo importante en el cuerpo o en `aria-label`. |
| `tone` | `"brand" \| "neutral"` | `"brand"` | Talón relleno de marca o gris suave. |
| `children` | `ReactNode` |  | El cuerpo: título, lo que sigue y las acciones. |
| `className` | `string` |  | Solo para el layout de afuera. |

## Guías

- Sí: Dale un `aria-label` que diga lo que dice el talón («Parte 2 de 3 de tu visita»).
- Sí: Mantén el cuerpo corto: dos o tres líneas; es una marca, no un formulario.
- No: No lo repitas en una lista larga: pierde su gracia y se vuelve una tarjeta más.
- No: No cambies el borde ni el radio con `className`: las muescas dependen de ellos.

Relacionados: card, timeline, progress-ring

## Ejemplos

### Talón neutro

Con `tone="neutral"` el talón es un gris suave: para cuando el dorado ya está en otra parte de la pantalla.

```tsx
<TicketCard tone="neutral" stub={<Stub current={1} total={2} />}>…</TicketCard>
```
