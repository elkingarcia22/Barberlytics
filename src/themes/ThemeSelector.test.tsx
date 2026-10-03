import { describe, expect, test } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test/render";
import { ThemeSelector } from "./ThemeSelector";

describe("ThemeSelector", () => {
  test("aplicar un preset escribe data-theme y las variables en <html>", async () => {
    renderWithProviders(<ThemeSelector />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /cambiar tema/i }));
    await user.click(await screen.findByRole("radio", { name: /esmeralda/i }));
    expect(document.documentElement.dataset.theme).toBe("emerald");
    expect(document.documentElement.style.getPropertyValue("--color-brand")).toBe("#34D399");
    expect(JSON.parse(window.localStorage.getItem("thema-theme") ?? "{}")).toMatchObject({ preset: "emerald" });
  });

  test("el modo oscuro añade la clase dark", async () => {
    renderWithProviders(<ThemeSelector />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /cambiar tema/i }));
    await user.click(await screen.findByRole("radio", { name: /oscuro/i }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
