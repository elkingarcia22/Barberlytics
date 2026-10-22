import { differenceInCalendarDays } from "date-fns";
import { useCustomerQuery } from "@/features/customers/queries";
import type { CustomerAppointment } from "@/features/customers/types";

/**
 * Lo que se lee del historial del cliente en la página «Ver todo del cliente»:
 * las visitas atendidas, cuántos días pasaron entre una y otra (su ritmo real)
 * y con qué barbero se queda (la fidelidad que antes contaba producción).
 */

/** Cuántos saltos entre visitas se pintan: los más recientes. */
export const GAPS_SHOWN = 6;

export interface BarberLoyalty {
  /** Visitas atendidas por el barbero de esta cita. */
  withBarber: number;
  /** Visitas atendidas en total. */
  total: number;
  /** Cuántos barberos distintos a este lo han atendido. */
  otherBarbers: number;
  /** Visitas seguidas (las más recientes) con este barbero. */
  streak: number;
}

/** Las atendidas, de la más reciente a la más vieja. */
export function completedVisits(appointments: readonly CustomerAppointment[]): CustomerAppointment[] {
  return appointments.filter((item) => item.status === "completed").sort((a, b) => b.start.localeCompare(a.start));
}

/** Los días entre visitas atendidas, de la más vieja a la más reciente (las últimas `GAPS_SHOWN`). */
export function visitGaps(appointments: readonly CustomerAppointment[]): number[] {
  const visits = completedVisits(appointments).reverse();
  const gaps = visits.slice(1).map((visit, index) => differenceInCalendarDays(new Date(visit.start), new Date(visits[index].start)));
  return gaps.slice(-GAPS_SHOWN);
}

/** Cómo le va con el barbero de esta cita frente a los demás. Sin barbero (venta de mostrador), no cuenta. */
export function barberLoyalty(appointments: readonly CustomerAppointment[], barberId: string | null): BarberLoyalty {
  const visits = completedVisits(appointments).filter((item) => item.barberId !== null);
  const withBarber = visits.filter((item) => item.barberId === barberId).length;
  const others = new Set(visits.map((item) => item.barberId).filter((id) => id !== barberId));
  const firstOther = visits.findIndex((item) => item.barberId !== barberId);
  return { withBarber, total: visits.length, otherBarbers: others.size, streak: firstOther === -1 ? visits.length : firstOther };
}

/** El historial del cliente: la misma consulta que su ficha, así comparten caché. */
export function useClientVisits(clientId: string | undefined) {
  const query = useCustomerQuery(clientId ?? "");
  return { appointments: query.data?.appointments ?? [], isLoading: query.isLoading, isError: query.isError };
}
