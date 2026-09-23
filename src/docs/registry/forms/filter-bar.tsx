import * as React from "react";
import { Download, Plus } from "lucide-react";
import { FilterBar, type ActiveFilter } from "@/components/filters";
import { MultiSelect } from "@/components/forms";
import { SearchableSelect } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const AREAS = [
  { value: "ventas", label: "Ventas" },
  { value: "operaciones", label: "Operaciones" },
  { value: "tecnologia", label: "Tecnología" },
  { value: "personas", label: "Personas" },
];

const STATES = [
  { value: "activo", label: "Activo" },
  { value: "pendiente", label: "Pendiente" },
  { value: "vencido", label: "Vencido" },
];

const AREA_LABEL = Object.fromEntries(AREAS.map((area) => [area.value, area.label]));
const STATE_LABEL = Object.fromEntries(STATES.map((state) => [state.value, state.label]));

/**
 * La barra con su estado: búsqueda, dos selects y los chips que salen de
 * ellos. `FilterBar` no guarda nada; todo vive aquí y se le pasa ya resuelto.
 */
function FilterBarDemo({
  withSearch = true,
  withActions = false,
  searchPlaceholder = "Buscar colaboradores…",
}: {
  withSearch?: boolean;
  withActions?: boolean;
  searchPlaceholder?: string;
}) {
  const [search, setSearch] = React.useState("");
  const [area, setArea] = React.useState<string | undefined>("ventas");
  const [states, setStates] = React.useState<string[]>(["activo"]);

  const activeFilters: ActiveFilter[] = [
    ...(area ? [{ id: "area", label: "Área", value: AREA_LABEL[area], onRemove: () => setArea(undefined) }] : []),
    ...states.map((state) => ({
      id: `estado-${state}`,
      label: "Estado",
      value: STATE_LABEL[state],
      onRemove: () => setStates((items) => items.filter((item) => item !== state)),
    })),
  ];

  const clear = () => {
    setArea(undefined);
    setStates([]);
  };

  return (
    <FilterBar
      searchValue={withSearch ? search : undefined}
      onSearchChange={withSearch ? setSearch : undefined}
      searchPlaceholder={searchPlaceholder}
      filters={
        <>
          <SearchableSelect options={AREAS} value={area} onValueChange={setArea} placeholder="Área" className="w-44" />
          <MultiSelect options={STATES} value={states} onValueChange={setStates} placeholder="Estado" className="w-52" />
        </>
      }
      actions={
        withActions ? (
          <>
            <Button variant="outline" size="sm">
              <Download /> Exportar
            </Button>
            <Button size="sm">
              <Plus /> Nuevo
            </Button>
          </>
        ) : undefined
      }
      activeFilters={activeFilters}
      onClearFilters={clear}
    />
  );
}

/** Solo búsqueda, sin chips: el caso de una lista corta. */
function SearchOnlyDemo() {
  const [search, setSearch] = React.useState("");
  return <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Buscar cursos…" />;
}

