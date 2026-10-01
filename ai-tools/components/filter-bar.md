# FilterBar (beta)

La cabecera de filtros de un listado: una tarjeta con búsqueda, un hueco para los selects y otro para las acciones, y debajo la fila de chips con los filtros activos y «Limpiar filtros». Úsala encima de tablas y grids cuando la persona combina búsqueda y varios criterios; el componente no guarda estado, tú le pasas los filtros ya resueltos.

Familia: Formularios · Doc: `/docs#/components/filter-bar` · Fuente: `src/components/filters/FilterBar.tsx`

```ts
import { FilterBar, type ActiveFilter } from "@/components/filters"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `searchValue` | `string` |  | Valor controlado del campo de búsqueda. |
| `onSearchChange` | `(value: string) => void` |  | Al escribir. Sin él, el campo de búsqueda no se muestra. |
| `searchPlaceholder` | `string` | `"Buscar..."` | Placeholder del campo de búsqueda. |
| `filters` | `React.ReactNode` |  | Selects y controles de filtro; se colocan en fila con `flex-wrap` junto a la búsqueda. |
| `actions` | `React.ReactNode` |  | Botones alineados al final de la tarjeta (exportar, crear…). |
| `activeFilters` | `ActiveFilter[]` | `[]` | Chips de filtros activos: `{ id, label, value?, onRemove? }`. Cada uno pinta «label: value» con su botón de quitar. |
| `onClearFilters` | `() => void` |  | Muestra «Limpiar filtros» al final de los chips cuando hay alguno activo. |
| `className` | `string` |  | Clases extra del contenedor exterior. |

## Guías

- Sí: Deriva `activeFilters` del mismo estado que alimenta los selects, así los chips y los controles nunca se contradicen.
- Sí: Da a cada chip un `onRemove` que quite solo ese criterio; `onClearFilters` es para vaciarlos todos.
- Sí: Aplica la búsqueda con un debounce si la lista consulta al servidor.
- No: No metas la lógica de filtrado dentro de `filters`: la barra solo dispone controles, no filtra.
- No: No pongas más de tres o cuatro selects; a partir de ahí conviene un panel de filtros avanzados.
- No: No uses los chips como navegación ni como estado de selección de filas.

Relacionados: searchable-select, multi-select, field, badge, input

## Ejemplos

### Búsqueda, selects y chips

Cada filtro activo se convierte en un `ActiveFilter` con su `onRemove`; «Limpiar filtros» solo aparece cuando hay chips y `onClearFilters`.

```tsx
const [search, setSearch] = React.useState("");
const [area, setArea] = React.useState<string>();
const [states, setStates] = React.useState<string[]>([]);

const activeFilters: ActiveFilter[] = [
  ...(area ? [{ id: "area", label: "Área", value: AREA_LABEL[area], onRemove: () => setArea(undefined) }] : []),
  ...states.map((state) => ({
    id: `estado-${state}`,
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
/>
```

### Con acciones a la derecha

El slot `actions` queda alineado al final de la tarjeta; en móvil baja debajo de los filtros.

```tsx
<FilterBar
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
/>
```

### Solo búsqueda

Sin `activeFilters` ni `onClearFilters` la fila de chips no se renderiza; queda la tarjeta con el campo.

```tsx
<FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Buscar cursos…" />
```
