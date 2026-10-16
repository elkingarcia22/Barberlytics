import type { DocEntry } from "../types";
import { commentsPanelEntry } from "./comments-panel";
import { commentsToggleEntry } from "./comments-toggle";
import { commentLayerEntry } from "./comment-layer";

/** Entradas del grupo "comments": comentarios sobre la pantalla al estilo Figma. */
export const commentsEntries: readonly DocEntry[] = [
  commentsPanelEntry,
  commentsToggleEntry,
  commentLayerEntry,
];
