# DataListBlock

Una lista de datos con todo lo que se le pide a una: buscador, configuración de columnas (orden, visibilidad y fijado), vista de tabla o de lista, filas por página o carga al bajar, selección múltiple y estado vacío. Quien lo usa declara qué se lista —filas, columnas y celdas— y no cómo se opera. Las preferencias se recuerdan por `tableId` entre sesiones.

Familia: Bloques · Doc: `/docs#/components/data-list-block` · Fuente: `src/components/blocks/DataListBlock.tsx`

```ts
import { DataListBlock } from "@/components/blocks"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `tableId` | `string` |  | Identidad de la lista: con ella se recuerdan columnas, vista y modo de filas. Si cambia, quien la usaba pierde sus ajustes. |
| `title` | `ReactNode` |  | El título de la lista, en la cabecera del marco. |
| `showCount` | `boolean` | `true` | El total tras filtrar, en una insignia junto al título. |
| `noun` | `string` |  | El sustantivo en plural —«procesos»— para los textos de estado, resumen y etiquetas. |
| `rows` | `readonly T[]` |  | Las filas ya filtradas por lo que decida la pantalla. El buscador del bloque filtra encima. |
| `columns` | `TableColumnSpec[]` |  | Las columnas declaradas una sola vez: id, etiqueta y si es fija u oculta por defecto. |
| `cells` | `TableColumnCells<T>` |  | Encabezado y celda de cada columna, juntos, para que mover una no desalinee la otra. |
| `getRowId` | `(row: T) => string` |  | La clave estable de cada fila. Es lo que guarda la selección. |
| `getRowLabel` | `(row: T) => string` |  | Cómo se nombra una fila en la casilla que la selecciona. Sin ella se usa el id. |
| `searchBy` | `(row: T) => string` |  | Sobre qué texto busca el buscador. Sin ella no hay buscador. |
| `renderListItem` | `(row, state) => ReactNode` |  | El dibujo de una fila en la vista lista. Sin ella el bloque se queda siempre en tabla. El `state` trae ya construidos `checkbox` y `menu` —uno u otro, según la preferencia—: colócalos, no los construyas. |
| `DataListRowState` | `{ selected; toggle; checkbox; menu }` |  | Lo que el bloque pasa a `renderListItem`. `checkbox` va en `leading` y `menu` al final; el que no aplique llega como `null`. |
| `selectable` | `boolean` | `false` | Añade la casilla por fila y la de «seleccionar la página». |
| `selected` | `ReadonlySet<string>` |  | Con ella la selección la manda quien llama; sin ella, el bloque. Pásala cuando la pantalla necesite leerla —por ejemplo para abrir el action rail. |
| `onSelectedChange` | `(next: ReadonlySet<string>) => void` |  | Se avisa en cada cambio de selección, mande quien mande. |
| `recordActions` | `RailActionSpec[]` |  | Lo que se puede hacer con los registros, con el mismo modelo declarativo que la barra flotante: cada acción dice su `scope` (`single`, `bulk`) y se pintan las que apliquen. Dónde se pintan lo decide quien mira desde el panel. |
| `onActionsPlacementChange` | `(placement: "rail" \| "inline") => void` |  | Avisa de dónde quiere las acciones quien mira. La pantalla lo usa para decidir también las suyas: con `rail` monta la barra flotante y deja su cabecera sin botones; con `inline` los devuelve arriba y no monta la barra. |
| `gender` | `"f" \| "m"` | `"m"` | Concordancia del recuento: «3 seleccionadas» frente a «3 seleccionados». |
| `pageSize` | `number` | `10` | Filas por página, y también el tamaño del salto al cargar bajando. |
| `emptyState` | `ReactNode` |  | Reemplaza el texto de lista vacía. |
| `actions` | `ReactNode` |  | Acciones propias en la cabecera, antes del buscador y la configuración. |

## Guías

- Sí: Dale un `tableId` estable y único por pantalla: es la llave de las preferencias de quien la usa.
- Sí: Declara `recordActions` una sola vez y pásaselas también a la barra: son la misma lista, y así los dos sitios se comportan igual.
- Sí: Escucha `onActionsPlacementChange`: si la pantalla monta la barra sin hacerlo, las acciones se ven dos veces.
- Sí: En la barra flotante, que la selección *sustituya* las acciones de la pantalla en vez de sumarse, y que las que solo valen para un registro se caigan en cuanto haya más de uno marcado.
- Sí: Filtra fuera lo que sea una decisión de la pantalla —una alerta, un periodo— y deja que el bloque se ocupe de la búsqueda.
- Sí: Pasa `selected` y `onSelectedChange` cuando la pantalla tenga que reaccionar a la selección; si no, deja que el bloque la lleve.
- Sí: Da `renderListItem` siempre que la lista se vaya a leer en móvil: la vista de lista es la que aguanta el ancho estrecho.
- No: No lo uses para una tabla corta y fija dentro de un panel: ahí basta TableShell con una Table.
- No: No repitas el buscador por fuera: si necesitas buscar sobre otro campo, cambia `searchBy`.
- No: No metas el contador a mano en el `title`; para eso está `showCount`.

Relacionados: table-shell, list-item, status-badge, heatmap-matrix

## Ejemplos

### Con todo puesto

El caso habitual. El botón de configuración cambia entre tabla y lista, ordena y oculta columnas, y alterna entre paginación y carga al bajar; todo se recuerda por `tableId`.

```tsx
<DataListBlock
  tableId="procesos"
  title="Lista de procesos"
  noun="procesos"
  rows={procesos}
  columns={columns}
  cells={cells}
  getRowId={(row) => row.id}
  searchBy={(row) => row.name}
  renderListItem={renderListItem}
  selectable
/>
```

### Solo lectura

Sin `selectable`, sin `searchBy` y sin `renderListItem`: queda la tabla configurable y su paginación. Es lo mínimo que hay que declarar.

```tsx
<DataListBlock
  tableId="procesos-lectura"
  title="Procesos del periodo"
  noun="procesos"
  rows={procesos}
  columns={columns}
  cells={cells}
  getRowId={(row) => row.id}
/>
```

### Sin filas

El bloque distingue «no hay nada» de «nada coincide con la búsqueda». Con `emptyState` se cambia el texto de ambos casos.

```tsx
<DataListBlock
  tableId="procesos-vacio"
  title="Lista de procesos"
  noun="procesos"
  rows={[]}
  columns={columns}
  cells={cells}
  getRowId={(row) => row.id}
/>
```
