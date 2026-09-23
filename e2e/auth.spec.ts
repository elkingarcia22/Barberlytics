import { expect, test } from "@playwright/test";
import { ADMIN, login } from "./helpers";

test.describe("Autenticación", () => {
  test("una ruta protegida redirige a /login y recuerda a dónde iba", async ({ page }) => {
    await page.goto("/usuarios");
    await expect(page).toHaveURL(/\/login/);
    await page.getByTestId("login-phone").fill(ADMIN.phone);
    await page.getByTestId("login-password").fill(ADMIN.password);
    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL(/\/usuarios/);
  });

  test("credenciales incorrectas muestran un error legible", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-phone").fill(ADMIN.phone);
    await page.getByTestId("login-password").fill("incorrecta");
    await page.getByTestId("login-submit").click();
    await expect(page.getByRole("alert")).toContainText(/incorrectos/i);
    await expect(page).toHaveURL(/\/login/);
  });

  test("entrar con Google abre la sesión de la cuenta vinculada", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-google").click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("recuperar el acceso por SMS cambia la contraseña y deja entrar", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /olvidaste tu contraseña/i }).click();
    await page.getByTestId("recovery-phone").fill(ADMIN.phone);
    await page.getByTestId("recovery-send").click();
    await page.getByLabel(/carácter 1 de 6/i).fill("2");
    for (const digit of ["4", "6", "8", "1", "0"]) await page.keyboard.type(digit);
    await page.getByTestId("recovery-verify").click();
    await page.getByTestId("recovery-password").fill("clave-nueva");
    await page.getByTestId("recovery-confirm").fill("clave-nueva");
    await page.getByTestId("recovery-save").click();
    await page.getByRole("button", { name: /volver a iniciar sesión/i }).click();
    await login(page, { phone: ADMIN.phone, password: "clave-nueva" });
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
