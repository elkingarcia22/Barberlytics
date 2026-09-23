import type { DocEntry } from "../types";
import { breadcrumbsEntry } from "./breadcrumbs";
import { globalSearchEntry } from "./global-search";
import { paginationShellEntry } from "./pagination-shell";
import { stepperEntry } from "./stepper";
import { tabsNavEntry } from "./tabs-nav";
import { themaMobileTabBarEntry } from "./thema-mobile-tab-bar";
import { themaProductHeaderEntry } from "./thema-product-header";
import { themaTabsEntry } from "./thema-tabs";
import { scrollspyEntry } from "./scrollspy";

/** Entradas del grupo "navigation". Cada componente vive en su propio archivo de esta carpeta. */
export const navigationEntries: readonly DocEntry[] = [
  breadcrumbsEntry,
  globalSearchEntry,
  paginationShellEntry,
  stepperEntry,
  tabsNavEntry,
  themaMobileTabBarEntry,
  themaProductHeaderEntry,
  themaTabsEntry,
  scrollspyEntry,
];
