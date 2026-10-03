# AiGeneratedBadge

Marca de procedencia: este contenido lo escribió la IA. Es solo la chispa con el degradado de IA y un tooltip que guarda la palabra; no es un estado ni una acción, y por eso no se puede pulsar ni cambia al editar.

Familia: IA · Doc: `/docs#/components/ai-generated-badge` · Fuente: `src/components/ai-interaction/AiGeneratedBadge.tsx`

```ts
import { AiGeneratedBadge } from "@/components/ai-interaction"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `className` | `string` |  | Clases extra para el contenedor inline. El icono mide 14px por defecto. |

## Guías

- Sí: Colócala junto al rótulo de la pieza, no junto al título.
- Sí: Úsala en todo contenido que redactó la IA y el usuario aún puede revisar.
- Sí: Deja que el tooltip diga la palabra: la chispa sola ya es la marca.
- No: No la conviertas en botón ni la uses como estado de carga.
- No: No la retires cuando el usuario edita el texto: sigue indicando su origen.
- No: No la uses en contenido escrito por personas: el degradado de IA marca procedencia.

Relacionados: ai-spark-glyph, badge, tooltip

## Ejemplos

### En la línea del rótulo

Va junto al rótulo en versalitas («OBJETIVO 1»), no junto al título, para leerse como metadato y no como parte del contenido. Pasa el cursor para ver el tooltip.

```tsx
<div className="flex items-center gap-1.5">
  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">Objetivo 1</span>
  <AiGeneratedBadge />
</div>
<p className="text-sm">Aumentar la retención del equipo comercial un 10% este semestre.</p>
```

### Varias instancias

Cada badge pinta con su propio id de degradado (`React.useId`), así varias en la misma vista no se pisan.

```tsx
<AiGeneratedBadge />
<AiGeneratedBadge className="opacity-60" />
<AiGeneratedBadge className="[&_svg]:size-5" />
```
