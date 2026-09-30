import { Home } from "lucide-react";
import type { NavChild, NavEntry } from "@/components/app-shell";
import { groupSectionArticles, type HelpIndex } from "@/lib/help";
import { sectionIcon } from "./sectionIcons";
import { helpPath } from "./content";

export const HELP_HOME_NAV_ID = "help:home";
const sectionNavId = (id: string) => `help:section:${id}`;
const groupNavId = (sectionId: string, groupId: string) => `help:group:${sectionId}:${groupId}`;

/**
 * El árbol del menú lateral del centro de ayuda: inicio y una raíz por
 * sección con sus artículos colgando. Las secciones grandes cuelgan sus
 * artículos de subgrupos («Agendar», «Cobrar y vender»…) para que el menú no
 * sea una lista interminable. Las secciones sin artículos no se enseñan: un
 * tema vacío es una promesa, no ayuda.
 */
export function buildHelpNavigation(index: HelpIndex | undefined, homeLabel: string): NavEntry[] {
  const home: NavEntry = { kind: "item", id: HELP_HOME_NAV_ID, label: homeLabel, icon: Home, path: helpPath() };
  if (!index) return [home];
  return [
    home,
    ...index.sections
      .filter((section) => section.articles.length > 0)
      .map<NavEntry>((section) => ({
        kind: "item",
        id: sectionNavId(section.id),
        label: section.title,
        icon: sectionIcon(section.icon),
        path: helpPath(section.id),
        children: sectionChildren(section, index),
      })),
  ];
}

function sectionChildren(section: HelpIndex["sections"][number], index: HelpIndex): NavChild[] {
  const groups = groupSectionArticles(section, index);
  const leaf = (article: (typeof groups)[number]["articles"][number]) => ({ id: article.id, label: article.title, path: helpPath(article.id) });
  if (groups.length === 1 && !groups[0].title) return groups[0].articles.map(leaf);
  return groups.map((group) => ({
    id: groupNavId(section.id, group.id),
    label: group.title,
    path: `${helpPath(section.id)}#${group.id}`,
    children: group.articles.map(leaf),
  }));
}

/** Qué nodo del menú está activo para una ruta `/ayuda/...`. */
export function helpNavIdFromPath(pathname: string): string {
  const rest = pathname.replace(/^\/ayuda\/?/, "").replace(/\/+$/, "");
  if (!rest || rest === "buscar") return HELP_HOME_NAV_ID;
  return rest.includes("/") ? rest : sectionNavId(rest);
}
