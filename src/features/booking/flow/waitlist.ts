import type { AppMessageKey } from "@/app/i18n/types";
import type { WaitlistWindow } from "../types";

/** Apuntado en la lista de espera y sin hora apartada: terminar es quedarse en ella. */
export function canFinishOnWaitlist(state: { waitlist: readonly unknown[]; items: readonly unknown[] }): boolean {
  return state.waitlist.length > 0 && state.items.length === 0;
}

/** El nombre de cada franja de la lista de espera, para la tarjeta y su confirmación. */
export const WINDOW_KEYS: Record<WaitlistWindow, AppMessageKey> = {
  morning: "booking.waitlist.morning",
  afternoon: "booking.waitlist.afternoon",
  evening: "booking.waitlist.evening",
  any: "booking.waitlist.any",
};
