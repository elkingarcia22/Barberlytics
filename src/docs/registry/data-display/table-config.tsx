import * as React from "react";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import {
  ConfigurableHeaderCells,
  ConfigurableRowCells,
  LazyRowsSentinel,
  LazyRowsSummary,
  TableBleedBox,
  TableConfigButton,
  useColumnDrag,
  useLazyRows,
  useTableConfig,
  type TableColumnCells,
  type TableColumnSpec,
} from "@/components/data-display/table-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { defineEntry } from "../types";

interface Person {
  id: number;
  name: string;
  area: string;
  objective: string;
  progress: number;
  status: "active" | "pending" | "completed";
}

const FIRST = ["Laura", "Carlos", "Ana", "Diego", "Valentina", "Mateo", "Sofía", "Julián", "Camila", "Andrés", "Isabela", "Santiago"];
const LAST = ["Méndez", "Rojas", "Torres", "Salazar", "Ruiz", "Herrera", "Castro", "Peña"];
const AREAS = ["Producto", "Ventas", "Tecnología", "Finanzas", "Marketing", "Personas"];
const OBJECTIVES = ["Lanzar onboarding v2", "Cerrar Q3 con +12%", "Migrar el data warehouse", "Reducir churn al 4%", "Certificar 40 líderes", "Automatizar la nómina"];
const STATUSES: Person["status"][] = ["active", "pending", "completed"];

/** 48 filas deterministas, sin depender de mocks. */
const PEOPLE: Person[] = Array.from({ length: 48 }, (_, index) => ({
  id: index + 1,
  name: `${FIRST[index % FIRST.length]} ${LAST[(index * 5) % LAST.length]}`,
  area: AREAS[(index * 7) % AREAS.length],
  objective: OBJECTIVES[(index * 11) % OBJECTIVES.length],
  progress: (index * 37) % 101,
  status: STATUSES[(index * 3) % STATUSES.length],
}));

const COLUMNS: TableColumnSpec[] = [
  { id: "select", label: "Selección", fixed: true },
  { id: "name", label: "Colaborador" },
  { id: "area", label: "Área" },
  { id: "objective", label: "Objetivo" },
  { id: "progress", label: "Avance" },
  { id: "status", label: "Estado", hiddenByDefault: true },
];

const CELLS: TableColumnCells<Person> = {
  name: { head: "Colaborador", cell: (row) => row.name, cellClassName: "font-medium" },
  area: { head: "Área", cell: (row) => row.area },
  objective: { head: "Objetivo", cell: (row) => row.objective, cellClassName: "text-text-secondary" },
  progress: { head: "Avance", headClassName: "text-right", cell: (row) => `${row.progress}%`, cellClassName: "text-right tabular-nums" },
  status: { head: "Estado", cell: (row) => <StatusBadge status={row.status} /> },
};

const PAGE_SIZE = 12;

