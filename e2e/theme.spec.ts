import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("el tema elegido sobrevive a una recarga", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Cambiar tema" }).click();
  await page.getByRole("radio", { name: /Esmeralda/ }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "emerald");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "emerald");
});
