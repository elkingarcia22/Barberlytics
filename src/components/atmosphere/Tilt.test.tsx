import { describe, expect, test } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Tilt } from "./Tilt";

describe("Tilt", () => {
  test("sin puntero fino no escribe ningún transform", () => {
    // Arrange · el matchMedia de las pruebas responde `false` a "(hover: hover) and (pointer: fine)".
    render(<Tilt maxDegrees={5}>Panel</Tilt>);
    const panel = screen.getByText("Panel");

    // Act
    fireEvent.pointerMove(panel, { clientX: 10, clientY: 10 });

    // Assert
    expect(panel).toHaveClass("tilt");
    expect(panel.style.transform).toBe("");
  });
});
