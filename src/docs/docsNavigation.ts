/**
 * La navegación de la documentación, expresada en el modelo del shell real.
 *
 * La doc no monta un menú propio: monta `AdminShell` con este árbol, así que
 * el sidebar, el rail plegado, los desplegables y el estado activo son
 * exactamente los del producto. Cada nodo lleva su `path` (el hash de la doc)
 * y un id con prefijo para poder ir y volver entre ruta y nodo.
 */

import {
  Blocks,
  BookOpen,
  Box,
  CalendarRange,
  ChartColumn,
  CloudUpload,
  Compass,
  House,
  Image,
  Layers,
  MessageSquareWarning,
  MousePointerClick,
  PanelBottom,
  PanelsTopLeft,
  Scissors,
  Shapes,
  Sparkles,
  Table2,
  TextCursorInput,
  Type,
  Wrench,
  type LucideIcon, CalendarClock } from "lucide-react";
import type { NavChild, NavEntry } from "@/components/app-shell";
import { SOURCE_LOCALE, resolveLocalized, type LocaleId, type Localized } from "@/i18n";
import { DOC_GROUPS, entriesByGroup } from "./registry";
import { FOUNDATION_PAGES } from "./foundationPages";
import { GUIDE_SECTIONS, guidesBySection } from "./guidePages";
import { routeToHash, type DocsRoute } from "./router";

/**
 * Un icono por grupo. No es decoración: plegado, el sidebar se convierte en
 * un rail de 64px donde el icono es lo único que queda de cada sección.
 */
/** El icono de cada familia; lo comparten el árbol del shell y la portada. */
export const GROUP_ICONS: Readonly<Record<string, LucideIcon>> = {
  ui: Box,
  typography: Type,
  forms: TextCursorInput,
  selection: MousePointerClick,
  navigation: Compass,
  overlays: Layers,
  feedback: MessageSquareWarning,
  "data-display": Table2,
  date: CalendarRange,
  scheduling: CalendarClock,
  upload: CloudUpload,
  charts: ChartColumn,
  ai: Sparkles,
  "action-rail": PanelBottom,
  layout: PanelsTopLeft,
  media: Image,
  utility: Wrench,
  icons: Shapes,
  atmosphere: Scissors,
  blocks: Blocks,
};

/**
 * Subcategorías dentro de una familia, para cuando la lista de componentes es
 * demasiado larga para leerla de una pasada (Primitivos: 45). El sidebar ya
 * sabe abrir un tercer nivel —lo usa "Aprendizaje" en el árbol de la app—, así
 * que aquí solo se agrupan los ids por afinidad; el resto de familias, con
 * listas cortas, se queda con la lista plana de siempre.
 */
const GROUP_SUBCATEGORIES: Readonly<Record<string, ReadonlyArray<{ label: Localized; description: Localized; entryIds: readonly string[] }>>> = {
  ui: [
    {
      label: { es: "Acciones", en: "Actions" },
      description: { es: "Botones, conmutadores y los menús que disparan una acción.", en: "Buttons, toggles and the menus that fire an action." },
      entryIds: ["button", "button-group", "toggle", "toggle-group", "dropdown-menu", "context-menu"],
    },
    {
      label: { es: "Overlays y ventanas", en: "Overlays and windows" },
      description: { es: "Lo que se abre encima de la pantalla: diálogos, paneles y flotantes.", en: "What opens on top of the screen: dialogs, panels and floating surfaces." },
      entryIds: ["dialog", "alert-dialog", "sheet", "popover", "hover-card", "tooltip"],
    },
    {
      label: { es: "Formulario", en: "Form" },
      description: { es: "Campos y controles para capturar datos.", en: "Fields and controls for capturing data." },
      entryIds: ["input", "input-group", "textarea", "label", "checkbox", "radio-group", "select", "switch", "slider", "calendar"],
    },
    {
      label: { es: "Feedback y estado", en: "Feedback and status" },
      description: { es: "Avisos, progreso y los estados de carga o vacío.", en: "Alerts, progress and loading or empty states." },
      entryIds: ["alert", "badge", "progress", "skeleton", "sonner", "activity-dropdown"],
    },
    {
      label: { es: "Navegación y disclosure", en: "Navigation and disclosure" },
      description: { es: "Cómo se explora o se abre y cierra contenido dentro de la pantalla.", en: "How content inside a screen is browsed, opened and closed." },
      entryIds: ["accordion", "collapsible", "tabs", "pagination", "command", "scroll-area"],
    },
    {
      label: { es: "Datos y contenido", en: "Data and content" },
      description: { es: "Cómo se presenta información: tablas, tarjetas y piezas de identidad.", en: "How information is presented: tables, cards and identity pieces." },
      entryIds: ["table", "card", "carousel", "avatar", "separator", "kbd"],
    },
    {
      label: { es: "Efectos y marca", en: "Effects and brand" },
      description: { es: "Los toques decorativos del sistema: brillos, bordes y la marca Thema.", en: "The decorative touches of the system: glows, borders and the Thema mark." },
      entryIds: ["border-beam", "moving-border-beam", "magic-card", "fluid-highlight", "thema-logo"],
    },
  ],
};

