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

describe("Personalizado", () => {
  test("elegirlo abre el editor y un HEX nuevo recolorea la app y se guarda", async () => {
    renderWithProviders(<ThemeSelector />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /cambiar tema/i }));
    await user.click(await screen.findByRole("radio", { name: "Personalizado" }));
    expect(document.documentElement.dataset.theme).toBe("custom");

    const hex = screen.getByRole("textbox", { name: "Color primario: código HEX" });
    await user.clear(hex);
    await user.type(hex, "#1F7A5A{Enter}");
    expect(document.documentElement.style.getPropertyValue("--color-brand")).toMatch(/^#[0-9A-F]{6}$/);
    expect(JSON.parse(window.localStorage.getItem("thema-theme") ?? "{}")).toMatchObject({
      preset: "custom",
      custom: { primary: "#1F7A5A" },
    });
  });
});

describe("Personalizado sin logo propio", () => {
  test("propone los colores del logo por defecto y «Usarlos» los aplica", async () => {
    const { ThemeSelectorPanel } = await import("./ThemeSelector");
    renderWithProviders(<ThemeSelectorPanel advanced={false} defaultLogo={{ colors: ["#D9B36A", "#6B4312"] }} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("radio", { name: "Personalizado" }));
    expect(screen.getByText("Los de Barberlytics, tu logo por defecto, con su IA.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /usarlos/i }));
    const stored = JSON.parse(window.localStorage.getItem("thema-theme") ?? "{}");
    expect(stored).toMatchObject({ custom: { primary: "#D9B36A", secondary: "#6B4312" } });
    expect(stored.custom.ai.start).toMatch(/^#[0-9A-F]{6}$/);
  });

  test("la IA se puede elegir a mano y volver a automático", async () => {
    const { ThemeSelectorPanel } = await import("./ThemeSelector");
    renderWithProviders(<ThemeSelectorPanel advanced={false} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("radio", { name: "Personalizado" }));
    await user.click(screen.getByRole("radio", { name: /^IA$/ }));
    const aiStart = () => document.documentElement.style.getPropertyValue("--color-ai-gradient-start");
    const before = aiStart();
    const hex = screen.getByRole("textbox", { name: "Inicio del degradado de IA: código HEX" });
    await user.clear(hex);
    await user.type(hex, "#7C3AED{Enter}");
    const read = () => JSON.parse(window.localStorage.getItem("thema-theme") ?? "{}").custom;
    expect(read().ai.start).toBe("#7C3AED");
    // El tema se rehace con la IA nueva: no basta con guardarla.
    expect(aiStart()).not.toBe(before);

    await user.click(screen.getByRole("button", { name: "Automático" }));
    expect(read().ai).toBeUndefined();
  });
});