export const filterBarEntry = defineEntry({
  id: "filter-bar",
  name: "FilterBar",
  group: "forms",
  description:
    "La cabecera de filtros de un listado: una tarjeta con búsqueda, un hueco para los selects y otro para las acciones, y debajo la fila de chips con los filtros activos y «Limpiar filtros». Úsala encima de tablas y grids cuando la persona combina búsqueda y varios criterios; el componente no guarda estado, tú le pasas los filtros ya resueltos.",
  importPath: 'import { FilterBar, type ActiveFilter } from "@/components/filters"',
  sourcePath: "src/components/filters/FilterBar.tsx",
  status: "beta",
  tags: ["controlled", "slots", "chips"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      withSearch: { type: "boolean", label: "Con búsqueda", default: true },
      searchPlaceholder: { type: "text", label: "Placeholder", default: "Buscar colaboradores…" },
      withActions: { type: "boolean", label: "Con acciones", default: false },
    },
    render: ({ withSearch, searchPlaceholder, withActions }) => (
      <FilterBarDemo key={`${withSearch}-${withActions}`} withSearch={withSearch} searchPlaceholder={searchPlaceholder} withActions={withActions} />
    ),
    code: ({ withSearch, searchPlaceholder, withActions }) => {
      const lines = [
        "<FilterBar",
        withSearch ? `  searchValue={search}\n  onSearchChange={setSearch}\n  searchPlaceholder="${searchPlaceholder}"` : "",
        "  filters={<><SearchableSelect … /><MultiSelect … /></>}",
        withActions ? '  actions={<><Button variant="outline" size="sm">Exportar</Button><Button size="sm">Nuevo</Button></>}' : "",
        "  activeFilters={activeFilters}",
        "  onClearFilters={clear}",
        "/>",
      ].filter(Boolean);
      return lines.join("\n");
    },
  }),
  examples: [
    {
      id: "complete",
      title: "Búsqueda, selects y chips",
      description:
        "Cada filtro activo se convierte en un `ActiveFilter` con su `onRemove`; «Limpiar filtros» solo aparece cuando hay chips y `onClearFilters`.",
      layout: "stretch",
      code: `const [search, setSearch] = React.useState("");
const [area, setArea] = React.useState<string>();
const [states, setStates] = React.useState<string[]>([]);

const activeFilters: ActiveFilter[] = [
  ...(area ? [{ id: "area", label: "Área", value: AREA_LABEL[area], onRemove: () => setArea(undefined) }] : []),
  ...states.map((state) => ({
    id: \`estado-\${state}\`,
    label: "Estado",
    value: STATE_LABEL[state],
    onRemove: () => setStates((items) => items.filter((item) => item !== state)),
  })),
];

<FilterBar
  searchValue={search}
  onSearchChange={setSearch}
  searchPlaceholder="Buscar colaboradores…"
  filters={
    <>
      <SearchableSelect options={AREAS} value={area} onValueChange={setArea} placeholder="Área" className="w-44" />
      <MultiSelect options={STATES} value={states} onValueChange={setStates} placeholder="Estado" className="w-52" />
    </>
  }
  activeFilters={activeFilters}
  onClearFilters={() => { setArea(undefined); setStates([]); }}
/>`,
      render: () => <FilterBarDemo />,
    },
    {
      id: "actions",
      title: "Con acciones a la derecha",
      description: "El slot `actions` queda alineado al final de la tarjeta; en móvil baja debajo de los filtros.",
      layout: "stretch",
      code: `<FilterBar
  searchValue={search}
  onSearchChange={setSearch}
  filters={<SearchableSelect … />}
  actions={
    <>
      <Button variant="outline" size="sm"><Download /> Exportar</Button>
      <Button size="sm"><Plus /> Nuevo</Button>
    </>
  }
  activeFilters={activeFilters}
  onClearFilters={clear}
/>`,
      render: () => <FilterBarDemo withActions />,
    },
    {
      id: "search-only",
      title: "Solo búsqueda",
      description: "Sin `activeFilters` ni `onClearFilters` la fila de chips no se renderiza; queda la tarjeta con el campo.",
      layout: "stretch",
      code: `<FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Buscar cursos…" />`,
      render: () => <SearchOnlyDemo />,
    },
  ],
  props: [
    { name: "searchValue", type: "string", description: "Valor controlado del campo de búsqueda." },
    { name: "onSearchChange", type: "(value: string) => void", description: "Al escribir. Sin él, el campo de búsqueda no se muestra." },
    { name: "searchPlaceholder", type: "string", default: '"Buscar..."', description: "Placeholder del campo de búsqueda." },
    { name: "filters", type: "React.ReactNode", description: "Selects y controles de filtro; se colocan en fila con `flex-wrap` junto a la búsqueda." },
    { name: "actions", type: "React.ReactNode", description: "Botones alineados al final de la tarjeta (exportar, crear…)." },
    { name: "activeFilters", type: "ActiveFilter[]", default: "[]", description: "Chips de filtros activos: `{ id, label, value?, onRemove? }`. Cada uno pinta «label: value» con su botón de quitar." },
    { name: "onClearFilters", type: "() => void", description: "Muestra «Limpiar filtros» al final de los chips cuando hay alguno activo." },
    { name: "className", type: "string", description: "Clases extra del contenedor exterior." },
  ],
  guidelines: {
    do: [
      "Deriva `activeFilters` del mismo estado que alimenta los selects, así los chips y los controles nunca se contradicen.",
      "Da a cada chip un `onRemove` que quite solo ese criterio; `onClearFilters` es para vaciarlos todos.",
      "Aplica la búsqueda con un debounce si la lista consulta al servidor.",
    ],
    dont: [
      "No metas la lógica de filtrado dentro de `filters`: la barra solo dispone controles, no filtra.",
      "No pongas más de tres o cuatro selects; a partir de ahí conviene un panel de filtros avanzados.",
      "No uses los chips como navegación ni como estado de selección de filas.",
    ],
  },
  related: ["searchable-select", "multi-select", "field", "badge", "input"],
});
