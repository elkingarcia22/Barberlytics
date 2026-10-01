# Tabla configurable

El kit para que una tabla recuerde cómo quiere verla cada persona: qué columnas, en qué orden, cuáles quedan fijadas al desplazar de lado y si las filas llegan por scroll o por páginas. Las columnas se declaran una sola vez (`TableColumnSpec[]`) y de esa lista salen el encabezado, las celdas y el panel de «Configurar». La preferencia vive en `localStorage` por tabla, no en la URL.

Familia: Datos · Doc: `/docs#/components/table-config` · Fuente: `src/components/data-display/table-config/`

```ts
import { useTableConfig, TableConfigButton, ConfigurableHeaderCells, ConfigurableRowCells, useColumnDrag, useLazyRows, LazyRowsSentinel, LazyRowsSummary, TableBleedBox } from "@/components/data-display/table-config"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `config.view` | `"table" \| "list"` | `"table"` | Rejilla o lista. Lo elige quien lee desde el panel («Cómo se ven») y se recuerda con el resto de la configuración; la pantalla decide cómo dibuja cada una. |
| `config.setView` | `(view) => void` |  | Cambia la vista. El panel ya lo llama; está aquí para un atajo propio de la pantalla. |
| `TableColumnSpec` | `{ id; label; fixed?; hiddenByDefault?; available? }` |  | Una columna declarada una vez. `fixed` la hace inamovible (solo la de selección); `available: false` la saca de la tabla y del panel sin olvidar su sitio. |
| `useTableConfig(tableId, columns, options?)` | `TableConfig` |  | El estado de la tabla, leído de `localStorage` en el primer render. `options.defaultMode` cambia el modo de fábrica (`"lazy"`). |
| `TableConfig.columns / fixedColumns / movableColumns` | `readonly TableColumnSpec[]` |  | Las visibles en orden, las que nunca se mueven y todas las movibles (para el panel). |
| `TableConfig.isLazy / mode / isDirty` | `boolean / TableRowsMode / boolean` |  | Cómo llegan las filas y si algo se salió de fábrica (enciende el punto del botón). |
| `TableConfig.toggleVisibility / togglePin / moveColumn / reset` | `(…) => void` |  | Las acciones del panel. Ocultar una fijada la suelta; fijar una oculta la muestra. |
| `TableColumnCells<T>` | `Record<string, { head; cell(row); headClassName?; cellClassName? }>` |  | Encabezado y celda de cada columna, juntos, para que el orden se aplique una vez sobre el par. |
| `ConfigurableHeaderCells / ConfigurableRowCells` | `component` |  | Recorren `config.columns` y sacan su mitad de `cells`. También miden los anchos para apilar las columnas fijadas. |
| `config.actions` | `"rail" \| "inline"` | `"rail"` | Dónde vive lo que se puede hacer. `rail` lo concentra todo en la barra flotante —las de la pantalla sin selección, las de los registros en cuanto se marca algo, sustituyéndolas— y deja la cabecera de la pantalla sin botones. `inline` las devuelve al layout: arriba las de la pantalla, y en la cabecera de la lista las de lo marcado. |
| `config.setActions` | `(placement) => void` |  | Cambia dónde van las acciones. Lo llama el panel («Dónde van las acciones»). |
| `config.rowControl` | `"checkbox" \| "menu"` | `"checkbox"` | Cómo se actúa sobre un registro. `checkbox` es el modelo de lote: se marcan filas —con su casilla o picando en la fila— y las acciones operan sobre lo marcado. `menu` quita las casillas y le da a cada fila su botón de acciones: se actúa sobre una sola, sin pasar por seleccionar, y no hay acciones en lote. |
| `config.setRowControl` | `(control) => void` |  | Cambia el modelo de fila. Lo llama el panel («Cómo se actúa sobre una fila»). |
| `TableConfigButton` | `{ config; noun?; showRowsMode?; showActionsPlacement?; showRowControl?; className? }` |  | El botón «Configurar» con el popover. `noun` nombra lo listado («colaboradores»); `showRowsMode={false}` esconde el selector de modo, `showActionsPlacement={false}` el de dónde van las acciones y `showRowControl={false}` el del modelo de fila (los dos últimos sobran donde no se opera sobre registros). |
| `DraggableHeaderCell` | `{ column; drag; pinned?; …th }` |  | Un `TableHead` con tirador de arrastre y guía de destino. Lo usa `ConfigurableHeaderCells`; úsalo directo solo en encabezados a mano. |
| `useColumnDrag({ axis, onReorder })` | `ColumnDrag` |  | Arrastre nativo, sin librería. `axis: "x"` en el encabezado, `"y"` en la lista del panel. Devuelve `dragHandleProps`, `dropTargetProps` y `dropSideFor`. |
| `useLazyRows({ total, enabled, step?, resetKey? })` | `LazyRows` |  | Cuántas filas mostrar (`count`), si faltan (`hasMore`) y el `attachSentinel`. Con `enabled: false` devuelve el total. `resetKey` reinicia al cambiar filtros. |
| `LazyRowsSentinel` | `{ lazy; colSpan; noun }` |  | Las últimas filas del `<tbody>`: hasta cuatro esqueletos y un botón «Cargar más» solo para teclado. |
| `LazyRowsSummary` | `{ lazy; total; noun; className? }` |  | El contador «12 de 48 colaboradores» que sustituye al paginador. |
| `TableBleedBox` | `{ bleed?: string; …div }` | `"-mx-6"` | La caja que saca la tabla al borde de su tarjeta, con regla arriba y abajo y scroll horizontal. |

## Guías

- Sí: Ofrece la vista de lista cuando las columnas sobran para decidir: en la lista se queda lo que identifica el registro y su estado.
- Sí: Comparte la selección entre las dos vistas: es la misma lista, solo cambia el dibujo.
- Sí: Usa un `tableId` estable y único por tabla: es la llave con la que se recuerda la preferencia.
- Sí: Pinta la columna fija (selección) a mano antes de `ConfigurableHeaderCells`; no pasa por el diccionario.
- Sí: Acota la altura de la caja con scroll cuando uses `useLazyRows`: el centinela necesita un contenedor que recorte de verdad.
- Sí: Pasa `resetKey` con la búsqueda y los filtros para que la carga vuelva al primer tramo.
- No: No guardes la configuración en la URL: es preferencia de quien mira, no parte de lo que se comparte.
- No: No marques `fixed` más que la columna de selección; para dejar quieta una columna está la chincheta (`pinned`).
- No: No cambies el `id` de una columna ya publicada: rompe el orden guardado en `localStorage`.

Relacionados: table, table-shell, table-header-controls, status-badge, popover, skeleton

## Ejemplos

### Tabla completa

Abre «Configurar» para ocultar, fijar o reordenar columnas («Estado» arranca oculta), o arrastra el tirador que aparece sobre cada encabezado. En scroll infinito las filas se cargan de doce en doce al bajar; en paginación aparece el paginador. La configuración se guarda con la llave `docs-tabla-configurable`.

```tsx
const COLUMNS: TableColumnSpec[] = [
  { id: "select", label: "Selección", fixed: true },
  { id: "name", label: "Colaborador" },
  { id: "area", label: "Área" },
  { id: "progress", label: "Avance" },
  { id: "status", label: "Estado", hiddenByDefault: true },
];

