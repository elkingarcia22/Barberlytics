import type { DocEntry } from "../types";
import { numberFieldEntry } from "./number-field";
import { inputOtpEntry } from "./input-otp";
import { fieldEntry } from "./field";
import { filterBarEntry } from "./filter-bar";
import { formSectionEntry } from "./form-section";
import { multiSelectEntry } from "./multi-select";
import { searchableSelectEntry } from "./searchable-select";
import { singleSelectEntry } from "./single-select";
import { ratingEntry } from "./rating";
import { phoneInputEntry } from "./phone-input";
import { colorPickerEntry } from "./color-picker";

/** Entradas del grupo "forms". Cada componente vive en su propio archivo de esta carpeta. */
export const formsEntries: readonly DocEntry[] = [fieldEntry, filterBarEntry, formSectionEntry, multiSelectEntry, searchableSelectEntry, singleSelectEntry, numberFieldEntry, inputOtpEntry, ratingEntry, phoneInputEntry, colorPickerEntry];
