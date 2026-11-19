import { describe, expect, test } from "vitest";
import {
  DOCS_NAVIGATION,
  FOUNDATIONS_NAV_ID,
  HOME_NAV_ID,
  SHOWCASE_NAV_ID,
  buildDocsNavigation,
  hashFromNavId,
  navIdFromRoute,
  routeFromNavId,
} from "./docsNavigation";
import { docsSearchDestinations, docsSearchObjects } from "./docsSearchIndex";
import { SHOWCASE_COMPONENT_IDS, SHOWCASE_GROUP_LABEL, isRouteInShowcase } from "./showcase";
import { FOUNDATION_PAGES } from "./foundationPages";
import { GUIDE_PAGES, GUIDE_SECTIONS } from "./guidePages";
import { ALL_ENTRIES, DOC_GROUPS } from "./registry";
import { routeToHash, type DocsRoute } from "./router";
import { SOURCE_LOCALE, resolveLocalized } from "@/i18n";

/**
 * `DOCS_NAVIGATION` es el árbol en español (la documentación monta
 * `buildDocsNavigation` con el idioma activo), así que las comparaciones van
 * contra el rótulo resuelto y no contra el objeto de traducciones.
 */
const inSource = <T,>(value: Parameters<typeof resolveLocalized<T>>[0]) => resolveLocalized(value, SOURCE_LOCALE);

/**
 * Todos los nodos del árbol, en cualquier nivel. Recorre hasta el fondo —no
 * solo un nivel de hijos— porque una familia grande (Primitivos) cuelga sus
 * componentes de una subcategoría, no del acordeón directamente.
 */
function flatten() {
  const rows: { id: string; label: string; path?: string }[] = [];
  const visit = (nodes: readonly { id: string; label: string; path?: string; children?: readonly { id: string; label: string; path?: string; children?: unknown }[] }[]) => {
    for (const node of nodes) {
      rows.push({ id: node.id, label: node.label, path: node.path });
      if (node.children) visit(node.children as typeof nodes);
    }
  };
  for (const entry of DOCS_NAVIGATION) {
    if (entry.kind !== "item") continue;
    rows.push({ id: entry.id, label: entry.label, path: entry.path });
    if (entry.children) visit(entry.children);
  }
  return rows;
}

/** Busca un id en cualquier nivel bajo `children` (hijos o nietos). */
function findDescendant(children: readonly { id: string; children?: readonly { id: string }[] }[] | undefined, id: string): boolean {
  return (children ?? []).some((child) => child.id === id || (child.children ?? []).some((leaf) => leaf.id === id));
}

