import { expect, test } from "@playwright/test";
import { login } from "./helpers";

const RAIL = '[aria-label="Navegación compacta"]';

test.describe("Menú lateral", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    // El shell se contrae solo a los 2,2 s; esperamos a que el rail mande.
    await expect(page.locator(RAIL)).toBeVisible();
  });

  test("el rail no se mueve al abrir y cerrar el panel", async ({ page }) => {
    const rail = page.locator(RAIL);
    const antes = await rail.boundingBox();

    await rail.getByLabel("Expandir menú").click();
    await expect(page.getByRole("button", { name: "Contraer menú" })).toBeVisible();
    const durante = await rail.boundingBox();

    await page.getByRole("button", { name: "Contraer menú" }).click();
    await expect(rail.getByLabel("Expandir menú")).toBeVisible();
    const despues = await rail.boundingBox();

    // El rail conserva posición y ancho en los tres momentos: es lo que se
    // rompía cuando un único elemento animaba su ancho.
    expect(durante).toEqual(antes);
    expect(despues).toEqual(antes);
    expect(antes?.width).toBe(64);
  });

  test("el panel se despliega a 240px y empuja el contenido", async ({ page }) => {
    const panel = page.locator("aside");
    await expect(panel).toHaveCSS("width", "240px");

    // Colapsado: el panel está fuera salvo el ancho del rail.
    const spacer = page.locator("aside").locator("xpath=..");
    await expect(spacer).toHaveCSS("width", "64px");

    await page.locator(RAIL).getByLabel("Expandir menú").click();
    await expect(spacer).toHaveCSS("width", "240px");
    // Ya desplegado, el panel entra en su sitio.
    const caja = await panel.boundingBox();
    expect(caja?.x).toBeCloseTo(8, 0);
  });

  test("una sección con hijos se abre desde el rail", async ({ page }) => {
    // "Personas" es una hoja: navega directo.
    await page.locator(RAIL).getByLabel("Personas").click();
    await expect(page).toHaveURL(/\/usuarios/);
    // El rail sigue ahí y marca la sección activa.
    await expect(page.locator(RAIL).getByLabel("Personas")).toHaveAttribute("aria-current", "page");
  });

  test("el rail ofrece cada sección con su etiqueta accesible", async ({ page }) => {
    const rail = page.locator(RAIL);
    for (const etiqueta of ["Inicio", "Personas", "Sistema de diseño"]) {
      await expect(rail.getByLabel(etiqueta)).toBeVisible();
    }
    // Y el conmutador de modo y el feedback siguen alcanzables.
    await expect(rail.getByLabel("Workspace")).toBeVisible();
    await expect(rail.getByLabel("Agente IA")).toBeVisible();
    await expect(rail.getByLabel("Feedback")).toBeVisible();
  });
});
