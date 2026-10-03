import { beforeAll, describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FeedbackDialog } from "./FeedbackDialog"

const SECTIONS = [
  { value: "general", label: "Impresión general" },
  { value: "agenda", label: "Calendario y agenda" },
]

beforeAll(() => {
  // jsdom no trae URL de objetos; las miniaturas solo necesitan una cadena.
  URL.createObjectURL = vi.fn(() => "blob:prueba")
  URL.revokeObjectURL = vi.fn()
})

function dialog(props: Partial<React.ComponentProps<typeof FeedbackDialog>> = {}) {
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue(undefined)
  const onOpenChange = props.onOpenChange ?? vi.fn()
  render(<FeedbackDialog open sections={SECTIONS} context="Métricas" onSubmit={onSubmit} onOpenChange={onOpenChange} {...props} />)
  return { onSubmit, onOpenChange }
}

const send = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Enviar feedback" }))

describe("FeedbackDialog", () => {
  test("dice con qué página se guardará el comentario", () => {
    dialog()
    expect(screen.getByRole("dialog", { name: "Enviar feedback" })).toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: /Incluir la página donde estás: Métricas/ })).toBeChecked()
  })

  test("no envía un comentario demasiado corto y lo explica", async () => {
    const user = userEvent.setup()
    const { onSubmit } = dialog()
    await user.type(screen.getByLabelText("Comentario"), "mal")
    await send(user)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole("alert")).toHaveTextContent("al menos 5 caracteres")
  })

  test("envía tipo, sección y comentario recortado, y agradece", async () => {
    const user = userEvent.setup()
    const { onSubmit } = dialog()
    await user.click(screen.getByRole("radio", { name: "Error" }))
    await user.type(screen.getByLabelText("Comentario"), "  El botón no guarda  ")
    await user.click(screen.getByRole("checkbox", { name: "Pueden contactarme sobre este feedback" }))
    await send(user)
    expect(onSubmit).toHaveBeenCalledWith({ type: "bug", section: "general", comment: "El botón no guarda", attachments: [], includePage: true, canContact: true })
    expect(await screen.findByText("¡Gracias por tu feedback!")).toBeInTheDocument()
  })

  test("las imágenes subidas viajan como archivos y se pueden quitar", async () => {
    const user = userEvent.setup()
    const { onSubmit } = dialog()
    const image = new File(["x"], "pantalla.png", { type: "image/png" })
    await user.upload(screen.getByLabelText("Subir imágenes", { selector: "input" }), image)
    expect(screen.getByRole("img", { name: "pantalla.png" })).toBeInTheDocument()
    await user.type(screen.getByLabelText("Comentario"), "Mira esta pantalla")
    await send(user)
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ attachments: [image] }))
  })

  test("rechaza lo que no es JPG o PNG y lo explica", async () => {
    const user = userEvent.setup({ applyAccept: false })
    dialog()
    await user.upload(screen.getByLabelText("Subir imágenes", { selector: "input" }), new File(["x"], "notas.pdf", { type: "application/pdf" }))
    expect(screen.getByRole("alert")).toHaveTextContent("notas.pdf no es una imagen JPG o PNG")
  })

  test("si el envío falla, conserva el texto y enseña el error", async () => {
    const user = userEvent.setup()
    dialog({ onSubmit: vi.fn().mockRejectedValue(new Error("Sin conexión")) })
    const field = screen.getByLabelText("Comentario")
    await user.type(field, "Los botones son pequeños")
    await send(user)
    expect(await screen.findByRole("alert")).toHaveTextContent("Sin conexión")
    expect(field).toHaveValue("Los botones son pequeños")
  })

  test("Escape cierra", async () => {
    const user = userEvent.setup()
    const { onOpenChange } = dialog()
    await user.keyboard("{Escape}")
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test("sin API de captura solo ofrece subir imágenes", () => {
    dialog()
    expect(screen.queryByRole("button", { name: "Capturar un área" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Grabar video" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Subir imágenes" })).toBeInTheDocument()
  })
})
