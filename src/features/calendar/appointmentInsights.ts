import { addDays } from "date-fns";
import type { AppMessageKey } from "@/app/i18n/types";
import { appointmentStart, isUnpaid } from "./calendarModel";
import type { Appointment, CalendarCatalog, Client } from "./types";

/**
 * Las sugerencias de una cita: lo que conviene saber antes de atender, sacado
 * del historial del cliente y de la propia cita. Son reglas, no un modelo:
 * cada una dice de qué dato sale y, cuando se puede resolver ahí mismo, qué
 * acción ofrece.
 */

export type InsightTone = "negative" | "warning" | "positive" | "info";

export type InsightAction = { kind: "rebook"; date: Date } | { kind: "addService"; serviceId: string };

export interface AppointmentInsight {
  id: "noShowRisk" | "notRequested" | "firstVisit" | "vip" | "upsell" | "rebook";
  tone: InsightTone;
  textKey: AppMessageKey;
  params?: Record<string, string | number>;
  action?: InsightAction;
  /** Una fecha que la interfaz formatea y pasa como `{date}`. */
  date?: Date;
  /** Un precio que la interfaz formatea y pasa como `{price}`. */
  price?: number;
}

/** A partir de qué proporción de faltas y cancelaciones conviene confirmar. */
export const NO_SHOW_RISK_RATE = 0.2;
const VIP_VISITS = 20;

export function appointmentInsights(appointment: Appointment, client: Client | undefined, catalog: CalendarCatalog): AppointmentInsight[] {
  const insights: AppointmentInsight[] = [];
  const known = client && client.type !== "walkin" ? client : undefined;
  const open = isUnpaid(appointment);

  if (known && appointment.status === "scheduled") {
    const missed = known.noShows + known.cancellations;
    const booked = known.visits + missed;
    if (booked > 0 && missed >= 2 && missed / booked >= NO_SHOW_RISK_RATE) {
      insights.push({ id: "noShowRisk", tone: "negative", textKey: "calendar.insight.noShowRisk", params: { count: missed, total: booked } });
    }
  }

  if (open && appointment.requestedBarberId && appointment.requestedBarberId !== appointment.barberId) {
    const requested = catalog.barbers.find((barber) => barber.id === appointment.requestedBarberId);
    if (requested) insights.push({ id: "notRequested", tone: "warning", textKey: "calendar.insight.notRequested", params: { name: requested.name } });
  }

  if (known?.type === "new" && open) insights.push({ id: "firstVisit", tone: "info", textKey: "calendar.insight.firstVisit" });
  if (known?.type === "vip" && known.visits >= VIP_VISITS && open) insights.push({ id: "vip", tone: "positive", textKey: "calendar.insight.vip", params: { count: known.visits } });

  if (open && appointment.serviceIds.length === 1) {
    const current = catalog.services.find((service) => service.id === appointment.serviceIds[0]);
    // El complemento más fácil de aceptar: de otra categoría y el más corto.
    const addOn = [...catalog.services].filter((service) => service.id !== current?.id && service.category !== current?.category).sort((a, b) => a.durationMin - b.durationMin || a.price - b.price)[0];
    if (addOn) insights.push({ id: "upsell", tone: "info", textKey: "calendar.insight.upsell", params: { service: addOn.name }, price: addOn.price, action: { kind: "addService", serviceId: addOn.id } });
  }

  if (known?.visitEveryDays) {
    const date = addDays(appointmentStart(appointment), known.visitEveryDays);
    insights.push({ id: "rebook", tone: "positive", textKey: "calendar.insight.rebook", params: { days: known.visitEveryDays }, date, action: { kind: "rebook", date } });
  }

  return insights;
}
