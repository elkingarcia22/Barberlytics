import { expect, test } from "@playwright/test";
import { ADMIN, login, typeOtp } from "./helpers";

test.describe("Autenticación", () => {
  test("una ruta protegida redirige a /login y recuerda a dónde iba", async ({ page }) => {
    await page.goto("/usuarios");
    await expect(page).toHaveURL(/\/login/);
    await page.getByTestId("login-phone").fill(ADMIN.phone);
    await page.getByTestId("login-submit").click();
    await typeOtp(page);
    await expect(page).toHaveURL(/\/usuarios/);
  });

  test("un celular incompleto no pide el código y dice cuántos dígitos faltan", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-phone").fill("30012");
    await page.getByTestId("login-submit").click();
    await expect(page.getByText(/faltan 5/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("un código incorrecto muestra un error legible", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-phone").fill(ADMIN.phone);
    await page.getByTestId("login-submit").click();
    await typeOtp(page, "000000");
    await expect(page.getByRole("alert")).toContainText(/no es correcto/i);
    await expect(page).toHaveURL(/\/login/);
  });

  test("entrar con Google abre la sesión de la cuenta vinculada", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-google").click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("olvidé mi número pide el correo y confirma el envío", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /olvidaste tu número/i }).click();
    await page.getByTestId("recovery-email").fill("admin@thema.dev");
    await page.getByTestId("recovery-send").click();
    await expect(page.getByRole("heading", { name: /revisa tu correo/i })).toBeVisible();
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
