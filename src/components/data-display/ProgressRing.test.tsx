import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ProgressRing } from "./ProgressRing";

describe("ProgressRing", () => {
  test("anuncia el avance como barra de progreso", () => {
    render(<ProgressRing value={6} max={10} aria-label="6 de 10 visitas" />);
    const ring = screen.getByRole("progressbar", { name: "6 de 10 visitas" });
    expect(ring).toHaveAttribute("aria-valuenow", "6");
    expect(ring).toHaveAttribute("aria-valuemax", "10");
  });

  test("no pasa del máximo ni baja de cero", () => {
    const { rerender } = render(<ProgressRing value={14} max={10} aria-label="avance" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "10");
    rerender(<ProgressRing value={-3} max={10} aria-label="avance" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  test("el tramo pendiente no cuenta como conseguido", () => {
    render(<ProgressRing value={5} pending={1} max={10} aria-label="avance" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "5");
  });

  test("el centro es decorativo: lo lee el aria-label, no el texto", () => {
    render(
      <ProgressRing value={3} max={10} aria-label="3 de 10">
        3/10
      </ProgressRing>
    );
    expect(screen.getByText("3/10")).toHaveAttribute("aria-hidden");
  });
});
