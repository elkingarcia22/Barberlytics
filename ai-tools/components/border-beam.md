# BorderBeam

Haz de luz que recorre el borde de su contenedor en bucle, sin afectar al layout. Úsalo con moderación para destacar una tarjeta, un plan recomendado o un panel de IA; el padre debe ser `relative` y tener radio de borde.

Familia: Primitivos · Doc: `/docs#/components/border-beam` · Fuente: `src/components/ui/border-beam.tsx`

```ts
import { BorderBeam } from "@/components/ui/border-beam"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `duration` | `number` | `15` | Segundos que tarda el haz en dar una vuelta completa. |
| `size` | `number` | `200` | Tamaño de referencia del haz (variable CSS `--size`). |
| `borderWidth` | `number` | `1.5` | Grosor del borde iluminado, en px. |
| `anchor` | `number` | `90` | Ángulo inicial del gradiente cónico, en grados. |
| `colorFrom` | `string` | `"#ffaa40"` | Color al inicio del haz. Acepta cualquier valor CSS, incluidas variables. |
| `colorTo` | `string` | `"#9c40ff"` | Color en la cola del haz. |
| `delay` | `number` | `0` | Desfase de la animación en segundos (útil con varios haces). |
| `className` | `string` |  | Clases extra para el contenedor absoluto. |

## Guías

- Sí: Asegúrate de que el padre sea `relative` y tenga `rounded-*`; el haz hereda el radio.
- Sí: Resérvalo para un solo elemento destacado por vista.
- Sí: Usa variables del tema en los colores para respetar el modo oscuro.
- No: No lo apliques a listas o tablas: satura y cuesta rendimiento.
- No: No lo uses sobre contenedores con `overflow: visible` intencionado; el haz recorta al borde.
- No: No lo combines con otros efectos animados de borde en el mismo elemento.

Relacionados: card, ai-panel

## Ejemplos

### Con los colores de marca

Pasa cualquier color CSS; aquí se usan las variables del tema para que siga al modo claro/oscuro.

```tsx
<Card className="relative">
  <CardHeader>
    <CardTitle>Asistente Thema</CardTitle>
    <CardDescription>Pregunta sobre tu progreso o pide una recomendación.</CardDescription>
  </CardHeader>
  <BorderBeam duration={10} colorFrom="var(--primary)" colorTo="var(--info)" />
</Card>
```

### Dos haces desfasados

Un segundo haz con `delay` igual a la mitad de la duración reparte la luz en lados opuestos.

```tsx
<div className="relative rounded-2xl border bg-surface p-6">
  …
  <BorderBeam duration={12} />
  <BorderBeam duration={12} delay={6} colorFrom="#22d3ee" colorTo="#6366f1" />
</div>
```

### Condicional

Al ser un hijo absoluto se puede montar y desmontar sin mover nada alrededor.

```tsx
const [active, setActive] = React.useState(false);

<Card className="relative">
  …
  <Button onClick={() => setActive((value) => !value)}>Destacar plan</Button>
  {active && <BorderBeam duration={8} />}
</Card>
```
