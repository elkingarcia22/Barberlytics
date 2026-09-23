import { DataListBlock } from "@/components/blocks";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ListItem } from "@/components/data-display/ListItem";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import type { TableColumnCells, TableColumnSpec } from "@/components/data-display/table-config";
import { defineEntry, definePlayground } from "../types";

interface DemoRow {
  id: string;
  name: string;
  area: string;
  owner: string;
  progress: number;
  status: "active" | "pending" | "completed";
}

const STATUS_LABELS = { active: "En curso", pending: "Sin iniciar", completed: "Cerrado" } as const;
const AREAS = ["Ventas", "Marketing", "Producto", "Operaciones", "Soporte"];
const OWNERS = ["Renata Méndez", "Carlos Rojas", "Ana Torres", "Diego Salazar"];
const STATUSES = ["active", "pending", "completed"] as const;

/** 24 filas deterministas: la demo no puede cambiar entre recargas. */
const DEMO_ROWS: readonly DemoRow[] = Array.from({ length: 24 }, (_, index) => ({
  id: `p-${index + 1}`,
  name: `${["Plan trimestral", "Seguimiento mensual", "Revisión semestral", "Programa anual"][index % 4]} ${2026 + (index % 2)}`,
  area: AREAS[index % AREAS.length]!,
  owner: OWNERS[index % OWNERS.length]!,
  progress: (index * 17) % 101,
  status: STATUSES[index % 3]!,
}));

const DEMO_COLUMNS: readonly TableColumnSpec[] = [
  { id: "name", label: "Nombre" },
  { id: "area", label: "Área" },
  { id: "owner", label: "Responsable" },
  { id: "status", label: "Estado" },
  { id: "progress", label: "Avance" },
];

const DEMO_CELLS: TableColumnCells<DemoRow> = {
  name: { head: "Nombre", cell: (row) => row.name, cellClassName: "font-medium text-text-primary" },
  area: { head: "Área", cell: (row) => row.area, cellClassName: "text-text-secondary" },
  owner: { head: "Responsable", cell: (row) => row.owner, cellClassName: "text-text-secondary" },
  status: {
    head: "Estado",
    cell: (row) => <StatusBadge status={row.status} label={STATUS_LABELS[row.status]} />,
  },
  progress: {
    head: "Avance",
    headClassName: "text-right",
    cell: (row) => `${row.progress}%`,
    cellClassName: "text-right tabular-nums",
  },
};

const renderListItem = (row: DemoRow, state: { selected: boolean; toggle: () => void }) => (
  <ListItem
    leading={<Checkbox checked={state.selected} onCheckedChange={state.toggle} aria-label={`Seleccionar ${row.name}`} />}
    title={row.name}
    description={`${row.area} · ${row.owner}`}
    meta={
      <span className="flex items-center gap-inline">
        <Progress value={row.progress} className="h-1.5 w-20" />
        <span className="w-10 text-right tabular-nums">{row.progress}%</span>
      </span>
    }
    actions={<StatusBadge status={row.status} label={STATUS_LABELS[row.status]} />}
    selected={state.selected}
  />
);

const DATA_SNIPPET = `const columns = [
  { id: "name", label: "Nombre" },
  { id: "area", label: "Área" },
  // …
];

const cells = {
  name: { head: "Nombre", cell: (row) => row.name },
  status: { head: "Estado", cell: (row) => <StatusBadge status={row.status} /> },
  // …
};`;

