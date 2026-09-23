import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ActionFab } from "./ActionFab"
import type { RailActionSpec } from "./railActions"

const ICON = <span data-testid="icono" />

const ACTIONS: readonly RailActionSpec[] = [
  { id: "create", label: "Crear proceso", icon: ICON, scope: ["screen"], primary: true },
  { id: "import", label: "Cargar", icon: ICON, scope: ["screen"] },
  { id: "edit", label: "Editar", icon: ICON, scope: ["single"] },
  { id: "delete", label: "Eliminar", icon: ICON, scope: ["single", "bulk"], tone: "danger", countInLabel: true },
]

const fab = (props: Partial<React.ComponentProps<typeof ActionFab>> = {}) =>
  render(
    <ActionFab actions={ACTIONS} selectedCount={0} onClearSelection={() => undefined} {...props} />
  )

const abrir = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Abrir las acciones" }))

describe("ActionFab", () => {
  test("cerrado es un solo botón: nada de lo que ofrece está a la vista", () => {
    fab()
    expect(screen.getByRole("button", { name: "Abrir las acciones" })).toBeInTheDocument()
    expect(screen.queryByText("Crear proceso")).not.toBeInTheDocument()
    expect(screen.queryByText("Cargar")).not.toBeInTheDocument()
  })

  test("al abrirlo despliega lo que aplica y pasa a ser la salida", async () => {
    const user = userEvent.setup()
    fab()
    await abrir(user)

    expect(screen.getByText("Crear proceso")).toBeInTheDocument()
    expect(screen.getByText("Cargar")).toBeInTheDocument()
    // Sin selección, lo que solo vale para un registro no se ofrece.
    expect(screen.queryByText("Editar")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cerrar las acciones" })).toBeInTheDocument()
  })

  test("reparte las acciones igual que la barra: un registro trae las suyas", async () => {
    const user = userEvent.setup()
    fab({ selectedCount: 1 })
    await abrir(user)

    expect(screen.getByText("Editar")).toBeInTheDocument()
    expect(screen.getByText("Eliminar")).toBeInTheDocument()
    expect(screen.queryByText("Crear proceso")).not.toBeInTheDocument()
  })

  test("con varios se cae lo individual y el recuento entra en la etiqueta", async () => {
    const user = userEvent.setup()
    fab({ selectedCount: 3 })
    await abrir(user)

    expect(screen.queryByText("Editar")).not.toBeInTheDocument()
    expect(screen.getByText("Eliminar (3)")).toBeInTheDocument()
  })

  test("cerrado enseña el recuento cuando hay algo marcado", () => {
    fab({ selectedCount: 4 })
    expect(screen.getByRole("button", { name: "Abrir las acciones" })).toHaveTextContent("4")
  })

  test("pulsar una acción la ejecuta y cierra el abanico", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    fab({ actions: [{ id: "create", label: "Crear proceso", icon: ICON, scope: ["screen"], primary: true, onSelect }] })

    await abrir(user)
    await user.click(screen.getByText("Crear proceso"))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("button", { name: "Abrir las acciones" })).toBeInTheDocument()
  })

  test("se puede soltar la selección desde el abanico", async () => {
    const user = userEvent.setup()
    const onClearSelection = vi.fn()
    fab({ selectedCount: 2, onClearSelection })

    await abrir(user)
    await user.click(screen.getByText("Soltar 2 seleccionados"))
    expect(onClearSelection).toHaveBeenCalled()
  })

  test("el recuento concuerda en género", async () => {
    const user = userEvent.setup()
    fab({ selectedCount: 2, gender: "f" })
    await abrir(user)
    expect(screen.getByText("Soltar 2 seleccionadas")).toBeInTheDocument()
  })

  test("sin nada que ofrecer no se pinta el botón", () => {
    fab({ actions: [] })
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
