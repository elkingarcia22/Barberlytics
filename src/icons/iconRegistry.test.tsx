import { describe, expect, test } from "vitest";
import { render } from "@testing-library/react";
import { iconRegistry, IconFallback } from "./iconRegistry";
import { ThemaIcon } from "./ThemaIcon";
import type { IconName } from "./iconTypes";

const ICON_NAMES = Object.keys(iconRegistry) as IconName[];

describe("iconRegistry", () => {
  test("todo IconName tiene datos SVG de Hugeicons no vacíos", () => {
    expect(ICON_NAMES.length).toBeGreaterThan(0);
    for (const name of ICON_NAMES) {
      const icon = iconRegistry[name];
      expect(Array.isArray(icon), `${name} debe ser una lista de elementos`).toBe(true);
      expect(icon.length, `${name} no puede estar vacío`).toBeGreaterThan(0);
      for (const [tag, attrs] of icon) {
        expect(typeof tag).toBe("string");
        expect(typeof attrs).toBe("object");
      }
    }
  });

  test("el icono de respaldo es un icono válido", () => {
    expect(Array.isArray(IconFallback)).toBe(true);
    expect(IconFallback.length).toBeGreaterThan(0);
  });
});

describe("ThemaIcon", () => {
  test("decorativo por defecto: renderiza un <svg> oculto a lectores de pantalla", () => {
    const { container } = render(<ThemaIcon name="search" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role");
    expect(svg?.querySelector("path")).not.toBeNull();
  });

  test("no decorativo: role img y aria-label", () => {
    const { container } = render(<ThemaIcon name="success" decorative={false} label="Encuesta publicada" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("role", "img");
    expect(svg).toHaveAttribute("aria-label", "Encuesta publicada");
    expect(svg).not.toHaveAttribute("aria-hidden");
  });

  test("aplica la talla, el tono y el trazo de 1.5", () => {
    const { container } = render(<ThemaIcon name="info" size="sm" tone="warning" className="extra" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("size-4", "text-warning", "extra");
    expect(svg).toHaveAttribute("width", "16");
    expect(svg).toHaveAttribute("stroke-width", "1.5");
  });

  test("un nombre desconocido usa el icono de respaldo en vez de romper", () => {
    const { container } = render(<ThemaIcon name={"rocket" as IconName} />);
    expect(container.querySelector("svg path")).not.toBeNull();
  });
});
