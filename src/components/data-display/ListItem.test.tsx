import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { ListItem, ListItemGroup } from "./ListItem";

/** Las clases del contenedor de la fila, que es quien lleva fondo y borde. */
function rowClasses(title: string): string {
  return screen.getByText(title).closest("[data-slot='list-item']")?.className ?? "";
}

describe("ListItemGroup", () => {
  test("dentro del grupo cada fila es su propia tarjeta", () => {
    render(
      <ListItemGroup>
        <ListItem title="Plan trimestral" />
      </ListItemGroup>
    );
    const classes = rowClasses("Plan trimestral");
    expect(classes).toContain("rounded-xl");
    expect(classes).toContain("border-border/60");
    expect(classes).toContain("bg-surface");
  });

  test("el grupo no pone padding lateral: las tarjetas llegan al borde del contenedor", () => {
    render(
      <ListItemGroup data-testid="grupo">
        <ListItem title="Plan trimestral" />
      </ListItemGroup>
    );
    const classes = screen.getByTestId("grupo").className;
    expect(classes).not.toMatch(/\bp-card\b|\bpx-/);
  });

  test("las filas son una lista accesible", () => {
    render(
      <ListItemGroup>
        <ListItem title="Uno" />
        <ListItem title="Dos" />
      </ListItemGroup>
    );
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  test("fuera de un grupo la fila no es listitem ni lleva borde propio", () => {
    render(<ListItem title="Suelta" />);
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    const classes = rowClasses("Suelta");
    expect(classes).toContain("bg-surface");
    expect(classes).not.toContain("rounded-xl");
  });
});
