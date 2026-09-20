import { expect, type Page } from "@playwright/test";

export const ADMIN = { email: "admin@thema.dev", password: "thema123" };

export async function login(page: Page, credentials = ADMIN) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(credentials.email);
  await page.getByTestId("login-password").fill(credentials.password);
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL(/\/dashboard/);
}
