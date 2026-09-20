import type { DocEntry } from "../types";
import { cardSelectionEntry } from "./card-selection";
import { radioCardGroupEntry } from "./radio-card-group";
import { selectableCardEntry } from "./selectable-card";
import { optionTileEntry } from "./option-tile";
import { checkboxCardGroupEntry } from "./checkbox-card-group";
import { segmentedControlEntry } from "./segmented-control";

/** Entradas del grupo "selection". Cada componente vive en su propio archivo de esta carpeta. */
export const selectionEntries: readonly DocEntry[] = [
  cardSelectionEntry,
  radioCardGroupEntry,
  selectableCardEntry,
  optionTileEntry,
  checkboxCardGroupEntry,
  segmentedControlEntry,
];
