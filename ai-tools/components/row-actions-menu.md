# RowActionsMenu

El botón de acciones de una fila: lo que se puede hacer con ese registro sin pasar por marcarlo. Es la alternativa a las casillas cuando la lista se opera de una en una —un menú por fila en vez de un modelo de lote—, y es lo que pinta DataListBlock cuando quien mira elige «Menú en cada fila» en el panel de configuración.

Familia: Datos · Doc: `/docs#/components/row-actions-menu` · Fuente: `src/components/data-display/RowActionsMenu.tsx`

```ts
import { RowActionsMenu } from "@/components/data-display"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `actions` | `RowAction[]` |  | Lo que se puede hacer con la fila. Con la lista vacía el botón no se pinta: un menú sin nada dentro es peor que no tenerlo. |
| `RowAction` | `{ id; label; icon?; tone?; blockedReason?; onSelect? }` |  | Mismo contrato que las acciones de la barra flotante, para declarar una vez y pintar en los dos sitios. |
| `rowLabel` | `string` |  | Qué fila se opera. Entra en el `aria-label` del botón para que no sea un «⋯» sin dueño. |
| `className` | `string` |  | Clases del botón disparador. |

## Guías

- Sí: Pasa `rowLabel` siempre: es lo único que distingue un botón de otro para quien navega con lector de pantalla.
- Sí: Pon `tone: "danger"` en lo destructivo y déjalo al final de la lista.
- Sí: Usa `blockedReason` en vez de quitar la acción cuando no aplica en ese estado.
- No: No lo mezcles con casillas en la misma tabla: o se opera en lote o se opera de una en una.
- No: No metas ahí acciones que afectan a toda la pantalla; esas van en la cabecera o en la barra flotante.

Relacionados: data-list-block, data-list-action-rail, table-config, list-item

## Ejemplos

### Una fila, sus acciones

El botón nombra la fila que opera —«Acciones de Plan trimestral 2026»— en vez de ser un «⋯» anónimo repetido en cada línea, que con un lector de pantalla no dice nada.

```tsx
<RowActionsMenu rowLabel={row.name} actions={acciones} />
```

### Lo que no se puede ahora

Con `blockedReason` la acción se queda a la vista y apagada, con el motivo en el título. Esconderla deja preguntándose si existe; explicarla contesta.

```tsx
{ id: "delete", label: "Eliminar", tone: "danger",
  blockedReason: "Un proceso en curso no se puede eliminar." }
```
