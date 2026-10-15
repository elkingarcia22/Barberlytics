import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectMark } from "./SelectMark";
import { SelectableRow } from "./SelectableRow";

describe("SelectMark", () => {
  test("es decorativa y refleja la forma y el estado", () => {
    const { container, rerender } = render(<SelectMark kind="checkbox" />);
    const mark = container.querySelector('[data-slot="select-mark"]');
    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(mark).toHaveAttribute("data-kind", "checkbox");
    expect(mark).not.toHaveAttribute("data-checked");
    rerender(<SelectMark kind="radio" checked />);
    expect(container.querySelector('[data-slot="select-mark"]')).toHaveAttribute("data-checked", "true");
  });
});

describe("SelectableRow", () => {
  test("lleva el rol y el estado, y elegir avisa", async () => {
    const onClick = vi.fn();
    render(
      <SelectableRow role="radio" checked label="Massachusetts, 88 Newbury St" onClick={onClick}>
        Massachusetts
      </SelectableRow>
    );
    const row = screen.getByRole("radio", { name: "Massachusetts, 88 Newbury St" });
    expect(row).toHaveAttribute("aria-checked", "true");
    await userEvent.click(row);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("con acción, el enlace es un botón aparte y no elige la fila", async () => {
    const onClick = vi.fn();
    const onAction = vi.fn();
    render(
      <SelectableRow role="checkbox" checked={false} label="Fade" onClick={onClick} action={{ label: "Ver detalle", ariaLabel: "Ver detalle: Fade", onClick: onAction }}>
        Fade
      </SelectableRow>
    );
    await userEvent.click(screen.getByRole("button", { name: "Ver detalle: Fade" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  test("deshabilitada no se elige", async () => {
    const onClick = vi.fn();
    render(
      <SelectableRow role="radio" checked={false} label="Cerrada" onClick={onClick} disabled>
        Cerrada
      </SelectableRow>
    );
    await userEvent.click(screen.getByRole("radio", { name: "Cerrada" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
