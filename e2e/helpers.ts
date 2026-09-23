import { expect, type Page } from "@playwright/test";

/** Cuenta de demostración del backend simulado; el celular se escribe sin prefijo (Colombia por defecto). */
export const ADMIN = { phone: "3001234567", password: "thema123" };

export async function login(page: Page, credentials = ADMIN) {
  await page.goto("/login");
  await page.getByTestId("login-phone").fill(credentials.phone);
  await page.getByTestId("login-password").fill(credentials.password);
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL(/\/dashboard/);
}
