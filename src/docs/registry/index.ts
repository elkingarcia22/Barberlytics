import { DOC_GROUPS, type DocEntry, type DocGroupId } from "./types";
import { uiEntries } from "./ui";
import { typographyEntries } from "./typography";
import { formsEntries } from "./forms";
import { selectionEntries } from "./selection";
import { navigationEntries } from "./navigation";
import { overlaysEntries } from "./overlays";
import { feedbackEntries } from "./feedback";
import { dataDisplayEntries } from "./data-display";
import { dateEntries } from "./date";
import { schedulingEntries } from "./scheduling";
import { uploadEntries } from "./upload";
import { chartsEntries } from "./charts";
import { aiEntries } from "./ai";
import { actionRailEntries } from "./action-rail";
import { layoutEntries } from "./layout";
import { mediaEntries } from "./media";
import { utilityEntries } from "./utility";
import { iconsEntries } from "./icons";
import { atmosphereEntries } from "./atmosphere";
import { blocksEntries } from "./blocks";

export * from "./types";

export const ALL_ENTRIES: readonly DocEntry[] = [
  ...uiEntries,
  ...typographyEntries,
  ...formsEntries,
  ...selectionEntries,
  ...navigationEntries,
  ...overlaysEntries,
  ...feedbackEntries,
  ...dataDisplayEntries,
  ...dateEntries,
  ...schedulingEntries,
  ...uploadEntries,
  ...chartsEntries,
  ...aiEntries,
  ...actionRailEntries,
  ...layoutEntries,
  ...mediaEntries,
  ...utilityEntries,
  ...iconsEntries,
  ...atmosphereEntries,
  ...blocksEntries,
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
