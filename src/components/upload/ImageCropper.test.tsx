import { describe, expect, test } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ImageCropper } from "./ImageCropper"

const IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

describe("ImageCropper", () => {
  test("los giros de 90° suman y restan y se anuncian en grados", async () => {
    const user = userEvent.setup()
    render(<ImageCropper image={IMAGE} />)

    await user.click(screen.getByRole("button", { name: "Girar a la derecha" }))
    expect(screen.getByText("90°")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Girar a la izquierda" }))
    await user.click(screen.getByRole("button", { name: "Girar a la izquierda" }))
    expect(screen.getByText("270°")).toBeInTheDocument()
  })

  test("acercar con el botón y restablecer vuelve al inicio", async () => {
    const user = userEvent.setup()
    render(<ImageCropper image={IMAGE} />)
    const zoom = screen.getByRole("slider", { name: "Zoom" })
    expect(zoom).toHaveAttribute("aria-valuenow", "1")

    await user.click(screen.getByRole("button", { name: "Acercar" }))
    expect(zoom).toHaveAttribute("aria-valuenow", "1.2")
    await user.click(screen.getByRole("button", { name: "Girar a la derecha" }))
    await user.click(screen.getByRole("button", { name: "Restablecer" }))
    expect(zoom).toHaveAttribute("aria-valuenow", "1")
    expect(screen.getByText("0°")).toBeInTheDocument()
  })

  test("las teclas + y − acercan y alejan desde el área de recorte", () => {
    render(<ImageCropper image={IMAGE} />)
    // jsdom no mide la imagen, así que el recuadro no llega a montarse: la tecla sube desde el contenedor.
    const container = screen.getByTestId("container")
    fireEvent.keyDown(container, { key: "+" })
    fireEvent.keyDown(container, { key: "+" })
    expect(screen.getByRole("slider", { name: "Zoom" })).toHaveAttribute("aria-valuenow", "1.2")
    fireEvent.keyDown(container, { key: "-" })
    expect(screen.getByRole("slider", { name: "Zoom" })).toHaveAttribute("aria-valuenow", "1.1")
  })

  test("sin giro fino no muestra la segunda barra", () => {
    render(<ImageCropper image={IMAGE} fineRotation={false} />)
    expect(screen.queryByRole("slider", { name: "Giro fino" })).not.toBeInTheDocument()
  })
})
