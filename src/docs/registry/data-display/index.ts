import type { DocEntry } from "../types";
import { statusBadgeEntry } from "./status-badge";
import { statusBadgeAnimatedEntry } from "./status-badge-animated";
import { tableShellEntry } from "./table-shell";
import { tableHeaderControlsEntry } from "./table-header-controls";
import { tableConfigEntry } from "./table-config";

/** Entradas del grupo "data-display". Cada componente vive en su propio archivo de esta carpeta. */
export const dataDisplayEntries: readonly DocEntry[] = [statusBadgeEntry, statusBadgeAnimatedEntry, tableShellEntry, tableHeaderControlsEntry, tableConfigEntry];
