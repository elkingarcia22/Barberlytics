import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/**
 * El home del preview es una plantilla: la estructura completa de una
 * pantalla de gestión —de qué partir, cómo va, qué necesita atención y la
 * lista con todo— armada solo con piezas del sistema. Estas pruebas fijan esa
 * estructura y que sus partes se hablen: una alerta filtra la lista de verdad.
 */

function auditPage() {
  const flags: Record<string, unknown>[] = [];
  const root = document.querySelector("main") ?? document.body;
  const cls = (el: Element) => (typeof el.className === "string" ? el.className : "").slice(0, 150);

  const containers = [...root.querySelectorAll<HTMLElement>("*")].filter((el) => {
    const cs = getComputedStyle(el);
    const radius = Number.parseFloat(cs.borderTopLeftRadius) || 0;
    const bordered = (Number.parseFloat(cs.borderTopWidth) || 0) > 0 && cs.borderTopStyle !== "none";
    const shadowed = cs.boxShadow !== "none";
    const r = el.getBoundingClientRect();
    // Un contenedor con scroll recorta su contenido por definición: una fila a
    // medio salir del borde no es un fallo de márgenes internas.
    const scrolls = /(auto|scroll)/.test(cs.overflowY + cs.overflowX);
    return radius >= 8 && (bordered || shadowed) && !scrolls && r.width >= 110 && r.height >= 48;
  });

  for (const el of containers) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const bw = (side: string) => Number.parseFloat(cs.getPropertyValue(`border-${side}-width`)) || 0;
    const box = { top: r.top + bw("top"), right: r.right - bw("right"), bottom: r.bottom - bw("bottom"), left: r.left + bw("left") };

    // Hijos que cuentan como contenido: texto visible y controles.
    // Para el texto medimos el rectángulo de los glifos (un Range), no la caja
    // de su elemento: la celda de una tabla toca el borde del contenedor por
    // definición, pero su texto no si la celda tiene su propio padding.
    const leaves: { rect: DOMRect; owner: Element; label: string }[] = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim() ?? "";
      if (text.length < 2 || !node.parentElement) continue;
      if (getComputedStyle(node.parentElement).visibility === "hidden") continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      leaves.push({ rect: range.getBoundingClientRect(), owner: node.parentElement, label: `"${text.slice(0, 28)}"` });
    }
    for (const control of el.querySelectorAll("button, input, select, textarea, [role=tab], [role=radio], [role=switch]")) {
      leaves.push({
        rect: control.getBoundingClientRect(),
        owner: control,
        label: `<${control.tagName.toLowerCase()}> ${cls(control).slice(0, 40)}`,
      });
    }

    for (const leaf of leaves) {
      // Si el contenido está dentro de otro contenedor con borde interno, ese
      // contenedor es el responsable: no acusamos al de fuera.
      let hop: Element | null = leaf.owner;
      let nested = false;
      while (hop && hop !== el) {
        const hcs = getComputedStyle(hop);
        if ((Number.parseFloat(hcs.borderTopWidth) || 0) > 0 || hcs.boxShadow !== "none" || hcs.overflow === "hidden") nested = true;
        hop = hop.parentElement;
      }
      if (nested) continue;

      const lr = leaf.rect;
      if (lr.width < 4 || lr.height < 4) continue;
      const gaps = { left: lr.left - box.left, right: box.right - lr.right, top: lr.top - box.top, bottom: box.bottom - lr.bottom };
      const flush = Object.entries(gaps).filter(([, gap]) => gap > -6 && gap < 3);
      if (!flush.length) continue;
      flags.push({
        container: `${el.tagName.toLowerCase()}.${cls(el)}`,
        child: leaf.label,
        sides: flush.map(([side, gap]) => `${side}:${Math.round(gap)}`).join(" "),
      });
    }
  }
  // Un hallazgo por contenedor + lado, para no repetir cada celda de una tabla.
  const seen = new Set<string>();
  return flags.filter((f) => {
    const key = `${f.container}|${f.sides}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}


test.describe("home plantilla", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await login(page);
    await expect(page.getByRole("heading", { name: "Home", level: 1 })).toBeVisible();
  });

  test("tiene las cuatro capas y la lista completa", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Empieza con una plantilla" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Ver más plantillas/ })).toBeVisible();

    // Las tres métricas, con su valor visible (nunca solo el gráfico).
    for (const label of ["Avance promedio", "Cumplimiento promedio", "Participación promedio"]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }

    await expect(page.getByText(/procesos? requieren? atención|Todo en orden/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lista de procesos" })).toBeVisible();

    for (const column of ["Nombre", "Periodo", "Fecha inicio", "Fecha cierre", "Estado", "# Elementos", "Avance"]) {
      await expect(page.getByRole("columnheader", { name: column })).toBeVisible();
    }

    // La cabecera de la pantalla: migas, título y sus acciones. El header del
    // shell ya no repite el nombre de la sección.
    await expect(page.getByLabel("Breadcrumb")).toContainText("Métricas");
    await expect(page.getByRole("button", { name: "Exportar" })).toBeVisible();

    // Y la barra de acciones del shell con la acción primaria. Cuando la barra
    // es dueña de las acciones la cabecera no las repite: "Crear proceso"
    // aparece una sola vez, en la barra.
    await expect(page.getByRole("button", { name: "Crear proceso" })).toHaveCount(1);
  });

  test("una alerta filtra la lista y se puede soltar", async ({ page }) => {
    const rowsBefore = await page.getByRole("row").count();
    await page.getByRole("button", { name: /Avance bajo/ }).click();
    const rowsFiltered = await page.getByRole("row").count();
    expect(rowsFiltered).toBeLessThan(rowsBefore);

    await page.getByRole("button", { name: /Avance bajo/ }).click();
    expect(await page.getByRole("row").count()).toBe(rowsBefore);
  });

  test("la búsqueda de la lista filtra por nombre", async ({ page }) => {
    await page.getByRole("button", { name: "Buscar en procesos" }).click();
    await page.getByPlaceholder("Buscar por nombre").fill("semestral");
    await expect(page.getByRole("cell", { name: /Revisión semestral/ }).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: /Plan trimestral/ })).toHaveCount(0);
  });

  test("la segunda pestaña cambia de lista", async ({ page }) => {
    await page.getByRole("tab", { name: "Sin asignar" }).click();
    await expect(page.getByRole("heading", { name: "Sin asignar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Asignar" }).first()).toBeVisible();
  });

  test("la configuración de la tabla ofrece rejilla o lista", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible();
    await page.getByRole("button", { name: /Configurar/i }).first().click();
    await page.getByRole("button", { name: "Lista", exact: true }).click();
    await page.keyboard.press("Escape");

    // La misma lista, sin rejilla: cada proceso en una fila con su estado.
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.getByText("Plan trimestral 2026", { exact: true }).first()).toBeVisible();

    // Y se recuerda: es una preferencia de quien lee.
    await page.reload();
    await expect(page.getByRole("table")).toHaveCount(0);
  });

  test("no deja contenido pegado al borde de su contenedor", async ({ page }) => {
    await page.waitForTimeout(1200);
    const flags = await page.evaluate(auditPage);
    expect(flags, JSON.stringify(flags, null, 2)).toEqual([]);
  });
});
