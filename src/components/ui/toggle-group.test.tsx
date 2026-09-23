import type * as React from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

function renderGroup(props: React.ComponentProps<typeof ToggleGroup>) {
  return render(
    <ToggleGroup aria-label="Formato" {...props}>
      <ToggleGroupItem value="bold" aria-label="Negrita">
        B
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Cursiva">
        I
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Subrayado">
        U
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

describe("ToggleGroup", () => {
  test("en modo single solo queda un ítem activo y emite el nuevo valor", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderGroup({ type: "single", defaultValue: "bold", onValueChange });

    const bold = screen.getByRole("radio", { name: "Negrita" });
    const italic = screen.getByRole("radio", { name: "Cursiva" });
    expect(bold).toHaveAttribute("data-state", "on");
    expect(italic).toHaveAttribute("data-state", "off");

    await user.click(italic);

    expect(onValueChange).toHaveBeenCalledWith("italic");
    expect(italic).toHaveAttribute("data-state", "on");
    expect(bold).toHaveAttribute("data-state", "off");
  });

  test("en modo single, pulsar el ítem activo lo deselecciona y emite cadena vacía", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderGroup({ type: "single", defaultValue: "bold", onValueChange });

    await user.click(screen.getByRole("radio", { name: "Negrita" }));

    expect(onValueChange).toHaveBeenCalledWith("");
    expect(screen.getByRole("radio", { name: "Negrita" })).toHaveAttribute("data-state", "off");
  });

  test("en modo multiple acumula y quita valores sin afectar al resto", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderGroup({ type: "multiple", defaultValue: ["bold"], onValueChange });

    const bold = screen.getByRole("button", { name: "Negrita" });
    const italic = screen.getByRole("button", { name: "Cursiva" });

    await user.click(italic);
    expect(onValueChange).toHaveBeenLastCalledWith(["bold", "italic"]);
    expect(bold).toHaveAttribute("aria-pressed", "true");
    expect(italic).toHaveAttribute("aria-pressed", "true");

    await user.click(bold);
    expect(onValueChange).toHaveBeenLastCalledWith(["italic"]);
    expect(bold).toHaveAttribute("aria-pressed", "false");
    expect(italic).toHaveAttribute("aria-pressed", "true");
  });

  test("los ítems heredan variante y tamaño del grupo", () => {
    renderGroup({ type: "single", variant: "outline", size: "sm" });

    const item = screen.getByRole("radio", { name: "Negrita" });
    expect(item).toHaveAttribute("data-variant", "outline");
    expect(item).toHaveAttribute("data-size", "sm");
  });

  test("deshabilitado en el grupo, ningún ítem responde al clic", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderGroup({ type: "single", disabled: true, onValueChange });

    await user.click(screen.getByRole("radio", { name: "Cursiva" }));

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
