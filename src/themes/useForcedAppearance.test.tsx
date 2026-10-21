import { describe, expect, test } from "vitest";
import { render } from "@testing-library/react";
import { ThemeProvider } from "./ThemeProvider";
import { useForcedAppearance } from "./useForcedPreset";
import type { ThemeOverride } from "./ThemeProvider";

function Forced({ override }: { override: ThemeOverride | null }) {
  useForcedAppearance(override);
  return null;
}

describe("useForcedAppearance", () => {
  test("fuerza preset, colores y modo sin guardarlos, y al desmontar vuelve lo elegido", () => {
    window.localStorage.setItem("thema-theme", JSON.stringify({ preset: "premium", mode: "dark", radius: "md", density: "normal" }));
    const { rerender } = render(
      <ThemeProvider>
        <Forced override={{ preset: "custom", custom: { primary: "#C8102E", secondary: "#0B3D91" }, mode: "light" }} />
      </ThemeProvider>
    );
    const html = document.documentElement;
    expect(html.dataset.theme).toBe("custom");
    expect(html.classList.contains("dark")).toBe(false);
    expect(JSON.parse(window.localStorage.getItem("thema-theme") ?? "{}")).toMatchObject({ preset: "premium", mode: "dark" });

    rerender(<ThemeProvider>{null}</ThemeProvider>);
    expect(html.dataset.theme).toBe("premium");
    expect(html.classList.contains("dark")).toBe(true);
  });
});
