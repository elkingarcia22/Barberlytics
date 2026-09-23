import type { DocEntry } from "../types";
import { buttonEntry } from "./button";
import { uiEntriesA } from "./entries-a";
import { uiEntriesB } from "./entries-b";
import { uiEntriesC } from "./entries-c";

/** Entradas del grupo "ui". Cada componente vive en su propio archivo de esta carpeta. */
export const uiEntries: readonly DocEntry[] = [buttonEntry, ...uiEntriesA, ...uiEntriesB, ...uiEntriesC];
