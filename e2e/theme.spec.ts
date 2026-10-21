import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("el tema elegido sobrevive a una recarga", async ({ page }) => {
  await login(page);
  // El selector de tema vive en el panel de «Personalización», que se abre desde
  // el menú de la marca. Lo elegido es una vista previa hasta pulsar Guardar.
  await page.getByTestId("workspace-menu-trigger").click();
  await page.getByTestId("personalization-switch").click();
  await page.getByRole("radio", { name: /Esmeralda/ }).click();
  await page.getByTestId("personalization-save").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "emerald");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "emerald");
});
