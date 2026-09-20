import type { DocEntry } from "../types";
import { buttonEntry } from "./button";
import { uiEntriesA } from "./entries-a";
import { uiEntriesB } from "./entries-b";

/** Entradas del grupo "ui". Cada componente vive en su propio archivo de esta carpeta. */
export const uiEntries: readonly DocEntry[] = [buttonEntry, ...uiEntriesA, ...uiEntriesB];
