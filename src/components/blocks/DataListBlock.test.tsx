import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DataListBlock } from "./DataListBlock"
import type { TableColumnCells, TableColumnSpec } from "@/components/data-display/table-config"
import { ListItem } from "@/components/data-display/ListItem"
import type { RailActionSpec } from "@/components/action-rail"

const EXPORTAR: readonly RailActionSpec[] = [
  { id: "export", label: "Exportar", icon: <span />, scope: ["single", "bulk"] },
]

interface Row {
  id: string
  name: string
  area: string
}

const ROWS: readonly Row[] = [
  { id: "a", name: "Plan trimestral", area: "Ventas" },
  { id: "b", name: "Seguimiento mensual", area: "Marketing" },
  { id: "c", name: "Revisión semestral", area: "Ventas" },
]

const COLUMNS: readonly TableColumnSpec[] = [
  { id: "name", label: "Nombre" },
  { id: "area", label: "Área" },
]

/** Como las tablas reales: la casilla de selección es una columna fija declarada. */
const COLUMNS_CON_FIJA: readonly TableColumnSpec[] = [
  { id: "select", label: "Selección", fixed: true },
  ...COLUMNS,
]

const CELLS: TableColumnCells<Row> = {
  name: { head: "Nombre", cell: (row) => row.name },
  area: { head: "Área", cell: (row) => row.area },
}

function renderBlock(props: Partial<React.ComponentProps<typeof DataListBlock<Row>>> = {}) {
  return render(
    <DataListBlock
      tableId={`test-${Math.random()}`}
      title="Lista de procesos"
      noun="procesos"
      rows={ROWS}
      columns={COLUMNS}
      cells={CELLS}
      getRowId={(row) => row.id}
      getRowLabel={(row) => row.name}
      {...props}
    />
  )
}

/** jsdom no trae IntersectionObserver y el centinela de «cargar al bajar» lo pide. */
class ObservadorInerte {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

beforeEach(() => {
  window.localStorage.clear()
  vi.stubGlobal("IntersectionObserver", ObservadorInerte)
})

describe("DataListBlock", () => {
  test("pinta la tabla con sus columnas y el total junto al título", () => {
    renderBlock()
    expect(screen.getByRole("table")).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Nombre" })).toBeInTheDocument()
    expect(screen.getByText("Plan trimestral")).toBeInTheDocument()
    expect(within(screen.getByRole("heading", { name: /Lista de procesos/ })).getByText("3")).toBeInTheDocument()
  })

  test("sin searchBy no hay buscador", () => {
    renderBlock()
    expect(screen.queryByRole("button", { name: /Buscar/ })).not.toBeInTheDocument()
  })

  test("el buscador filtra y el total lo refleja", async () => {
    const user = userEvent.setup()
    renderBlock({ searchBy: (row) => row.name })

    await user.click(screen.getByRole("button", { name: "Buscar en procesos" }))
    await user.type(screen.getByPlaceholderText("Buscar por nombre"), "mensual")

    expect(screen.getByText("Seguimiento mensual")).toBeInTheDocument()
    expect(screen.queryByText("Plan trimestral")).not.toBeInTheDocument()
    expect(within(screen.getByRole("heading", { name: /Lista de procesos/ })).getByText("1")).toBeInTheDocument()
  })

  test("al cerrar el buscador se recupera la lista entera", async () => {
    const user = userEvent.setup()
    renderBlock({ searchBy: (row) => row.name })

    await user.click(screen.getByRole("button", { name: "Buscar en procesos" }))
    await user.type(screen.getByPlaceholderText("Buscar por nombre"), "mensual")
    await user.click(screen.getByRole("button", { name: "Cerrar la búsqueda" }))

    expect(screen.getByText("Plan trimestral")).toBeInTheDocument()
  })

  test("sin selectable no hay casillas", () => {
    renderBlock()
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0)
  })

  test("la selección avisa hacia fuera y nombra la fila", async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    renderBlock({ selectable: true, onSelectedChange })

    await user.click(screen.getByRole("checkbox", { name: "Seleccionar Plan trimestral" }))
    expect(onSelectedChange).toHaveBeenCalledWith(new Set(["a"]))
  })

