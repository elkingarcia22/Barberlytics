import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { BarberlyticsLogo } from "./BarberlyticsLogo";
import { MARK_RATIO, WORDMARK_RATIO } from "./barberlyticsLogoPaths";

describe("BarberlyticsLogo", () => {
  test("es una imagen con nombre accesible y proporción del logotipo", () => {
    render(<BarberlyticsLogo height={40} />);
    const svg = screen.getByRole("img", { name: "Barberlytics" });
    expect(svg.getAttribute("height")).toBe("40");
    expect(svg.getAttribute("width")).toBe(String(Math.round(40 * WORDMARK_RATIO)));
    expect(svg.querySelectorAll("path")).toHaveLength(3);
  });

  test("la variante mark deja solo la flecha y cambia la proporción", () => {
    render(<BarberlyticsLogo variant="mark" height={40} title="Isotipo" />);
    const svg = screen.getByRole("img", { name: "Isotipo" });
    expect(svg.getAttribute("width")).toBe(String(Math.round(40 * MARK_RATIO)));
    expect(svg.querySelectorAll("path")).toHaveLength(1);
    expect(svg.querySelectorAll("linearGradient")).toHaveLength(1);
  });

  test("brand y ai usan los tokens del tema; mono usa currentColor", () => {
    const { container, rerender } = render(<BarberlyticsLogo gradient="brand" />);
    const stops = () => Array.from(container.querySelectorAll("stop")).map((stop) => (stop as SVGStopElement).style.stopColor);
    expect(stops()[0]).toBe("var(--color-brand-gradient-from)");

    rerender(<BarberlyticsLogo gradient="ai" />);
    expect(stops()).toHaveLength(10);
    expect(stops()[4]).toBe("var(--color-ai-stop-5)");

    rerender(<BarberlyticsLogo gradient="mono" />);
    expect(container.querySelector("linearGradient")).toBeNull();
    const fills = Array.from(container.querySelectorAll("path")).map((path) => path.getAttribute("fill"));
    expect(fills.every((fill) => fill === "currentColor")).toBe(true);
  });

  test("dos logos en la misma página no comparten ids de gradiente", () => {
    const { container } = render(
      <>
        <BarberlyticsLogo />
        <BarberlyticsLogo />
      </>
    );
    const ids = Array.from(container.querySelectorAll("linearGradient")).map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