/**
 * Reparte los componentes de una familia entre sus subcategorías. Un
 * componente que no esté clasificado —de la lista de arriba o uno que se
 * sume mañana— no desaparece del árbol: cae en un cajón "Otros" en vez de
 * quedar invisible por un id que se olvidó de añadir.
 */
function buildSubcategoryChildren(
  groupId: string,
  entries: readonly { id: string; name: string }[],
  subcategories: ReadonlyArray<{ label: Localized; description: Localized; entryIds: readonly string[] }>,
  locale: LocaleId
): NavChild[] {
  const tr = <T,>(value: Parameters<typeof resolveLocalized<T>>[0]) => resolveLocalized(value, locale);
  const classified = new Set(subcategories.flatMap((sub) => sub.entryIds));
  const bucket = (ids: readonly string[]) =>
    ids
      .map((id) => entries.find((entry) => entry.id === id))
      .filter((entry): entry is { id: string; name: string } => entry !== undefined)
      .map((entry) => ({
        id: `component:${entry.id}`,
        label: entry.name,
        path: routeToHash({ kind: "component", id: entry.id }),
      }));

  const groups = subcategories.map((sub, index) => ({
    // El id lleva el índice y no el rótulo: el rótulo cambia con el idioma y
    // el nodo activo dejaría de encontrarse al cambiar de lengua.
    id: `subgroup:${groupId}:${index}`,
    label: tr(sub.label),
    description: tr(sub.description),
    children: bucket(sub.entryIds),
  }));

  const leftover = entries.filter((entry) => !classified.has(entry.id)).map((entry) => entry.id);
  if (leftover.length === 0) return groups;
  return [
    ...groups,
    {
      id: `subgroup:${groupId}:other`,
      label: tr(NAV_LABELS.other),
      description: tr({ es: "Sin subcategoría todavía.", en: "No subcategory yet." }),
      children: bucket(leftover),
    },
  ];
}

/** Los rótulos del propio árbol, los únicos que no salen de un registro. */
const NAV_LABELS = {
  home: { es: "Inicio", en: "Home" },
  foundations: { es: "Fundamentos", en: "Foundations" },
  components: { es: "Componentes", en: "Components" },
  overview: { es: "Resumen", en: "Overview" },
  other: { es: "Otros", en: "Other" },
} as const;

export const HOME_NAV_ID = "inicio";
/** El acordeón que agrupa los fundamentos. */
export const FOUNDATIONS_NAV_ID = "section:foundations";
/** Los acordeones de guías: `section:start` y `section:patterns`. */
export const guideSectionNavId = (section: string) => `section:${section}`;

/** El id del nodo que corresponde a una ruta de la doc. */
export function navIdFromRoute(route: DocsRoute): string {
  switch (route.kind) {
    case "home":
      return HOME_NAV_ID;
    case "foundation":
      return `foundation:${route.id}`;
    case "guide":
      return `guide:${route.id}`;
    case "group":
      return `group:${route.id}`;
    case "component":
      return `component:${route.id}`;
  }
}

