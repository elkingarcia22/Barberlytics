import { describe, expect, test } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test/render";
import { ThemeSelector } from "./ThemeSelector";
import { useForcedPreset } from "./useForcedPreset";

function Forced() {
  useForcedPreset("premium");
  return null;
}

describe("useForcedPreset", () => {
  test("aplica el preset forzado sin guardarlo y al desmontar vuelve el elegido", async () => {
    // Arrange
    const { rerender } = renderWithProviders(
      <>
        <ThemeSelector />
        <Forced />
      </>
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /cambiar tema/i }));
    await user.click(await screen.findByRole("radio", { name: /esmeralda/i }));

    // Assert: forzado en pantalla, pero lo guardado sigue siendo el elegido
    expect(document.documentElement.dataset.theme).toBe("premium");
    expect(JSON.parse(window.localStorage.getItem("thema-theme") ?? "{}")).toMatchObject({ preset: "emerald" });

    // Act
    rerender(<ThemeSelector />);

    // Assert
    expect(document.documentElement.dataset.theme).toBe("emerald");
  });
});
