import { describe, expect, test, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HeatmapMatrix, type HeatmapColumn, type HeatmapRow } from "./HeatmapMatrix"
import { FAVORABILITY_BANDS, NO_DATA_BAND, bandForValue, bandRangeLabel } from "./heatmapScale"

const COLUMNS: readonly HeatmapColumn[] = [
  { id: "ventas", label: "Ventas" },
  { id: "ops", label: "Operaciones" },
]

const ROWS: readonly HeatmapRow[] = [
  {
    id: "crecer",
    label: "Crecer",
    values: { ventas: 82, ops: 45 },
    children: [{ id: "pipeline", label: "Pipeline", values: { ventas: 96, ops: null } }],
  },
]

describe("bandForValue", () => {
  test("cada corte de la escala cae en su banda", () => {
    expect(bandForValue(0).id).toBe("critical")
    expect(bandForValue(24).id).toBe("critical")
    expect(bandForValue(25).id).toBe("low")
    expect(bandForValue(79).id).toBe("medium")
    expect(bandForValue(80).id).toBe("good")
    expect(bandForValue(95).id).toBe("excellent")
    expect(bandForValue(100).id).toBe("excellent")
  })

  test("un valor por debajo de la escala queda fuera de ella, no en la peor banda", () => {
    expect(bandForValue(-1).id).toBe(NO_DATA_BAND.id)
  })

  test("los colores salen de tokens, nunca de un hex", () => {
    for (const band of FAVORABILITY_BANDS) {
      expect(band.background).toMatch(/^hsl\(var\(--fav-/)
    }
  })
})

describe("bandRangeLabel", () => {
  test("la última banda se lee como un mínimo abierto", () => {
    expect(bandRangeLabel(FAVORABILITY_BANDS[0]!)).toBe("0 – 24 %")
    expect(bandRangeLabel(FAVORABILITY_BANDS.at(-1)!)).toBe("≥ 95 %")
  })
})

describe("HeatmapMatrix", () => {
  test("es una tabla navegable: cada celda anuncia fila, columna, valor y banda", () => {
    render(<HeatmapMatrix columns={COLUMNS} rows={ROWS} rowHeaderLabel="Objetivo" />)
    expect(screen.getByRole("table")).toBeInTheDocument()
    expect(screen.getByLabelText("Crecer, Ventas: 82 %. Bueno.")).toBeInTheDocument()
    expect(screen.getByLabelText("Crecer, Operaciones: 45 %. Bajo.")).toBeInTheDocument()
  })

  test("una celda sin dato se lee «No aplica» y muestra un guion, no un cero", () => {
    render(<HeatmapMatrix columns={COLUMNS} rows={ROWS} />)
    const cell = screen.getByLabelText("Pipeline, Operaciones: Sin dato. No aplica.")
    expect(cell).toHaveTextContent("—")
    expect(cell).not.toHaveTextContent("0")
  })

  test("las filas con hijos se pliegan y despliegan", async () => {
    const user = userEvent.setup()
    render(<HeatmapMatrix columns={COLUMNS} rows={ROWS} />)
    expect(screen.getByText("Pipeline")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Contraer Crecer/ }))
    expect(screen.queryByText("Pipeline")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Desplegar Crecer/ }))
    expect(screen.getByText("Pipeline")).toBeInTheDocument()
  })

  test("defaultExpanded vacío arranca con todo cerrado", () => {
    render(<HeatmapMatrix columns={COLUMNS} rows={ROWS} defaultExpanded={[]} />)
    expect(screen.queryByText("Pipeline")).not.toBeInTheDocument()
  })

  test("sin onCellClick las celdas no son enfocables; con él, solo las que tienen dato", async () => {
    const onCellClick = vi.fn()
    const { rerender } = render(<HeatmapMatrix columns={COLUMNS} rows={ROWS} />)
    expect(screen.queryAllByRole("button", { name: /Ventas:/ })).toHaveLength(0)

    rerender(<HeatmapMatrix columns={COLUMNS} rows={ROWS} onCellClick={onCellClick} />)
    await userEvent.click(screen.getByRole("button", { name: "Crecer, Ventas: 82 %. Bueno." }))
    expect(onCellClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "crecer" }),
      expect.objectContaining({ id: "ventas" }),
      82,
    )
    expect(screen.queryByRole("button", { name: /Sin dato/ })).not.toBeInTheDocument()
  })

  test("la leyenda nombra las cinco bandas y se puede apagar", () => {
    const { rerender } = render(<HeatmapMatrix columns={COLUMNS} rows={ROWS} />)
    const legend = screen.getByRole("figure")
    for (const band of FAVORABILITY_BANDS) {
      expect(within(legend).getByText(band.label)).toBeInTheDocument()
    }

    rerender(<HeatmapMatrix columns={COLUMNS} rows={ROWS} legend={false} />)
    expect(screen.queryByText("Excelente")).not.toBeInTheDocument()
  })

  test("formatValue cambia lo que se escribe en la celda", () => {
    render(<HeatmapMatrix columns={COLUMNS} rows={ROWS} formatValue={(v) => `${v}/100`} />)
    expect(screen.getByText("82/100")).toBeInTheDocument()
  })
})
