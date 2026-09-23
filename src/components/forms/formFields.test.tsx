import * as React from "react"
import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { InputOtp } from "./InputOtp"
import { NumberField } from "./NumberField"
import { PhoneInput } from "./PhoneInput"
import { Rating } from "./Rating"

describe("NumberField", () => {
  test("las flechas suben y bajan el valor", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<NumberField defaultValue={8} step={2} onValueChange={onValueChange} aria-label="Duración" />)

    const input = screen.getByRole("spinbutton", { name: "Duración" })
    await user.click(input)
    await user.keyboard("{ArrowUp}")
    expect(onValueChange).toHaveBeenLastCalledWith(10)

    await user.keyboard("{ArrowDown}{ArrowDown}")
    expect(onValueChange).toHaveBeenLastCalledWith(6)
    expect(input).toHaveValue("6")
  })

  test("no pasa de min ni de max, ni con los botones", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<NumberField defaultValue={19} min={1} max={20} onValueChange={onValueChange} aria-label="Cupos" />)

    const input = screen.getByRole("spinbutton", { name: "Cupos" })
    await user.click(input)
    await user.keyboard("{PageUp}")
    expect(onValueChange).toHaveBeenLastCalledWith(20)
    expect(screen.getByRole("button", { name: "Sumar" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Restar" }))
    expect(onValueChange).toHaveBeenLastCalledWith(19)
  })

  test("recorta al salir del campo si se escribe fuera de rango", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <>
        <NumberField defaultValue={5} min={1} max={20} onValueChange={onValueChange} aria-label="Cupos" />
        <button type="button">fuera</button>
      </>
    )

    const input = screen.getByRole("spinbutton", { name: "Cupos" })
    await user.clear(input)
    await user.type(input, "99")
    await user.click(screen.getByRole("button", { name: "fuera" }))
    expect(input).toHaveValue("20")
    expect(onValueChange).toHaveBeenLastCalledWith(20)
  })
})

describe("InputOtp", () => {
  test("reparte un código pegado y avisa al completarlo", async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<InputOtp length={6} groups={[3, 3]} onComplete={onComplete} aria-label="Código" />)

    const cells = screen.getAllByRole("textbox")
    expect(cells).toHaveLength(6)

    await user.click(cells[0])
    await user.paste("482915")

    expect(onComplete).toHaveBeenCalledWith("482915")
    expect(cells.map((cell) => (cell as HTMLInputElement).value).join("")).toBe("482915")
  })

  test("descarta lo que no es un dígito y retrocede con Backspace", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<InputOtp length={4} onChange={onChange} aria-label="Código" />)

    const cells = screen.getAllByRole("textbox") as HTMLInputElement[]
    await user.click(cells[0])
    await user.keyboard("12a3")

    expect(cells.map((cell) => cell.value).join("")).toBe("123")

    await user.keyboard("{Backspace}")
    expect(onChange).toHaveBeenLastCalledWith("12")
  })
})

describe("Rating", () => {
  test("cambia con el teclado", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Rating defaultValue={3} onValueChange={onValueChange} label="Satisfacción" />)

    await user.tab()
    await user.keyboard("{ArrowRight}")
    expect(onValueChange).toHaveBeenLastCalledWith(4)

    await user.keyboard("{Home}")
    expect(onValueChange).toHaveBeenLastCalledWith(1)
  })

  test("de solo lectura no es un control y anuncia la nota", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Rating value={4.2} readOnly showValue onValueChange={onValueChange} />)

    expect(screen.queryByRole("radiogroup")).toBeNull()
    expect(screen.getByRole("img", { name: "4,2 de 5" })).toBeInTheDocument()
    expect(screen.getByText("4,2 de 5")).toBeInTheDocument()

    await user.tab()
    expect(onValueChange).not.toHaveBeenCalled()
  })
})

describe("PhoneInput", () => {
  function ControlledPhone({ onValueChange }: { onValueChange: (value: string) => void }) {
    const [value, setValue] = React.useState("+573001234567")
    return (
      <PhoneInput
        value={value}
        onValueChange={(next) => {
          setValue(next)
          onValueChange(next)
        }}
      />
    )
  }

  test("emite E.164 al escribir y al cambiar de país", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ControlledPhone onValueChange={onValueChange} />)

    const input = screen.getByRole("textbox")
    expect(input).toHaveValue("300 123 4567")

    await user.click(screen.getByRole("combobox", { name: "Prefijo de país" }))
    await user.click(await screen.findByRole("option", { name: /México/ }))

    expect(onValueChange).toHaveBeenLastCalledWith("+523001234567")
    expect(screen.getByRole("textbox")).toHaveValue("30 0123 4567")
  })

  test("descarta lo que no son dígitos y respeta la longitud del país", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<PhoneInput onValueChange={onValueChange} defaultCountry="ES" />)

    const input = screen.getByRole("textbox")
    await user.type(input, "612-345-678999")

    expect(onValueChange).toHaveBeenLastCalledWith("+34612345678")
    expect(input).toHaveValue("612 345 678")
  })
})
