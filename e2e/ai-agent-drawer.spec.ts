import { expect, test } from "@playwright/test";

/**
 * El panel del Agente IA se apoya en dos cosas que ya se rompieron una vez:
 *
 * 1. `ai-mesh-agent` solo aporta los tintes, así que el panel tiene que poner
 *    su propia superficie. Cuando esa clase se llamaba `bg-ai-mesh-agent`,
 *    tailwind-merge la consideraba del mismo grupo que `bg-surface` y
 *    descartaba una de las dos: el panel quedaba transparente.
 * 2. El acabado premium pintaba su barniz con `background-image` sobre
 *    `.shadow-card`, y como el panel lleva las dos clases, se comía la malla.
 *
 * En los dos casos el síntoma era el mismo: en oscuro desaparecía la gradación
 * que sí se veía en claro. Esta prueba mira el resultado, no las clases.
 */
for (const mode of ["dark", "light"] as const) {
  test(`el panel del agente conserva superficie y gradación en ${mode}`, async ({ page }) => {
    await page.addInitScript((m) => {
      localStorage.setItem("thema-theme", JSON.stringify({ preset: "premium", mode: m, radius: "md", density: "normal" }));
    }, mode);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/docs#/components/ai-agent-drawer");
    await expect(page.getByRole("heading", { name: "AiAgentDrawer", level: 1 })).toBeVisible();
    await page.getByRole("button", { name: "Abrir Agente IA" }).first().click();

    const panel = page.locator(".ai-mesh-agent").first();
    await expect(panel).toBeVisible();
    const style = await panel.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.backgroundColor, image: cs.backgroundImage };
    });

    // Una superficie de verdad debajo (nunca transparente)…
    expect(style.color).not.toBe("rgba(0, 0, 0, 0)");
    expect(style.color).not.toBe("transparent");
    // …y los tres tintes de la malla encima.
    expect(style.image.match(/radial-gradient/g) ?? []).toHaveLength(3);
  });
}