  test("«seleccionar la página» marca y desmarca todas", async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    renderBlock({ selectable: true, onSelectedChange })

    await user.click(screen.getByRole("checkbox", { name: "Seleccionar la página" }))
    expect(onSelectedChange).toHaveBeenLastCalledWith(new Set(["a", "b", "c"]))
  })

  test("con `selected` manda quien llama: el bloque no cambia por su cuenta", async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    renderBlock({ selectable: true, selected: new Set(["a"]), onSelectedChange })

    const row = screen.getByRole("checkbox", { name: "Seleccionar Plan trimestral" })
    expect(row).toBeChecked()

    await user.click(row)
    expect(onSelectedChange).toHaveBeenCalledWith(new Set())
    expect(screen.getByRole("checkbox", { name: "Seleccionar Plan trimestral" })).toBeChecked()
  })

  test("sin renderListItem se queda en tabla aunque haya guardada una vista de lista", () => {
    window.localStorage.setItem(
      "thema.tabla.fijo-sin-lista",
      JSON.stringify({ order: [], hidden: [], pinned: [], mode: "paged", view: "list" })
    )
    renderBlock({ tableId: "fijo-sin-lista" })
    expect(screen.getByRole("table")).toBeInTheDocument()
  })

  test("con renderListItem y la vista guardada en lista, dibuja filas y no tabla", () => {
    window.localStorage.setItem(
      "thema.tabla.fijo-con-lista",
      JSON.stringify({ order: [], hidden: [], pinned: [], mode: "paged", view: "list" })
    )
    renderBlock({
      tableId: "fijo-con-lista",
      renderListItem: (row) => <ListItem title={row.name} description={row.area} />,
    })
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    expect(screen.getByRole("list")).toBeInTheDocument()
    expect(screen.getAllByRole("listitem")).toHaveLength(3)
  })

  test("todas las filas tienen tantas columnas como la cabecera, también las de carga", () => {
    // Con carga al bajar, el centinela y sus filas de esqueleto se pintan con un
    // `colSpan` calculado. Si cuenta de más —la columna fija `select` sumada
    // aparte de la casilla— aparece una columna fantasma al final que desalinea
    // la última columna respecto a la cabecera del marco.
    window.localStorage.setItem(
      "thema.tabla.colspan",
      JSON.stringify({ order: [], hidden: [], pinned: [], mode: "lazy", view: "table" })
    )
    renderBlock({ tableId: "colspan", columns: COLUMNS_CON_FIJA, selectable: true, pageSize: 1 })

    const tabla = screen.getByRole("table")
    const columnasCabecera = tabla.querySelectorAll("thead th").length
    const filas = [...tabla.querySelectorAll("tbody tr")]
    expect(filas.length).toBeGreaterThan(1)
    for (const fila of filas) {
      const ancho = [...fila.children].reduce((total, celda) => total + (celda as HTMLTableCellElement).colSpan, 0)
      expect(ancho, `fila «${fila.textContent?.slice(0, 20)}»`).toBe(columnasCabecera)
    }
  })

  test("por defecto las acciones no se pintan aquí: van al rail y se avisa de ello", async () => {
    const user = userEvent.setup()
    const onActionsPlacementChange = vi.fn()
    renderBlock({
      selectable: true,
      onActionsPlacementChange,
      recordActions: EXPORTAR,
    })

    expect(onActionsPlacementChange).toHaveBeenCalledWith("rail")
    await user.click(screen.getByRole("checkbox", { name: "Seleccionar Plan trimestral" }))
    expect(screen.queryByRole("button", { name: "Exportar" })).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /Lista de procesos/ })).toBeInTheDocument()
  })

  test("con las acciones en la tabla, la cabecera deja paso al recuento y a las acciones", async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      "thema.tabla.inline",
      JSON.stringify({ order: [], hidden: [], pinned: [], mode: "paged", view: "table", actions: "inline" })
    )
    renderBlock({
      tableId: "inline",
      selectable: true,
      recordActions: EXPORTAR,
    })

    // Sin nada marcado la cabecera es la de siempre.
    expect(screen.getByRole("heading", { name: /Lista de procesos/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Exportar" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("checkbox", { name: "Seleccionar Plan trimestral" }))
    expect(screen.getByRole("heading", { name: "1 seleccionado" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Exportar" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /Lista de procesos/ })).not.toBeInTheDocument()

    // Y al soltar la selección vuelve sola.
    await user.click(screen.getByRole("button", { name: "Soltar la selección" }))
    expect(screen.getByRole("heading", { name: /Lista de procesos/ })).toBeInTheDocument()
  })

  test("en la cabecera también se caen las individuales al marcar varios", async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      "thema.tabla.ambitos",
      JSON.stringify({ order: [], hidden: [], pinned: [], mode: "paged", view: "table", actions: "inline" })
    )
    renderBlock({
      tableId: "ambitos",
      selectable: true,
      recordActions: [
        { id: "edit", label: "Editar", icon: <span />, scope: ["single"] },
        { id: "dup", label: "Duplicar", icon: <span />, scope: ["single", "bulk"], countInLabel: true },
      ],
    })

    await user.click(screen.getByRole("checkbox", { name: "Seleccionar Plan trimestral" }))
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Duplicar" })).toBeInTheDocument()

    await user.click(screen.getByRole("checkbox", { name: "Seleccionar Seguimiento mensual" }))
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Duplicar (2)" })).toBeInTheDocument()
  })

  test("picar en la fila la marca, pero un clic en un control suyo no", async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    renderBlock({ selectable: true, onSelectedChange })

    await user.click(screen.getByText("Plan trimestral"))
    expect(onSelectedChange).toHaveBeenLastCalledWith(new Set(["a"]))

    // El buscador vive en la cabecera, pero la regla es la misma: lo que nace
    // en un control no toca la selección.
    onSelectedChange.mockClear()
    await user.click(screen.getByRole("checkbox", { name: "Seleccionar Seguimiento mensual" }))
    expect(onSelectedChange).toHaveBeenCalledTimes(1)
  })

  test("con menú por fila no hay casillas y cada fila lleva sus acciones", async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      "thema.tabla.menu",
      JSON.stringify({ order: [], hidden: [], pinned: [], mode: "paged", view: "table", rowControl: "menu" })
    )
    renderBlock({
      tableId: "menu",
      selectable: true,
      recordActions: [
        { id: "edit", label: "Editar", icon: <span />, scope: ["single"] },
        { id: "dup", label: "Duplicar en lote", icon: <span />, scope: ["bulk"] },
      ],
    })

    expect(screen.queryAllByRole("checkbox")).toHaveLength(0)

    await user.click(screen.getByRole("button", { name: "Acciones de Plan trimestral" }))
    // Solo las que aplican a un registro: sin selección no hay lote.
    expect(await screen.findByRole("menuitem", { name: "Editar" })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "Duplicar en lote" })).not.toBeInTheDocument()
  })

  test("el recuento concuerda en número y en género", async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      "thema.tabla.genero",
      JSON.stringify({ order: [], hidden: [], pinned: [], mode: "paged", view: "table", actions: "inline" })
    )
    renderBlock({ tableId: "genero", selectable: true, gender: "f" })

    await user.click(screen.getByRole("checkbox", { name: "Seleccionar Plan trimestral" }))
    expect(screen.getByRole("heading", { name: "1 seleccionada" })).toBeInTheDocument()

    await user.click(screen.getByRole("checkbox", { name: "Seleccionar Seguimiento mensual" }))
    expect(screen.getByRole("heading", { name: "2 seleccionadas" })).toBeInTheDocument()
  })

  test("sin selección la opción de dónde van las acciones no se ofrece", async () => {
    const user = userEvent.setup()
    renderBlock({ noun: "procesos" })
    await user.click(screen.getByRole("button", { name: "Configurar la tabla" }))
    expect(screen.queryByText("Dónde van las acciones")).not.toBeInTheDocument()
  })

  test("una lista vacía distingue «no hay nada» de «nada coincide»", async () => {
    const user = userEvent.setup()
    const { rerender } = renderBlock({ rows: [] })
    expect(screen.getByText("Todavía no hay procesos.")).toBeInTheDocument()

    rerender(
      <DataListBlock
        tableId="vacio-buscado"
        title="Lista de procesos"
        noun="procesos"
        rows={ROWS}
        columns={COLUMNS}
        cells={CELLS}
        getRowId={(row) => row.id}
        searchBy={(row) => row.name}
      />
    )
    await user.click(screen.getByRole("button", { name: "Buscar en procesos" }))
    await user.type(screen.getByPlaceholderText("Buscar por nombre"), "zzz")
    expect(screen.getByText("Nada que coincida con esta búsqueda.")).toBeInTheDocument()
  })
})