function ConfigurableTableDemo() {
  const config = useTableConfig("docs-tabla-configurable", COLUMNS);
  const drag = useColumnDrag({ axis: "x", onReorder: config.moveColumn });
  const lazy = useLazyRows({ total: PEOPLE.length, enabled: config.isLazy, step: PAGE_SIZE });
  const [page, setPage] = React.useState(0);
  const [selected, setSelected] = React.useState<ReadonlySet<number>>(new Set());

  const pageCount = Math.ceil(PEOPLE.length / PAGE_SIZE);
  const rows = config.isLazy ? PEOPLE.slice(0, lazy.count) : PEOPLE.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const colSpan = config.fixedColumns.length + config.columns.length;
  const toggle = (id: number) =>
    setSelected((current) => (current.has(id) ? new Set([...current].filter((value) => value !== id)) : new Set([...current, id])));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        {config.isLazy ? (
          <LazyRowsSummary lazy={lazy} total={PEOPLE.length} noun="colaboradores" />
        ) : (
          <p className="text-[12px] text-muted-foreground">
            Página {page + 1} de {pageCount} · {PEOPLE.length} colaboradores
          </p>
        )}
        <TableConfigButton config={config} noun="colaboradores" />
      </div>

      <div className="max-h-[300px] overflow-y-auto rounded-lg border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">
                <span className="sr-only">Seleccionar</span>
              </TableHead>
              <ConfigurableHeaderCells config={config} drag={drag} cells={CELLS} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((person) => (
              <TableRow key={person.id} data-state={selected.has(person.id) ? "selected" : undefined}>
                <TableCell className="text-center">
                  <Checkbox checked={selected.has(person.id)} onCheckedChange={() => toggle(person.id)} aria-label={`Seleccionar a ${person.name}`} />
                </TableCell>
                <ConfigurableRowCells config={config} cells={CELLS} row={person} />
              </TableRow>
            ))}
            {config.isLazy && <LazyRowsSentinel lazy={lazy} colSpan={colSpan} noun="colaboradores" />}
          </TableBody>
        </Table>
      </div>

      {!config.isLazy && (
        <div className="flex justify-end gap-2">
          <Button size="xs" variant="outline" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>
            Anterior
          </Button>
          <Button size="xs" variant="outline" disabled={page >= pageCount - 1} onClick={() => setPage((value) => value + 1)}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}

function BleedDemo() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-sm">Participantes del ciclo</CardTitle>
      </CardHeader>
      <CardContent>
        <TableBleedBox>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Colaborador</TableHead>
                <TableHead className="pr-6 text-right">Avance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PEOPLE.slice(0, 4).map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="pl-6 font-medium">{person.name}</TableCell>
                  <TableCell className="pr-6 text-right tabular-nums">{person.progress}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableBleedBox>
      </CardContent>
    </Card>
  );
}

