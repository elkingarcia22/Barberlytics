import { expect, test } from "@playwright/test";
import { ADMIN, login } from "./helpers";

test.describe("Autenticación", () => {
  test("una ruta protegida redirige a /login y recuerda a dónde iba", async ({ page }) => {
    await page.goto("/usuarios");
    await expect(page).toHaveURL(/\/login/);
    await page.getByTestId("login-email").fill(ADMIN.email);
    await page.getByTestId("login-password").fill(ADMIN.password);
    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL(/\/usuarios/);
  });

  test("credenciales incorrectas muestran un error legible", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill(ADMIN.email);
    await page.getByTestId("login-password").fill("incorrecta");
    await page.getByTestId("login-submit").click();
    await expect(page.getByRole("alert")).toContainText(/incorrectos/i);
    await expect(page).toHaveURL(/\/login/);
  });

  test("cerrar sesión vuelve al login y limpia la sesión", async ({ page }) => {
    await login(page);
    await page.getByTestId("shell-avatar").click();
    await page.getByTestId("shell-logout").click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
