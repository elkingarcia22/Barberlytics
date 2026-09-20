import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("Personas", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/usuarios");
  });

  test("lista paginada con búsqueda sincronizada en la URL", async ({ page }) => {
    await expect(page.getByTestId("users-table")).toBeVisible();
    await expect(page.getByTestId("users-total")).toContainText(/\d+ personas/);
    await page.getByTestId("users-search").fill("Ventas");
    await expect(page).toHaveURL(/search=Ventas/);
    await expect(page.getByTestId("users-table")).toContainText("Ventas");
  });

  test("crear una persona la muestra en la lista", async ({ page }) => {
    await page.goto("/usuarios?sort=-createdAt");
    await page.getByTestId("users-new").click();
    await page.getByTestId("user-form-name").fill("Prueba Automática");
    await page.getByTestId("user-form-email").fill("prueba.automatica@empresa.com");
    await page.getByTestId("user-form-area").click();
    await page.getByRole("option", { name: "Producto" }).click();
    await page.getByTestId("user-form-submit").click();
    await expect(page.getByTestId("user-form-submit")).toBeHidden();
    await expect(page.getByTestId("users-table")).toContainText("Prueba Automática");
  });

  test("la validación del cliente detiene un formulario incompleto", async ({ page }) => {
    await page.getByTestId("users-new").click();
    await page.getByTestId("user-form-submit").click();
    await expect(page.getByText(/al menos 3 caracteres/)).toBeVisible();
    await expect(page.getByText(/área es obligatoria/)).toBeVisible();
  });

  test("el servidor rechaza un correo duplicado y el formulario lo marca", async ({ page }) => {
    await page.getByTestId("users-new").click();
    await page.getByTestId("user-form-name").fill("Persona Repetida");
    const firstEmail = await page.getByTestId("users-table").locator("[data-user-email]").first().getAttribute("data-user-email");
    await page.getByTestId("user-form-email").fill(firstEmail ?? "");
    await page.getByTestId("user-form-area").click();
    await page.getByRole("option", { name: "Ventas" }).click();
    await page.getByTestId("user-form-submit").click();
    await expect(page.getByText(/ya existe una persona/i)).toBeVisible();
  });
});