describe("DOCS_NAVIGATION", () => {
  test("los ids no se repiten en todo el árbol", () => {
    const ids = flatten().map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("los fundamentos cuelgan de un único acordeón, en orden", () => {
    const section = DOCS_NAVIGATION.find((entry) => entry.kind === "item" && entry.id === FOUNDATIONS_NAV_ID);
    if (!section || section.kind !== "item") throw new Error("falta el acordeón de fundamentos");
    expect(section.label).toBe("Fundamentos");
    expect(section.children).toEqual(
      FOUNDATION_PAGES.map((page) => ({
        id: `foundation:${page.id}`,
        label: inSource(page.label),
        path: routeToHash({ kind: "foundation", id: page.id }),
      }))
    );
    // Y ya no quedan fundamentos sueltos en el primer nivel.
    expect(DOCS_NAVIGATION.filter((entry) => entry.kind === "item" && entry.id.startsWith("foundation:"))).toEqual([]);
  });

  test("cada componente del registro aparece exactamente una vez", () => {
    const componentIds = flatten()
      .map((node) => node.id)
      .filter((id) => id.startsWith("component:"));
    expect(componentIds.sort()).toEqual(ALL_ENTRIES.map((entry) => `component:${entry.id}`).sort());
  });

  test("cada grupo es un acordeón cuyo primer hijo abre su resumen", () => {
    for (const group of DOC_GROUPS) {
      const section = DOCS_NAVIGATION.find((entry) => entry.kind === "item" && entry.id === `section:${group.id}`);
      if (!section || section.kind !== "item") throw new Error(`falta la sección ${group.id}`);
      expect(section.label).toBe(inSource(group.label));
      expect(section.children?.[0]).toMatchObject({
        id: `group:${group.id}`,
        path: routeToHash({ kind: "group", id: group.id }),
      });
    }
  });

  test("cada guía cuelga del acordeón de su sección, y cada sección existe", () => {
    for (const section of GUIDE_SECTIONS) {
      const node = DOCS_NAVIGATION.find((entry) => entry.kind === "item" && entry.id === `section:${section.id}`);
      if (!node || node.kind !== "item") throw new Error(`falta la sección de guías ${section.id}`);
      expect(node.label).toBe(inSource(section.label));
      expect(node.children?.map((child) => child.id)).toEqual(
        GUIDE_PAGES.filter((page) => page.section === section.id).map((page) => `guide:${page.id}`)
      );
    }
    // Y toda guía va y vuelve entre ruta y nodo.
    for (const page of GUIDE_PAGES) {
      expect(routeFromNavId(`guide:${page.id}`)).toEqual({ kind: "guide", id: page.id });
      expect(navIdFromRoute({ kind: "guide", id: page.id })).toBe(`guide:${page.id}`);
    }
  });

  test("el inicio es el primer ítem", () => {
    expect(DOCS_NAVIGATION[0]).toMatchObject({ kind: "item", id: HOME_NAV_ID, path: routeToHash({ kind: "home" }) });
  });
});

describe("ruta ⇄ nodo", () => {
  const routes: DocsRoute[] = [
    { kind: "home" },
    { kind: "foundation", id: "spacing" },
    { kind: "group", id: "ui" },
    { kind: "component", id: "button" },
  ];

  test("ida y vuelta conserva la ruta", () => {
    for (const route of routes) {
      expect(routeFromNavId(navIdFromRoute(route))).toEqual(route);
    }
  });

  test("hashFromNavId devuelve el hash de la doc", () => {
    for (const route of routes) {
      expect(hashFromNavId(navIdFromRoute(route))).toBe(routeToHash(route));
    }
  });

  test("un id desconocido o sin prefijo cae en el inicio", () => {
    expect(routeFromNavId("section:ui")).toEqual({ kind: "home" });
    expect(routeFromNavId(FOUNDATIONS_NAV_ID)).toEqual({ kind: "home" });
    expect(routeFromNavId("cualquiera")).toEqual({ kind: "home" });
  });

  test("el nodo activo de una ruta de componente cuelga de su grupo", () => {
    const entry = ALL_ENTRIES[0];
    const section = DOCS_NAVIGATION.find((item) => item.kind === "item" && item.id === `section:${entry.group}`);
    if (!section || section.kind !== "item") throw new Error("sección no encontrada");
    expect(findDescendant(section.children, navIdFromRoute({ kind: "component", id: entry.id }))).toBe(true);
  });
});

describe("vitrina", () => {
  const tree = buildDocsNavigation(SOURCE_LOCALE, { showcase: true });

  test("solo quedan Inicio, Marca y el grupo de ejemplos", () => {
    expect(tree.map((entry) => (entry.kind === "item" ? entry.id : entry.kind))).toEqual([HOME_NAV_ID, "foundation:brand", SHOWCASE_NAV_ID]);
    const group = tree[2];
    if (group.kind !== "item") throw new Error("falta el grupo de la vitrina");
    expect(group.label).toBe(inSource(SHOWCASE_GROUP_LABEL));
  });

  test("el grupo lista cada componente de la selección, en orden, hacia su página", () => {
    const group = tree[2];
    if (group.kind !== "item") throw new Error("falta el grupo de la vitrina");
    expect(group.children?.map((child) => child.path)).toEqual(
      SHOWCASE_COMPONENT_IDS.map((id) => routeToHash({ kind: "component", id }))
    );
  });

  test("todos los ids de la selección existen en el registro", () => {
    const known = new Set(ALL_ENTRIES.map((entry) => entry.id));
    expect(SHOWCASE_COMPONENT_IDS.filter((id) => !known.has(id))).toEqual([]);
    expect(SHOWCASE_COMPONENT_IDS.length).toBeGreaterThanOrEqual(15);
  });

  test("las rutas fuera de la selección no se abren", () => {
    expect(isRouteInShowcase({ kind: "home" })).toBe(true);
    expect(isRouteInShowcase({ kind: "foundation", id: "brand" })).toBe(true);
    expect(isRouteInShowcase({ kind: "foundation", id: "colors" })).toBe(false);
    expect(isRouteInShowcase({ kind: "guide", id: "como-usar" })).toBe(false);
    expect(isRouteInShowcase({ kind: "group", id: "ai" })).toBe(false);
    expect(isRouteInShowcase({ kind: "component", id: SHOWCASE_COMPONENT_IDS[0] })).toBe(true);
    const hidden = ALL_ENTRIES.find((entry) => !SHOWCASE_COMPONENT_IDS.includes(entry.id));
    expect(isRouteInShowcase({ kind: "component", id: hidden!.id })).toBe(false);
  });

  test("la búsqueda solo ofrece destinos y componentes permitidos", () => {
    expect(docsSearchDestinations(SOURCE_LOCALE, true).map((item) => item.id)).toEqual(["home", "foundation-brand"]);
    expect(docsSearchObjects(SOURCE_LOCALE, true).map((item) => item.id).sort()).toEqual([...SHOWCASE_COMPONENT_IDS].sort());
    // Fuera de la vitrina, todo sigue ahí.
    expect(docsSearchObjects(SOURCE_LOCALE)).toHaveLength(ALL_ENTRIES.length);
  });
});
