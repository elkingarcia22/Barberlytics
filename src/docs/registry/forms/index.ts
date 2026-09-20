import type { DocEntry } from "../types";
import { fieldEntry } from "./field";
import { formSectionEntry } from "./form-section";
import { multiSelectEntry } from "./multi-select";
import { searchableSelectEntry } from "./searchable-select";
import { singleSelectEntry } from "./single-select";

/** Entradas del grupo "forms". Cada componente vive en su propio archivo de esta carpeta. */
export const formsEntries: readonly DocEntry[] = [fieldEntry, formSectionEntry, multiSelectEntry, searchableSelectEntry, singleSelectEntry];
