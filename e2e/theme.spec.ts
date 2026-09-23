import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("el tema elegido sobrevive a una recarga", async ({ page }) => {
  await login(page);
  // El selector de tema cuelga de «Personalización», dentro del menú de la
  // marca (junto a los ajustes), no de la cabecera: hay que abrirlos los dos.
  await page.getByTestId("workspace-menu-trigger").click();
  await page.getByTestId("personalization-switch").click();
  await page.getByRole("radio", { name: /Esmeralda/ }).click();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "emerald");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "emerald");
});
