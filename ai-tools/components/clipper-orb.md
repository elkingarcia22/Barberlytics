# ClipperOrb

El símbolo de la IA en todo el sistema: el orbe de Clipper, un poste de barbería hecho esfera de vidrio con el gradiente de IA. Gira, respira y late según lo que hace el agente. Es lo que dibuja `ThemaIcon name="sparkles"`, `AiSparkGlyph`, `ChatMark` y la portada de Clipper.

Familia: IA · Doc: `/docs#/components/clipper-orb` · Fuente: `src/components/ai-interaction/ClipperOrb.tsx`

```ts
import { ClipperOrb } from "@/components/ai-interaction"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `size` | `number` | `128` | Lado en px. Pequeño (14–24) acompaña a un texto; grande (120+) es la portada. |
| `state` | `"idle" \| "listening" \| "thinking"` | `"idle"` | Lo que hace Clipper: reposo, escuchando (gira rápido y late) o pensando (el halo se aviva). |
| `bare` | `boolean` | `false` | Sin halo ni anillo, para tamaños pequeños. |

## Guías

- Sí: Úsalo siempre que haya que mostrar «la IA»: botones, cargas, mensajes del agente, estados vacíos de IA.
- Sí: Usa `state` para reflejar lo que hace Clipper (escucha, piensa).
- No: No dibujes otro destello o icono de IA: pide el orbe (`ThemaIcon name="sparkles"` ya lo es).
- No: No lo uses como decoración en superficies que no son de IA: es la marca del agente.

Relacionados: ai-spark-glyph, ai-button, thema-icon, ai-analyzing-state

## Ejemplos

### Estados

En reposo gira despacio; escuchando, rápido y late; pensando, el halo se aviva.

```tsx
<ClipperOrb size={96} />
<ClipperOrb size={96} state="listening" />
<ClipperOrb size={96} state="thinking" />
```

### Pequeño, junto a un texto

Hasta unos 32 px va `bare`: sin halo ni anillo, para no ensuciar el texto.

```tsx
<ClipperOrb size={16} bare />
<ClipperOrb size={24} bare />
```
