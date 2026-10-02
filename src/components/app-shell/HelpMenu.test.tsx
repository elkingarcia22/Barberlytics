import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookOpen, ListChecks, Sparkles } from "lucide-react";
import { HelpMenu, type ShellHelpAction } from "./HelpMenu";

const actions = (spies: Record<string, () => void>): ShellHelpAction[] => [
  { id: "ask", label: "Pregúntame", description: "Escribe tu duda.", icon: Sparkles, tone: "ai", onSelect: spies.ask },
  { id: "center", label: "Ir al centro de ayuda", icon: BookOpen, onSelect: spies.center },
  { id: "guide", label: "Guíame paso a paso", icon: ListChecks, onSelect: spies.guide },
];

describe("HelpMenu", () => {
  test("el botón abre un menú con las tres puertas, con su descripción", async () => {
    const user = userEvent.setup();
    render(<HelpMenu label="Ayuda" actions={actions({ ask: vi.fn(), center: vi.fn(), guide: vi.fn() })} />);

    await user.click(screen.getByRole("button", { name: "Ayuda" }));

    expect(screen.getByRole("menuitem", { name: /Pregúntame/ })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Ir al centro de ayuda/ })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Guíame paso a paso/ })).toBeTruthy();
    expect(screen.getByText("Escribe tu duda.")).toBeTruthy();
  });

  test("elegir una opción ejecuta solo la suya y cierra el menú", async () => {
    const user = userEvent.setup();
    const spies = { ask: vi.fn(), center: vi.fn(), guide: vi.fn() };
    render(<HelpMenu label="Ayuda" actions={actions(spies)} />);

    await user.click(screen.getByRole("button", { name: "Ayuda" }));
    await user.click(screen.getByRole("menuitem", { name: /Guíame paso a paso/ }));

    expect(spies.guide).toHaveBeenCalledTimes(1);
    expect(spies.ask).not.toHaveBeenCalled();
    expect(screen.queryByRole("menuitem", { name: /Pregúntame/ })).toBeNull();
  });
});
