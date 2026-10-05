import type { DocEntry } from "../types";
import { listItemEntry } from "./list-item";
import { statusBadgeEntry } from "./status-badge";
import { statusBadgeAnimatedEntry } from "./status-badge-animated";
import { tableShellEntry } from "./table-shell";
import { tableHeaderControlsEntry } from "./table-header-controls";
import { tableConfigEntry } from "./table-config";
import { rowActionsMenuEntry } from "./row-actions-menu";
import { rowContextMenuEntry } from "./row-context-menu";
import { timelineEntry } from "./timeline";
import { treeEntry } from "./tree";
import { sortableEntry } from "./sortable";
import { kanbanEntry } from "./kanban";

/** Entradas del grupo "data-display". Cada componente vive en su propio archivo de esta carpeta. */
export const dataDisplayEntries: readonly DocEntry[] = [
  listItemEntry,
  statusBadgeEntry,
  statusBadgeAnimatedEntry,
  tableShellEntry,
  tableHeaderControlsEntry,
  tableConfigEntry,
  rowActionsMenuEntry,
  rowContextMenuEntry,
  timelineEntry,
  treeEntry,
  sortableEntry,
  kanbanEntry,
];
