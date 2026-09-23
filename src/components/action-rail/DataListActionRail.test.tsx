import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DataListActionRail, type RailActionSpec } from "./DataListActionRail"

const ICON = <span data-testid="icono" />

const ACTIONS: readonly RailActionSpec[] = [
  { id: "create", label: "Crear proceso", icon: ICON, scope: ["screen"], primary: true },
  { id: "import", label: "Cargar", icon: ICON, scope: ["screen"] },
  { id: "edit", label: "Editar", icon: ICON, scope: ["single"] },
  { id: "duplicate", label: "Duplicar", icon: ICON, scope: ["single", "bulk"], countInLabel: true },
  { id: "delete", label: "Eliminar", icon: ICON, scope: ["single", "bulk"], tone: "danger", countInLabel: true },
]

const rail = (props: Partial<React.ComponentProps<typeof DataListActionRail>> = {}) =>
  render(
    <DataListActionRail
      actions={ACTIONS}
      selectedCount={0}
      onClearSelection={() => undefined}
      {...props}
    />
  )

/** Las acciones de la barra: fuera el tirador, los ajustes y la ✕ del recuento. */
function accionesVisibles(): string[] {
  return screen
    .getAllByRole("button")
    .map((b) => b.getAttribute("aria-label") ?? "")
    .filter((label) => label && !/Mover barra|Ajustes de la barra|Limpiar selección/i.test(label))
}

describe("DataListActionRail", () => {
  test("sin selección solo salen las de la pantalla", () => {
    rail()
    expect(accionesVisibles()).toEqual(["Cargar", "Crear proceso"])
  })

  test("la fila va de menor a mayor peso: lo plegado, lo de a diario y la principal", () => {
    // Lo que se configura una vez no compite por sitio con lo de a diario,
    // pero tiene que seguir estando: se llega en un clic, no desaparece.
    rail({
      actions: [
        ...ACTIONS,
        { id: "settings", label: "Activar equipo", icon: ICON, scope: ["screen"], overflow: true },
      ],
    })

    expect(accionesVisibles()).toEqual(["Más acciones", "Cargar", "Crear proceso"])
  })

  test("una acción plegada se ejecuta desde el menú", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    rail({
      actions: [
        ...ACTIONS,
        { id: "settings", label: "Activar equipo", icon: ICON, scope: ["screen"], overflow: true, onSelect },
      ],
    })

    await user.click(screen.getByRole("button", { name: "Más acciones" }))
    await user.click(await screen.findByRole("button", { name: "Activar equipo" }))
    expect(onSelect).toHaveBeenCalledOnce()
  })

  test("con un registro las de la pantalla se van y entran las suyas", () => {
    rail({ selectedCount: 1 })
    const acciones = accionesVisibles()
    expect(acciones).not.toContain("Crear proceso")
    expect(acciones).not.toContain("Cargar")
    expect(acciones).toEqual(expect.arrayContaining(["Editar", "Duplicar", "Eliminar"]))
  })

  test("con varios se cae lo que solo vale para uno y el recuento entra en la etiqueta", () => {
    rail({ selectedCount: 3 })
    const acciones = accionesVisibles()
    expect(acciones).not.toContain("Editar")
    expect(acciones).toEqual(expect.arrayContaining(["Duplicar (3)", "Eliminar (3)"]))
  })

  test("el recuento se lee y su ✕ suelta la selección", async () => {
    const user = userEvent.setup()
    const onClearSelection = vi.fn()
    rail({ selectedCount: 2, onClearSelection })

    expect(screen.getByText("2 seleccionados")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /Limpiar selección/i }))
    expect(onClearSelection).toHaveBeenCalled()
  })

  test("el género concuerda", () => {
    rail({ selectedCount: 2, gender: "f" })
    expect(screen.getByText("2 seleccionadas")).toBeInTheDocument()
  })

  test("pulsar una acción avisa a quien la declaró", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    rail({
      selectedCount: 1,
      actions: [{ id: "edit", label: "Editar", icon: ICON, scope: ["single"], onSelect }],
    })
    await user.click(screen.getByRole("button", { name: "Editar" }))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  test("lo que no cabe se pliega, pero una sola sobrante no monta un menú", () => {
    const seis: readonly RailActionSpec[] = Array.from({ length: 6 }, (_, i) => ({
      id: `a${i}`,
      label: `Acción ${i}`,
      icon: ICON,
      scope: ["bulk"] as const,
    }))

    // Seis con límite de cinco: la sexta se queda fuera del menú.
    const { unmount } = rail({ selectedCount: 2, actions: seis, inlineLimit: 5 })
    expect(screen.queryByRole("button", { name: /Más acciones/i })).not.toBeInTheDocument()
    expect(accionesVisibles()).toHaveLength(6)
    unmount()

    // Con límite de tres sobran tres: ahí sí compensa plegarlas.
    rail({ selectedCount: 2, actions: seis, inlineLimit: 3 })
    expect(screen.getByRole("button", { name: /Más acciones/i })).toBeInTheDocument()
  })

  test("`locked` desmonta la barra en vez de dejarla flotando", () => {
    rail({ selectedCount: 1, locked: true })
    expect(screen.queryAllByRole("button")).toHaveLength(0)
  })
})
