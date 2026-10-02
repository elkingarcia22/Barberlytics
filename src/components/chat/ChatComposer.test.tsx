import { beforeAll, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { ChatComposer } from "./ChatComposer";

function Harness(props: Partial<React.ComponentProps<typeof ChatComposer>>) {
  const [value, setValue] = React.useState("");
  return <ChatComposer value={value} onChange={setValue} onSend={props.onSend ?? vi.fn()} {...props} />;
}

// jsdom no mide trazos SVG; el borde que recorre (MovingBorderBeam) los necesita.
beforeAll(() => {
  Object.assign(SVGElement.prototype, {
    getTotalLength: () => 100,
    getPointAtLength: () => ({ x: 0, y: 0 }),
  });
});

describe("ChatComposer", () => {
  test("Enter envía el texto recortado y vacía la caja; Shift+Enter baja de línea", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Harness onSend={onSend} />);
    const input = screen.getByTestId("chat-input");

    await user.type(input, "  hola{Shift>}{Enter}{/Shift}mundo  ");
    expect(onSend).not.toHaveBeenCalled();
    await user.keyboard("{Enter}");

    expect(onSend).toHaveBeenCalledWith("hola\nmundo", []);
    expect(input).toHaveValue("");
  });

  test("sin texto no se puede enviar", () => {
    render(<Harness />);
    expect(screen.getByTestId("chat-send")).toBeDisabled();
  });

  test("las fichas de arranque avisan al tocarlas y el aviso de novedad se cierra", async () => {
    const user = userEvent.setup();
    const onChip = vi.fn();
    render(<Harness chips={["Evaluaciones vencidas"]} onChip={onChip} news={{ text: "Ya ejecuta acciones en **Selección**." }} />);

    await user.click(screen.getByRole("button", { name: "Evaluaciones vencidas" }));
    expect(onChip).toHaveBeenCalledWith("Evaluaciones vencidas");

    expect(screen.getByTestId("chat-news")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Cerrar novedad" }));
    expect(screen.queryByTestId("chat-news")).toBeNull();
  });

  test("el botón Voz solo sale cuando hay a dónde ir", () => {
    const { rerender } = render(<Harness />);
    expect(screen.queryByTestId("chat-voice")).toBeNull();
    rerender(<Harness onVoice={vi.fn()} />);
    expect(screen.getByTestId("chat-voice")).toBeTruthy();
  });
});
