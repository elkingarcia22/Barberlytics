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
import { routeToHash } from "./router";
import { SOURCE_LOCALE, resolveLocalized, type LocaleId } from "@/i18n";

const go = (hash: string) => () => {
  window.location.hash = hash;
};

export function docsSearchObjects(locale: LocaleId = SOURCE_LOCALE): readonly SearchObjectItem[] {
  return ALL_ENTRIES.map((entry) => ({
    id: entry.id,
    title: entry.name,
    meta: [resolveLocalized(findGroup(entry.group)?.label ?? entry.group, locale)],
    // Las etiquetas del registro buscan pero no se pintan: "radix" o "picker"
    // encuentran el componente sin llenar la fila de jerga.
    keywords: entry.tags,
    actionLabel: "Abrir",
    onSelect: go(routeToHash({ kind: "component", id: entry.id })),
  }));
}

export function docsSearchDestinations(locale: LocaleId = SOURCE_LOCALE): readonly SearchNavigateItem[] {
  const tr = <T,>(value: Parameters<typeof resolveLocalized<T>>[0]) => resolveLocalized(value, locale);
  return [
    { id: "home", path: [tr({ es: "Inicio", en: "Home" })], onSelect: go(routeToHash({ kind: "home" })) },
    ...GUIDE_PAGES.map((page) => ({
      id: `guide-${page.id}`,
      path: [tr(GUIDE_SECTIONS.find((section) => section.id === page.section)?.label ?? "Guías"), tr(page.label)],
      onSelect: go(routeToHash({ kind: "guide", id: page.id })),
    })),
    ...FOUNDATION_PAGES.map((page) => ({
      id: `foundation-${page.id}`,
      path: [tr({ es: "Fundamentos", en: "Foundations" }), tr(page.label)],
      onSelect: go(routeToHash({ kind: "foundation", id: page.id })),
    })),
    ...DOC_GROUPS.map((group) => ({
      id: `group-${group.id}`,
      path: [tr({ es: "Componentes", en: "Components" }), tr(group.label)],
      onSelect: go(routeToHash({ kind: "group", id: group.id })),
    })),
  ];
}
