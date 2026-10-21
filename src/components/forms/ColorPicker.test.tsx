import * as React from "react"
import { describe, expect, test, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ColorPicker } from "./ColorPicker"

describe("ColorPicker", () => {
  test("el HEX escrito se aplica al salir del campo o con Enter", async () => {
    const onChange = vi.fn()
    render(<ColorPicker value="#C8102E" onChange={onChange} label="Color primario" />)
    const input = screen.getByRole("textbox", { name: "Color primario: código HEX" })
    await userEvent.clear(input)
    await userEvent.type(input, "0b3d91{Enter}")
    expect(onChange).toHaveBeenLastCalledWith("#0B3D91")
  })

  test("un HEX inválido vuelve al color actual sin emitir", async () => {
    const onChange = vi.fn()
    render(<ColorPicker value="#C8102E" onChange={onChange} />)
    const input = screen.getByRole("textbox", { name: "Color: código HEX" })
    await userEvent.clear(input)
    await userEvent.type(input, "rojo")
    expect(input).toHaveAttribute("aria-invalid", "true")
    fireEvent.blur(input)
    expect(input).toHaveValue("#C8102E")
    expect(onChange).not.toHaveBeenCalled()
  })

  test("las flechas mueven el matiz y la saturación", () => {
    const onChange = vi.fn()
    render(<ColorPicker value="#FF0000" onChange={onChange} />)
    fireEvent.keyDown(screen.getByRole("slider", { name: "Color: matiz" }), { key: "ArrowRight", shiftKey: true })
    expect(onChange.mock.calls.at(-1)?.[0]).toMatch(/^#FF2[AB]00$/)
    fireEvent.keyDown(screen.getByRole("slider", { name: "Color: saturación y brillo" }), { key: "ArrowLeft", shiftKey: true })
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  test("elegir una muestra emite su color", async () => {
    const onChange = vi.fn()
    render(<ColorPicker value="#C8102E" onChange={onChange} swatches={[{ color: "#0B3D91", label: "Azul del logo" }]} />)
    await userEvent.click(screen.getByRole("button", { name: "Azul del logo" }))
    expect(onChange).toHaveBeenCalledWith("#0B3D91")
  })

  test("un value nuevo desde fuera reemplaza el que se muestra", () => {
    function Harness() {
      const [color, setColor] = React.useState("#C8102E")
      return (
        <>
          <button type="button" onClick={() => setColor("#0B3D91")}>Cambiar</button>
          <ColorPicker value={color} onChange={setColor} />
        </>
      )
    }
    render(<Harness />)
    fireEvent.click(screen.getByRole("button", { name: "Cambiar" }))
    expect(screen.getByRole("textbox", { name: "Color: código HEX" })).toHaveValue("#0B3D91")
  })
})
