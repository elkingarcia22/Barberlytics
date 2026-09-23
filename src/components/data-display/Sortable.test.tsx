import * as React from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sortable } from "./Sortable";

/**
 * Reordenar las lecciones de un plan no puede depender del ratón: el arrastre
 * con teclado (Espacio levanta, flechas mueven, Espacio suelta) es la ruta
 * accesible y la que estas pruebas protegen.
 */
interface Lesson {
  id: string;
  label: string;
}

const LESSONS: Lesson[] = [
  { id: "1", label: "Lección 1" },
  { id: "2", label: "Lección 2" },
  { id: "3", label: "Lección 3" },
];

function Plan({ onReorder, ...rest }: { onReorder?: (items: Lesson[]) => void; handle?: boolean }) {
  const [items, setItems] = React.useState(LESSONS);
  return (
    <Sortable
      items={items}
      getId={(item) => item.id}
      onReorder={(next) => {
        setItems(next);
        onReorder?.(next);
      }}
      renderItem={(item) => <span>{item.label}</span>}
      {...rest}
    />
  );
}

const order = () => screen.getAllByRole("listitem").map((node) => node.textContent);

describe("Sortable", () => {
  test("mover con el teclado dispara onReorder con el nuevo orden", async () => {
    const user = userEvent.setup();
    const onReorder = vi.fn();
    render(<Plan onReorder={onReorder} />);

    await user.tab();
    const handle = screen.getByRole("button", { name: "Reordenar Lección 1" });
    expect(handle).toHaveFocus();

    // Espacio levanta; hasta entonces las flechas solo mueven el foco.
    await user.keyboard(" ");
    expect(handle).toHaveAttribute("aria-pressed", "true");

    await user.keyboard("{ArrowDown}");
    expect(onReorder).toHaveBeenCalledTimes(1);
    expect(onReorder.mock.lastCall?.[0].map((item: Lesson) => item.id)).toEqual(["2", "1", "3"]);
    expect(order()).toEqual(["Lección 2", "Lección 1", "Lección 3"]);

    await user.keyboard("{ArrowDown}");
    expect(order()).toEqual(["Lección 2", "Lección 3", "Lección 1"]);

    // Y suelta donde quedó.
    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: "Reordenar Lección 1" })).toHaveAttribute("aria-pressed", "false");
  });

  test("anuncia el movimiento en la región aria-live", async () => {
    const user = userEvent.setup();
    render(<Plan />);

    await user.tab();
    await user.keyboard(" {ArrowDown}");

    expect(screen.getByRole("status")).toHaveTextContent("Lección 1 movida a la posición 2 de 3");
  });

  test("Escape cancela y devuelve la lista al orden original", async () => {
    const user = userEvent.setup();
    render(<Plan />);

    await user.tab();
    await user.keyboard(" {ArrowDown}{ArrowDown}");
    expect(order()).toEqual(["Lección 2", "Lección 3", "Lección 1"]);

    await user.keyboard("{Escape}");
    expect(order()).toEqual(["Lección 1", "Lección 2", "Lección 3"]);
    expect(screen.getByRole("status")).toHaveTextContent("Movimiento cancelado");
  });

  test("sin nada levantado las flechas solo cambian el foco", async () => {
    const user = userEvent.setup();
    const onReorder = vi.fn();
    render(<Plan onReorder={onReorder} />);

    await user.tab();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("button", { name: "Reordenar Lección 2" })).toHaveFocus();
    expect(onReorder).not.toHaveBeenCalled();
  });

  test("sin agarre la fila entera es el control reordenable", async () => {
    const user = userEvent.setup();
    render(<Plan handle={false} />);

    await user.tab();
    const row = screen.getByRole("listitem", { name: "Lección 1" });
    expect(row).toHaveFocus();

    await user.keyboard(" {ArrowDown}");
    expect(order()).toEqual(["Lección 2", "Lección 1", "Lección 3"]);
  });
});
