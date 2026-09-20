import type { DocEntry } from "../types";
import { activityDropdownEntry } from "./activity-dropdown";
import { magicCardEntry } from "./magic-card";
import { movingBorderBeamEntry } from "./moving-border-beam";
import { paginationEntry } from "./pagination";
import { popoverEntry } from "./popover";
import { progressEntry } from "./progress";
import { radioGroupEntry } from "./radio-group";
import { scrollAreaEntry } from "./scroll-area";
import { selectEntry } from "./select";
import { separatorEntry } from "./separator";
import { sheetEntry } from "./sheet";
import { skeletonEntry } from "./skeleton";
import { sliderEntry } from "./slider";
import { sonnerEntry } from "./sonner";
import { switchEntry } from "./switch";
import { tableEntry } from "./table";
import { tabsEntry } from "./tabs";
import { textareaEntry } from "./textarea";
import { tooltipEntry } from "./tooltip";
import { themaLogoEntry } from "./thema-logo";

/** Primitivos, segunda mitad (magic-card … activity-dropdown). */
export const uiEntriesB: readonly DocEntry[] = [
  magicCardEntry,
  movingBorderBeamEntry,
  paginationEntry,
  popoverEntry,
  progressEntry,
  radioGroupEntry,
  scrollAreaEntry,
  selectEntry,
  separatorEntry,
  sheetEntry,
  skeletonEntry,
  sliderEntry,
  sonnerEntry,
  switchEntry,
  tableEntry,
  tabsEntry,
  textareaEntry,
  tooltipEntry,
  themaLogoEntry,
  activityDropdownEntry,
];
