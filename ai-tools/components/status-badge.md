# StatusBadge

Un `Badge` con vocabulario de estado: cada valor trae su variante de color y su etiqueta en español por defecto. Sirve para que una tabla o una tarjeta digan «Activo» o «Pendiente» sin repetir el mapa de colores en cada pantalla.

Familia: Datos · Doc: `/docs#/components/status-badge` · Fuente: `src/components/data-display/StatusBadge.tsx`

```ts
import { StatusBadge } from "@/components/data-display/StatusBadge"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `status` | `"active" \| "inactive" \| "pending" \| "completed" \| "warning" \| "error" \| "info" \| "neutral"` |  | El estado; decide la variante de color y la etiqueta por defecto. |
| `label` | `string` |  | Texto alternativo; si se omite se usa la etiqueta en español del estado. |
| `className` | `string` |  | Clases extra sobre el `Badge`. |
| `...props` | `React.HTMLAttributes<HTMLDivElement>` |  | Cualquier atributo nativo del contenedor. |

## Guías

- Sí: Usa el mismo `status` para el mismo significado en toda la app; cambia solo `label`.
- Sí: Prefiere `inactive` o `neutral` para lo archivado, no `error`.
- No: No lo uses como botón ni como filtro: es solo lectura.
- No: No inventes colores con `className`; si falta un estado, amplía el mapa.

Relacionados: badge, status-badge-animated, table-shell

## Ejemplos

### Todos los estados

Ocho valores, cuatro tonos: positivo, neutro, aviso, negativo e informativo.

```tsx
<StatusBadge status="active" />
<StatusBadge status="completed" />
<StatusBadge status="pending" />
<StatusBadge status="warning" />
<StatusBadge status="error" />
<StatusBadge status="info" />
<StatusBadge status="inactive" />
<StatusBadge status="neutral" />
```

### Etiqueta propia

El estado fija el color; `label` pone el texto que el dominio necesita.

```tsx
<StatusBadge status="active" label="En curso" />
<StatusBadge status="pending" label="Programado" />
<StatusBadge status="error" label="Sin plantilla" />
<StatusBadge status="completed" label="Cerrado" />
```

### En una tabla

El uso habitual: una columna de estado con la misma altura que el texto de la fila.

```tsx
<TableRow>
  <TableCell>{cycle.name}</TableCell>
  <TableCell><StatusBadge status={cycle.status} label={cycle.label} /></TableCell>
</TableRow>
```
