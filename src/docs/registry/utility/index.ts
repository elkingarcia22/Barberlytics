import type { DocEntry } from "../types";
import { iconTileEntry } from "./icon-tile";
import { tagEntry } from "./tag";
import { sectionHeaderEntry } from "./section-header";
import { pageHeaderEntry } from "./page-header";
import { actionTileEntry } from "./action-tile";

/** Entradas del grupo "utility". Cada componente vive en su propio archivo de esta carpeta. */
export const utilityEntries: readonly DocEntry[] = [iconTileEntry, tagEntry, sectionHeaderEntry, pageHeaderEntry, actionTileEntry];
