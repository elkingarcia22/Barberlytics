import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FeedbackPanel } from "./FeedbackPanel"

const SECTIONS = [
  { value: "general", label: "Impresión general" },
  { value: "agenda", label: "Calendario y agenda" },
]

function panel(props: Partial<React.ComponentProps<typeof FeedbackPanel>> = {}) {
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue(undefined)
  const onOpenChange = props.onOpenChange ?? vi.fn()
  render(<FeedbackPanel open sections={SECTIONS} context="Métricas" onSubmit={onSubmit} onOpenChange={onOpenChange} {...props} />)
  return { onSubmit, onOpenChange }
}

describe("FeedbackPanel", () => {
  test("dice en qué página se guardará el comentario", () => {
    panel()
    expect(screen.getByRole("dialog", { name: "Tu opinión importa" })).toBeInTheDocument()
    expect(screen.getByText("Métricas")).toBeInTheDocument()
  })

  test("no envía un comentario demasiado corto y lo explica", async () => {
    const user = userEvent.setup()
    const { onSubmit } = panel()
    await user.type(screen.getByLabelText("Compártenos tus comentarios"), "mal")
    await user.click(screen.getByRole("button", { name: "Enviar feedback" }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole("alert")).toHaveTextContent("al menos 5 caracteres")
  })

  test("envía sección y comentario recortado, y agradece", async () => {
    const user = userEvent.setup()
    const { onSubmit } = panel()
    await user.type(screen.getByLabelText("Compártenos tus comentarios"), "  Falta la vista semanal  ")
    await user.click(screen.getByRole("button", { name: "Enviar feedback" }))
    expect(onSubmit).toHaveBeenCalledWith({ section: "general", comment: "Falta la vista semanal" })
    expect(await screen.findByText("¡Gracias por tu feedback!")).toBeInTheDocument()
  })

  test("si el envío falla, conserva el texto y enseña el error", async () => {
    const user = userEvent.setup()
    panel({ onSubmit: vi.fn().mockRejectedValue(new Error("Sin conexión")) })
    const field = screen.getByLabelText("Compártenos tus comentarios")
    await user.type(field, "Los botones son pequeños")
    await user.click(screen.getByRole("button", { name: "Enviar feedback" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Sin conexión")
    expect(field).toHaveValue("Los botones son pequeños")
  })

  test("Escape cierra", async () => {
    const user = userEvent.setup()
    const { onOpenChange } = panel()
    await user.keyboard("{Escape}")
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