const CELLS: TableColumnCells<Person> = {
  name: { head: "Colaborador", cell: (row) => row.name },
  area: { head: "Área", cell: (row) => row.area },
  progress: { head: "Avance", headClassName: "text-right", cell: (row) => `${row.progress}%`, cellClassName: "text-right" },
  status: { head: "Estado", cell: (row) => <StatusBadge status={row.status} /> },
};

const config = useTableConfig("colaboradores", COLUMNS);
const drag = useColumnDrag({ axis: "x", onReorder: config.moveColumn });
const lazy = useLazyRows({ total: rows.length, enabled: config.isLazy, step: 25, resetKey: query });

<TableConfigButton config={config} noun="colaboradores" />

<div className="max-h-[300px] overflow-y-auto">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-10" />                       {/* la columna fija, a mano */}
        <ConfigurableHeaderCells config={config} drag={drag} cells={CELLS} />
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.slice(0, lazy.count).map((row) => (
        <TableRow key={row.id}>
          <TableCell><Checkbox /></TableCell>
          <ConfigurableRowCells config={config} cells={CELLS} row={row} />
        </TableRow>
      ))}
      <LazyRowsSentinel lazy={lazy} colSpan={1 + config.columns.length} noun="colaboradores" />
    </TableBody>
  </Table>
</div>
<LazyRowsSummary lazy={lazy} total={rows.length} noun="colaboradores" />
```

### De lado a lado de la tarjeta

`TableBleedBox` anula el padding del contenedor (por defecto `-mx-6`) para que las filas lleguen al borde y no queden dos marcos concéntricos. Las celdas recuperan el margen con `pl-6` / `pr-6`.

```tsx
<Card>
  <CardHeader><CardTitle>Participantes del ciclo</CardTitle></CardHeader>
  <CardContent>
    <TableBleedBox>            {/* bleed="-mx-6" por defecto */}
      <Table>…</Table>
    </TableBleedBox>
  </CardContent>
</Card>
```
