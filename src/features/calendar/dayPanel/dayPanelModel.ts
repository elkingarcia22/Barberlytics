import { isActive } from "../calendarModel";
import type { Appointment } from "../types";

/** Lo que el panel del día cuenta, sin interfaz. */

export interface DayClient {
  clientId: string;
  /** Su primera cita del día (la que dice a qué hora llega). */
  first: Appointment;
  /** Cuántas citas vivas tiene ese día. */
  count: number;
}

/** Los clientes del día, uno por persona, en el orden en que llegan; sin las citas canceladas ni las de quien no vino. */
export function clientsOf(appointments: readonly Appointment[]): DayClient[] {
  const byClient = new Map<string, { first: Appointment; count: number }>();
  for (const appointment of [...appointments].sort((a, b) => a.start.localeCompare(b.start))) {
    if (!isActive(appointment)) continue;
    const seen = byClient.get(appointment.clientId);
    byClient.set(appointment.clientId, seen ? { ...seen, count: seen.count + 1 } : { first: appointment, count: 1 });
  }
  return [...byClient.entries()].map(([clientId, item]) => ({ clientId, ...item }));
}
