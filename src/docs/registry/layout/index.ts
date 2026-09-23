import type { DocEntry } from "../types";
import { pageShellEntry } from "./page-shell";
import { headerEntry } from "./header";
import { adminShellEntry } from "./admin-shell";
import { appSidebarEntry } from "./app-sidebar";
import { appHeaderEntry } from "./app-header";
import { companyMenuEntry } from "./company-menu";
import { accountMenuEntry } from "./account-menu";
import { workspaceMenuEntry } from "./workspace-menu";
import { sidebarIconRailEntry } from "./sidebar-icon-rail";
import { agentViewEntry } from "./agent-view";
import { resizableEntry } from "./resizable";

/** Entradas del grupo "layout". Cada componente vive en su propio archivo de esta carpeta. */
export const layoutEntries: readonly DocEntry[] = [
  pageShellEntry,
  headerEntry,
  adminShellEntry,
  appSidebarEntry,
  appHeaderEntry,
  accountMenuEntry,
  companyMenuEntry,
  workspaceMenuEntry,
  sidebarIconRailEntry,
  agentViewEntry,
  resizableEntry,
];
