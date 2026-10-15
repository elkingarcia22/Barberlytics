import type { DocEntry } from "../types";
import { resourceDayGridEntry } from "./resource-day-grid";
import { monthOccupancyGridEntry } from "./month-occupancy-grid";
import { timeSlotPickerEntry } from "./time-slot-picker";
import { dayStripEntry } from "./day-strip";
import { timeSlotGroupsEntry } from "./time-slot-groups";

/** Entradas del grupo "scheduling": la agenda del día, la ocupación del mes, el selector de hora y sus piezas sueltas (la tira de días y las horas por franja). */
export const schedulingEntries: readonly DocEntry[] = [resourceDayGridEntry, monthOccupancyGridEntry, timeSlotPickerEntry, dayStripEntry, timeSlotGroupsEntry];
