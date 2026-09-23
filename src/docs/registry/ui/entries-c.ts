import type { DocEntry } from "../types";
import { buttonGroupEntry } from "./button-group";
import { collapsibleEntry } from "./collapsible";
import { contextMenuEntry } from "./context-menu";
import { kbdEntry } from "./kbd";
import { toggleEntry } from "./toggle";
import { toggleGroupEntry } from "./toggle-group";

/** Primitivos, tercera tanda (button-group … toggle-group). */
export const uiEntriesC: readonly DocEntry[] = [
  buttonGroupEntry,
  collapsibleEntry,
  contextMenuEntry,
  kbdEntry,
  toggleEntry,
  toggleGroupEntry,
];
