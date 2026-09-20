import type { DocEntry } from "../types";
import { chipEntry } from "./chip";
import { aiButtonEntry } from "./ai-button";
import { aiLoaderEntry } from "./ai-loader";
import { aiAnalyzingStateEntry } from "./ai-analyzing-state";
import { aiGeneratedBadgeEntry } from "./ai-generated-badge";
import { aiSparkGlyphEntry } from "./ai-spark-glyph";
import { saveIndicatorEntry } from "./save-indicator";
import { aiInsightCardEntry } from "./ai-insight-card";
import { aiPanelEntry } from "./ai-panel";
import { aiAgentDrawerEntry } from "./ai-agent-drawer";

/** Entradas del grupo "ai". Cada componente vive en su propio archivo de esta carpeta. */
export const aiEntries: readonly DocEntry[] = [
  chipEntry,
  aiButtonEntry,
  aiLoaderEntry,
  aiAnalyzingStateEntry,
  aiGeneratedBadgeEntry,
  aiSparkGlyphEntry,
  saveIndicatorEntry,
  aiInsightCardEntry,
  aiPanelEntry,
  aiAgentDrawerEntry,
];
