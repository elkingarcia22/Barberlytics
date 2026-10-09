# HairBurst

Ráfaga de pelo de barba para celebrar: como el confeti, pero con los pelitos cortos y rizados de un arreglo de barba. Estalla una vez hacia arriba, cae meciéndose y se apaga en unos 3,5 s. Es la celebración de la cita recién creada en la reserva en línea. Toma los colores del tema y con prefers-reduced-motion no se monta.

Familia: Atmósfera y marca · Doc: `/docs#/components/hair-burst` · Fuente: `src/components/atmosphere/HairBurst.tsx`

```ts
import { HairBurst } from "@/components/atmosphere"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `count` | `number` | `110` | Cuántos pelos salen; un tercio son cañones cortos y gruesos. |
| `origin` | `{ x: number; y: number }` | `{ x: 0.5, y: 0.3 }` | De dónde estallan, en proporción del contenedor (0 a 1). |
| `onDone` | `() => void` |  | Al terminar la ráfaga; con «reducir movimiento», enseguida. |
| `className` | `string` |  | Clases extra para el <canvas>, que ya es absolute inset-0 y no intercepta el puntero. |

## Guías

- Sí: Úsala para un logro de verdad: la cita creada, no cada paso del recorrido.
- Sí: Dale como `key` lo que celebra (el id de la reserva): así no se repite al volver a la pantalla.
- Sí: El contenedor tiene que ser `relative` y con `overflow-hidden`; el canvas mide al padre.
- No: No la dejes montada en bucle: para lluvia de fondo está HairCanvas.
- No: No la dispares dos veces seguidas en el mismo recorrido.
- No: No le des colores: los toma del tema (`--primary` y `--foreground`).

Relacionados: hair-canvas, halo

## Ejemplos

### Cita creada

Así sale en la reserva en línea al confirmar la cita: encima de todo (`z-toast`), sin interceptar el puntero, y se desmonta en `onDone`.

```tsx
<HairBurst key={reservation.id} className="z-toast" onDone={() => setBurstId(null)} />
```
