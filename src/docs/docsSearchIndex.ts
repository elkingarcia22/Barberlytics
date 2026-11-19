/**
 * El índice de la búsqueda general para la documentación.
 *
 * La doc usa el mismo `GlobalSearch` que la aplicación; lo único suyo es lo
 * que mete en el índice: los componentes como "objetos" y los fundamentos y
 * las familias como destinos. No ofrece preguntar al agente porque en la doc
 * no hay agente al que preguntar.
 */

import type { SearchNavigateItem, SearchObjectItem } from "@/components/search";
import { ALL_ENTRIES, DOC_GROUPS, findGroup } from "./registry";
import { FOUNDATION_PAGES } from "./foundationPages";
import { GUIDE_PAGES, GUIDE_SECTIONS } from "./guidePages";
import { routeToHash, type DocsRoute } from "./router";
import { SOURCE_LOCALE, resolveLocalized, type LocaleId } from "@/i18n";
import { SHOWCASE_COMPONENT_IDS, SHOWCASE_GROUP_LABEL, isRouteInShowcase } from "./showcase";

const go = (hash: string) => () => {
  window.location.hash = hash;
};

/**
 * Con `showcase` (la vitrina, ver `showcase.ts`) solo entran los componentes
 * de la selección, y su familia se lee como el grupo de la vitrina.
 */
export function docsSearchObjects(locale: LocaleId = SOURCE_LOCALE, showcase = false): readonly SearchObjectItem[] {
  const entries = showcase ? ALL_ENTRIES.filter((entry) => SHOWCASE_COMPONENT_IDS.includes(entry.id)) : ALL_ENTRIES;
  return entries.map((entry) => ({
    id: entry.id,
    title: entry.name,
    meta: [resolveLocalized(showcase ? SHOWCASE_GROUP_LABEL : (findGroup(entry.group)?.label ?? entry.group), locale)],
    // Las etiquetas del registro buscan pero no se pintan: "radix" o "picker"
    // encuentran el componente sin llenar la fila de jerga.
    keywords: entry.tags,
    actionLabel: "Abrir",
    onSelect: go(routeToHash({ kind: "component", id: entry.id })),
  }));
}

/** Con `showcase` solo quedan los destinos que la vitrina deja abrir. */
export function docsSearchDestinations(locale: LocaleId = SOURCE_LOCALE, showcase = false): readonly SearchNavigateItem[] {
  return allSearchDestinations(locale)
    .filter(({ route }) => !showcase || isRouteInShowcase(route))
    .map(({ item }) => item);
}

/** Un destino del buscador junto a la ruta que abre; la ruta solo sirve para filtrar. */
function destination(id: string, path: string[], route: DocsRoute): { route: DocsRoute; item: SearchNavigateItem } {
  return { route, item: { id, path, onSelect: go(routeToHash(route)) } };
}

function allSearchDestinations(locale: LocaleId) {
  const tr = <T,>(value: Parameters<typeof resolveLocalized<T>>[0]) => resolveLocalized(value, locale);
  return [
    destination("home", [tr({ es: "Inicio", en: "Home" })], { kind: "home" }),
    ...GUIDE_PAGES.map((page) =>
      destination(
        `guide-${page.id}`,
        [tr(GUIDE_SECTIONS.find((section) => section.id === page.section)?.label ?? "Guías"), tr(page.label)],
        { kind: "guide", id: page.id }
      )
    ),
    ...FOUNDATION_PAGES.map((page) =>
      destination(`foundation-${page.id}`, [tr({ es: "Fundamentos", en: "Foundations" }), tr(page.label)], { kind: "foundation", id: page.id })
    ),
    ...DOC_GROUPS.map((group) =>
      destination(`group-${group.id}`, [tr({ es: "Componentes", en: "Components" }), tr(group.label)], { kind: "group", id: group.id })
    ),
  ];
}
