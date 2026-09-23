import type { DocEntry } from "../types";
import { actionRailShellEntry } from "./action-rail-shell";
import { dataListActionRailEntry } from "./data-list-action-rail";
import { actionFabEntry } from "./action-fab";
import { railButtonEntry } from "./rail-button";
import { confirmActionPopoverEntry } from "./confirm-action-popover";
import { railOverflowMenuEntry } from "./rail-overflow-menu";
import { railSettingsMenuEntry } from "./rail-settings-menu";
import { railSelectionChipEntry } from "./rail-selection-chip";
import { railDragHandleEntry } from "./rail-drag-handle";
import { drawerActionRailEntry } from "./drawer-action-rail";

/** Entradas del grupo "action-rail". Cada componente vive en su propio archivo de esta carpeta. */
export const actionRailEntries: readonly DocEntry[] = [
  actionRailShellEntry,
  dataListActionRailEntry,
  actionFabEntry,
  railButtonEntry,
  confirmActionPopoverEntry,
  railOverflowMenuEntry,
  railSettingsMenuEntry,
  railSelectionChipEntry,
  railDragHandleEntry,
  drawerActionRailEntry,
];
