# AIInsightCard

Tarjeta para un hallazgo de la IA: tipo (insight, riesgo, recomendación u oportunidad), nivel de confianza, evidencia e impacto en dos columnas y una acción opcional al pie. Es la unidad que AIPanel agrupa.

Familia: IA · Doc: `/docs#/components/ai-insight-card` · Fuente: `src/components/ai/AIInsightCard.tsx`

```ts
import { AIInsightCard } from "@/components/ai"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | Titular del hallazgo. Obligatorio. |
| `description` | `string` |  | Explicación breve bajo el título. |
| `type` | `"insight" \| "risk" \| "recommendation" \| "opportunity"` | `"insight"` | Naturaleza del hallazgo; define icono, etiqueta y color. |
| `confidence` | `"low" \| "medium" \| "high" \| null` | `"high"` | Nivel de confianza mostrado como badge en la esquina. `null` lo oculta: úsalo cuando la sugerencia sale de una regla y no de un modelo. |
| `evidence` | `string` |  | Dato que sustenta el hallazgo. |
| `impact` | `string` |  | Consecuencia esperada. |
| `actionLabel` | `string` |  | Texto del botón al pie. Sin él no hay pie. |
| `onAction` | `() => void` |  | Callback de la acción del pie. |
| `className` | `string` |  | Clases extra para la Card. |

## Guías

- Sí: Muestra siempre la confianza: el usuario decide cuánto fiarse.
- Sí: Rellena evidencia e impacto cuando existan; es lo que hace accionable el hallazgo.
- Sí: Usa `risk` solo para lo que requiere atención, no para cualquier dato negativo.
- No: No mezcles varios hallazgos en una tarjeta; una tarjeta, un insight.
- No: No uses la tarjeta para contenido que no generó la IA: la identidad de IA marca procedencia.

Relacionados: ai-panel, card, badge

## Ejemplos

### Tipos

El icono, la etiqueta y el color del encabezado cambian por tipo.

```tsx
<AIInsightCard type="insight" title="El eNPS mejora en equipos con líder nuevo" confidence="high" />
<AIInsightCard type="risk" title="Riesgo de burnout en Soporte" confidence="medium" />
<AIInsightCard type="recommendation" title="Reforzar el onboarding de Producto" confidence="medium" />
<AIInsightCard type="opportunity" title="Talento interno listo para promoción" confidence="low" />
```

### Con evidencia, impacto y acción

Evidencia e impacto se muestran en dos columnas; `actionLabel` añade el pie con la flecha.

```tsx
<AIInsightCard
  type="risk"
  confidence="high"
  title="Tres gerencias sin plan de sucesión"
  description="Ninguna de las gerencias regionales tiene un sucesor identificado."
  evidence="0 de 3 con sucesor"
  impact="Continuidad operativa"
  actionLabel="Crear plan de sucesión"
  onAction={() => {}}
/>
```
