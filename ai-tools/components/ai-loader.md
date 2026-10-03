# AILoader

Estado de espera mientras la IA trabaja, en tres formas: una línea con spinner, un bloque con esqueleto o una tarjeta con progreso. Cada estado trae su texto por defecto en español y anuncia con `aria-live`.

Familia: IA · Doc: `/docs#/components/ai-loader` · Fuente: `src/components/ai-interaction/AILoader.tsx`

```ts
import { AILoader } from "@/components/ai-interaction"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `variant` | `"inline" \| "block" \| "card"` | `"block"` | Forma del loader. |
| `status` | `"thinking" \| "generating" \| "analyzing" \| "complete" \| "error"` | `"thinking"` | Fase del proceso; define el texto por defecto y, en `card`, si se muestra el spinner. |
| `label` | `string` |  | Texto que reemplaza al del estado. |
| `description` | `string` |  | Segunda línea bajo el título. Solo en `card`. |
| `progress` | `number` |  | 0–100. Solo en `card`: cambia el esqueleto por una barra de progreso. |
| `className` | `string` |  | Clases extra para el contenedor. |

## Guías

- Sí: Elige la variante según el hueco que ocupa el resultado: línea, párrafo o tarjeta.
- Sí: Pasa `progress` cuando conozcas el avance real; si no, deja el esqueleto.
- Sí: Cambia `status` a `complete` o `error` al terminar en vez de desmontar de golpe.
- No: No lo uses para cargas que no vienen de la IA: el degradado está reservado para superficies de IA.
- No: No inventes porcentajes: una barra que salta de 10 a 100 pierde credibilidad.

Relacionados: ai-analyzing-state, ai-button, skeleton

## Ejemplos

### Variantes

`inline` cabe en una línea de texto, `block` sustituye a un párrafo y `card` ocupa el lugar de una tarjeta.

```tsx
<AILoader variant="inline" />
<AILoader />
<AILoader variant="card" status="generating" description="Redactando el resumen ejecutivo" />
```

### Tarjeta con progreso

Con `progress` la tarjeta cambia el esqueleto por una barra con el degradado de IA.

```tsx
const [progress, setProgress] = React.useState(0);
// …un intervalo va sumando hasta 100

<AILoader
  variant="card"
  status={progress >= 100 ? "complete" : "generating"}
  description="Redactando las preguntas de la sección 2"
  progress={progress}
/>
```

### Estados y textos por defecto

Cada `status` trae su etiqueta; `label` la sobreescribe.

```tsx
<AILoader variant="inline" status="thinking" />
<AILoader variant="inline" status="generating" />
<AILoader variant="inline" status="analyzing" />
<AILoader variant="inline" status="complete" />
<AILoader variant="inline" status="error" />
<AILoader variant="inline" label="Buscando duplicados…" />
```
