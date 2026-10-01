# TableHeaderControls

Los controles que viven en los encabezados de toda tabla seleccionable: el menú de selección masiva, el encabezado que ordena y filtra por valores, y el que solo ordena. Una sola copia para que la lista de encuestas y la de participación se comporten igual.

Familia: Datos · Doc: `/docs#/components/table-header-controls` · Fuente: `src/components/data-display/TableHeaderControls.tsx`

```ts
import { SelectionHeaderMenu, FilterSortHeader, SortOnlyHeader } from "@/components/data-display/TableHeaderControls"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `SelectionHeaderMenu.state` | `boolean \| "indeterminate"` |  | Cuántas filas están marcadas: ninguna, algunas o todas. |
| `SelectionHeaderMenu.paged` | `boolean` |  | Si la tabla se lee por páginas. Solo entonces hay menú; en scroll infinito es una casilla. |
| `SelectionHeaderMenu.pageCount / matchCount` | `number` |  | Filas en la página actual y filas que coinciden con búsqueda y filtros. |
| `SelectionHeaderMenu.show*` | `boolean` |  | Qué opciones del menú se ofrecen (seleccionar/deseleccionar página o todos). |
| `SelectionHeaderMenu.on*` | `() => void` |  | Las cuatro acciones del menú. |
| `SelectionHeaderMenu.align` | `"center" \| "start"` | `"center"` | Dónde cae la marca; debe coincidir con la casilla de las filas. |
| `HeaderSelectAllCheckbox` | `component` |  | La casilla sola, para tablas sin páginas; `SelectionHeaderMenu` la usa cuando `paged` es falso. |
| `FilterSortHeader.options / selected` | `readonly string[] / ReadonlySet<string>` |  | Los valores filtrables y los marcados. |
| `FilterSortHeader.defaultAllSelected` | `boolean` | `false` | Cierto cuando un conjunto vacío significa «nada excluido» en vez de «nada elegido». |
| `FilterSortHeader.filterLabel` | `string` |  | Nombre del embudo para el lector de pantalla si difiere del título. |
| `SortOnlyHeader.label` | `ReactNode` |  | Título de la columna; admite nodos para alternar nombre largo y abreviatura. |
| `sortActive / onSort` | `boolean / () => void` |  | Si esta columna manda el orden y qué hacer al pulsar. |
| `align` | `"left" \| "right"` | `"left"` | Alineación del encabezado; a la derecha en columnas numéricas. |

## Guías

- Sí: Alinea `align` del menú con la casilla de las filas; si no, la columna se lee como dos.
- Sí: Usa `SortOnlyHeader` en cifras, porcentajes y fechas.
- Sí: Recalcula los `show*` desde el estado real: el menú solo ofrece lo que tiene sentido.
- No: No metas un `Checkbox` real dentro del trigger del menú: es un botón dentro de un botón.
- No: No ofrezcas «esta página» en scroll infinito; pasa `paged={false}`.

Relacionados: table, table-config, checkbox, dropdown-menu

## Ejemplos

### Selección masiva

Con `paged` el encabezado es un menú (esta página / todos); en scroll infinito vuelve a ser una casilla que marca todo lo que hay.

```tsx
<SelectionHeaderMenu
  state={headerState}            // false | true | "indeterminate"
  paged={paged}
  pageCount={pageIds.length}
  matchCount={allIds.length}
  showSelectPage={pageSelectedCount < pageIds.length}
  showSelectAll={selected.size < allIds.length}
  showDeselectPage={pageSelectedCount > 0}
  showDeselectAll={selected.size > 0}
  onSelectPage={() => select(pageIds)}
  onSelectAll={() => select(allIds)}
  onDeselectPage={() => deselect(pageIds)}
  onDeselectAll={() => setSelected(new Set())}
  formatCount={(n) => n.toLocaleString("es-CO")}
/>
```

### Ordenar y filtrar

`FilterSortHeader` para columnas con un conjunto de valores; `SortOnlyHeader` para cifras y fechas, donde filtrar por valor exacto no tiene sentido.

```tsx
<FilterSortHeader
  label="Área"
  options={AREAS}
  selected={areas}
  onToggleFilter={toggleArea}
  onClearFilter={() => setAreas(new Set())}
  sortActive={sort?.key === "area"}
  onSort={() => sortBy("area")}
/>
<SortOnlyHeader label="Puntaje" align="right" sortActive={sort?.key === "score"} onSort={() => sortBy("score")} />
```
