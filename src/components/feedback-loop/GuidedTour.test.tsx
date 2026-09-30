import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { GuidedTour, type TourStep } from "./GuidedTour"

const STEPS: TourStep[] = [
  { id: "a", title: "Bienvenida", description: "Primer paso" },
  { id: "b", title: "El menú", description: "Segundo paso", target: "#no-existe" },
  { id: "c", title: "El botón", description: "Último paso" },
]

function tour(props: Partial<React.ComponentProps<typeof GuidedTour>> = {}) {
  const onOpenChange = vi.fn()
  const onComplete = vi.fn()
  render(<GuidedTour steps={STEPS} open onOpenChange={onOpenChange} onComplete={onComplete} {...props} />)
  return { onOpenChange, onComplete }
}

describe("GuidedTour", () => {
  test("recorre los pasos hacia delante y hacia atrás", async () => {
    const user = userEvent.setup()
    tour()
    expect(screen.getByRole("dialog", { name: "Bienvenida" })).toBeInTheDocument()
    expect(screen.getByText("Paso 1 de 3")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Atrás/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Continuar/ }))
    // Un objetivo que no aparece no bloquea: la tarjeta sale igual.
    expect(await screen.findByRole("dialog", { name: "El menú" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /Atrás/ }))
    expect(screen.getByRole("dialog", { name: "Bienvenida" })).toBeInTheDocument()
  })

  test("«Finalizar» completa y cierra; Escape solo cierra", async () => {
    const user = userEvent.setup()
    const { onOpenChange, onComplete } = tour()
    await user.click(screen.getByRole("button", { name: /Continuar/ }))
    await user.click(await screen.findByRole("button", { name: /Continuar/ }))
    await user.click(screen.getByRole("button", { name: /Finalizar/ }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test("Escape cierra sin completar", async () => {
    const user = userEvent.setup()
    const { onOpenChange, onComplete } = tour()
    await user.keyboard("{Escape}")
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onComplete).not.toHaveBeenCalled()
  })

  test("cerrado no pinta nada", () => {
    tour({ open: false })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
