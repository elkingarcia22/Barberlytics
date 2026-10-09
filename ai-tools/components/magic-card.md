# MagicCard

Tarjeta seleccionable con barrido de luz al pasar el cursor, leve elevación y un estado seleccionado que no mueve el contenido. Úsala cuando la persona elige una opción entre varias tarjetas (tipos de encuesta, formas de convocar) o en pares sí/no.

Familia: Primitivos · Doc: `/docs#/components/magic-card` · Fuente: `src/components/ui/magic-card.tsx`

```ts
import { MagicCard } from "@/components/ui/magic-card"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `isSelected` | `boolean` | `false` | Pinta el borde, el fondo y el texto en el acento; el borde de 1.5px ya está reservado, así que el contenido no salta. |
| `variant` | `"primary" \| "ai"` | `"primary"` | La variante `ai` usa la malla degradada y el anillo de IA; ignora `tone`. |
| `tone` | `Tone` |  | Acento con el que se selecciona y hace hover (`brand`, `positive`, `warning`, `negative`, `neutral`, `ai`). Sin tono, azul de marca. |
| `contentClassName` | `string` |  | Clases del contenedor interno (`flex w-full`). Útil para apilar en columna. |
| `...props` | `React.HTMLAttributes<HTMLButtonElement>` |  | Se renderiza como <button type="button">; acepta onClick, aria-*, etc. |

## Guías

- Sí: Usa `tone` cuando cada opción ya tiene su propio color en el producto.
- Sí: Deja el contenido corto: un icono, un título y una línea de ayuda.
- Sí: Mantén un solo elemento seleccionado por grupo (o usa un par sí/no).
- No: No la uses como tarjeta informativa sin acción: para eso está Card.
- No: No combines `variant="ai"` con `tone`; la variante lo ignora.
- No: No metas controles interactivos dentro: ya es un botón.

Relacionados: card, button, radio-group

## Ejemplos

### Conjunto con tonos

Cada tarjeta se selecciona en su propio color; el chip revela el tono al pasar el cursor.

```tsx
const [selected, setSelected] = React.useState("pulse");

<MagicCard tone="brand" isSelected={selected === "pulse"} onClick={() => setSelected("pulse")} contentClassName="flex-col items-start gap-2">
  <span className="tone-reveal-chip flex size-8 items-center justify-center rounded-lg"><ClipboardList className="size-4" /></span>
  <span className="text-sm font-semibold">Pulso</span>
  <span className="text-xs text-text-secondary">Cinco preguntas, cada semana.</span>
</MagicCard>
<MagicCard tone="positive" isSelected={selected === "climate"} onClick={() => setSelected("climate")}>…</MagicCard>
<MagicCard tone="warning" isSelected={selected === "feedback"} onClick={() => setSelected("feedback")}>…</MagicCard>
```

### Par sí / no

Sin tono: la selección se pinta en azul de marca.

```tsx
const [answer, setAnswer] = React.useState<"yes" | "no" | null>(null);

<MagicCard isSelected={answer === "yes"} onClick={() => setAnswer("yes")} contentClassName="items-center gap-2">
  <ThumbsUp className="size-4" /> <span className="text-sm font-medium">Sí</span>
</MagicCard>
<MagicCard isSelected={answer === "no"} onClick={() => setAnswer("no")} contentClassName="items-center gap-2">
  <ThumbsDown className="size-4" /> <span className="text-sm font-medium">No</span>
</MagicCard>
```

### Variante IA

Malla de color y anillo degradado al seleccionar. Reservada a la superficie de IA del producto.

```tsx
<MagicCard variant="ai" isSelected={selected} onClick={toggle} contentClassName="flex-col gap-1.5">
  <span className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4" /> Generar con Clipper</span>
  <span className="text-xs text-text-secondary">Redactamos las preguntas a partir de tu objetivo.</span>
</MagicCard>
```
