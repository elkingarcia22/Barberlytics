# AiSparkGlyph

La chispa de la IA: el destello grande con dos satélites que laten a destiempo. Vive suelta porque es la misma marca a 42px en el panel de análisis y a 18px en una tarjeta que se rehace; el latido escalonado es lo que la hace leerse como trabajo en curso.

Familia: IA · Doc: `/docs#/components/ai-spark-glyph` · Fuente: `src/components/ai-interaction/AiSparkGlyph.tsx`

```ts
import { AiSparkGlyph } from "@/components/ai-interaction"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `size` | `number` | `42` | Lado del glifo en píxeles. |
| `className` | `string` |  | Clases extra para el <svg>. Es `aria-hidden`: acompáñalo de texto. |

## Guías

- Sí: Úsala como marca de «la IA está trabajando» junto a un texto que lo diga.
- Sí: Prefiere AiAnalyzingState o AiGeneratedBadge; usa el glifo suelto solo para composiciones nuevas de IA.
- No: No la uses como icono decorativo en superficies que no son de IA: el degradado está reservado.
- No: No dupliques el SVG en otro componente; importa este para que el dibujo no se separe.

Relacionados: ai-analyzing-state, ai-generated-badge, thema-icon

## Ejemplos

### Tamaños

El SVG escala sin perder el trazo relativo; el degradado usa un id único por instancia.

```tsx
<AiSparkGlyph size={18} />
<AiSparkGlyph size={24} />
<AiSparkGlyph />
<AiSparkGlyph size={64} />
```

### Con halo

El halo difuminado que usa AiAnalyzingState detrás de la chispa, para cuando la pieza es la protagonista.

```tsx
<div className="relative flex h-16 w-16 items-center justify-center">
  <div className="absolute h-11 w-11 animate-pulse rounded-full bg-ai-gradient opacity-20 blur-xl" />
  <AiSparkGlyph size={42} />
</div>
```
