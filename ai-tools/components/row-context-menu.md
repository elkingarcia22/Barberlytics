# RowContextMenu

El clic derecho sobre un registro —una fila de tabla, una tarjeta de la agenda—: el mismo menú de acciones que el botón «⋯», sin tener que apuntarle. Lo destructivo va al final y separado, y lo bloqueado sale apagado con su motivo. Es un atajo: lo que ofrece tiene que existir también a la vista.

Familia: Datos · Doc: `/docs#/components/row-context-menu` · Fuente: `src/components/data-display/RowContextMenu.tsx`

```ts
import { RowContextMenu } from "@/components/data-display"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `actions` | `RowAction[]` |  | Las mismas acciones que `RowActionsMenu`. Con la lista vacía no envuelve nada y el clic derecho vuelve a ser el del navegador. |
| `rowLabel` | `string` |  | Qué se opera; encabeza el menú para saber sobre qué se hizo clic. |
| `onOpenChange` | `(open: boolean) => void` |  | Al abrir, quien lo usa suele marcar la fila: las acciones de una lista operan sobre lo marcado (así lo hace DataListBlock). |
| `children` | `ReactElement` |  | La fila o tarjeta. Tiene que aceptar ref y props; si no, envuélvela en un `<div className="contents">`. |

## Guías

- Sí: Ofrece las mismas acciones que el botón «⋯» o el panel del registro: el clic derecho es un atajo, no un sitio nuevo.
- Sí: Marca la fila al abrir el menú cuando las acciones operan sobre la selección.
- Sí: Deja lo irreversible con `tone: "danger"`: el menú lo separa y lo pone al final.
- No: No escondas acciones solo en el clic derecho: en táctil y con teclado no se descubre.
- No: No lo pongas en propuestas o vistas previas que se aceptan tocándolas: ahí no hay nada que operar.

Relacionados: row-actions-menu, data-list-block, resource-day-grid, context-menu

## Ejemplos

### Clic derecho en una fila

Haz clic derecho en cualquier fila: sale el nombre de la fila arriba y sus acciones, con «Eliminar» separado al final. El botón «⋯» sigue ahí para táctil y teclado.

```tsx
<RowContextMenu rowLabel={row.name} actions={acciones}>
  <TableRow>…</TableRow>
</RowContextMenu>
```
