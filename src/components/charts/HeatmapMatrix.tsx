import * as React from "react"
import { ThemaIcon } from "@/icons/ThemaIcon"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { FAVORABILITY_BANDS, NO_DATA_BAND, bandForValue, bandRangeLabel, type HeatBand } from "./heatmapScale"

export interface HeatmapColumn {
  readonly id: string
  readonly label: string
}

export interface HeatmapRow {
  readonly id: string
  readonly label: string
  /** Segunda línea de la cabecera de fila: el "de qué" del dato. */
  readonly caption?: string
  readonly children?: readonly HeatmapRow[]
  /** Valor por columna. `null` pinta la celda como "No aplica", fuera de escala. */
  readonly values: Readonly<Record<string, number | null | undefined>>
}

export interface HeatmapMatrixProps {
  columns: readonly HeatmapColumn[]
  rows: readonly HeatmapRow[]
  /** Bandas de color, ascendentes por `min`. Por defecto, la escala de favorabilidad. */
  bands?: readonly HeatBand[]
  /** Ids de filas con los hijos desplegados al montar. Por defecto, todas. */
  defaultExpanded?: readonly string[]
  /** Cabecera de la primera columna. */
  rowHeaderLabel?: string
  formatValue?: (value: number) => string
  legend?: boolean
  onCellClick?: (row: HeatmapRow, column: HeatmapColumn, value: number) => void
  caption?: string
  className?: string
}

interface FlatRow {
  readonly row: HeatmapRow
  readonly depth: number
  readonly expandable: boolean
  readonly expanded: boolean
}

function flatten(rows: readonly HeatmapRow[], expanded: ReadonlySet<string>, depth = 0): FlatRow[] {
  return rows.flatMap((row) => {
    const children = row.children ?? []
    const expandable = children.length > 0
    const isExpanded = expandable && expanded.has(row.id)
    const self: FlatRow = { row, depth, expandable, expanded: isExpanded }
    return isExpanded ? [self, ...flatten(children, expanded, depth + 1)] : [self]
  })
}

function collectIds(rows: readonly HeatmapRow[]): string[] {
  return rows.flatMap((row) => [row.id, ...collectIds(row.children ?? [])])
}

const defaultFormat = (value: number) => `${Math.round(value)} %`

/**
 * HeatmapMatrix
 *
 * Matriz de calor en tabla: filas (jerárquicas y desplegables) contra columnas,
 * cada celda coloreada por la banda en la que cae su valor. Para comparar un
 * mismo indicador entre muchos cortes — lo que un heatmap de ECharts no hace
 * bien, porque ahí las etiquetas de fila no son navegables ni desplegables.
 *
 * Es una `<table>` de verdad, no un `role="img"`: un lector de pantalla recorre
 * la matriz por filas y columnas, y cada celda anuncia su valor y su banda.
 *
 * El borde de la celda va en un `box-shadow` interior, no en `border`, para que
 * no robe 1px al área de color y las celdas sigan alineadas con su columna.
 *
 * @example
 * <HeatmapMatrix
 *   rowHeaderLabel="Objetivo"
 *   columns={[{ id: "ventas", label: "Ventas" }, { id: "ops", label: "Operaciones" }]}
 *   rows={[{ id: "q1", label: "Cierre de trimestre", values: { ventas: 82, ops: 41 } }]}
 * />
 */
