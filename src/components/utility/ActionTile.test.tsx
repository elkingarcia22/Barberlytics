import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActionTile } from "./ActionTile";

describe("ActionTile", () => {
  test("es un botón con su título y su pista, y avisa al pulsarlo", async () => {
    const onClick = vi.fn();
    render(<ActionTile title="Agregar otra cita" description="Para ti otro día" onClick={onClick} />);
    const tile = screen.getByRole("button", { name: /Agregar otra cita/ });
    expect(tile).toHaveTextContent("Para ti otro día");
    await userEvent.click(tile);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("con href es un enlace", () => {
    render(<ActionTile title="Llamar" href="tel:+16175550100" />);
    expect(screen.getByRole("link", { name: "Llamar" })).toHaveAttribute("href", "tel:+16175550100");
  });

  test("apilada no lleva flecha y deshabilitada no responde", async () => {
    const onClick = vi.fn();
    const { container } = render(<ActionTile title="Enviar recibo" layout="stacked" disabled onClick={onClick} />);
    expect(container.querySelector("svg")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Enviar recibo" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
