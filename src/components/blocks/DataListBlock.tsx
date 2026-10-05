import * as React from "react"
import { Search, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ListItemGroup } from "@/components/data-display/ListItem"
import { RowActionsMenu, type RowAction } from "@/components/data-display/RowActionsMenu"
import { RowContextMenu } from "@/components/data-display/RowContextMenu"
import type { RailActionSpec } from "@/components/action-rail"
import { TableShell } from "@/components/data-display/TableShell"
import {
  ConfigurableHeaderCells,
  ConfigurableRowCells,
  LazyRowsSentinel,
  LazyRowsSummary,
  TableConfigButton,
  useColumnDrag,
  useLazyRows,
  useTableConfig,
  type TableActionsPlacement,
  type TableColumnCells,
  type TableColumnSpec,
} from "@/components/data-display/table-config"

/** Lo que el bloque le cuenta a quien dibuja una fila de la vista lista. */
export interface DataListRowState {
  selected: boolean
  toggle: () => void
  /**
   * La casilla de la fila, o `null` si quien mira eligió operarlas por menú.
   * Va en `leading`; no lo construyas tú, para que respete la preferencia.
   */
  checkbox: React.ReactNode
  /** El menú de acciones de la fila, o `null` si se opera marcando. Va al final. */
  menu: React.ReactNode
}

export interface DataListBlockProps<T> {
  /**
   * Identidad de la lista. Con ella se recuerdan entre sesiones el orden de las
   * columnas, cuáles están ocultas o fijadas, la vista y el modo de filas, así
   * que tiene que ser estable: si cambia, quien la usaba pierde sus ajustes.
   */
  tableId: string
  title: React.ReactNode
  /** El total tras filtrar, en una insignia junto al título. */
  showCount?: boolean
  description?: string
  /** El sustantivo en plural —«procesos»— para los textos de estado y resumen. */
  noun: string
  rows: readonly T[]
  columns: readonly TableColumnSpec[]
  cells: TableColumnCells<T>
  getRowId: (row: T) => string
  /** Cómo se nombra una fila en la casilla que la selecciona. */
  getRowLabel?: (row: T) => string
  /** Sobre qué texto busca el buscador. Sin ella no hay buscador. */
  searchBy?: (row: T) => string
  searchPlaceholder?: string
  /**
   * El dibujo de una fila en la vista lista. Sin ella el bloque se queda
   * siempre en tabla, aunque haya guardada una preferencia de lista.
   */
  renderListItem?: (row: T, state: DataListRowState) => React.ReactNode
  selectable?: boolean
  /** Con `selected` la selección la manda quien llama; sin ella, el bloque. */
  selected?: ReadonlySet<string>
  onSelectedChange?: (next: ReadonlySet<string>) => void
  /**
   * Lo que se puede hacer con los registros, con el mismo modelo declarativo
   * que usa la barra flotante: cada acción dice su `scope`, y se pintan las
   * que apliquen a lo que haya marcado —las individuales solo con uno—.
   *
   * Dónde se pintan lo decide quien mira desde el panel: aquí, en la cabecera
   * del marco, o fuera, en la barra. Cuando manda la barra el bloque no pinta
   * ninguna y avisa por `onActionsPlacementChange` para que la pantalla monte
   * allí esta misma lista.
   */
  recordActions?: readonly RailActionSpec[]
  onActionsPlacementChange?: (placement: TableActionsPlacement) => void
  /** Género de lo que se cuenta: «3 seleccionadas» frente a «3 seleccionados». */
  gender?: "f" | "m"
  pageSize?: number
  emptyState?: React.ReactNode
  /** Acciones propias en la cabecera, antes del buscador y la configuración. */
  actions?: React.ReactNode
  className?: string
}

const DEFAULT_PAGE_SIZE = 10

/** «1 seleccionado» / «3 seleccionadas»: concuerda en número y en género. */
function selectionWord(count: number, gender: "f" | "m"): string {
  const base = gender === "f" ? "seleccionada" : "seleccionado"
  return count === 1 ? base : `${base}s`
}

/**
 * DataListBlock
 *
 * Una lista de datos con todo lo que se le pide a una: buscador, configuración
 * de columnas —orden, visibilidad, fijado—, vista de tabla o de lista, filas
 * por página o carga al bajar, selección múltiple y estado vacío.
 *
 * Es un bloque, no un componente suelto: toma las piezas del sistema y las
 * cablea entre sí, que es la parte que cada pantalla repetía. Quien lo usa
 * declara **qué** se lista —filas, columnas y celdas— y no **cómo** se opera.
 *
 * En la vista de lista cada fila es una tarjeta de ancho completo y el marco se
 * descarga —sin fondo ni borde bajo la cabecera—: las filas ya traen su propio
 * borde, y encerrarlas otra vez sería una caja dentro de otra.
 *
 * @example
 * <DataListBlock
 *   tableId="procesos"
 *   title="Lista de procesos"
 *   noun="procesos"
 *   rows={procesos}
 *   columns={PROCESS_COLUMNS}
 *   cells={PROCESS_CELLS}
 *   getRowId={(row) => row.id}
 *   searchBy={(row) => row.name}
 *   selectable
 * />
 */
