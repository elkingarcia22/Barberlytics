import { describe, expect, it } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { IconTile } from "./IconTile";

const Glyph = () => <svg data-testid="glyph" />;

describe("IconTile", () => {
  it("pinta solo el icono cuando no hay foto", () => {
    const { container, getByTestId } = render(<IconTile icon={<Glyph />} src={null} />);
    expect(getByTestId("glyph")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("cubre la baldosa con la foto y deja el icono de respaldo", () => {
    const { container, getByTestId } = render(<IconTile icon={<Glyph />} src="https://example.com/cera.jpg" />);
    expect(container.querySelector("img")).toHaveAttribute("src", "https://example.com/cera.jpg");
    expect(getByTestId("glyph")).toBeInTheDocument();
  });

  it("si la foto falla vuelve al icono, y lo intenta otra vez con una foto nueva", () => {
    const { container, rerender } = render(<IconTile icon={<Glyph />} src="https://example.com/rota.jpg" />);
    fireEvent.error(container.querySelector("img") as HTMLImageElement);
    expect(container.querySelector("img")).toBeNull();
    rerender(<IconTile icon={<Glyph />} src="https://example.com/buena.jpg" />);
    expect(container.querySelector("img")).toHaveAttribute("src", "https://example.com/buena.jpg");
  });
});