export function HeatmapMatrix({
  columns,
  rows,
  bands = FAVORABILITY_BANDS,
  defaultExpanded,
  rowHeaderLabel = "",
  formatValue = defaultFormat,
  legend = true,
  onCellClick,
  caption,
  className,
}: HeatmapMatrixProps) {
  const [expanded, setExpanded] = React.useState<ReadonlySet<string>>(
    () => new Set(defaultExpanded ?? collectIds(rows)),
  )

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const visible = flatten(rows, expanded)

  return (
    <TooltipProvider delayDuration={120}>
      <figure className={cn("flex flex-col gap-stack", className)}>
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            {caption ? <caption className="sr-only">{caption}</caption> : null}
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead
                  scope="col"
                  className="sticky left-0 z-20 w-[152px] min-w-[152px] max-w-[152px] bg-surface-muted text-text-secondary sm:w-[240px] sm:min-w-[240px] sm:max-w-[240px]"
                >
                  {rowHeaderLabel}
                </TableHead>
                {columns.map((column) => (
                  <TableHead
                    key={column.id}
                    scope="col"
                    className="min-w-[96px] bg-surface-muted text-center text-text-secondary"
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map(({ row, depth, expandable, expanded: isExpanded }) => (
                <TableRow key={row.id} className="group">
                  <TableHead
                    scope="row"
                    className="sticky left-0 z-10 w-[152px] min-w-[152px] max-w-[152px] bg-surface font-normal group-hover:bg-surface-muted sm:w-[240px] sm:min-w-[240px] sm:max-w-[240px]"
                    style={{ paddingLeft: `calc(var(--space-inline, 1rem) + ${depth} * 1.25rem)` }}
                  >
                    <div className="flex items-center gap-1.5">
                      {expandable ? (
                        <button
                          type="button"
                          onClick={() => toggle(row.id)}
                          aria-expanded={isExpanded}
                          className="-ml-1 flex size-5 shrink-0 items-center justify-center rounded text-text-muted transition-colors hover:bg-accent hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <ThemaIcon
                            name="chevronRight"
                            size="sm"
                            decorative
                            className={cn(
                              "transition-transform motion-reduce:transition-none",
                              isExpanded && "rotate-90",
                            )}
                          />
                          <span className="sr-only">
                            {isExpanded ? "Contraer" : "Desplegar"} {row.label}
                          </span>
                        </button>
                      ) : null}
                      <div className="min-w-0">
                        <p className="truncate text-text-primary">{row.label}</p>
                        {row.caption ? (
                          <p className="truncate text-xs text-text-muted">{row.caption}</p>
                        ) : null}
                      </div>
                    </div>
                  </TableHead>
                  {columns.map((column) => (
                    <HeatCell
                      key={column.id}
                      row={row}
                      column={column}
                      bands={bands}
                      formatValue={formatValue}
                      onCellClick={onCellClick}
                    />
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {legend ? (
          <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {bands.map((band) => (
              <span key={band.id} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span
                  aria-hidden
                  className="size-2.5 rounded-sm"
                  style={{ backgroundColor: band.border }}
                />
                {band.label}
                <span className="text-text-muted">{bandRangeLabel(band, bands)}</span>
              </span>
            ))}
          </figcaption>
        ) : null}
      </figure>
    </TooltipProvider>
  )
}

interface HeatCellProps {
  row: HeatmapRow
  column: HeatmapColumn
  bands: readonly HeatBand[]
  formatValue: (value: number) => string
  onCellClick?: HeatmapMatrixProps["onCellClick"]
}

function HeatCell({ row, column, bands, formatValue, onCellClick }: HeatCellProps) {
  const raw = row.values[column.id]
  const value = typeof raw === "number" ? raw : null
  const band = value === null ? NO_DATA_BAND : bandForValue(value, bands)
  const interactive = value !== null && Boolean(onCellClick)
  const readout = value === null ? "Sin dato" : formatValue(value)
  // Una celda sin acción no debe ser foco de tabulación, pero el tooltip necesita
  // un único hijo con ref: se cambia la etiqueta, no se envuelve en otro nodo.
  const Root = (interactive ? "button" : "div") as "button"

  return (
    <TableCell className="p-[1.5px] align-middle">
      <Tooltip>
        <TooltipTrigger asChild>
          <Root
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => onCellClick?.(row, column, value as number) : undefined}
            aria-label={`${row.label}, ${column.label}: ${readout}. ${band.label}.`}
            className={cn(
              "flex h-9 w-full items-center justify-center rounded-[5px] text-xs font-bold tabular-nums",
              "transition-transform motion-reduce:transition-none",
              interactive &&
                "hover:relative hover:z-10 hover:scale-[1.04] focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:hover:scale-100",
            )}
            style={{
              backgroundColor: band.background,
              color: band.foreground,
              boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${band.border} 30%, transparent)`,
            }}
          >
            {value === null ? "—" : formatValue(value)}
          </Root>
        </TooltipTrigger>
        <TooltipContent side="top" className="w-[220px]">
          <p className="font-semibold">{row.label}</p>
          <p className="text-popover-foreground/70">{column.label}</p>
          <p className="mt-1 flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-sm" style={{ backgroundColor: band.border }} />
            <span className="font-semibold tabular-nums">{readout}</span>
            <span className="text-popover-foreground/70">{band.label}</span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TableCell>
  )
}
