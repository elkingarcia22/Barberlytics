import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraduationCap, Grid2x2Plus } from "lucide-react";
import { TemplateTile } from "./TemplateTile";
import { templateThumbWeights, type TemplateDefinition } from "./templateTypes";

const PLANTILLA: TemplateDefinition = {
  id: "onboarding",
  label: "Onboarding",
  name: "Plan de onboarding",
  description: "Los primeros treinta días de quien entra.",
  meta: "4 elementos · Mes",
  icon: GraduationCap,
  tone: "brand",
  items: [
    { label: "Completar la ruta de inducción", weight: 40 },
    { label: "Cerrar la primera conversación", weight: 30 },
    { label: "Entregar el equipo y los accesos", weight: 20 },
    { label: "Firmar la documentación", weight: 10 },
  ],
};

describe("templateThumbWeights", () => {
  test("normaliza los pesos contra la línea que más pesa", () => {
    const weights = templateThumbWeights(
      [
        { label: "una", weight: 50 },
        { label: "otra", weight: 25 },
      ],
      3
    );
    expect(weights).toEqual([1, 0.5]);
  });

  test("recorta a las líneas que caben en la miniatura", () => {
    expect(templateThumbWeights(PLANTILLA.items, 3)).toHaveLength(3);
  });

  test("da a una línea liviana un mínimo visible en vez de dejarla en cero", () => {
    const [, ultima] = templateThumbWeights(
      [
        { label: "manda", weight: 100 },
        { label: "casi nada", weight: 1 },
      ],
      3
    );
    expect(ultima).toBeGreaterThan(0.2);
  });

  test("sin pesos reales, reparte el mínimo en vez de dividir por cero", () => {
    const weights = templateThumbWeights(
      [
        { label: "una", weight: 0 },
        { label: "otra", weight: 0 },
      ],
      3
    );
    expect(weights.every((weight) => weight > 0)).toBe(true);
  });

  test("sin líneas, no dibuja ninguna barra", () => {
    expect(templateThumbWeights([], 3)).toEqual([]);
  });
});

describe("TemplateTile", () => {
  test("compacta, muestra el nombre corto y la medida, y avisa al pulsarse", async () => {
    const onClick = vi.fn();
    render(<TemplateTile template={PLANTILLA} onClick={onClick} />);

    expect(screen.getByText("Onboarding")).toBeTruthy();
    expect(screen.getByText("4 elementos · Mes")).toBeTruthy();

    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("en tarjeta, muestra el nombre completo y para qué sirve", () => {
    render(<TemplateTile template={PLANTILLA} variant="card" onClick={() => {}} />);

    expect(screen.getByText("Plan de onboarding")).toBeTruthy();
    expect(screen.getByText("Los primeros treinta días de quien entra.")).toBeTruthy();
  });

  test("en fila, muestra el nombre completo junto a para qué sirve", () => {
    render(<TemplateTile template={PLANTILLA} variant="row" onClick={() => {}} />);

    expect(screen.getByText("Plan de onboarding")).toBeTruthy();
    expect(screen.getByText("4 elementos · Mes")).toBeTruthy();
  });

  test("lleva el nombre y la medida en el título nativo, con lo que la ficha recorta", () => {
    render(<TemplateTile template={PLANTILLA} onClick={() => {}} />);

    expect(screen.getByRole("button").getAttribute("title")).toBe(
      "Plan de onboarding · 4 elementos · Mes"
    );
  });

  test("punteada, no pinta el degradado del tono ni la insignia", () => {
    const verMas: TemplateDefinition = {
      ...PLANTILLA,
      id: "ver-mas",
      label: "Ver más plantillas",
      name: "Ver más plantillas",
      meta: "Todo el catálogo",
      icon: Grid2x2Plus,
      items: [],
    };
    const { container } = render(<TemplateTile template={verMas} dashed onClick={() => {}} />);

    const tile = screen.getByRole("button");
    expect(tile.style.backgroundImage).toBe("");
    // La insignia es el único círculo con anillo de la ficha.
    expect(container.querySelector(".ring-surface")).toBeNull();
  });

  test("con tono, pinta un degradado y expone el acento a las clases de hover", () => {
    render(<TemplateTile template={PLANTILLA} onClick={() => {}} />);

    const tile = screen.getByRole("button");
    expect(tile.style.backgroundImage).toContain("linear-gradient");
    expect(tile.style.getPropertyValue("--tone")).toBe("var(--color-brand)");
    expect(tile.className).toContain("magic-card-toned");
  });

  test("la tarjeta deja el degradado a su portada y no a la ficha", () => {
    render(<TemplateTile template={PLANTILLA} variant="card" onClick={() => {}} />);

    expect(screen.getByRole("button").style.backgroundImage).toBe("");
  });

  test("no escribe texto blanco sobre fondo de marca", () => {
    const { container } = render(<TemplateTile template={PLANTILLA} variant="card" onClick={() => {}} />);

    expect(container.querySelector(".text-white")).toBeNull();
  });
});
