import { appointmentStage, servicesOf, servicesPrice, STAGES, type AppointmentStage } from "./calendarModel";
import type { Appointment, CalendarCatalog } from "./types";

/**
 * En qué va cada cita ahora mismo y cuánto dinero lleva la jornada. Son
 * cuentas sobre las citas que ya están en pantalla —no piden nada al
 * servidor— y cada grupo sirve de filtro de la agenda.
 *
 * El orden es el de la urgencia en recepción: lo que ya se pasó de hora, lo
 * que está listo para cobrar, quien espera, quien está en silla, lo que
 * falta por llegar y lo ya cobrado.
 */

export const PULSE_FOCUSES = STAGES;
export type PulseFocus = AppointmentStage;

/** En cuál de los grupos cae una cita; `null` si está anulada. */
export const pulseGroup = appointmentStage;

export interface DayPulse {
  counts: Record<PulseFocus, number>;
  total: number;
  /** Lo ya cobrado y lo que sumará el día si todas las citas se atienden. */
  collected: number;
  expected: number;
}

export function dayPulse(appointments: readonly Appointment[], catalog: CalendarCatalog, now: Date | undefined): DayPulse {
  const counts: Record<PulseFocus, number> = { late: 0, toCollect: 0, waiting: 0, seated: 0, upcoming: 0, paid: 0 };
  let total = 0;
  let collected = 0;
  let expected = 0;
  for (const appointment of appointments) {
    const group = pulseGroup(appointment, now);
    if (!group) continue;
    counts[group] += 1;
    total += 1;
    const amount = appointment.payment?.total ?? servicesPrice(servicesOf(catalog, appointment));
    expected += amount;
    if (group === "paid") collected += amount;
  }
  return { counts, total, collected, expected };
}
