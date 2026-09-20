import type { DocEntry } from "../types";
import { datePickerEntry } from "./date-picker";
import { dateRangePickerEntry } from "./date-range-picker";
import { dualDateRangePickerEntry } from "./dual-date-range-picker";
import { monthPickerEntry } from "./month-picker";
import { quarterSelectorEntry } from "./quarter-selector";
import { periodSelectorEntry } from "./period-selector";
import { dateFilterBarEntry } from "./date-filter-bar";
import { dateUtilsEntry } from "./date-utils";
import { rangeSliderEntry } from "./range-slider";

/** Entradas del grupo "date". Cada componente vive en su propio archivo de esta carpeta. */
export const dateEntries: readonly DocEntry[] = [
  datePickerEntry,
  dateRangePickerEntry,
  dualDateRangePickerEntry,
  monthPickerEntry,
  quarterSelectorEntry,
  periodSelectorEntry,
  dateFilterBarEntry,
  dateUtilsEntry,
  rangeSliderEntry,
];
