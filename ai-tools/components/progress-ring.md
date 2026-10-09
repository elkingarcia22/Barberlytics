# ProgressRing (beta)

Avance en un anillo: lo conseguido en color pleno y, opcional, lo que suma la acción en curso en un tono más suave. Para avances cortos y contables —visitas de una membresía, sesiones de un paquete, pasos— con el conteo o un icono en el centro.

Familia: Datos · Doc: `/docs#/components/progress-ring` · Fuente: `src/components/data-display/ProgressRing.tsx`

```ts
import { ProgressRing } from "@/components/data-display/ProgressRing"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `number` |  | Lo conseguido, de 0 a `max`. |
| `max` | `number` | `100` | El total del anillo. |
| `pending` | `number` | `0` | Tramo que se suma en tono suave: lo que aporta la acción en curso. No cuenta en `aria-valuenow`. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 32, 44 o 64 px. |
| `color` | `"primary" \| "success" \| "warning" \| "destructive"` | `"primary"` | Color de los arcos. |
| `children` | `React.ReactNode` |  | El centro (conteo o icono). Es decorativo: el avance se anuncia con `aria-label`. |
| `aria-label` | `string` |  | Qué avanza y cuánto («6 de 10 visitas»). Obligatorio en la práctica. |

## Guías

- Sí: Úsalo para totales pequeños y contables (hasta ~20): visitas, sesiones, pasos.
- Sí: Pon el conteo en el centro y di en el `aria-label` qué avanza.
- Sí: Usa `pending` para enseñar lo que aporta la acción que el usuario está por confirmar.
- No: No lo uses para cargas o porcentajes largos: usa `Progress`.
- No: No lo uses para repartir un total en partes: usa `DonutChart`.
- No: No lo pongas sin texto al lado ni `aria-label`: un anillo solo no dice de qué es.

Relacionados: progress, donut-chart

## Ejemplos

### Membresía en el pago

Seis visitas hechas y la cita que se está pagando suma la séptima, en tono suave hasta que ocurra.

```tsx
<ProgressRing value={6} pending={1} max={10} aria-label="7 de 10 visitas">
  <Text as="span" size="xs" weight="semibold" tabular>7<span className="text-text-muted">/10</span></Text>
</ProgressRing>
```

### Premio ganado

Completo y con un icono en el centro: ya no es avance, es algo por usar.

```tsx
<ProgressRing value={10} max={10} aria-label="Cortesía lista">
  <ThemaIcon name="award" size="sm" tone="primary" />
</ProgressRing>
```

### Tamaños

`sm` en una fila densa, `md` junto a un texto de dos líneas, `lg` como dato principal de una tarjeta.

```tsx
<ProgressRing size="sm" value={2} max={4} aria-label="2 de 4 sesiones" />
<ProgressRing value={2} max={4} aria-label="2 de 4 sesiones" />
<ProgressRing size="lg" value={2} max={4} color="success" aria-label="2 de 4 sesiones">…</ProgressRing>
```
