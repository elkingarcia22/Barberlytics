import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/**
 * La búsqueda general vive en la cabecera del shell, así que es la misma en
 * la aplicación y en la documentación; lo único que cambia es el índice que
 * cada una le pasa. Aquí se comprueba el lado de la aplicación: sus
 * registros, sus destinos y la pregunta al agente.
 */
test.describe("búsqueda general en la aplicación", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    await login(page);
    await page.getByRole("button", { name: /Buscar o preguntar/i }).click();
    await expect(page.getByPlaceholder("Buscar o preguntar")).toBeVisible();
  });

  test("encuentra registros y destinos, y los separa en grupos", async ({ page }) => {
    await page.getByPlaceholder("Buscar o preguntar").fill("analista");
    await expect(page.getByRole("option", { name: /Analista de datos, vacante/ })).toBeVisible();
    await expect(page.getByRole("option", { name: /Andrés Malo, candidato/ })).toBeVisible();

    await page.getByPlaceholder("Buscar o preguntar").fill("clientes");
    await expect(page.getByRole("option", { name: /Clientes/ })).toBeVisible();
  });

  test("busca sin tildes y acota por pestaña", async ({ page }) => {
    await page.getByPlaceholder("Buscar o preguntar").fill("andres");
    await expect(page.getByRole("option", { name: /Andrés Malo/ })).toBeVisible();

    await page.getByRole("tab", { name: "Ir a" }).click();
    await expect(page.getByRole("option", { name: /Andrés Malo/ })).toHaveCount(0);
  });

  test("un destino navega de verdad", async ({ page }) => {
    await page.getByPlaceholder("Buscar o preguntar").fill("clientes");
    await page.getByRole("option", { name: /Clientes/ }).first().click();
    await expect(page).toHaveURL(/\/clientes/);
    await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
  });

  /**
   * La configuración salió del menú lateral: si tampoco estuviera aquí, un
   * ajuste que se toca una vez al año no tendría por dónde encontrarse.
   */
  test("un ajuste se encuentra aunque no esté en el menú", async ({ page }) => {
    await page.getByPlaceholder("Buscar o preguntar").fill("propinas");
    await page.getByRole("option", { name: /Propinas/ }).first().click();
    await expect(page).toHaveURL(/\/configuracion\/propinas/);
  });

  test("preguntar abre el panel del agente con la pregunta", async ({ page }) => {
    await page.getByPlaceholder("Buscar o preguntar").fill("¿cuántas vacantes están abiertas?");
    const ask = page.getByRole("option", { name: /Preguntar al agente/ });
    await expect(ask).toBeVisible();
    await ask.click();
    // El shell cambia al modo agente: su conmutador queda en "Agente IA".
    await expect(page.getByRole("button", { name: "Agente IA" })).toHaveClass(/font-semibold/);
  });

  test("⌘K la abre desde cualquier parte", async ({ page }) => {
    await page.keyboard.press("Escape");
    await expect(page.getByPlaceholder("Buscar o preguntar")).toHaveCount(0);
    await page.locator("body").press("ControlOrMeta+k");
    await expect(page.getByPlaceholder("Buscar o preguntar")).toBeVisible();
  });
});
