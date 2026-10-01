# AIPanel

Contenedor de insights de IA: una Card con la chispa en el título, acciones en la cabecera, pie opcional y estados de carga y vacío ya resueltos. Sus hijos suelen ser AIInsightCard apilados en una columna.

Familia: IA · Doc: `/docs#/components/ai-panel` · Fuente: `src/components/ai/AIPanel.tsx`

```ts
import { AIPanel } from "@/components/ai"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` | `"Insights de IA"` | Título junto a la chispa. |
| `description` | `string` |  | Subtítulo bajo el título. |
| `children` | `React.ReactNode` |  | Contenido, normalmente AIInsightCard. Se apila en una columna con gap. |
| `actions` | `React.ReactNode` |  | Botones a la derecha de la cabecera. |
| `footer` | `React.ReactNode` |  | Pie separado por una línea. |
| `loading` | `boolean` | `false` | Reemplaza el contenido por un spinner con texto. |
| `empty` | `boolean` | `false` | Reemplaza el contenido por el estado vacío. |
| `emptyState` | `React.ReactNode` |  | Estado vacío a medida; por defecto usa EmptyState. |
| `className` | `string` |  | Clases extra para la Card. |

## Guías

- Sí: Agrupa aquí todo lo que generó la IA en la vista, en vez de dispersar tarjetas.
- Sí: Ofrece una acción de regenerar cuando el usuario pueda cambiar la entrada.
- Sí: Deja el aviso de verificación en el `footer`.
- No: No lo uses como contenedor genérico: la identidad de IA marca procedencia del contenido.
- No: No mezcles `loading` y `empty` a la vez; `loading` gana y el estado vacío no se ve.

Relacionados: ai-insight-card, card, empty-state

## Ejemplos

### Con acciones y regeneración

El botón de la cabecera pone el panel en `loading`; al terminar los hijos vuelven a montarse.

```tsx
const [loading, setLoading] = React.useState(false);

<AIPanel
  title="Insights del trimestre"
  description="Basada en 1.240 respuestas"
  loading={loading}
  actions={<Button variant="outline" size="sm" onClick={() => setLoading(true)}><RefreshCw /> Regenerar</Button>}
  footer={<p className="text-xs text-text-muted">La IA puede cometer errores; verifica antes de actuar.</p>}
>
  <AIInsightCard type="insight" title="El eNPS sube 6 puntos en equipos híbridos" evidence="+6 vs Q2" impact="Retención" />
  <AIInsightCard type="risk" title="Soporte reporta carga alta tres meses seguidos" confidence="medium" />
</AIPanel>
```

### Vacío

Con `empty` muestra un EmptyState por defecto; `emptyState` lo reemplaza.

```tsx
<AIPanel empty>
  {/* los hijos no se renderizan */}
</AIPanel>
```
