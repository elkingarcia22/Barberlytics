import type { AppMessageKey } from "@/app/i18n";
import type { Appointment } from "../types";

/**
 * Si el cliente confirmó que viene, en una palabra para el badge junto al
 * título de la cita, y cómo (para su tooltip). Si ya llegó, vino: cuenta como
 * confirmada. Lo que respondió por mensaje y recepción tiene que resolver
 * (otra hora, que no puede venir) gana sobre «sin confirmar».
 */

export type ConfirmationKind = "confirmed" | "pending" | "reschedule" | "declined";

export interface ConfirmationState {
  kind: ConfirmationKind;
  label: AppMessageKey;
  /** Cómo se llegó ahí; `null` si no hay nada que decir. */
  hint: AppMessageKey | null;
  /** Ya está en la barbería (o después): la confirmación ya no se toca. */
  arrived: boolean;
}

const VIA_KEY: Readonly<Record<"link" | "reception" | "whatsapp", AppMessageKey>> = {
  link: "calendar.messages.confirmedLink",
  reception: "calendar.messages.confirmedReception",
  whatsapp: "calendar.messages.confirmedWhatsapp",
};

export function confirmationOf(appointment: Pick<Appointment, "status" | "confirmation">): ConfirmationState {
  const arrived = appointment.status === "arrived" || appointment.status === "seated" || appointment.status === "paid";
  if (arrived) return { kind: "confirmed", label: "calendar.messages.confirmed", hint: "calendar.messages.confirmedArrived", arrived };
  const status = appointment.confirmation?.status;
  if (status === "confirmed") return { kind: "confirmed", label: "calendar.messages.confirmed", hint: VIA_KEY[appointment.confirmation?.via ?? "reception"], arrived };
  if (status === "reschedule_requested") return { kind: "reschedule", label: "calendar.messages.rescheduleRequested", hint: "calendar.messages.rescheduleHint", arrived };
  if (status === "declined") return { kind: "declined", label: "calendar.messages.declined", hint: "calendar.messages.declinedHint", arrived };
  return { kind: "pending", label: "calendar.messages.notConfirmed", hint: appointment.status === "scheduled" ? "calendar.messages.pendingHint" : null, arrived };
}
