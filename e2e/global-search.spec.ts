import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/**
 * La búsqueda general vive en la cabecera del shell, así que es la misma en
 * la aplicación y en la documentación; lo único que cambia es el índice que
 * cada una le pasa. Aquí se comprueba el lado de la aplicación: sus
 * registros, sus destinos y la pregunta al agente.
 *
 * Los registros de la aplicación son los artículos del centro de ayuda. En
 * e2e ese contenido no viene del sitio publicado sino de
 * `e2e/fixtures/help/index.json` (ver `VITE_HELP_BASE_URL` en
 * `playwright.config.ts`), así que los títulos de aquí son los de ese archivo.
 */
test.describe("búsqueda general en la aplicación", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    await login(page);
    await page.getByRole("button", { name: /Buscar o preguntar/i }).click();
    await expect(page.getByPlaceholder("Buscar o preguntar")).toBeVisible();
  });

  test("encuentra registros y destinos, y los separa en grupos", async ({ page }) => {
    await page.getByPlaceholder("Buscar o preguntar").fill("agenda");
    await expect(page.getByRole("option", { name: /Agendar una cita/ })).toBeVisible();
    await expect(page.getByRole("option", { name: /Añadir un barbero a la agenda/ })).toBeVisible();

    await page.getByPlaceholder("Buscar o preguntar").fill("clientes");
    await expect(page.getByRole("option", { name: /Clientes/ })).toBeVisible();
  });

  test("busca sin tildes y acota por pestaña", async ({ page }) => {
    await page.getByPlaceholder("Buscar o preguntar").fill("anadir");
    await expect(page.getByRole("option", { name: /Añadir un barbero/ })).toBeVisible();

    await page.getByRole("tab", { name: "Ir a" }).click();
    await expect(page.getByRole("option", { name: /Añadir un barbero/ })).toHaveCount(0);
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
    // Por texto y no por nombre accesible: el rail compacto tiene un botón con
    // la misma etiqueta, y con el menú contraído los dos existen a la vez.
    await expect(page.locator("button", { hasText: /^Agente IA$/ })).toHaveClass(/font-semibold/);
  });

  test("⌘K la abre desde cualquier parte", async ({ page }) => {
    await page.keyboard.press("Escape");
    await expect(page.getByPlaceholder("Buscar o preguntar")).toHaveCount(0);
    await page.locator("body").press("ControlOrMeta+k");
    await expect(page.getByPlaceholder("Buscar o preguntar")).toBeVisible();
  });
});
