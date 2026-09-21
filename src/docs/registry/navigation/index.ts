import type { DocEntry } from "../types";
import { breadcrumbsEntry } from "./breadcrumbs";
import { paginationShellEntry } from "./pagination-shell";
import { tabsNavEntry } from "./tabs-nav";
import { themaMobileTabBarEntry } from "./thema-mobile-tab-bar";
import { themaProductHeaderEntry } from "./thema-product-header";
import { themaTabsEntry } from "./thema-tabs";

/** Entradas del grupo "navigation". Cada componente vive en su propio archivo de esta carpeta. */
export const navigationEntries: readonly DocEntry[] = [
  breadcrumbsEntry,
  paginationShellEntry,
  tabsNavEntry,
  themaMobileTabBarEntry,
  themaProductHeaderEntry,
  themaTabsEntry,
];
