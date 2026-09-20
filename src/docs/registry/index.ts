import { DOC_GROUPS, type DocEntry, type DocGroupId } from "./types";
import { uiEntries } from "./ui";
import { formsEntries } from "./forms";
import { selectionEntries } from "./selection";
import { navigationEntries } from "./navigation";
import { overlaysEntries } from "./overlays";
import { feedbackEntries } from "./feedback";
import { dataDisplayEntries } from "./data-display";
import { dateEntries } from "./date";
import { uploadEntries } from "./upload";
import { chartsEntries } from "./charts";
import { aiEntries } from "./ai";
import { actionRailEntries } from "./action-rail";
import { layoutEntries } from "./layout";
import { mediaEntries } from "./media";
import { utilityEntries } from "./utility";
import { iconsEntries } from "./icons";

export * from "./types";

export const ALL_ENTRIES: readonly DocEntry[] = [
  ...uiEntries,
  ...formsEntries,
  ...selectionEntries,
  ...navigationEntries,
  ...overlaysEntries,
  ...feedbackEntries,
  ...dataDisplayEntries,
  ...dateEntries,
  ...uploadEntries,
  ...chartsEntries,
  ...aiEntries,
  ...actionRailEntries,
  ...layoutEntries,
  ...mediaEntries,
  ...utilityEntries,
  ...iconsEntries,
];

export function findEntry(id: string): DocEntry | undefined {
  return ALL_ENTRIES.find((entry) => entry.id === id);
}

export function entriesByGroup(group: DocGroupId): DocEntry[] {
  return ALL_ENTRIES.filter((entry) => entry.group === group).sort((a, b) => a.name.localeCompare(b.name));
}

export function findGroup(id: string) {
  return DOC_GROUPS.find((group) => group.id === id);
}
