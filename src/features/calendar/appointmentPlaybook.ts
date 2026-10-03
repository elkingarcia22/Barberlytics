import { pulseGroup } from "./pulseModel";
import type { Appointment } from "./types";

/**
 * Qué toca hacer con una cita según dónde va: la acción principal, las que
 * la acompañan y las que quedan en el menú. Es lo que hace que el panel de
 * una cita tarde ponga delante «Llamar» y el de una en silla, «Cobrar».
 */

export type AppointmentStage = "late" | "upcoming" | "waiting" | "seated" | "toCollect" | "paid" | "noShow" | "cancelled";

export type AppointmentActionId = "call" | "whatsapp" | "checkIn" | "seat" | "pay" | "ready" | "rebook" | "edit" | "noShow" | "cancel";

export interface AppointmentPlaybook {
  stage: AppointmentStage;
  /** Lo primero que se ofrece; el primero de la lista es el botón principal. */
  primary: AppointmentActionId[];
  /** Lo que se puede hacer además, a la vista pero sin competir. */
  secondary: AppointmentActionId[];
  /** Lo que se hace rara vez o no tiene vuelta atrás: al menú. */
  more: AppointmentActionId[];
}

export function appointmentStage(appointment: Appointment, now: Date | undefined): AppointmentStage {
  if (appointment.status === "cancelled") return "cancelled";
  if (appointment.status === "no_show") return "noShow";
  return pulseGroup(appointment, now) ?? "upcoming";
}

const CONTACT: AppointmentActionId[] = ["call", "whatsapp"];

export function appointmentPlaybook(appointment: Appointment, now: Date | undefined, options: { hasPhone: boolean }): AppointmentPlaybook {
  const stage = appointmentStage(appointment, now);
  const contact = options.hasPhone ? CONTACT : [];
  switch (stage) {
    // Ya pasó su hora: primero saber si viene.
    case "late":
      return { stage, primary: [...contact, "checkIn"], secondary: ["noShow", "edit"], more: ["cancel"] };
    case "upcoming":
      return { stage, primary: ["checkIn"], secondary: ["edit", ...contact.slice(1)], more: ["noShow", "cancel"] };
    case "waiting":
      return { stage, primary: ["seat"], secondary: [...(appointment.barberReady ? [] : (["ready"] as AppointmentActionId[])), "pay", "edit"], more: ["noShow", "cancel"] };
    case "seated":
      return { stage, primary: ["pay"], secondary: ["edit"], more: ["cancel"] };
    case "toCollect":
      return { stage, primary: ["pay"], secondary: ["edit"], more: [] };
    case "paid":
      return { stage, primary: ["rebook"], secondary: contact.slice(1), more: [] };
    case "noShow":
    case "cancelled":
      return { stage, primary: ["rebook"], secondary: contact, more: [] };
  }
}
