import { afterEach, describe, expect, test } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DataListActionRail } from "./DataListActionRail"
import { applyRailLayout, declaredRailLayout, railLayoutKey } from "./railLayout"
import { railScreenTiers, type RailActionSpec } from "./railActions"

const ICON = <span />

const ACTIONS: readonly RailActionSpec[] = [
  { id: "sale", label: "Venta", icon: ICON, scope: ["screen"], overflow: true },
  { id: "queue", label: "Fila", icon: ICON, scope: ["screen"] },
  { id: "collect", label: "Cobros", icon: ICON, scope: ["screen"] },
  { id: "hours", label: "Horario", icon: ICON, scope: ["screen"], overflow: true },
  { id: "unconfirmed", label: "Sin confirmar", icon: ICON, scope: ["screen"], filter: true, active: false },
  { id: "create", label: "Crear cita", icon: ICON, scope: ["screen"], primary: true },
  { id: "edit", label: "Editar", icon: ICON, scope: ["single"] },
]

const ids = (actions: readonly RailActionSpec[]) => actions.map((action) => action.id)

describe("railLayout", () => {
  afterEach(() => window.localStorage.clear())

  test("la ficha de un registro y la de otro son la misma pantalla", () => {
    expect(railLayoutKey("/clientes/cli_0012")).toBe("/clientes/:id")
    expect(railLayoutKey("/calendario/")).toBe("/calendario")
  })

  test("sin elección vale lo declarado y los filtros no salen", () => {
    const tiers = railScreenTiers(applyRailLayout(ACTIONS, null))
    expect(tiers.primary?.id).toBe("create")
    expect(ids(tiers.inline)).toEqual(["queue", "collect"])
    expect(ids(tiers.folded)).toEqual(["sale", "hours"])
    expect(declaredRailLayout(ACTIONS)).toEqual({ primary: "create", secondary: ["queue", "collect"] })
  })

  test("la elección cambia la principal, pone a la vista en su orden (filtros incluidos) y pliega lo demás", () => {
    const tiers = railScreenTiers(applyRailLayout(ACTIONS, { primary: "sale", secondary: ["unconfirmed", "hours"] }))
    expect(tiers.primary?.id).toBe("sale")
    expect(ids(tiers.inline)).toEqual(["unconfirmed", "hours"])
    // La que era principal pasa a «más acciones»; las de selección no se tocan.
    expect(ids(tiers.folded)).toEqual(["queue", "collect", "create"])
    expect(ids(applyRailLayout(ACTIONS, { primary: "sale", secondary: [] }))).toContain("edit")
  })

  test("ids que ya no existen se ignoran", () => {
    const tiers = railScreenTiers(applyRailLayout(ACTIONS, { primary: "gone", secondary: ["gone", "queue"] }))
    expect(tiers.primary?.id).toBe("create")
    expect(ids(tiers.inline)).toEqual(["queue"])
  })

  test("«Editar acciones» guarda la elección de la pantalla y la barra la aplica", async () => {
    const user = userEvent.setup()
    render(
      <TooltipProvider>
        <DataListActionRail actions={ACTIONS} selectedCount={0} onClearSelection={() => undefined} layoutKey="/prueba" />
      </TooltipProvider>
    )
    expect(screen.queryByRole("button", { name: "Sin confirmar" })).toBeNull()

    await user.click(screen.getByRole("button", { name: "Ajustes de la barra" }))
    await user.click(screen.getByRole("button", { name: "Editar acciones" }))
    const editor = await screen.findByRole("dialog", { name: "Editar acciones" })
    // Tres a la vista como máximo: con dos de serie, cabe una más y luego se apagan las demás.
    await user.click(within(editor).getByRole("checkbox", { name: "Sin confirmar" }))
    expect(within(editor).getByRole("checkbox", { name: "Horario" })).toBeDisabled()
    await user.click(within(editor).getByRole("radio", { name: "Venta" }))
    await user.click(within(editor).getByRole("button", { name: "Guardar" }))

    expect(screen.getByRole("button", { name: "Sin confirmar" })).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByRole("button", { name: "Venta" })).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem("thema.actionRail.layout.v1:/prueba") ?? "null")).toEqual({ primary: "sale", secondary: ["queue", "collect", "unconfirmed"] })
  })
})