export const dataListBlockEntry = defineEntry({
  id: "data-list-block",
  name: "DataListBlock",
  group: "blocks",
  description:
    "Una lista de datos con todo lo que se le pide a una: buscador, configuración de columnas (orden, visibilidad y fijado), vista de tabla o de lista, filas por página o carga al bajar, selección múltiple y estado vacío. Quien lo usa declara qué se lista —filas, columnas y celdas— y no cómo se opera. Las preferencias se recuerdan por `tableId` entre sesiones.",
  importPath: 'import { DataListBlock } from "@/components/blocks"',
  sourcePath: "src/components/blocks/DataListBlock.tsx",
  status: "stable",
  tags: ["bloque", "tabla", "lista", "selección"],
  playground: definePlayground({
    controls: {
      selectable: { type: "boolean", label: "Selección múltiple", default: true },
      searchable: { type: "boolean", label: "Buscador", default: true },
      showCount: { type: "boolean", label: "Contador en el título", default: true },
      pageSize: { type: "number", label: "Filas por página", default: 8, min: 4, max: 20, step: 2 },
    },
    layout: "stretch",
    render: ({ selectable, searchable, showCount, pageSize }) => (
      <DataListBlock
        tableId="docs-data-list-playground"
        title="Lista de procesos"
        noun="procesos"
        rows={DEMO_ROWS}
        columns={DEMO_COLUMNS}
        cells={DEMO_CELLS}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        searchBy={searchable ? (row) => row.name : undefined}
        renderListItem={renderListItem}
        selectable={selectable}
        showCount={showCount}
        pageSize={pageSize}
      />
    ),
    code: ({ selectable, searchable, showCount, pageSize }) => `${DATA_SNIPPET}

<DataListBlock
  tableId="procesos"
  title="Lista de procesos"
  noun="procesos"
  rows={procesos}
  columns={columns}
  cells={cells}
  getRowId={(row) => row.id}
  getRowLabel={(row) => row.name}${searchable ? "\n  searchBy={(row) => row.name}" : ""}
  renderListItem={renderListItem}${selectable ? "\n  selectable" : ""}${showCount ? "" : "\n  showCount={false}"}
  pageSize={${pageSize}}
/>`,
  }),
  examples: [
    {
      id: "full",
      title: "Con todo puesto",
      description:
        "El caso habitual. El botón de configuración cambia entre tabla y lista, ordena y oculta columnas, y alterna entre paginación y carga al bajar; todo se recuerda por `tableId`.",
      layout: "stretch",
      code: `<DataListBlock
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
/>`,
      render: () => (
        <DataListBlock
          tableId="docs-data-list-full"
          title="Lista de procesos"
          noun="procesos"
          rows={DEMO_ROWS}
          columns={DEMO_COLUMNS}
          cells={DEMO_CELLS}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.name}
          searchBy={(row) => row.name}
          renderListItem={renderListItem}
          selectable
        />
      ),
    },
    {
      id: "read-only",
      title: "Solo lectura",
      description:
        "Sin `selectable`, sin `searchBy` y sin `renderListItem`: queda la tabla configurable y su paginación. Es lo mínimo que hay que declarar.",
      layout: "stretch",
      code: `<DataListBlock
  tableId="procesos-lectura"
  title="Procesos del periodo"
  noun="procesos"
  rows={procesos}
  columns={columns}
  cells={cells}
  getRowId={(row) => row.id}
/>`,
      render: () => (
        <DataListBlock
          tableId="docs-data-list-readonly"
          title="Procesos del periodo"
          noun="procesos"
          rows={DEMO_ROWS.slice(0, 6)}
          columns={DEMO_COLUMNS}
          cells={DEMO_CELLS}
          getRowId={(row) => row.id}
        />
      ),
    },
    {
      id: "empty",
      title: "Sin filas",
      description:
        "El bloque distingue «no hay nada» de «nada coincide con la búsqueda». Con `emptyState` se cambia el texto de ambos casos.",
      layout: "stretch",
      code: `<DataListBlock
  tableId="procesos-vacio"
  title="Lista de procesos"
  noun="procesos"
  rows={[]}
  columns={columns}
  cells={cells}
  getRowId={(row) => row.id}
/>`,
      render: () => (
        <DataListBlock
          tableId="docs-data-list-empty"
          title="Lista de procesos"
          noun="procesos"
          rows={[]}
          columns={DEMO_COLUMNS}
          cells={DEMO_CELLS}
          getRowId={(row) => row.id}
        />
      ),
    },
  ],
  props: [
    { name: "tableId", type: "string", description: "Identidad de la lista: con ella se recuerdan columnas, vista y modo de filas. Si cambia, quien la usaba pierde sus ajustes." },
    { name: "title", type: "ReactNode", description: "El título de la lista, en la cabecera del marco." },
    { name: "showCount", type: "boolean", default: "true", description: "El total tras filtrar, en una insignia junto al título." },
    { name: "noun", type: "string", description: "El sustantivo en plural —«procesos»— para los textos de estado, resumen y etiquetas." },
    { name: "rows", type: "readonly T[]", description: "Las filas ya filtradas por lo que decida la pantalla. El buscador del bloque filtra encima." },
    { name: "columns", type: "TableColumnSpec[]", description: "Las columnas declaradas una sola vez: id, etiqueta y si es fija u oculta por defecto." },
    { name: "cells", type: "TableColumnCells<T>", description: "Encabezado y celda de cada columna, juntos, para que mover una no desalinee la otra." },
    { name: "getRowId", type: "(row: T) => string", description: "La clave estable de cada fila. Es lo que guarda la selección." },
    { name: "getRowLabel", type: "(row: T) => string", description: "Cómo se nombra una fila en la casilla que la selecciona. Sin ella se usa el id." },
    { name: "searchBy", type: "(row: T) => string", description: "Sobre qué texto busca el buscador. Sin ella no hay buscador." },
    { name: "renderListItem", type: "(row, state) => ReactNode", description: "El dibujo de una fila en la vista lista. Sin ella el bloque se queda siempre en tabla. El `state` trae ya construidos `checkbox` y `menu` —uno u otro, según la preferencia—: colócalos, no los construyas." },
    { name: "DataListRowState", type: "{ selected; toggle; checkbox; menu }", description: "Lo que el bloque pasa a `renderListItem`. `checkbox` va en `leading` y `menu` al final; el que no aplique llega como `null`." },
    { name: "selectable", type: "boolean", default: "false", description: "Añade la casilla por fila y la de «seleccionar la página»." },
    { name: "selected", type: "ReadonlySet<string>", description: "Con ella la selección la manda quien llama; sin ella, el bloque. Pásala cuando la pantalla necesite leerla —por ejemplo para abrir el action rail." },
    { name: "onSelectedChange", type: "(next: ReadonlySet<string>) => void", description: "Se avisa en cada cambio de selección, mande quien mande." },
    { name: "recordActions", type: "RailActionSpec[]", description: "Lo que se puede hacer con los registros, con el mismo modelo declarativo que la barra flotante: cada acción dice su `scope` (`single`, `bulk`) y se pintan las que apliquen. Dónde se pintan lo decide quien mira desde el panel." },
    { name: "onActionsPlacementChange", type: "(placement: \"rail\" | \"inline\") => void", description: "Avisa de dónde quiere las acciones quien mira. La pantalla lo usa para decidir también las suyas: con `rail` monta la barra flotante y deja su cabecera sin botones; con `inline` los devuelve arriba y no monta la barra." },
    { name: "gender", type: '"f" | "m"', default: '"m"', description: "Concordancia del recuento: «3 seleccionadas» frente a «3 seleccionados»." },
    { name: "pageSize", type: "number", default: "10", description: "Filas por página, y también el tamaño del salto al cargar bajando." },
    { name: "emptyState", type: "ReactNode", description: "Reemplaza el texto de lista vacía." },
    { name: "actions", type: "ReactNode", description: "Acciones propias en la cabecera, antes del buscador y la configuración." },
  ],
  guidelines: {
    do: [
      "Dale un `tableId` estable y único por pantalla: es la llave de las preferencias de quien la usa.",
      "Declara `recordActions` una sola vez y pásaselas también a la barra: son la misma lista, y así los dos sitios se comportan igual.",
      "Escucha `onActionsPlacementChange`: si la pantalla monta la barra sin hacerlo, las acciones se ven dos veces.",
      "En la barra flotante, que la selección *sustituya* las acciones de la pantalla en vez de sumarse, y que las que solo valen para un registro se caigan en cuanto haya más de uno marcado.",
      "Filtra fuera lo que sea una decisión de la pantalla —una alerta, un periodo— y deja que el bloque se ocupe de la búsqueda.",
      "Pasa `selected` y `onSelectedChange` cuando la pantalla tenga que reaccionar a la selección; si no, deja que el bloque la lleve.",
      "Da `renderListItem` siempre que la lista se vaya a leer en móvil: la vista de lista es la que aguanta el ancho estrecho.",
    ],
    dont: [
      "No lo uses para una tabla corta y fija dentro de un panel: ahí basta TableShell con una Table.",
      "No repitas el buscador por fuera: si necesitas buscar sobre otro campo, cambia `searchBy`.",
      "No metas el contador a mano en el `title`; para eso está `showCount`.",
    ],
  },
  related: ["table-shell", "list-item", "status-badge", "heatmap-matrix"],
});
