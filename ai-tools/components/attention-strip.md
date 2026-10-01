# AttentionStrip

La franja de avisos: una sola fila que dice cuánto reclama atención y ofrece un botón por motivo. El ánimo va en el filete lateral y el disco del icono, no en un lavado de color sobre toda la fila.

Familia: Feedback · Doc: `/docs#/components/attention-strip` · Fuente: `src/components/feedback/AttentionStrip.tsx`

```ts
import { AttentionStrip, AttentionAction } from "@/components/feedback/AttentionStrip"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `label` | `string` |  | Cómo se anuncia el grupo a un lector de pantalla (`aria-label`). |
| `icon` | `LucideIcon` |  | Icono del disco a la izquierda de la franja. |
| `tone` | `"brand" \| "positive" \| "warning" \| "negative" \| "neutral"` | `"warning"` | Color del filete lateral y del disco del icono. |
| `title` | `string` |  | La cifra de arriba: cuánto reclama atención. |
| `detail` | `string` |  | La línea de abajo: qué hacer con la fila. |
| `children` | `React.ReactNode` |  | Los botones, un `AttentionAction` por motivo. |
| `AttentionAction.icon` | `LucideIcon` |  | Icono del motivo; se colorea con `tone`. |
| `AttentionAction.label` | `string` |  | Nombre del motivo. |
| `AttentionAction.hint` | `string` |  | Explicación del aviso, mostrada en un tooltip. |
| `AttentionAction.value` | `number` |  | Cifra del motivo, formateada con separador de miles (es-CO). |
| `AttentionAction.tone` | `AttentionTone` | `"brand"` | Color del icono del botón cuando no está activo. |
| `AttentionAction.active` | `boolean` | `false` | Se pinta encendido cuando el aviso es además un filtro puesto. |
| `AttentionAction.onClick` | `() => void` |  | Qué pasa al pulsar el motivo. |

## Guías

- Sí: Una sola franja por bloque: agrupa varios motivos dentro con `AttentionAction`.
- Sí: Usa `active` cuando el aviso filtra la lista que está debajo.
- Sí: Escribe `hint` como una frase completa: es lo que explica el aviso.
- No: No apiles varias franjas del mismo tono para decir lo mismo.
- No: No la uses para mensajes de sistema o errores de formulario; para eso está Alert.
- No: No pongas más de tres o cuatro acciones: la fila se vuelve una barra de menú.

Relacionados: alert, badge, button, tooltip

## Ejemplos

### Acciones como filtro

Con `active` el botón se pinta encendido: el aviso además es un filtro puesto.

```tsx
const [active, setActive] = React.useState<string | null>(null);
const toggle = (id: string) => setActive((current) => (current === id ? null : id));

<AttentionStrip label="Avisos del ciclo" icon={AlertTriangle} title="14 colaboradores reclaman atención" detail="Pulsa un motivo para filtrar la lista">
  <AttentionAction icon={Clock} label="Sin evaluar" hint="Aún no han recibido ninguna evaluación en este ciclo." value={9} tone="warning" active={active === "pending"} onClick={() => toggle("pending")} />
  <AttentionAction icon={UserX} label="Sin líder" hint="No tienen un líder asignado que pueda evaluarlos." value={5} tone="negative" active={active === "no-leader"} onClick={() => toggle("no-leader")} />
</AttentionStrip>
```

### Tonos

El tono cambia solo el filete y el disco del icono; la superficie es la misma que la de las tarjetas.

```tsx
<AttentionStrip label="Todo al día" icon={CheckCircle2} tone="positive" title="Todo al día" detail="No hay pendientes en este ciclo" />
<AttentionStrip label="Novedad" icon={Info} tone="brand" title="Nueva plantilla disponible" detail="Puedes aplicarla al próximo ciclo" />
<AttentionStrip label="Cierre" icon={AlertTriangle} tone="negative" title="El ciclo cierra en 2 días" detail="Quedan 31 evaluaciones sin enviar" />
<AttentionStrip label="Archivado" icon={Clock} tone="neutral" title="Ciclo archivado" detail="Solo lectura" />
```

### Tono por acción

Cada `AttentionAction` colorea su propio icono según el motivo; la cifra se formatea con separador de miles.

```tsx
<AttentionStrip label="Resumen" icon={BellRing} tone="brand" title="1.240 avisos en la organización" detail="Agrupados por motivo">
  <AttentionAction icon={CheckCircle2} label="Completados" hint="Evaluaciones enviadas y cerradas." value={1024} tone="positive" onClick={goCompleted} />
  <AttentionAction icon={Clock} label="Pendientes" hint="Evaluaciones sin enviar." value={198} tone="warning" onClick={goPending} />
  <AttentionAction icon={UserX} label="Bloqueados" hint="Sin líder o sin plantilla asignada." value={18} tone="negative" onClick={goBlocked} />
</AttentionStrip>
```
