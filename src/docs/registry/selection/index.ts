import type { DocEntry } from "../types";
import { cardSelectionEntry } from "./card-selection";
import { radioCardGroupEntry } from "./radio-card-group";
import { selectableCardEntry } from "./selectable-card";
import { optionTileEntry } from "./option-tile";
import { checkboxCardGroupEntry } from "./checkbox-card-group";
import { segmentedControlEntry } from "./segmented-control";
import { templateTileEntry } from "./template-tile";
import { selectMarkEntry } from "./select-mark";
import { selectableRowEntry } from "./selectable-row";

/** Entradas del grupo "selection". Cada componente vive en su propio archivo de esta carpeta. */
export const selectionEntries: readonly DocEntry[] = [
  cardSelectionEntry,
  radioCardGroupEntry,
  selectableCardEntry,
  optionTileEntry,
  checkboxCardGroupEntry,
  segmentedControlEntry,
  templateTileEntry,
  selectMarkEntry,
  selectableRowEntry,
];
