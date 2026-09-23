import * as React from "react";
import { FilterSortHeader, SelectionHeaderMenu, SortOnlyHeader } from "@/components/data-display/TableHeaderControls";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { defineEntry } from "../types";

interface Person {
  id: number;
  name: string;
  area: string;
  score: number;
}

const AREAS = ["Producto", "Ventas", "Tecnología", "Finanzas"] as const;
const NAMES = ["Renata Méndez", "Carlos Rojas", "Ana Torres", "Diego Salazar", "Valentina Ruiz", "Mateo Herrera", "Antonia Castro", "Julián Peña"];
const PEOPLE: Person[] = NAMES.map((name, index) => ({ id: index + 1, name, area: AREAS[index % AREAS.length], score: 55 + ((index * 17) % 45) }));
const PAGE_SIZE = 4;
const formatCount = (value: number) => value.toLocaleString("es-CO");

function headerState(selected: ReadonlySet<number>, ids: readonly number[]): boolean | "indeterminate" {
  const count = ids.filter((id) => selected.has(id)).length;
  if (count === 0) return false;
  return count === ids.length ? true : "indeterminate";
}

function SelectionDemo() {
  const [paged, setPaged] = React.useState(true);
  const [selected, setSelected] = React.useState<ReadonlySet<number>>(new Set());
  const allIds = PEOPLE.map((person) => person.id);
  const pageIds = paged ? allIds.slice(0, PAGE_SIZE) : allIds;
  const rows = paged ? PEOPLE.slice(0, PAGE_SIZE) : PEOPLE;
  const select = (ids: readonly number[]) => setSelected((current) => new Set([...current, ...ids]));
  const deselect = (ids: readonly number[]) => setSelected((current) => new Set([...current].filter((id) => !ids.includes(id))));
  const toggle = (id: number) => (selected.has(id) ? deselect([id]) : select([id]));
  const pageSelectedCount = pageIds.filter((id) => selected.has(id)).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-text-muted">
        <Button size="xs" variant="outline" onClick={() => setPaged((value) => !value)}>
          Modo: {paged ? "paginado" : "scroll infinito"}
        </Button>
        <span>{formatCount(selected.size)} seleccionados</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <SelectionHeaderMenu
                state={headerState(selected, allIds)}
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
                formatCount={formatCount}
              />
            </TableHead>
            <TableHead>Colaborador</TableHead>
            <TableHead>Área</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((person) => (
            <TableRow key={person.id} data-state={selected.has(person.id) ? "selected" : undefined}>
              <TableCell className="text-center">
                <Checkbox checked={selected.has(person.id)} onCheckedChange={() => toggle(person.id)} aria-label={`Seleccionar a ${person.name}`} />
              </TableCell>
              <TableCell className="font-medium">{person.name}</TableCell>
              <TableCell>{person.area}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function FilterSortDemo() {
  const [areas, setAreas] = React.useState<ReadonlySet<string>>(new Set());
  const [sort, setSort] = React.useState<{ key: "area" | "score"; dir: 1 | -1 } | null>(null);
  const toggleArea = (area: string) => setAreas((current) => (current.has(area) ? new Set([...current].filter((value) => value !== area)) : new Set([...current, area])));
  const sortBy = (key: "area" | "score") => setSort((current) => (current?.key === key ? { key, dir: current.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  const rows = PEOPLE.filter((person) => areas.size === 0 || areas.has(person.area)).sort((a, b) => {
    if (!sort) return 0;
    const diff = sort.key === "score" ? a.score - b.score : a.area.localeCompare(b.area);
    return diff * sort.dir;
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Colaborador</TableHead>
          <TableHead>
            <FilterSortHeader label="Área" options={AREAS} selected={areas} onToggleFilter={toggleArea} onClearFilter={() => setAreas(new Set())} sortActive={sort?.key === "area"} onSort={() => sortBy("area")} />
          </TableHead>
          <TableHead>
            <SortOnlyHeader label="Puntaje" align="right" sortActive={sort?.key === "score"} onSort={() => sortBy("score")} />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((person) => (
          <TableRow key={person.id}>
            <TableCell className="font-medium">{person.name}</TableCell>
            <TableCell>{person.area}</TableCell>
            <TableCell className="text-right tabular-nums">{person.score}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export const tableHeaderControlsEntry = defineEntry({
  id: "table-header-controls",
  name: "TableHeaderControls",
  group: "data-display",
  description:
    "Los controles que viven en los encabezados de toda tabla seleccionable: el menú de selección masiva, el encabezado que ordena y filtra por valores, y el que solo ordena. Una sola copia para que la lista de encuestas y la de participación se comporten igual.",
  importPath: 'import { SelectionHeaderMenu, FilterSortHeader, SortOnlyHeader } from "@/components/data-display/TableHeaderControls"',
  sourcePath: "src/components/data-display/TableHeaderControls.tsx",
  status: "stable",
  tags: ["dropdown-menu", "checkbox"],
  examples: [
    {
      id: "selection",
      title: "Selección masiva",
      description: "Con `paged` el encabezado es un menú (esta página / todos); en scroll infinito vuelve a ser una casilla que marca todo lo que hay.",
      layout: "stretch",
      code: `<SelectionHeaderMenu
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
/>`,
      render: () => <SelectionDemo />,
    },
    {
      id: "filter-sort",
      title: "Ordenar y filtrar",
      description: "`FilterSortHeader` para columnas con un conjunto de valores; `SortOnlyHeader` para cifras y fechas, donde filtrar por valor exacto no tiene sentido.",
      layout: "stretch",
      code: `<FilterSortHeader
  label="Área"
  options={AREAS}
  selected={areas}
  onToggleFilter={toggleArea}
  onClearFilter={() => setAreas(new Set())}
  sortActive={sort?.key === "area"}
  onSort={() => sortBy("area")}
/>
<SortOnlyHeader label="Puntaje" align="right" sortActive={sort?.key === "score"} onSort={() => sortBy("score")} />`,
      render: () => <FilterSortDemo />,
    },
  ],
  props: [
    { name: "SelectionHeaderMenu.state", type: 'boolean | "indeterminate"', description: "Cuántas filas están marcadas: ninguna, algunas o todas." },
    { name: "SelectionHeaderMenu.paged", type: "boolean", description: "Si la tabla se lee por páginas. Solo entonces hay menú; en scroll infinito es una casilla." },
    { name: "SelectionHeaderMenu.pageCount / matchCount", type: "number", description: "Filas en la página actual y filas que coinciden con búsqueda y filtros." },
    { name: "SelectionHeaderMenu.show*", type: "boolean", description: "Qué opciones del menú se ofrecen (seleccionar/deseleccionar página o todos)." },
    { name: "SelectionHeaderMenu.on*", type: "() => void", description: "Las cuatro acciones del menú." },
    { name: "SelectionHeaderMenu.align", type: '"center" | "start"', default: '"center"', description: "Dónde cae la marca; debe coincidir con la casilla de las filas." },
    { name: "HeaderSelectAllCheckbox", type: "component", description: "La casilla sola, para tablas sin páginas; `SelectionHeaderMenu` la usa cuando `paged` es falso." },
    { name: "FilterSortHeader.options / selected", type: "readonly string[] / ReadonlySet<string>", description: "Los valores filtrables y los marcados." },
    { name: "FilterSortHeader.defaultAllSelected", type: "boolean", default: "false", description: "Cierto cuando un conjunto vacío significa «nada excluido» en vez de «nada elegido»." },
    { name: "FilterSortHeader.filterLabel", type: "string", description: "Nombre del embudo para el lector de pantalla si difiere del título." },
    { name: "SortOnlyHeader.label", type: "ReactNode", description: "Título de la columna; admite nodos para alternar nombre largo y abreviatura." },
    { name: "sortActive / onSort", type: "boolean / () => void", description: "Si esta columna manda el orden y qué hacer al pulsar." },
    { name: "align", type: '"left" | "right"', default: '"left"', description: "Alineación del encabezado; a la derecha en columnas numéricas." },
  ],
  guidelines: {
    do: ["Alinea `align` del menú con la casilla de las filas; si no, la columna se lee como dos.", "Usa `SortOnlyHeader` en cifras, porcentajes y fechas.", "Recalcula los `show*` desde el estado real: el menú solo ofrece lo que tiene sentido."],
    dont: ["No metas un `Checkbox` real dentro del trigger del menú: es un botón dentro de un botón.", "No ofrezcas «esta página» en scroll infinito; pasa `paged={false}`."],
  },
  related: ["table", "table-config", "checkbox", "dropdown-menu"],
});
