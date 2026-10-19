import { isActive, serviceSlots } from "./calendarModel";
import type { Appointment, CalendarCatalog } from "./types";

/**
 * Los recursos especiales en la agenda (un sillón de lavado, el vaporizador…):
 * qué citas del día los ocupan y cuándo se piden más de los que hay. Un
 * recurso se ocupa solo durante el tramo de su servicio, no toda la cita.
 * Sin interfaz, para el filtro de la agenda y las pruebas.
 */

/** Lo que la agenda necesita de un recurso (el de Servicios trae más). */
export interface AgendaResource {
  id: string;
  name: string;
  units: number;
  serviceIds: readonly string[];
}

export interface ResourceUse {
  appointment: Appointment;
  start: Date;
  end: Date;
}

/** Un momento en que se piden más unidades de las que hay. */
export interface ResourceClash {
  start: Date;
  end: Date;
  appointmentIds: string[];
}

export interface ResourceDay {
  uses: ResourceUse[];
  clashes: ResourceClash[];
}

/** Los tramos de las citas vivas del día que ocupan el recurso, por hora. */
export function resourceUses(resource: AgendaResource, appointments: readonly Appointment[], catalog: CalendarCatalog): ResourceUse[] {
  return appointments
    .filter(isActive)
    .flatMap((appointment) =>
      serviceSlots(catalog, appointment)
        .filter((slot) => resource.serviceIds.includes(slot.service.id))
        .map((slot) => ({ appointment, start: slot.start, end: slot.end }))
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Cuándo el recurso no da abasto: en cada comienzo de un tramo se cuenta
 * cuántos están en curso; con más que las unidades hay choque. Los choques
 * con las mismas citas se cuentan una vez.
 */
export function resourceClashes(resource: AgendaResource, uses: readonly ResourceUse[]): ResourceClash[] {
  const clashes = new Map<string, ResourceClash>();
  for (const use of uses) {
    const at = use.start.getTime();
    const running = uses.filter((other) => other.start.getTime() <= at && at < other.end.getTime());
    if (running.length <= resource.units) continue;
    const ids = [...new Set(running.map((item) => item.appointment.id))].sort();
    const key = ids.join(",");
    const end = new Date(Math.min(...running.map((item) => item.end.getTime())));
    if (!clashes.has(key)) clashes.set(key, { start: use.start, end, appointmentIds: ids });
  }
  return [...clashes.values()];
}

export function resourceDay(resource: AgendaResource, appointments: readonly Appointment[], catalog: CalendarCatalog): ResourceDay {
  const uses = resourceUses(resource, appointments, catalog);
  return { uses, clashes: resourceClashes(resource, uses) };
}

/** Si el filtro de servicios ya es exactamente el de un recurso (o lo contiene entero). */
export const resourceSelected = (resource: Pick<AgendaResource, "serviceIds">, serviceIds: readonly string[]): boolean =>
  resource.serviceIds.length > 0 && resource.serviceIds.every((id) => serviceIds.includes(id));

/** Marcar un recurso suma sus servicios al filtro; desmarcarlo los quita. */
export function toggleResource(resource: Pick<AgendaResource, "serviceIds">, serviceIds: readonly string[]): string[] {
  if (resourceSelected(resource, serviceIds)) return serviceIds.filter((id) => !resource.serviceIds.includes(id));
  return [...new Set([...serviceIds, ...resource.serviceIds])];
}
