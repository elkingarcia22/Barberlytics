import { describe, expect, test } from "vitest";
import { render } from "@testing-library/react";
import { BarberGlyph } from "./BarberGlyph";
import { Foil } from "./Foil";
import { Grain } from "./Grain";
import { Halo } from "./Halo";
import { Vignette } from "./Vignette";

describe("Fondos y acabados", () => {
  test("Grain y Vignette son decorativos y cambian de alcance con `scope`", () => {
    const { container } = render(
      <>
        <Grain />
        <Vignette scope="page" />
      </>
    );
    const grain = container.querySelector('[data-slot="grain"]');
    const vignette = container.querySelector('[data-slot="vignette"]');
    expect(grain).toHaveAttribute("aria-hidden", "true");
    expect(grain).toHaveAttribute("data-scope", "container");
    expect(vignette).toHaveAttribute("data-scope", "page");
  });

  test("Halo expone posición, tamaño y fuerza como variables", () => {
    const { container } = render(<Halo x="12%" y="-10%" size="60rem 40rem" strength={0.3} />);
    const halo = container.querySelector('[data-slot="halo"]') as HTMLElement;
    expect(halo.style.getPropertyValue("--halo-x")).toBe("12%");
    expect(halo.style.getPropertyValue("--halo-size")).toBe("60rem 40rem");
    expect(halo.style.getPropertyValue("--halo-alpha")).toBe("0.3");
  });

  test("BarberGlyph dibuja el peine o la navaja y flota si se le pide", () => {
    const { container } = render(
      <>
        <BarberGlyph kind="comb" rotate={-8} />
        <BarberGlyph kind="razor" floating rotate={4} />
      </>
    );
    const [comb, razor] = container.querySelectorAll<SVGSVGElement>('[data-slot="barber-glyph"]');
    expect(comb.dataset.kind).toBe("comb");
    expect(comb.querySelectorAll("line").length).toBeGreaterThan(20);
    expect(comb.style.transform).toBe("rotate(-8deg)");
    expect(razor).toHaveClass("float-slow");
    expect(razor.style.getPropertyValue("--float-rot")).toBe("4deg");
  });

  test("Foil renderiza la etiqueta pedida con la clase de lámina", () => {
    const { getByText } = render(
      <h1>
        La entrenamos <Foil as="em">contigo</Foil>
      </h1>
    );
    const word = getByText("contigo");
    expect(word.tagName).toBe("EM");
    expect(word).toHaveClass("foil");
  });
});
