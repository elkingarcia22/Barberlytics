import type { DocEntry } from "../types";
import { headingEntry } from "./heading";
import { textEntry } from "./text";

/** Entradas del grupo "typography". Cada componente vive en su propio archivo de esta carpeta. */
export const typographyEntries: readonly DocEntry[] = [headingEntry, textEntry];
