import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/**
 * La documentación no tiene shell propio: monta el mismo `AdminShell` que la
 * aplicación, con el árbol de la doc, la búsqueda y los controles de tema en
 * las acciones del header. Estas pruebas fijan ese contrato —si alguien
 * vuelve a montar un menú o una cabecera aparte, fallan— sin atarse a la
 * estructura interna del sidebar, que evoluciona por su cuenta.
 */
/** Lo que tarda el paquete de la doc en compilarse y montar la cabecera. */
const DOCS_BOOT_TIMEOUT = 30_000;

test.describe("shell de la documentación", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.goto("/docs#/");
    // Espera determinista: el botón de búsqueda es la última pieza del header
    // en montarse, así que verlo garantiza que el shell y su atajo de teclado
    // ya están vivos. Con un `waitForTimeout` el ⌘K se perdía a veces.
    // En desarrollo, el paquete de la documentación se compila a demanda y
    // pesa más de un megabyte: con varios workers a la vez, el primero en
    // pedirlo espera bastante más que los 5s del timeout por defecto.
    await expect(page.getByRole("button", { name: /Buscar en el sistema/i })).toBeVisible({ timeout: DOCS_BOOT_TIMEOUT });
  });

  test("usa el menú, la cabecera y el pie del producto", async ({ page }) => {
    // El menú lateral del producto, no uno propio.
    await expect(page.locator("aside").first()).toBeVisible();
    // Las migas viven en el hueco que el shell reserva a la pantalla montada.
    await expect(page.getByLabel("Breadcrumb")).toContainText("Inicio");
    // Pie del shell, con la marca de la configuración.
    await expect(page.getByRole("contentinfo")).toContainText("Thema");
  });

  test("apaga el cromo que solo tiene sentido en la aplicación", async ({ page }) => {
    // Cabecera: nada de novedades, ayuda, notificaciones ni sesión.
    await expect(page.getByRole("button", { name: "Novedades" })).toHaveCount(0);
    await expect(page.getByLabel("Ayuda")).toHaveCount(0);
    await expect(page.getByLabel("Notificaciones")).toHaveCount(0);
    await expect(page.getByTestId("shell-avatar")).toHaveCount(0);
    // Menú: nada de menú de empresa ni conmutador de agente.
    await expect(page.getByRole("button", { name: "Workspace", exact: true })).toHaveCount(0);
  });

  test("los fundamentos van agrupados en un acordeón", async ({ page }) => {
    // El shell se auto-plega a rail poco después de montar; si ya lo hizo,
    // se expande primero, que es lo que haría cualquiera para navegar.
    const expand = page.getByLabel("Expandir menú");
    await expect(async () => {
      if (await expand.count()) await expand.click();
      await expect(page.locator("aside").first().getByRole("button", { name: "Fundamentos" })).toBeVisible();
    }).toPass();

    const aside = page.locator("aside").first();
    const fundamentos = aside.getByRole("button", { name: "Fundamentos" });
    // Las filas de un acordeón cerrado siguen montadas (el shell anima la
    // altura del contenedor), así que lo que dice si está abierto es su
    // `aria-expanded`, no que el texto esté en el DOM.
    await expect(fundamentos).toHaveAttribute("aria-expanded", "false");
    await fundamentos.click();
    await expect(fundamentos).toHaveAttribute("aria-expanded", "true");
    // Y desde ahí se navega a cualquiera de sus páginas.
    await aside.getByText("Espaciado", { exact: true }).click();
    await expect(page).toHaveURL(/#\/foundations\/spacing/);
  });

  /**
   * El rail plegado tiene que dar salida a una sección con hijos: si no, esos
   * nodos quedan inalcanzables con el panel cerrado. La aplicación ya no tiene
   * ninguna —Servicios y Productos van sueltos—, así que el caso vive aquí.
   */
  test("una sección con hijos los ofrece al pasar el puntero", async ({ page }) => {
    const rail = page.locator('[aria-label="Navegación compacta"]');
    await expect(rail).toBeVisible({ timeout: DOCS_BOOT_TIMEOUT });

    await expect(async () => {
      await rail.getByLabel("Fundamentos").hover();
      await expect(page.getByRole("menuitem", { name: "Temas" })).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 15000 });

    await page.getByRole("menuitem", { name: "Temas" }).click();
    await expect(page).toHaveURL(/#\/foundations\/themes/);
  });

  test("las migas siguen a la ruta", async ({ page }) => {
    // Navegación dentro del documento (solo cambia el hash), como cuando se
    // elige un componente en el menú: la cabecera no se recarga.
    await page.evaluate(() => { window.location.hash = "#/components/button"; });
    await expect(page.getByRole("heading", { name: "Button", level: 1 })).toBeVisible();
    const crumbs = page.getByLabel("Breadcrumb");
    await expect(crumbs).toContainText("Componentes");
    await expect(crumbs).toContainText("Button");
  });

  test("la búsqueda del header abre la paleta del sistema y navega", async ({ page }) => {
    await page.getByRole("button", { name: /Buscar en el sistema/i }).click();
    const input = page.getByPlaceholder("Busca un componente o un fundamento");
    await expect(input).toBeVisible();
    await input.fill("espaciado");
    await page.getByRole("option", { name: /Espaciado/i }).first().click();
    await expect(page).toHaveURL(/#\/foundations\/spacing/);
    await expect(page.getByRole("heading", { name: "Espaciado", level: 1 })).toBeVisible();
  });

  test("el botón Aplicación sale a la aplicación de ejemplo", async ({ page }) => {
    const preview = page.getByRole("link", { name: /Aplicación/i });
    await expect(preview).toHaveAttribute("href", "/dashboard");
    // Con sesión entra directo al inicio de la app.
    await login(page);
    await page.goto("/docs#/");
    await page.getByRole("link", { name: /Aplicación/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "Home", level: 1 })).toBeVisible();
  });

  test("sin sesión, Aplicación pasa antes por el login", async ({ page }) => {
    await page.getByRole("link", { name: /Aplicación/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("⌘K abre la misma paleta", async ({ page }) => {
    await page.locator("body").press("ControlOrMeta+k");
    await expect(page.getByPlaceholder("Busca un componente o un fundamento")).toBeVisible();
  });
});
