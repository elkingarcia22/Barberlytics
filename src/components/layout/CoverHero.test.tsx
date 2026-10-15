import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { CoverHero, CoverTitle } from "./CoverHero";

describe("CoverHero", () => {
  test("pinta la foto decorativa y el contenido sobre ella", () => {
    const { container } = render(
      <CoverHero imageUrl="https://example.com/barberia.jpg">
        <CoverTitle title="Arma tu cita" lead="Elige sede, servicio y barbero." />
      </CoverHero>
    );
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(screen.getByRole("heading", { name: "Arma tu cita" })).toBeInTheDocument();
    expect(screen.getByText("Elige sede, servicio y barbero.")).toBeInTheDocument();
  });

  test("sin foto solo queda el espacio", () => {
    const { container } = render(
      <CoverHero>
        <CoverTitle title="Hola" />
      </CoverHero>
    );
    expect(container.querySelector("img")).toBeNull();
  });
});