export const tableConfigEntry = defineEntry({
  id: "table-config",
  name: "Tabla configurable",
  group: "data-display",
  description:
    "El kit para que una tabla recuerde cómo quiere verla cada persona: qué columnas, en qué orden, cuáles quedan fijadas al desplazar de lado y si las filas llegan por scroll o por páginas. Las columnas se declaran una sola vez (`TableColumnSpec[]`) y de esa lista salen el encabezado, las celdas y el panel de «Configurar». La preferencia vive en `localStorage` por tabla, no en la URL.",
  importPath: 'import { useTableConfig, TableConfigButton, ConfigurableHeaderCells, ConfigurableRowCells, useColumnDrag, useLazyRows, LazyRowsSentinel, LazyRowsSummary, TableBleedBox } from "@/components/data-display/table-config"',
  sourcePath: "src/components/data-display/table-config/",
  status: "stable",
  tags: ["hooks", "popover", "drag-and-drop", "localStorage"],
  examples: [
    {
      id: "complete",
      title: "Tabla completa",
      description:
        "Abre «Configurar» para ocultar, fijar o reordenar columnas («Estado» arranca oculta), o arrastra el tirador que aparece sobre cada encabezado. En scroll infinito las filas se cargan de doce en doce al bajar; en paginación aparece el paginador. La configuración se guarda con la llave `docs-tabla-configurable`.",
      layout: "stretch",
      frameClassName: "min-h-[360px]",
      code: `const COLUMNS: TableColumnSpec[] = [
  { id: "select", label: "Selección", fixed: true },
  { id: "name", label: "Colaborador" },
  { id: "area", label: "Área" },
  { id: "progress", label: "Avance" },
  { id: "status", label: "Estado", hiddenByDefault: true },
];

const CELLS: TableColumnCells<Person> = {
  name: { head: "Colaborador", cell: (row) => row.name },
  area: { head: "Área", cell: (row) => row.area },
  progress: { head: "Avance", headClassName: "text-right", cell: (row) => \`\${row.progress}%\`, cellClassName: "text-right" },
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
<LazyRowsSummary lazy={lazy} total={rows.length} noun="colaboradores" />`,
      render: () => <ConfigurableTableDemo />,
    },
    {
      id: "bleed",
      title: "De lado a lado de la tarjeta",
      description:
        "`TableBleedBox` anula el padding del contenedor (por defecto `-mx-6`) para que las filas lleguen al borde y no queden dos marcos concéntricos. Las celdas recuperan el margen con `pl-6` / `pr-6`.",
      layout: "center",
      code: `<Card>
  <CardHeader><CardTitle>Participantes del ciclo</CardTitle></CardHeader>
  <CardContent>
    <TableBleedBox>            {/* bleed="-mx-6" por defecto */}
      <Table>…</Table>
    </TableBleedBox>
  </CardContent>
</Card>`,
      render: () => <BleedDemo />,
    },
  ],
  props: [
    { name: "TableColumnSpec", type: "{ id; label; fixed?; hiddenByDefault?; available? }", description: "Una columna declarada una vez. `fixed` la hace inamovible (solo la de selección); `available: false` la saca de la tabla y del panel sin olvidar su sitio." },
    { name: "useTableConfig(tableId, columns, options?)", type: "TableConfig", description: "El estado de la tabla, leído de `localStorage` en el primer render. `options.defaultMode` cambia el modo de fábrica (`\"lazy\"`)." },
    { name: "TableConfig.columns / fixedColumns / movableColumns", type: "readonly TableColumnSpec[]", description: "Las visibles en orden, las que nunca se mueven y todas las movibles (para el panel)." },
    { name: "TableConfig.isLazy / mode / isDirty", type: "boolean / TableRowsMode / boolean", description: "Cómo llegan las filas y si algo se salió de fábrica (enciende el punto del botón)." },
    { name: "TableConfig.toggleVisibility / togglePin / moveColumn / reset", type: "(…) => void", description: "Las acciones del panel. Ocultar una fijada la suelta; fijar una oculta la muestra." },
    { name: "TableColumnCells<T>", type: "Record<string, { head; cell(row); headClassName?; cellClassName? }>", description: "Encabezado y celda de cada columna, juntos, para que el orden se aplique una vez sobre el par." },
    { name: "ConfigurableHeaderCells / ConfigurableRowCells", type: "component", description: "Recorren `config.columns` y sacan su mitad de `cells`. También miden los anchos para apilar las columnas fijadas." },
    { name: "TableConfigButton", type: "{ config; noun?; showRowsMode?; className? }", description: "El botón «Configurar» con el popover. `noun` nombra lo listado («colaboradores»); `showRowsMode={false}` esconde el selector de modo." },
    { name: "DraggableHeaderCell", type: "{ column; drag; pinned?; …th }", description: "Un `TableHead` con tirador de arrastre y guía de destino. Lo usa `ConfigurableHeaderCells`; úsalo directo solo en encabezados a mano." },
    { name: "useColumnDrag({ axis, onReorder })", type: "ColumnDrag", description: "Arrastre nativo, sin librería. `axis: \"x\"` en el encabezado, `\"y\"` en la lista del panel. Devuelve `dragHandleProps`, `dropTargetProps` y `dropSideFor`." },
    { name: "useLazyRows({ total, enabled, step?, resetKey? })", type: "LazyRows", description: "Cuántas filas mostrar (`count`), si faltan (`hasMore`) y el `attachSentinel`. Con `enabled: false` devuelve el total. `resetKey` reinicia al cambiar filtros." },
    { name: "LazyRowsSentinel", type: "{ lazy; colSpan; noun }", description: "Las últimas filas del `<tbody>`: hasta cuatro esqueletos y un botón «Cargar más» solo para teclado." },
    { name: "LazyRowsSummary", type: "{ lazy; total; noun; className? }", description: "El contador «12 de 48 colaboradores» que sustituye al paginador." },
    { name: "TableBleedBox", type: "{ bleed?: string; …div }", default: '"-mx-6"', description: "La caja que saca la tabla al borde de su tarjeta, con regla arriba y abajo y scroll horizontal." },
  ],
  guidelines: {
    do: [
      "Usa un `tableId` estable y único por tabla: es la llave con la que se recuerda la preferencia.",
      "Pinta la columna fija (selección) a mano antes de `ConfigurableHeaderCells`; no pasa por el diccionario.",
      "Acota la altura de la caja con scroll cuando uses `useLazyRows`: el centinela necesita un contenedor que recorte de verdad.",
      "Pasa `resetKey` con la búsqueda y los filtros para que la carga vuelva al primer tramo.",
    ],
    dont: [
      "No guardes la configuración en la URL: es preferencia de quien mira, no parte de lo que se comparte.",
      "No marques `fixed` más que la columna de selección; para dejar quieta una columna está la chincheta (`pinned`).",
      "No cambies el `id` de una columna ya publicada: rompe el orden guardado en `localStorage`.",
    ],
  },
  related: ["table", "table-shell", "table-header-controls", "status-badge", "popover", "skeleton"],
});
