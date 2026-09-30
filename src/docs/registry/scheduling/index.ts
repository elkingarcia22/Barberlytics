import type { DocEntry } from "../types";
import { resourceDayGridEntry } from "./resource-day-grid";
import { monthOccupancyGridEntry } from "./month-occupancy-grid";
import { timeSlotPickerEntry } from "./time-slot-picker";

/** Entradas del grupo "scheduling": la agenda del día, la ocupación del mes y el selector de hora. */
export const schedulingEntries: readonly DocEntry[] = [resourceDayGridEntry, monthOccupancyGridEntry, timeSlotPickerEntry];
