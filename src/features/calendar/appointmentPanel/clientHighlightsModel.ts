import { differenceInCalendarDays } from "date-fns";
import type { CustomerAppointment } from "@/features/customers/types";
import type { ClientNote, ConductReport } from "../types";
import { barberLoyalty, completedVisits, lastVisitOf } from "./clientVisits";

/**
 * Lo primero que se lee de un cliente en «Sobre {nombre}», en el orden en que importa: lo que el
 * barbero debe cuidar (actitud, alergias, medicamentos), si cumple, si se está perdiendo, qué se hizo
 * la última vez, su nota y con quién se queda. Cada punto lleva a su pestaña de la página.
 */

export type ClientTab = "summary" | "care" | "visits" | "loyalty";

export type HighlightTone = "negative" | "warning" | "neutral";

export type ClientHighlight =
  | { kind: "conduct"; tab: "care"; tone: "negative"; report: ConductReport; count: number }
  | { kind: "health"; tab: "care"; tone: "warning"; note: ClientNote }
  | { kind: "reliability"; tab: "visits"; tone: HighlightTone; visits: number; noShows: number; cancellations: number }
  | { kind: "rhythm"; tab: "visits"; tone: HighlightTone; daysSince: number; every: number | null; overdue: boolean }
  | { kind: "lastVisit"; tab: "visits"; tone: "neutral"; visit: CustomerAppointment }
  | { kind: "note"; tab: "care"; tone: "neutral"; note: ClientNote; more: number }
  | { kind: "loyalty"; tab: "loyalty"; tone: "neutral"; preferredName: string | null; withBarber: number; total: number; barberName: string | null };

/** Se da por perdido cuando lleva más de una vez y media su ritmo sin venir. */
export const OVERDUE_FACTOR = 1.5;

export interface HighlightsInput {
  conduct: readonly ConductReport[];
  critical: readonly ClientNote[];
  notes: readonly ClientNote[];
  visits: number;
  noShows: number;
  cancellations: number;
  lastVisit: Date | null;
  visitEveryDays: number | null;
  preferredName: string | null;
  barberId: string | null;
  barberName: string | null;
  history: readonly CustomerAppointment[];
  now: Date;
}

export function clientHighlights(input: HighlightsInput): ClientHighlight[] {
  const out: ClientHighlight[] = [];
  const [report] = input.conduct;
  if (report) out.push({ kind: "conduct", tab: "care", tone: "negative", report, count: input.conduct.length });
  for (const note of input.critical) out.push({ kind: "health", tab: "care", tone: "warning", note });
  out.push({ kind: "reliability", tab: "visits", tone: input.noShows > 0 ? "warning" : "neutral", visits: input.visits, noShows: input.noShows, cancellations: input.cancellations });
  const lastVisit = lastVisitOf(input.history, input.lastVisit);
  if (lastVisit) {
    const daysSince = differenceInCalendarDays(input.now, lastVisit);
    const overdue = input.visitEveryDays !== null && daysSince > input.visitEveryDays * OVERDUE_FACTOR;
    out.push({ kind: "rhythm", tab: "visits", tone: overdue ? "warning" : "neutral", daysSince, every: input.visitEveryDays, overdue });
  }
  const [last] = completedVisits(input.history);
  if (last) out.push({ kind: "lastVisit", tab: "visits", tone: "neutral", visit: last });
  const [note, ...older] = input.notes;
  if (note) out.push({ kind: "note", tab: "care", tone: "neutral", note, more: older.length });
  const loyalty = barberLoyalty(input.history, input.barberId);
  out.push({ kind: "loyalty", tab: "loyalty", tone: "neutral", preferredName: input.preferredName, withBarber: loyalty.withBarber, total: loyalty.total, barberName: input.barberName });
  return out;
}
