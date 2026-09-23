import type { DocEntry } from "../types";
import { attentionStripEntry } from "./attention-strip";
import { emptyStateEntry } from "./empty-state";
import { emptyStateActionButtonEntry } from "./empty-state-action-button";
import { spinnerEntry } from "./spinner";
import { themaToasterEntry } from "./thema-toaster";

/** Entradas del grupo "feedback". Cada componente vive en su propio archivo de esta carpeta. */
export const feedbackEntries: readonly DocEntry[] = [attentionStripEntry, emptyStateEntry, emptyStateActionButtonEntry, spinnerEntry, themaToasterEntry];
