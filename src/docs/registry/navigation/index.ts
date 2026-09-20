import type { DocEntry } from "../types";
import { breadcrumbsEntry } from "./breadcrumbs";
import { paginationShellEntry } from "./pagination-shell";
import { playgroundSidebarEntry } from "./playground-sidebar";
import { tabsNavEntry } from "./tabs-nav";
import { ubitsMobileTabBarEntry } from "./ubits-mobile-tab-bar";
import { ubitsProductHeaderEntry } from "./ubits-product-header";
import { ubitsSubNavEntry } from "./ubits-sub-nav";
import { ubitsTabsEntry } from "./ubits-tabs";

/** Entradas del grupo "navigation". Cada componente vive en su propio archivo de esta carpeta. */
export const navigationEntries: readonly DocEntry[] = [
  breadcrumbsEntry,
  paginationShellEntry,
  playgroundSidebarEntry,
  tabsNavEntry,
  ubitsMobileTabBarEntry,
  ubitsProductHeaderEntry,
  ubitsSubNavEntry,
  ubitsTabsEntry,
];
