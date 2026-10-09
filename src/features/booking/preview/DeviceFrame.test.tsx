import * as React from "react";
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeviceFrame, type PreviewDevice } from "./DeviceFrame";

/** Un contenido con estado propio, como la reserva: si el marco lo desmonta, vuelve a cero. */
function Counter() {
  const [count, setCount] = React.useState(0);
  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      Pasos: {count}
    </button>
  );
}

describe("DeviceFrame", () => {
  test("al cambiar de celular a tablet y a monitor, lo de dentro sigue donde estaba", async () => {
    // Arrange
    const user = userEvent.setup();
    const frame = (device: PreviewDevice) => (
      <DeviceFrame device={device} address="barberia.example.com">
        <Counter />
      </DeviceFrame>
    );
    const { rerender } = render(frame("phone"));
    await user.click(screen.getByRole("button", { name: "Pasos: 0" }));
    await user.click(screen.getByRole("button", { name: "Pasos: 1" }));

    // Act
    rerender(frame("tablet"));
    rerender(frame("monitor"));

    // Assert
    expect(screen.getByRole("button", { name: "Pasos: 2" })).toBeInTheDocument();
    expect(screen.getByText("barberia.example.com")).toBeInTheDocument();
  });
});
