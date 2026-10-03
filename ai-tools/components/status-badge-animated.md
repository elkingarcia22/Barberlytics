# StatusBadge (animado)

La píldora de estado con transición: al cambiar `state`, el icono entra con un resorte y el texto se desliza, así el ojo ve que algo pasó y no solo que algo es distinto. El estado pendiente lleva un spinner girando; el resto, un icono fijo.

Familia: Datos · Doc: `/docs#/components/status-badge-animated` · Fuente: `src/components/status-badge.tsx`

```ts
import { StatusBadge } from "@/components/status-badge"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `state` | `"pending" \| "failed" \| "success" \| "neutral" \| "info"` | `"pending"` | El estado actual; cambiarlo dispara la transición. |
| `labels` | `Partial<Record<StatusState, string>>` |  | Etiquetas propias por estado; se mezclan con las de fábrica. |
| `className` | `string` |  | Clases extra sobre la píldora. |

## Guías

- Sí: Úsalo donde el estado cambia delante del usuario: envíos, sincronizaciones, procesos.
- Sí: Pasa `labels` con el vocabulario del dominio (Enviada, Rechazada…).
- No: No lo uses en listas largas y estáticas: cada instancia monta framer-motion; ahí va `StatusBadge` de data-display.
- No: No cambies el estado en cada render; la animación se dispara con cada cambio de `state`.

Relacionados: status-badge, badge

## Ejemplos

### Transiciones entre estados

Cambia el estado con los botones para ver la animación de icono y texto.

```tsx
const [state, setState] = React.useState<StatusState>("neutral");

<StatusBadge state={state} />
<Button size="xs" onClick={() => setState("pending")}>Pendiente</Button>
<Button size="xs" onClick={() => setState("success")}>Éxito</Button>
```

### Flujo de envío

Un caso real: sin enviar, enviando (spinner) y el resultado. Las etiquetas vienen del dominio con `labels`.

```tsx
const SEND_LABELS = { neutral: "Sin enviar", pending: "Enviando", success: "Enviada", failed: "Rechazada" };
const [state, setState] = React.useState<StatusState>("neutral");

const send = async () => {
  setState("pending");
  try {
    await api.send();
    setState("success");
  } catch {
    setState("failed");
  }
};

<StatusBadge state={state} labels={SEND_LABELS} />
```

### Todos los estados

```tsx
<StatusBadge state="neutral" />
<StatusBadge state="pending" />
<StatusBadge state="success" />
<StatusBadge state="failed" />
<StatusBadge state="info" />
```
