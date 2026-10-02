import { expect, type Page } from "@playwright/test";
import { campaignKey } from "../src/components/feedback-loop/campaignMemory";
import { ACTIVE_CAMPAIGN_DEFINITION } from "../src/features/feedback/campaignRegistry";

/** Cuenta de demostración del backend simulado; el celular se escribe sin prefijo (Colombia por defecto). */
export const ADMIN = { phone: "3001234567" };
/** El código por SMS del backend simulado es fijo. */
export const OTP_CODE = "246810";

export async function typeOtp(page: Page, code = OTP_CODE) {
  await page.getByLabel(/carácter 1 de 6/i).fill(code[0]);
  for (const digit of code.slice(1)) await page.keyboard.type(digit);
}

/**
 * Deja el recorrido de la campaña de feedback como ya visto. Sale solo la
 * primera vez que alguien entra y tapa la pantalla con una capa que intercepta
 * los clics: en una prueba que no trata de él solo estorba.
 */
export async function skipFeedbackTour(page: Page) {
  if (!ACTIVE_CAMPAIGN_DEFINITION) return;
  await page.addInitScript((key) => window.localStorage.setItem(key, "1"), campaignKey(ACTIVE_CAMPAIGN_DEFINITION.id, "tour"));
}

export async function login(page: Page, credentials = ADMIN) {
  await skipFeedbackTour(page);
  await page.goto("/login");
  await page.getByTestId("login-phone").fill(credentials.phone);
  await page.getByTestId("login-submit").click();
  await typeOtp(page);
  await expect(page).toHaveURL(/\/metricas/);
}
