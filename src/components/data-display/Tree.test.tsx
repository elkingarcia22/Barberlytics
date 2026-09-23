import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tree, type TreeNode } from "./Tree";

/**
 * El árbol se usa para elegir audiencias (empresa → áreas → equipos), así que
 * el teclado y el estado indeterminado no son adornos: son la forma de
 * seleccionar un área entera sin abrirla.
 */
const NODES: TreeNode[] = [
  {
    id: "acme",
    label: "Acme",
    children: [
      {
        id: "tecnologia",
        label: "Tecnología",
        children: [
          { id: "frontend", label: "Frontend", count: 8 },
          { id: "backend", label: "Backend", count: 12 },
        ],
      },
      { id: "personas", label: "Personas", count: 4 },
    ],
  },
];

const items = () => screen.getAllByRole("treeitem");
const item = (name: string) => screen.getByRole("treeitem", { name: new RegExp(name) });

describe("Tree", () => {
  test("se expande y se recorre con el teclado", async () => {
    const user = userEvent.setup();
    render(<Tree nodes={NODES} />);

    // Cerrado: solo la raíz es visible.
    expect(items()).toHaveLength(1);

    await user.tab();
    expect(item("Acme")).toHaveFocus();

    // → abre el nodo, → otra vez baja al primer hijo.
    await user.keyboard("{ArrowRight}");
    expect(item("Acme")).toHaveAttribute("aria-expanded", "true");
    expect(items()).toHaveLength(3);

    await user.keyboard("{ArrowRight}");
    expect(item("Tecnología")).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(item("Personas")).toHaveFocus();

    await user.keyboard("{Home}");
    expect(item("Acme")).toHaveFocus();

    await user.keyboard("{End}");
    expect(item("Personas")).toHaveFocus();

    // ← sin hijos abiertos sube al padre; ← otra vez lo cierra.
    await user.keyboard("{ArrowLeft}");
    expect(item("Acme")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(item("Acme")).toHaveAttribute("aria-expanded", "false");
    expect(items()).toHaveLength(1);
  });

  test("aria-level refleja la profundidad real de cada nodo", () => {
    render(<Tree nodes={NODES} defaultExpandedIds={["acme", "tecnologia"]} />);

    expect(item("Acme")).toHaveAttribute("aria-level", "1");
    expect(item("Tecnología")).toHaveAttribute("aria-level", "2");
    expect(item("Frontend")).toHaveAttribute("aria-level", "3");
    expect(screen.getAllByRole("group")).toHaveLength(2);
  });

  test("la selección múltiple propaga a hijos y deja al padre indeterminado", async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(
      <Tree
        nodes={NODES}
        selectable="multiple"
        defaultExpandedIds={["acme", "tecnologia"]}
        onSelectedChange={onSelectedChange}
      />
    );

    // Marcar «Tecnología» marca sus dos hijos y deja «Acme» a medias.
    await user.click(screen.getByRole("checkbox", { name: "Tecnología" }));
    expect(onSelectedChange).toHaveBeenLastCalledWith(expect.arrayContaining(["tecnologia", "frontend", "backend"]));
    expect(onSelectedChange.mock.lastCall?.[0]).not.toContain("acme");

    expect(screen.getByRole("checkbox", { name: "Frontend" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Acme" })).toHaveAttribute("data-state", "indeterminate");
    expect(item("Acme")).toHaveAttribute("aria-selected", "false");

    // Al completar la otra rama el padre pasa a marcado.
    await user.click(screen.getByRole("checkbox", { name: "Personas" }));
    expect(screen.getByRole("checkbox", { name: "Acme" })).toBeChecked();
    expect(item("Acme")).toHaveAttribute("aria-selected", "true");

    // Y desmarcar un nieto lo devuelve a indeterminado.
    await user.click(screen.getByRole("checkbox", { name: "Backend" }));
    expect(screen.getByRole("checkbox", { name: "Acme" })).toHaveAttribute("data-state", "indeterminate");
  });

  test("Espacio selecciona el nodo enfocado", async () => {
    const user = userEvent.setup();
    render(<Tree nodes={NODES} selectable="single" defaultExpandedIds={["acme"]} />);

    await user.tab();
    await user.keyboard("{ArrowDown} ");
    expect(item("Tecnología")).toHaveAttribute("aria-selected", "true");
    expect(item("Acme")).toHaveAttribute("aria-selected", "false");
  });

  test("muestra el texto vacío cuando no hay nodos", () => {
    render(<Tree nodes={[]} emptyLabel="Sin áreas" />);
    expect(screen.getByText("Sin áreas")).toBeInTheDocument();
  });
});