export function DataListBlock<T>({
  tableId,
  title,
  showCount = true,
  description,
  noun,
  rows,
  columns,
  cells,
  getRowId,
  getRowLabel,
  searchBy,
  searchPlaceholder = "Buscar por nombre",
  renderListItem,
  selectable = false,
  selected: selectedProp,
  onSelectedChange,
  recordActions,
  onActionsPlacementChange,
  gender = "m",
  pageSize = DEFAULT_PAGE_SIZE,
  emptyState,
  actions,
  className,
}: DataListBlockProps<T>) {
  const [query, setQuery] = React.useState("")
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [page, setPage] = React.useState(0)
  const [ownSelected, setOwnSelected] = React.useState<ReadonlySet<string>>(() => new Set())

  const config = useTableConfig(tableId, columns)
  const drag = useColumnDrag({ axis: "x", onReorder: config.moveColumn })

  const isControlled = selectedProp !== undefined
  const selected = isControlled ? selectedProp : ownSelected
  const commitSelected = (next: ReadonlySet<string>) => {
    if (!isControlled) setOwnSelected(next)
    onSelectedChange?.(next)
  }

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle || !searchBy) return rows
    return rows.filter((row) => searchBy(row).toLowerCase().includes(needle))
  }, [rows, query, searchBy])

  const lazy = useLazyRows({ total: filtered.length, enabled: config.isLazy, step: pageSize })
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const visible = config.isLazy
    ? filtered.slice(0, lazy.count)
    : filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

  // Sin `renderListItem` no hay nada que dibujar en modo lista, así que la
  // preferencia guardada se ignora en vez de dejar el cuerpo en blanco.
  const asList = config.view === "list" && Boolean(renderListItem)
  // Exactamente las columnas que se pintan: las de `config.columns` más la de
  // la casilla. Las fijas ya están dentro de `columns`, así que sumarlas aparte
  // creaba una columna fantasma que desalineaba la última con la cabecera.
  // Con el menú por fila no hay selección: se actúa sobre una, ahí mismo.
  const usesCheckbox = selectable && config.rowControl === "checkbox"
  const usesRowMenu = selectable && config.rowControl === "menu"
  const colSpan =
    config.columns.length + (usesCheckbox ? 1 : 0) + (usesRowMenu ? 1 : 0)

  const toggleRow = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    commitSelected(next)
  }

  const allOnPageSelected = visible.length > 0 && visible.every((row) => selected.has(getRowId(row)))

  const togglePage = () => {
    const next = new Set(selected)
    for (const row of visible) {
      if (allOnPageSelected) next.delete(getRowId(row))
      else next.add(getRowId(row))
    }
    commitSelected(next)
  }

  // La pantalla necesita saberlo para no duplicar las acciones en el rail
  // cuando quien mira ha pedido tenerlas aquí.
  React.useEffect(() => {
    onActionsPlacementChange?.(config.actions)
  }, [config.actions, onActionsPlacementChange])

  // Mientras hay filas marcadas y las acciones van en el marco, la barra de
  // título deja paso: el recuento y lo que se puede hacer con ello ocupan el
  // sitio del título y del buscador, y vuelven solos al soltar la selección.
  const takeOverHeader = usesCheckbox && config.actions === "inline" && selected.size > 0
  // El mismo reparto que hace la barra: con un registro entran también las
  // individuales; con varios se caen y el recuento pasa a la etiqueta.
  const singleActions = (recordActions ?? []).filter((action) => action.scope.includes("single"))
  const rowActions: RowAction[] = singleActions.map((action) => ({
    id: action.id,
    label: action.label,
    icon: action.icon,
    tone: action.tone,
    blockedReason: action.blockedReason,
    onSelect: action.onSelect,
  }))
  /* Las acciones de un registro operan sobre lo marcado. Abrir el menú de una
     fila —el «⋯» o el clic derecho— la deja como la única marcada, igual que
     en un explorador de archivos: así la acción cae sobre esa fila. */
  const focusRow = (id: string) => (open: boolean) => {
    if (open && !(selected.size === 1 && selected.has(id))) commitSelected(new Set([id]))
  }
  const rowMenuFor = (row: T) =>
    usesRowMenu ? (
      <RowActionsMenu rowLabel={getRowLabel?.(row)} actions={rowActions} onOpenChange={focusRow(getRowId(row))} />
    ) : null
  /** El clic derecho de una fila: las mismas acciones individuales, en cualquier modo de fila. */
  const withContextMenu = (row: T, element: React.ReactElement) =>
    selectable && rowActions.length > 0 ? (
      <RowContextMenu key={getRowId(row)} rowLabel={getRowLabel?.(row)} actions={rowActions} onOpenChange={focusRow(getRowId(row))}>
        {element}
      </RowContextMenu>
    ) : (
      element
    )

  /* Picar en la fila la marca: la casilla sigue siendo el control accesible,
     esto es el atajo de ratón. Un clic que nace en un control de la fila —un
     botón, un enlace, el propio menú— es suyo y no toca la selección. */
  const rowClickProps = (id: string) =>
    usesCheckbox
      ? {
          onClick: (event: React.MouseEvent) => {
            if ((event.target as HTMLElement).closest("button,a,input,label,[role=checkbox],[role=menu]")) return
            toggleRow(id)
          },
          className: "cursor-pointer",
        }
      : {}

  const recordMode = selected.size === 1 ? "single" : "bulk"
  const headerActions = (recordActions ?? []).filter((action) => action.scope.includes(recordMode))

  return (
    <TableShell
      className={className}
      title={
        takeOverHeader ? (
          <span className="flex items-center gap-inline">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Soltar la selección"
              onClick={() => commitSelected(new Set())}
            >
              <X />
            </Button>
            {selected.size} {selectionWord(selected.size, gender)}
          </span>
        ) : showCount ? (
          <>
            {title}
            <Badge variant="neutral">{filtered.length.toLocaleString("es-CO")}</Badge>
          </>
        ) : (
          title
        )
      }
      description={description}
      surface={asList ? "header" : "card"}
      empty={visible.length === 0}
      emptyState={
        emptyState ?? (
          <p className="py-6 text-center text-sm text-text-muted">
            {query ? "Nada que coincida con esta búsqueda." : `Todavía no hay ${noun}.`}
          </p>
        )
      }
      actions={
        takeOverHeader ? (
          headerActions.map((action) => (
            <Button
              key={action.id}
              size="xs"
              variant={action.tone === "danger" ? "destructive" : "outline"}
              disabled={Boolean(action.blockedReason)}
              title={action.blockedReason ?? undefined}
              onClick={() => action.onSelect?.()}
            >
              {action.icon}
              {action.countInLabel && selected.size > 1 ? `${action.label} (${selected.size})` : action.label}
            </Button>
          ))
        ) : (
        <>
          {actions}
          {searchBy &&
            (searchOpen ? (
              <span className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-muted" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setPage(0)
                  }}
                  placeholder={searchPlaceholder}
                  className="h-8 w-56 pl-8 pr-8"
                />
                <button
                  type="button"
                  aria-label="Cerrar la búsqueda"
                  onClick={() => {
                    setQuery("")
                    setSearchOpen(false)
                    setPage(0)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ) : (
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={`Buscar en ${noun}`}
                onClick={() => setSearchOpen(true)}
              >
                <Search />
              </Button>
            ))}
          <TableConfigButton config={config} noun={noun} />
        </>
        )
      }
      footer={
        config.isLazy ? (
          <LazyRowsSummary lazy={lazy} total={filtered.length} noun={noun} />
        ) : (
          <>
            <p className="text-xs text-text-muted">
              Página {currentPage + 1} de {pageCount} · {filtered.length} {noun}
            </p>
            <div className="ml-auto flex gap-2">
              <Button size="xs" variant="outline" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
                Anterior
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={currentPage >= pageCount - 1}
                onClick={() => setPage(currentPage + 1)}
              >
                Siguiente
              </Button>
            </div>
          </>
        )
      }
    >
      {asList ? (
        <ListItemGroup className="py-2">
          {visible.map((row) => {
            const id = getRowId(row)
            return (
              <React.Fragment key={id}>
                {withContextMenu(
                  row,
                  <div className="contents">
                    {renderListItem?.(row, {
                      selected: selected.has(id),
                      toggle: () => toggleRow(id),
                      checkbox: usesCheckbox ? (
                        <Checkbox
                          checked={selected.has(id)}
                          onCheckedChange={() => toggleRow(id)}
                          aria-label={`Seleccionar ${getRowLabel?.(row) ?? id}`}
                        />
                      ) : null,
                      menu: rowMenuFor(row),
                    })}
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </ListItemGroup>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {usesCheckbox && (
                <TableHead className="w-10 text-center">
                  <Checkbox
                    checked={allOnPageSelected}
                    onCheckedChange={togglePage}
                    aria-label="Seleccionar la página"
                  />
                </TableHead>
              )}
              <ConfigurableHeaderCells config={config} drag={drag} cells={cells} />
              {usesRowMenu && (
                <TableHead className="w-12">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => {
              const id = getRowId(row)
              return withContextMenu(
                row,
                <TableRow
                  key={id}
                  data-state={selected.has(id) ? "selected" : undefined}
                  {...rowClickProps(id)}
                >
                  {usesCheckbox && (
                    <TableCell className="text-center">
                      <Checkbox
                        checked={selected.has(id)}
                        onCheckedChange={() => toggleRow(id)}
                        aria-label={`Seleccionar ${getRowLabel?.(row) ?? id}`}
                      />
                    </TableCell>
                  )}
                  <ConfigurableRowCells config={config} cells={cells} row={row} />
                  {usesRowMenu && <TableCell className="text-right">{rowMenuFor(row)}</TableCell>}
                </TableRow>
              )
            })}
            {config.isLazy && <LazyRowsSentinel lazy={lazy} colSpan={colSpan} noun={noun} />}
          </TableBody>
        </Table>
      )}
    </TableShell>
  )
}
