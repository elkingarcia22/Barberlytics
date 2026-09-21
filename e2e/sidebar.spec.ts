import { expect, test } from "@playwright/test";
import { login } from "./helpers";

const RAIL = '[aria-label="Navegación compacta"]';

test.describe("Menú lateral", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    // El shell se contrae solo a los 2,2 s; esperamos a que el rail mande.
    await expect(page.locator(RAIL)).toBeVisible();
  });

  test("el rail no se mueve al abrir y cerrar el panel", async ({ page }) => {
    const rail = page.locator(RAIL);
    const antes = await rail.boundingBox();

    await rail.getByLabel("Expandir menú").click();
    await expect(page.getByRole("button", { name: "Contraer menú" })).toBeVisible();
    const durante = await rail.boundingBox();

    await page.getByRole("button", { name: "Contraer menú" }).click();
    await expect(rail.getByLabel("Expandir menú")).toBeVisible();
    const despues = await rail.boundingBox();

    // El rail conserva posición y ancho en los tres momentos: es lo que se
    // rompía cuando un único elemento animaba su ancho.
    expect(durante).toEqual(antes);
    expect(despues).toEqual(antes);
    expect(antes?.width).toBe(64);
  });

  test("el panel se despliega a 240px y empuja el contenido", async ({ page }) => {
    const panel = page.locator("aside");
    await expect(panel).toHaveCSS("width", "240px");

    // Colapsado: el panel está fuera salvo el ancho del rail.
    const spacer = page.locator("aside").locator("xpath=..");
    await expect(spacer).toHaveCSS("width", "64px");

    await page.locator(RAIL).getByLabel("Expandir menú").click();
    await expect(spacer).toHaveCSS("width", "240px");
    // Ya desplegado, el panel entra en su sitio: pegado al borde, sin aire.
    const caja = await panel.boundingBox();
    expect(caja?.x).toBe(0);
  });

  test("una sección con hijos se abre desde el rail", async ({ page }) => {
    // "Personas" es una hoja: navega directo.
    await page.locator(RAIL).getByLabel("Personas").click();
    await expect(page).toHaveURL(/\/usuarios/);
    // El rail sigue ahí y marca la sección activa.
    await expect(page.locator(RAIL).getByLabel("Personas")).toHaveAttribute("aria-current", "page");
  });

  test("el rail ofrece cada sección con su etiqueta accesible", async ({ page }) => {
    const rail = page.locator(RAIL);
    for (const etiqueta of ["Inicio", "Personas", "Sistema de diseño"]) {
      await expect(rail.getByLabel(etiqueta)).toBeVisible();
    }
    // Y el conmutador de modo y el feedback siguen alcanzables.
    await expect(rail.getByLabel("Workspace")).toBeVisible();
    await expect(rail.getByLabel("Agente IA")).toBeVisible();
    await expect(rail.getByLabel("Feedback")).toBeVisible();
  });
});

test.describe("Menú de empresa", () => {
  test("toda la fila abre el menú y el consumo se ve como proporción", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.getByRole("button", { name: "Expandir menú" }).click();

    await page.getByTestId("company-trigger").click();
    // Licencias y créditos, cada uno con su anillo y su porcentaje.
    await expect(page.getByText("Licencias")).toBeVisible();
    await expect(page.getByText("940 de 1.000")).toBeVisible();
    await expect(page.getByText("Créditos de IA")).toBeVisible();
    await expect(page.getByText("94%")).toBeVisible();

    // Cambiar de empresa abre su propio menú al lado, sin tapar al principal.
    await page.getByTestId("company-switch").hover();
    await expect(page.getByRole("menuitem", { name: /Alpha/ })).toBeVisible();
    await expect(page.getByText("Tus empresas")).toBeVisible();
    // El menú principal sigue en pantalla detrás del submenú.
    await expect(page.getByRole("menuitem", { name: "Roles y permisos" })).toBeVisible();
  });
});

test.describe("Navegación anidada", () => {
  // El árbol con secciones anidadas vive en la demo del sistema de diseño;
  // la navegación de la app es plana.
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1500, height: 1000 });
    await page.goto("/docs#/components/app-sidebar");
    await page.waitForTimeout(1200);
  });

  test("cerrado, basta pasar el puntero para ver segundo y tercer nivel", async ({ page }) => {
    const idx = await page.evaluate(() => {
      const rails = [...document.querySelectorAll('[aria-label="Navegación compacta"]')];
      return rails.findIndex((r) => getComputedStyle(r.parentElement!).pointerEvents !== "none");
    });
    expect(idx).toBeGreaterThanOrEqual(0);
    const rail = page.locator('[aria-label="Navegación compacta"]').nth(idx);
    await rail.scrollIntoViewIfNeeded();
    // La página de documentación sigue asentándose (gráficos diferidos); si el
    // layout se mueve bajo el puntero, el menú se cierra solo.
    await page.waitForTimeout(500);

    // Sin clic: solo el puntero encima abre el segundo nivel. El menú se
    // cierra solo si el puntero sale, así que reintentamos el gesto entero
    // en vez de dar por hecho que el primer hover cae en el sitio.
    await expect(async () => {
      await rail.getByLabel("Aprendizaje").hover();
      await expect(page.getByRole("menuitem", { name: "LMS Creator" })).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 15000 });

    // …y desde ahí, el tercero.
    await expect(async () => {
      await page.getByRole("menuitem", { name: "LMS Creator" }).hover();
      await expect(page.getByRole("menuitem", { name: "Universidad corporativa" })).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 15000 });
  });

  test("dentro de una sección se salta de hermano sin volver atrás", async ({ page }) => {
    const panel = page.locator("aside").filter({ hasText: "Aprendizaje" }).first();
    await panel.getByRole("button", { name: "Aprendizaje" }).first().click();
    await panel.getByRole("button", { name: "LMS Creator" }).first().click();

    const switcher = page.getByTestId("drill-switcher").first();
    await expect(switcher).toContainText("LMS Creator");
    await switcher.click();
    await page.getByRole("menuitem", { name: "Planes de Formación" }).click();
    await expect(switcher).toContainText("Planes de Formación");
  });
});

test.describe("Submenús", () => {
  /**
   * Un submenú debe abrirse al lado del menú que lo contiene, no encima.
   * Se montaban uno sobre otro porque el SubContent del primitivo no iba en
   * un portal y floating-ui lo colocaba contra su padre, no contra la
   * ventana.
   */
  test("el submenú de empresas abre al lado, sin tapar al padre", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.getByRole("button", { name: "Expandir menú" }).click();
    await page.getByTestId("company-trigger").click();
    await page.getByTestId("company-switch").hover();
    await expect(page.getByText("Tus empresas")).toBeVisible();
    // El panel entra con un zoom del 95%: medir a media animación da una
    // caja más pequeña y desplazada.
    await page.waitForTimeout(400);

    const padre = await page.locator('[data-slot="dropdown-menu-content"]').first().boundingBox();
    const sub = await page.locator('[data-slot="dropdown-menu-sub-content"]').first().boundingBox();
    expect(padre).not.toBeNull();
    expect(sub).not.toBeNull();
    // El submenú empieza donde acaba el padre: ni lo pisa ni se le monta.
    expect(sub!.x).toBeGreaterThanOrEqual(padre!.x + padre!.width);
  });
});
