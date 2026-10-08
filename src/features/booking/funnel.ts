import * as React from "react";
import { bookingApi } from "./api";
import type { BookingStep } from "./bookingState";

/** Dónde se abre la reserva: el enlace público, el widget en su sitio o la vista previa del panel. */
export type BookingSurface = "link" | "widget" | "preview";

export interface BookingUtm {
  source: string;
  medium: string;
  campaign: string;
}

/** Los pasos que cuenta el embudo (el resto —perfil, sede, «Mis citas»— no lo cambia). */
const TRACKED: ReadonlySet<BookingStep> = new Set(["phone", "verify", "services", "barber", "time", "review", "payment", "confirmed"]);

/** La UTM del enlace con que llegó (`utm_source`, `utm_medium`, `utm_campaign`), o nada. */
export function utmFrom(search: string): BookingUtm | null {
  const params = new URLSearchParams(search);
  const source = params.get("utm_source")?.trim();
  if (!source) return null;
  return { source, medium: params.get("utm_medium")?.trim() ?? "", campaign: params.get("utm_campaign")?.trim() ?? "" };
}

/**
 * Registra a qué pasos llega esta sesión, una vez por paso, para el embudo del dueño. Anónimo (una
 * sesión al azar, sin datos del cliente) y sin bloquear nada: si falla, no pasa nada.
 */
export function useFunnelTracking(step: BookingStep, surface: BookingSurface): { sessionId: string; utm: BookingUtm | null } {
  const [tracking] = React.useState(() => ({ sessionId: crypto.randomUUID(), utm: typeof window === "undefined" ? null : utmFrom(window.location.search) }));
  const sent = React.useRef(new Set<BookingStep>());
  React.useEffect(() => {
    if (!TRACKED.has(step) || sent.current.has(step)) return;
    sent.current.add(step);
    void bookingApi.trackEvent({ sessionId: tracking.sessionId, step, surface, source: tracking.utm?.source ?? "" }).catch(() => undefined);
  }, [step, surface, tracking]);
  return tracking;
}