/** La ruta que corresponde a un id de nodo; cualquier id desconocido vuelve al inicio. */
export function routeFromNavId(id: string): DocsRoute {
  const separator = id.indexOf(":");
  if (separator === -1) return { kind: "home" };
  const kind = id.slice(0, separator);
  const target = id.slice(separator + 1);
  switch (kind) {
    case "foundation":
      return { kind: "foundation", id: target };
    case "guide":
      return { kind: "guide", id: target };
    case "group":
      return { kind: "group", id: target };
    case "component":
      return { kind: "component", id: target };
    default:
      return { kind: "home" };
  }
}

export function hashFromNavId(id: string): string {
  return routeToHash(routeFromNavId(id));
}

/** El acordeón de una sección de guías (Empezar o Patrones). */
function guideSectionEntry(sectionId: "start" | "patterns", locale: LocaleId): NavEntry {
  const section = GUIDE_SECTIONS.find((item) => item.id === sectionId)!;
  const tr = <T,>(value: Parameters<typeof resolveLocalized<T>>[0]) => resolveLocalized(value, locale);
  return {
    kind: "item",
    id: guideSectionNavId(section.id),
    label: tr(section.label),
    icon: section.icon,
    children: guidesBySection(section.id).map((page) => ({
      id: `guide:${page.id}`,
      label: tr(page.label),
      description: tr(page.description),
      path: routeToHash({ kind: "guide", id: page.id }),
    })),
  };
}

/**
 * El árbol: Inicio, las guías de arranque, los fundamentos agrupados en un
 * acordeón, los patrones y cada familia de componentes en el suyo. El primer hijo de cada familia abre su página de
 * resumen, que de otro modo quedaría sin puerta de entrada: en este modelo
 * una raíz con hijos despliega en vez de navegar.
 */
export function buildDocsNavigation(locale: LocaleId): readonly NavEntry[] {
  const tr = <T,>(value: Parameters<typeof resolveLocalized<T>>[0]) => resolveLocalized(value, locale);
  return [
    { kind: "item", id: HOME_NAV_ID, label: tr(NAV_LABELS.home), icon: House, path: routeToHash({ kind: "home" }) },

    guideSectionEntry("start", locale),

    {
      kind: "item",
      id: FOUNDATIONS_NAV_ID,
      label: tr(NAV_LABELS.foundations),
      icon: BookOpen,
      children: FOUNDATION_PAGES.map((page) => ({
        id: `foundation:${page.id}`,
        label: tr(page.label),
        path: routeToHash({ kind: "foundation", id: page.id }),
      })),
    },

    guideSectionEntry("patterns", locale),

    { kind: "group", label: tr(NAV_LABELS.components) },
    ...DOC_GROUPS.flatMap<NavEntry>((group) => {
      const entries = entriesByGroup(group.id);
      if (entries.length === 0) return [];

      const summary: NavChild = {
        id: `group:${group.id}`,
        label: `${tr(NAV_LABELS.overview)} · ${entries.length}`,
        description: tr(group.description),
        path: routeToHash({ kind: "group", id: group.id }),
      };

      const subcategories = GROUP_SUBCATEGORIES[group.id];
      const componentChildren: NavChild[] = subcategories
        ? buildSubcategoryChildren(group.id, entries, subcategories, locale)
        : entries.map((entry) => ({
            id: `component:${entry.id}`,
            label: entry.name,
            description: tr(entry.description),
            path: routeToHash({ kind: "component", id: entry.id }),
          }));

      return [
        {
          kind: "item",
          id: `section:${group.id}`,
          label: tr(group.label),
          icon: GROUP_ICONS[group.id] ?? Box,
          children: [summary, ...componentChildren],
        },
      ];
    }),
  ];
}

/**
 * El árbol en español. Lo usan las pruebas y cualquier consumidor sin
 * contexto de idioma; la documentación monta `buildDocsNavigation` con el
 * idioma activo.
 */
export const DOCS_NAVIGATION: readonly NavEntry[] = buildDocsNavigation(SOURCE_LOCALE);
