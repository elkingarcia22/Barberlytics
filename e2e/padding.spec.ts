import { expect, test } from "@playwright/test";
import { DOC_GROUPS } from "../src/docs/registry/types";
import { FOUNDATION_PAGES } from "../src/docs/foundationPages";

/**
 * Auditoría de márgenes internas.
 *
 * Recorre toda la documentación y busca contenido —texto, botones, campos—
 * pegado al borde interior de un contenedor con borde o sombra: el síntoma de
 * "esta card no tiene padding". Mide el rectángulo real de los glifos, no la
 * caja de su elemento, porque la celda de una tabla toca el borde del
 * contenedor por definición mientras su texto no lo hace.
 *
 * Existe porque cuatro casos así llegaron a producción a la vez: un pie de
 * card sin padding lateral, el vacío de un gráfico con `p-0`, el error de otro
 * sin márgenes y una etiqueta larga saliéndose de su tarjeta de métrica.
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
    /*
     * Un contenedor que recorta su contenido es un visor, no una card: una
     * fila a medio salir por el borde no es un fallo de márgenes internas.
     * Cuenta tanto el que tiene scroll como el marco de alto fijo que esconde
     * lo que desborda —los marcos de las demos de pantalla completa.
     */
    const scrolls = /(auto|scroll)/.test(cs.overflowY + cs.overflowX);
    const clips = /hidden/.test(cs.overflowY + cs.overflowX) && el.scrollHeight > el.clientHeight + 2;
    return radius >= 8 && (bordered || shadowed) && !scrolls && !clips && r.width >= 110 && r.height >= 48;
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
    const leaves: { rect: DOMRect; owner: Element; label: string; fills?: { x: boolean; y: boolean }; inGrid?: boolean }[] = [];
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
        /*
         * Un control que abarca el contenedor entero es una fila, no una
         * pieza suelta: la cabecera clicable de una tarjeta plegable, la
         * franja horaria de un calendario, una opción de lista. Su margen va
         * por dentro, y su texto ya se audita por su cuenta con el Range de
         * arriba, así que su caja no se acusa.
         */
        fills: {
          x: control.getBoundingClientRect().width >= box.right - box.left - 2,
          y: control.getBoundingClientRect().height >= box.bottom - box.top - 2,
        },
        /*
         * La celda de una rejilla o de una tabla también va a sangre: la
         * última columna toca el borde derecho y la última fila el de abajo
         * por definición, igual que un `<td>`. Lo que no puede tocar el borde
         * es su texto, y ese se mide aparte.
         */
        inGrid: (() => {
          let hop: Element | null = control;
          while (hop && hop !== root) {
            if (/^(grid|inline-grid|table|table-row|table-cell|table-row-group)$/.test(getComputedStyle(hop).display)) return true;
            if (hop === el) break;
            hop = hop.parentElement;
          }
          return false;
        })(),
      });
    }

    for (const leaf of leaves) {
      // Si el contenido está dentro de otro contenedor con borde interno, ese
      // contenedor es el responsable: no acusamos al de fuera.
      let hop: Element | null = leaf.owner;
      let nested = false;
      while (hop && hop !== el) {
        const hcs = getComputedStyle(hop);
        /*
         * Cualquier caja intermedia que recorte —con scroll o escondiendo lo
         * que desborda— es la dueña del borde contra el que cae el contenido,
         * así que el de fuera no responde por él. Antes solo se miraba
         * `overflow: hidden` en el eje resumido, y una demo con scroll propio
         * dentro de un marco acusaba al marco.
         */
        const clipping = /(hidden|auto|scroll)/.test(hcs.overflowX + hcs.overflowY);
        if ((Number.parseFloat(hcs.borderTopWidth) || 0) > 0 || hcs.boxShadow !== "none" || clipping) nested = true;
        hop = hop.parentElement;
      }
      if (nested) continue;

      const lr = leaf.rect;
      if (lr.width < 4 || lr.height < 4) continue;
      const gaps = { left: lr.left - box.left, right: box.right - lr.right, top: lr.top - box.top, bottom: box.bottom - lr.bottom };
      // Un control que llena el contenedor en un eje es una fila o una celda
      // de rejilla: va a sangre por definición y su margen es interno. Su
      // texto se sigue midiendo por separado, que es lo que de verdad no
      // puede tocar el borde.
      if (leaf.fills?.x || leaf.fills?.y || leaf.inGrid) continue;
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

test("ningún contenido queda pegado al borde de su contenedor", async ({ page }) => {
  test.setTimeout(600_000);
  await page.addInitScript(() => {
    localStorage.setItem("thema-theme", JSON.stringify({ preset: "premium", mode: "light", radius: "md", density: "normal" }));
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/docs#/");
  await page.waitForTimeout(1200);

  /*
   * Las rutas ya no se leen del menú: desde que la doc usa el shell del
   * producto, su navegación son botones con `onNavigate`, no enlaces, y la
   * auditoría pasó de 151 rutas a 23 sin que nada fallara. Ahora el inicio,
   * los fundamentos y los grupos salen de sus propios datos, y los
   * componentes de la página de cada grupo, que sí los enlaza de verdad.
   */
  const groupRoutes = DOC_GROUPS.map((group) => `#/group/${group.id}`);
  const componentRoutes: string[] = [];
  for (const group of DOC_GROUPS) {
    await page.evaluate((r) => { location.hash = r; }, `#/group/${group.id}`);
    /*
     * Espera determinista al título de ESE grupo. Con un `waitForTimeout` la
     * doc no siempre había repintado a tiempo y se leían los enlaces de la
     * página anterior: la lista se quedaba en 63 rutas de 151 sin que nada
     * fallara, y la auditoría dejaba de mirar cinco sextos de la
     * documentación.
     */
    await expect(page.getByRole("heading", { level: 1, name: group.label })).toBeVisible();
    componentRoutes.push(
      ...(await page.evaluate(() =>
        [...document.querySelectorAll('a[href^="#/components/"]')].map((a) => a.getAttribute("href")!)
      ))
    );
  }

  const routes = [
    "#/",
    ...FOUNDATION_PAGES.map((page_) => `#/foundations/${page_.id}`),
    ...groupRoutes,
    ...componentRoutes,
  ].filter((value, index, all) => all.indexOf(value) === index);

  const report: Record<string, unknown[]> = {};
  for (const route of routes) {
    await page.evaluate((r) => { location.hash = r.replace(/^.*#/, "#"); }, route);
    await page.waitForTimeout(320);
    /*
     * Espera a que terminen las animaciones de entrada antes de medir. Sin
     * esto, una fila a medio entrar aparecía "pegada al borde" según el
     * momento exacto de la captura —la página de Motion, que va precisamente
     * de animaciones, fallaba de forma intermitente—. Las infinitas (la malla
     * de IA) se excluyen: nunca terminan.
     */
    await page.evaluate(async () => {
      const finite = document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity);
      await Promise.all(finite.map((animation) => animation.finished.catch(() => undefined)));
    });
    const flags = await page.evaluate(auditPage);
    if (flags.length) report[route] = flags;
  }
  // Si la lista se queda corta, la auditoría dejaría de mirar la mayor parte
  // de la doc en silencio: por eso el número también es una aserción.
  expect(routes.length).toBeGreaterThan(140);
  expect(report, `Contenido pegado al borde:\n${JSON.stringify(report, null, 2)}`).toEqual({});
});
