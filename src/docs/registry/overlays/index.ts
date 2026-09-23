import type { DocEntry } from "../types";
import { confirmDialogEntry } from "./confirm-dialog";
import { drawerSectionEntry } from "./drawer-section";
import { drawerShellEntry } from "./drawer-shell";
import { modalShellEntry } from "./modal-shell";
import { templateCatalogDrawerEntry } from "./template-catalog-drawer";

/** Entradas del grupo "overlays". Cada componente vive en su propio archivo de esta carpeta. */
export const overlaysEntries: readonly DocEntry[] = [
  confirmDialogEntry,
  drawerSectionEntry,
  drawerShellEntry,
  modalShellEntry,
  templateCatalogDrawerEntry,
];
