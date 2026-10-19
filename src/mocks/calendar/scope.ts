import { db } from "../db";
import { isOwnClient } from "../customers/handlers";
import { isBarber, sessionOf } from "../session";
import type { MockAppointment, MockClient, MockTimeBlock } from "./seed";

/**
 * La agenda que ve un barbero, recortada en el servidor (docs/roles/01-calendario.md y
 * docs/API_CONTRACT.md, «Permisos en el servidor»): su columna, sus citas y sus bloqueos. De los
 * clientes recibe la ficha de los suyos; del resto, solo el nombre, para poder buscarlo al agendar.
 * La pantalla recortaba esto mismo (`calendarAccess.ts`); ahora no depende de ella.
 */

/** La ficha del barbero que llama, o `null` si no es barbero (dueño, administrador, recepción). */
export function barberOf(request: Request): string | null {
  const session = sessionOf(request);
  return session && isBarber(session) ? session.memberId : null;
}

const YEAR_MS = 365 * 86_400_000;

/**
 * Los clientes que son suyos: los de Clientes más los que atendió (o tiene agendados) con él en el último
 * año en la agenda. Una cita cancelada o a la que no vino no los hace suyos.
 */
export function ownClientIds(memberId: string, now = Date.now()): Set<string> {
  const ids = new Set(
    db.calendar.appointments
      .filter((item) => item.barberId === memberId && item.status !== "cancelled" && item.status !== "no_show" && now - new Date(item.start).getTime() <= YEAR_MS)
      .map((item) => item.clientId)
  );
  for (const client of db.calendar.clients) if (!ids.has(client.id) && isOwnClient(client, memberId)) ids.add(client.id);
  return ids;
}

/** Un cliente ajeno: el nombre y la foto para encontrarlo; sin teléfono, notas de salud ni historial. */
export const redactClient = (client: MockClient): MockClient => ({ ...client, phone: "", notes: [], visits: 0, cancellations: 0, noShows: 0, lastVisitAt: null, preferredBarberId: null, visitEveryDays: null });

export const ownAppointments = <T extends Pick<MockAppointment, "barberId">>(items: readonly T[], memberId: string | null): T[] => (memberId ? items.filter((item) => item.barberId === memberId) : [...items]);
export const ownBlocks = (blocks: readonly MockTimeBlock[], memberId: string | null): MockTimeBlock[] => (memberId ? blocks.filter((block) => block.barberId === memberId) : [...blocks]);
