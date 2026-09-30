import type { DocEntry } from "../types";
import { feedbackCampaignEntry } from "./feedback-campaign";
import { feedbackLauncherEntry } from "./feedback-launcher";
import { feedbackPanelEntry } from "./feedback-panel";
import { guidedTourEntry } from "./guided-tour";

/** Entradas del grupo "feedback-loop": pedir opinión masiva sobre algo recién lanzado. */
export const feedbackLoopEntries: readonly DocEntry[] = [feedbackCampaignEntry, feedbackLauncherEntry, feedbackPanelEntry, guidedTourEntry];
