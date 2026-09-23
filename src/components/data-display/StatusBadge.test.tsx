import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";

/**
 * Regresión: el mapa de estados pedía variantes de `Badge` que no existían
 * (`positive`, `warning`, `negative`, `info`) y un `any` lo ocultaba, así que
 * cada chip salía sin fondo ni color: texto pelado en medio de una tabla.
 */
describe("StatusBadge", () => {
  test.each([
    ["active", "text-status-positive"],
    ["pending", "text-status-warning"],
    ["error", "text-status-negative"],
    ["info", "text-status-info"],
  ] as const)("%s se pinta con su tono", (status, expected) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(/./).className).toContain(expected);
  });

  test("usa la etiqueta que se le pase y su etiqueta por defecto si no", () => {
    const { rerender } = render(<StatusBadge status="active" />);
    expect(screen.getByText("Activo")).toBeTruthy();
    rerender(<StatusBadge status="active" label="En curso" />);
    expect(screen.getByText("En curso")).toBeTruthy();
  });
})
