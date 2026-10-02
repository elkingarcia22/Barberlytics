import type { Conversation } from "./types";

export type ConversationGroupKey = "today" | "yesterday" | "week" | "older";

export interface ConversationGroup {
  key: ConversationGroupKey;
  items: readonly Conversation[];
}

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Las conversaciones por cuándo se tocaron: Hoy, Ayer, Últimos 7 días, Anteriores. Sin grupos vacíos. */
export function groupConversations(conversations: readonly Conversation[], now = Date.now()): ConversationGroup[] {
  const today = startOfDay(now);
  const buckets: Record<ConversationGroupKey, Conversation[]> = { today: [], yesterday: [], week: [], older: [] };
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  for (const conversation of sorted) {
    const day = startOfDay(conversation.updatedAt);
    const key: ConversationGroupKey = day >= today ? "today" : day >= today - DAY ? "yesterday" : day >= today - 7 * DAY ? "week" : "older";
    buckets[key].push(conversation);
  }
  return (["today", "yesterday", "week", "older"] as const).filter((key) => buckets[key].length > 0).map((key) => ({ key, items: buckets[key] }));
}
