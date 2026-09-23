import type { DocEntry } from "../types";
import { themaIconEntry } from "./thema-icon";
import { glassIconEntry } from "./glass-icon";

/** Entradas del grupo "icons". Cada componente vive en su propio archivo de esta carpeta. */
export const iconsEntries: readonly DocEntry[] = [themaIconEntry, glassIconEntry];
