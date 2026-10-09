# AiSparkGlyph

La marca de «la IA está trabajando»: el orbe de Clipper pensando (gira rápido, halo vivo). Vive suelta porque es la misma marca a 42px en el panel de análisis y a 18px en una tarjeta que se rehace; por debajo de 32px va sin halo ni anillo.

Familia: IA · Doc: `/docs#/components/ai-spark-glyph` · Fuente: `src/components/ai-interaction/AiSparkGlyph.tsx`

```ts
import { AiSparkGlyph } from "@/components/ai-interaction"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `size` | `number` | `42` | Lado del glifo en píxeles. |
| `className` | `string` |  | Clases extra. Es `aria-hidden`: acompáñalo de texto. |

## Guías

- Sí: Úsala como marca de «la IA está trabajando» junto a un texto que lo diga.
- Sí: Prefiere AiAnalyzingState o AiGeneratedBadge; usa el glifo suelto solo para composiciones nuevas de IA.
- No: No la uses como icono decorativo en superficies que no son de IA: el degradado está reservado.
- No: No dibujes otra chispa: usa este glifo o `ClipperOrb`.

Relacionados: clipper-orb, ai-analyzing-state, ai-generated-badge, thema-icon

## Ejemplos

### Tamaños

El orbe escala con el tamaño; bajo 32px pierde el halo y el anillo.

```tsx
<AiSparkGlyph size={18} />
<AiSparkGlyph size={24} />
<AiSparkGlyph />
<AiSparkGlyph size={64} />
```

### Con halo

Con el halo difuminado detrás, para cuando la pieza es la protagonista (a partir de 32px ya lo trae).

```tsx
<div className="relative flex h-16 w-16 items-center justify-center">
  <div className="absolute h-11 w-11 animate-pulse rounded-full bg-ai-gradient opacity-20 blur-xl" />
  <AiSparkGlyph size={42} />
</div>
```
