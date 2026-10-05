import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { RowContextMenu } from "./RowContextMenu";

describe("RowContextMenu", () => {
  test("el clic derecho abre las acciones de la fila y elegir una la ejecuta", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <RowContextMenu
        rowLabel="Plan 2026"
        onOpenChange={onOpenChange}
        actions={[
          { id: "edit", label: "Editar", onSelect: onEdit },
          { id: "delete", label: "Eliminar", tone: "danger" },
          { id: "archive", label: "Archivar", blockedReason: "Ya está archivado" },
        ]}
      >
        <div>Fila</div>
      </RowContextMenu>
    );
    fireEvent.contextMenu(screen.getByText("Fila"));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(await screen.findByText("Plan 2026")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Archivar" })).toHaveAttribute("data-disabled");
    // Lo destructivo va al final, después de lo demás.
    const items = screen.getAllByRole("menuitem").map((item) => item.textContent);
    expect(items[items.length - 1]).toBe("Eliminar");
    await user.click(screen.getByRole("menuitem", { name: "Editar" }));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  test("sin acciones no envuelve nada", () => {
    render(
      <RowContextMenu actions={[]}>
        <div>Fila</div>
      </RowContextMenu>
    );
    fireEvent.contextMenu(screen.getByText("Fila"));
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
