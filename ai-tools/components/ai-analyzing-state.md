# AiAnalyzingState

La forma única en que la IA dice «dame un momento» en toda la plataforma. Un panel con la chispa latiendo, barra de progreso opcional y un titular que entra con fundido cada vez que cambia; la versión inline reduce lo mismo a una línea.

Familia: IA · Doc: `/docs#/components/ai-analyzing-state` · Fuente: `src/components/ai-interaction/AiAnalyzingState.tsx`

```ts
import { AiAnalyzingState } from "@/components/ai-interaction"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | Titular. Cada cambio de valor entra con un fundido (framer-motion, `AnimatePresence`). |
| `progress` | `number` |  | 0–100. Si se omite, la barra no se muestra y la espera se lee como indeterminada. |
| `detail` | `string` |  | Línea sobre la barra, a la izquierda: qué se está produciendo. Solo en `panel`. |
| `caption` | `string` |  | Frase bajo la barra: qué está pasando en una línea. Solo en `panel`. |
| `variant` | `"panel" \| "inline"` | `"panel"` | `panel` es el bloque grande (300px mínimo); `inline` reduce la chispa y el título a una línea. |
| `className` | `string` |  | Clases extra para el contenedor. |

## Guías

- Sí: Cambia `title` conforme avanza el proceso: es lo que convierte la espera en una secuencia.
- Sí: Usa `panel` cuando la espera ocupa la pantalla y `inline` cuando ocupa un hueco.
- Sí: Pasa `progress` solo si conoces el avance real.
- No: No crees otra versión del mismo momento: es la única forma en que la IA pide tiempo en el producto.
- No: No lo uses para cargas normales de datos; el degradado de IA es exclusivo de superficies de IA.
- No: No animes el porcentaje con saltos ficticios.

Relacionados: ai-loader, ai-spark-glyph, empty-state

## Ejemplos

### Secuencia de pasos

El titular cambia según el avance y cada cambio entra con un fundido: así el trabajo se lee como pasos y no como una barra que sube sola.

```tsx
const STEPS = ["Leyendo el archivo", "Detectando columnas", "Validando correos", "Preparando la importación"];
const [progress, setProgress] = React.useState(0);
const step = STEPS[Math.min(STEPS.length - 1, Math.floor((progress / 100) * STEPS.length))];

<AiAnalyzingState
  title={progress >= 100 ? "Importación lista" : step}
  detail="participantes.xlsx"
  progress={progress}
  caption="La IA revisa el archivo antes de crear los participantes."
/>
```

### Sin progreso conocido

Sin `progress` no hay barra: la chispa y el titular bastan para esperas cortas de duración desconocida.

```tsx
<AiAnalyzingState title="Generando recomendaciones" caption="Suele tardar unos segundos." />
```

### Inline

Para huecos donde el panel no cabe, como una tarjeta que se está rehaciendo.

```tsx
<AiAnalyzingState variant="inline" title="Reescribiendo la pregunta" />
```
