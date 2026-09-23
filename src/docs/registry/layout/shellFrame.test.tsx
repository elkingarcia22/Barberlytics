import { describe, expect, test } from "vitest";
import { Home } from "lucide-react";
import { renderWithProviders, screen } from "@/test/render";
import { AppSidebar } from "@/components/app-shell/AppSidebar";
import { ShellConfigContext, resolveShellConfig } from "@/components/app-shell";
import { ShellFrame } from "./layoutDemo";

/**
 * Regresión: desde que la documentación monta el shell del producto, un
 * `AppSidebar` de demostración heredaba por contexto la configuración de la
 * doc y pintaba su navegación —Fundamentos, Primitivos…— en vez de los datos
 * de ejemplo que viene a demostrar. `ShellFrame` provee la suya para que la
 * demo no dependa de quién la hospede.
 */
describe("ShellFrame", () => {
  const sidebar = (
    <AppSidebar
      collapsed={false}
      mobileOpen={false}
      mode="workspace"
      onModeChange={() => {}}
      onCloseMobile={() => {}}
      onToggleCollapse={() => {}}
      onOpenFeedback={() => {}}
    />
  );

  test("aísla la demo de la configuración que la rodea", () => {
    const fuera = resolveShellConfig({
      navigation: [{ kind: "item", id: "docs", label: "Documentación", icon: Home }],
    });
    renderWithProviders(
      <ShellConfigContext.Provider value={fuera}>
        <ShellFrame>{sidebar}</ShellFrame>
      </ShellConfigContext.Provider>
    );
    // Los datos de ejemplo del shell…
    expect(screen.getByText("Aprendizaje")).toBeTruthy();
    // …y nada de la configuración de fuera.
    expect(screen.queryByText("Documentación")).toBeNull();
  });

  test("la demo puede cambiar lo que necesite sin perder el resto", () => {
    renderWithProviders(
      <ShellFrame config={{ brand: { productName: "Demo" } }}>{sidebar}</ShellFrame>
    );
    expect(screen.getByText("Aprendizaje")).toBeTruthy();
  });
});
