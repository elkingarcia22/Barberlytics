# MovingBorderBeam

Un haz de luz con el degradado de IA que recorre el perímetro del contenedor. Es decorativo: se coloca dentro de un elemento `relative` y señala que una acción o un panel es de IA.

Familia: Primitivos · Doc: `/docs#/components/moving-border-beam` · Fuente: `src/components/ui/moving-border-beam.tsx`

```ts
import { MovingBorderBeam } from "@/components/ui/moving-border-beam"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `mode` | `"glow" \| "line"` | `"glow"` | `glow`: blob radial recortado al borde. `line`: trazo con fundido en los extremos, estable en cualquier proporción. |
| `duration` | `number` | `6000` | Milisegundos por vuelta completa. |
| `borderWidth` | `number` | `1.5` | Grosor del anillo (px). |
| `rx / ry` | `number \| string` | `22` | Radios del rectángulo; deben coincidir con el `border-radius` del contenedor. |
| `colorFrom / colorTo` | `string` | `degradado IA` | Extremos del degradado del haz. |
| `beamSize` | `number` | `160` | Diámetro del blob; solo aplica al modo `glow`. |
| `className` | `string` |  | Clases extra para la capa absoluta. |

## Guías

- Sí: Coloca el haz dentro de un contenedor `relative` con el mismo radio.
- Sí: Usa `line` en píldoras y tarjetas anchas; `glow` en botones cuadrados.
- Sí: Resérvalo para la superficie de IA del producto.
- No: No lo pongas en varios elementos a la vez en la misma vista.
- No: No lo uses como indicador de foco o de estado seleccionado.

Relacionados: magic-card, ai-button, card

## Ejemplos

### Botón de icono (glow)

El modo `glow` es un cometa suave; funciona en formas casi cuadradas como los botones de 40px del action rail.

```tsx
<button type="button" className="relative flex size-10 items-center justify-center rounded-[12px] bg-surface shadow-card" aria-label="Abrir asistente">
  <MovingBorderBeam mode="glow" rx={12} ry={12} beamSize={90} duration={4000} />
  <Sparkles className="relative size-4" />
</button>
```

### Píldora ancha (line)

En una forma ancha y baja el blob se partiría en dos; el modo `line` es un trazo que solo puede estar en un sitio.

```tsx
<div className="relative inline-flex h-10 items-center gap-2 rounded-full bg-surface px-5 text-sm font-medium shadow-card">
  <MovingBorderBeam mode="line" rx={20} ry={20} borderWidth={2} duration={5000} />
  <Sparkles className="size-4" /> Resumir con IA
</div>
```

### Dentro de una tarjeta

Colores propios y un recorrido más lento para una superficie grande.

```tsx
<div className="relative w-80 rounded-2xl border border-border/60 bg-surface p-5 shadow-card">
  <MovingBorderBeam mode="line" rx={16} ry={16} duration={9000} colorFrom="hsl(var(--primary))" colorTo="hsl(var(--ai-gradient-end))" />
  <h3 className="text-sm font-semibold">Plan sugerido</h3>
  <p className="mt-1 text-xs text-text-secondary">Generado a partir de las respuestas del último trimestre.</p>
</div>
```
