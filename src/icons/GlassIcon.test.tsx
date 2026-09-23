import { describe, expect, test } from "vitest";
import { render } from "@testing-library/react";
import { GlassIcon } from "./GlassIcon";

describe("GlassIcon", () => {
  test("renderiza un <svg> del tamaño pedido (64 por defecto)", () => {
    const { container, rerender } = render(<GlassIcon name="survey" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "64");
    expect(svg).toHaveAttribute("height", "64");
    expect(svg).toHaveAttribute("viewBox", "0 0 64 64");

    rerender(<GlassIcon name="survey" size={96} />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "96");
  });

  test("dos instancias no comparten ids de gradientes ni filtros", () => {
    const { container } = render(
      <>
        <GlassIcon name="calendar" tone="blue" />
        <GlassIcon name="calendar" tone="blue" />
      </>
    );
    const ids = Array.from(container.querySelectorAll("linearGradient, filter, clipPath")).map((el) => el.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);

    const [first, second] = Array.from(container.querySelectorAll("svg"));
    const fillOf = (svg: Element) => svg.querySelector("path[fill^='url(#']")?.getAttribute("fill");
    expect(fillOf(first)).toMatch(/^url\(#glass-/);
    expect(fillOf(first)).not.toBe(fillOf(second));
  });

  test("el tono brand usa las variables CSS del gradiente de marca", () => {
    const { container } = render(<GlassIcon name="sparkles" tone="brand" />);
    // jsdom no resuelve selectores descendientes con etiquetas camelCase (`linearGradient stop`), por eso solo `stop`.
    const stops = Array.from(container.querySelectorAll("stop")).map((s) => s.getAttribute("style") ?? "");
    expect(stops.some((s) => s.includes("var(--color-brand-gradient-from)"))).toBe(true);
    expect(stops.some((s) => s.includes("var(--color-brand-gradient-via)"))).toBe(true);
    expect(stops.some((s) => s.includes("var(--color-brand-gradient-to)"))).toBe(true);
    expect(container.querySelector("svg")).toHaveAttribute("data-glass-tone", "brand");
  });

  test("es decorativo sin label y accesible con label", () => {
    const { container, rerender } = render(<GlassIcon name="users" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");

    rerender(<GlassIcon name="users" label="Equipo" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("role", "img");
    expect(svg).toHaveAttribute("aria-label", "Equipo");
  });

  test("pinta el glifo del registro en blanco con sombra", () => {
    const { container } = render(<GlassIcon name="home" tone="green" />);
    const glyph = container.querySelector("g[filter^='url(#'][color='#fff']");
    expect(glyph).not.toBeNull();
    expect(glyph?.querySelector("path")).toHaveAttribute("stroke", "currentColor");
    expect(glyph?.querySelector("path")).toHaveAttribute("stroke-width", "1.75");
  });
});
