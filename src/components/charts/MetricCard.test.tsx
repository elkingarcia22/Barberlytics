import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import { MetricCard } from "./MetricCard"
import { DELTA_FLAT_THRESHOLD, DeltaPill } from "./DeltaPill"

/** Las clases de la píldora que envuelve al texto `text`. */
function pillClasses(text: string): string {
  return screen.getByText(text).parentElement?.className ?? ""
}

describe("MetricCard", () => {
  test("el valor siempre se lee como texto, con gráfico o sin él", () => {
    render(
      <MetricCard
        label="Avance promedio"
        value="72 %"
        caption="Sobre 8 ciclos"
        chart={<div data-testid="grafico" />}
      />
    )

    expect(screen.getByText("72 %")).toBeTruthy()
    expect(screen.getByText("Sobre 8 ciclos")).toBeTruthy()
    expect(screen.getByTestId("grafico")).toBeTruthy()
  })

  test("formatea un valor numérico en es-ES y deja pasar cualquier nodo", () => {
    const { rerender } = render(<MetricCard label="Colaboradores" value={1740.5} />)
    expect(screen.getByText("1740,5")).toBeTruthy()

    rerender(<MetricCard label="Colaboradores" value={<em>sin dato</em>} />)
    expect(screen.getByText("sin dato").tagName).toBe("EM")
  })

  test("la variación llega como píldora con su texto y su tono", () => {
    render(<MetricCard label="Avance" value="72 %" delta={3.2} deltaLabel="+3,2 pp" />)

    const pill = screen.getByText("+3,2 pp").parentElement
    expect(pill?.className).toContain("text-status-positive")
  })

  test("deltaTone gana al signo para las métricas invertidas", () => {
    render(<MetricCard label="Rotación" value="4,8 %" delta={1.7} deltaTone="negative" />)

    const pill = screen.getByText("+1,7").parentElement
    expect(pill?.className).toContain("text-status-negative")
  })

  test("sin delta no se dibuja ninguna píldora", () => {
    render(<MetricCard label="Objetivos activos" value={214} />)
    expect(screen.queryByText(/^[+-]/)).toBeNull()
  })

  test("hint monta un disparador accesible con el tooltip", () => {
    render(<MetricCard label="Avance promedio" value="72 %" hint="Promedio de los ciclos iniciados." />)
    expect(screen.getByRole("button", { name: "Qué mide Avance promedio" })).toBeTruthy()
  })

  /**
   * Regresión de maquetación: el gráfico a sangre tiene que quedar FUERA del
   * bloque con relleno, o el borde inferior de la tarjeta lo deja flotando a
   * 24 px del canto en vez de apoyado en él.
   */
  test("chartPlacement mueve el gráfico dentro o fuera del bloque con relleno", () => {
    const chart = <div data-testid="grafico" />

    const { rerender } = render(<MetricCard label="Cumplimiento" value="72 %" chart={chart} />)
    const inside = screen.getByTestId("grafico").closest(".p-card")
    expect(inside).not.toBeNull()

    rerender(<MetricCard label="Cumplimiento" value="72 %" chart={chart} chartPlacement="bottom" />)
    expect(screen.getByTestId("grafico").closest(".p-card")).toBeNull()
    expect(screen.getByTestId("grafico").closest(".px-card")).toBeNull()
  })
})

describe("DeltaPill", () => {
  test.each([
    [3.2, "text-status-positive"],
    [-2.4, "text-status-negative"],
    [0.2, "text-text-secondary"],
    [-0.4, "text-text-secondary"],
    [0, "text-text-secondary"],
  ] as const)("%s se pinta con el tono que le toca", (value, expected) => {
    render(<DeltaPill value={value} label="delta" />)
    expect(pillClasses("delta")).toContain(expected)
  })

  /**
   * El umbral vive dentro del componente: un +0,2 pp de ruido estadístico se
   * pintaba en verde con flecha arriba y se leía como una mejora real.
   */
  test("el umbral deja plano cualquier ruido por debajo de medio punto", () => {
    expect(DELTA_FLAT_THRESHOLD).toBe(0.5)

    const { rerender } = render(<DeltaPill value={DELTA_FLAT_THRESHOLD} label="justo" />)
    expect(pillClasses("justo")).toContain("text-text-secondary")

    rerender(<DeltaPill value={DELTA_FLAT_THRESHOLD + 0.1} label="justo" />)
    expect(pillClasses("justo")).toContain("text-status-positive")
  })

  test("la dirección se puede forzar sin tocar el tono", () => {
    const { container } = render(<DeltaPill value={3.2} direction="flat" label="+3,2 pp" />)
    expect(pillClasses("+3,2 pp")).toContain("text-status-positive")
    expect(container.querySelectorAll("svg").length).toBe(1)
  })

  test("sin label formatea el número en es-ES con signo explícito", () => {
    const { rerender } = render(<DeltaPill value={3.25} />)
    expect(screen.getByText("+3,3")).toBeTruthy()

    rerender(<DeltaPill value={-1.4} />)
    expect(screen.getByText("-1,4")).toBeTruthy()

    rerender(<DeltaPill value={0} />)
    expect(screen.getByText("0")).toBeTruthy()
  })

  test("showIcon a false deja solo el texto", () => {
    const { container, rerender } = render(<DeltaPill value={3.2} />)
    expect(container.querySelectorAll("svg").length).toBe(1)

    rerender(<DeltaPill value={3.2} showIcon={false} />)
    expect(container.querySelectorAll("svg").length).toBe(0)
  })
})
