import { expect, type Page } from "@playwright/test";

/** Cuenta de demostración del backend simulado; el celular se escribe sin prefijo (Colombia por defecto). */
export const ADMIN = { phone: "3001234567" };
/** El código por SMS del backend simulado es fijo. */
export const OTP_CODE = "246810";

export async function typeOtp(page: Page, code = OTP_CODE) {
  await page.getByLabel(/carácter 1 de 6/i).fill(code[0]);
  for (const digit of code.slice(1)) await page.keyboard.type(digit);
}

export async function login(page: Page, credentials = ADMIN) {
  await page.goto("/login");
  await page.getByTestId("login-phone").fill(credentials.phone);
  await page.getByTestId("login-submit").click();
  await typeOtp(page);
  await expect(page).toHaveURL(/\/metricas/);
}
