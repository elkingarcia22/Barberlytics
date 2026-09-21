import type { DocEntry } from "../types";
import { appShellEntry } from "./app-shell";
import { pageShellEntry } from "./page-shell";
import { headerEntry } from "./header";
import { adminShellEntry } from "./admin-shell";
import { appSidebarEntry } from "./app-sidebar";
import { appHeaderEntry } from "./app-header";

/** Entradas del grupo "layout". Cada componente vive en su propio archivo de esta carpeta. */
export const layoutEntries: readonly DocEntry[] = [
  appShellEntry,
  pageShellEntry,
  headerEntry,
  adminShellEntry,
  appSidebarEntry,
  appHeaderEntry,
];
