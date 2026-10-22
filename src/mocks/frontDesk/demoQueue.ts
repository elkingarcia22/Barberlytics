import { db } from "../db";
import type { MockQueueEntry } from "./state";

/**
 * Gente de muestra en la fila sin cita, para que la demo no arranque vacía: unos se unieron en línea
 * (desde el enlace de la barbería, todavía de camino) y otros llegaron caminando (kiosco o recepción).
 * Solo en el navegador (`enableDemoQueue` desde `browser.ts`): las pruebas parten de una fila vacía.
 * Se siembra una vez por sede y día; lo que pase después (llamar, «se fue») queda como en cualquier fila.
 */

let enabled = false;
export const enableDemoQueue = () => {
  enabled = true;
};

interface DemoPerson {
  firstName: string;
  phone: string | null;
  serviceIds: string[];
  /** Índice del barbero de la sede que pidió; `null` = sin preferencia. */
  barber: number | null;
  source: MockQueueEntry["source"];
  /** Hace cuántos minutos se unió. */
  minutesAgo: number;
}

const PEOPLE: readonly DemoPerson[] = [
  { firstName: "Julián", phone: null, serviceIds: ["svc_corte"], barber: null, source: "reception", minutesAgo: 32 },
  { firstName: "Mariana", phone: "+573005550101", serviceIds: ["svc_fade"], barber: 1, source: "online", minutesAgo: 26 },
  { firstName: "Kevin", phone: "+573005550102", serviceIds: ["svc_corte", "svc_barba"], barber: null, source: "kiosk", minutesAgo: 19 },
  { firstName: "Sofía", phone: "+573005550103", serviceIds: ["svc_cejas"], barber: null, source: "online", minutesAgo: 12 },
  { firstName: "Esteban", phone: null, serviceIds: ["svc_barba"], barber: null, source: "kiosk", minutesAgo: 7 },
  { firstName: "Camila", phone: "+573005550104", serviceIds: ["svc_corte"], barber: null, source: "online", minutesAgo: 3 },
];

const MINUTE_MS = 60_000;

export function seedDemoQueue(branchId: string, day: string, at: Date): void {
  const key = `${branchId}:${day}`;
  if (!enabled || (db.frontDesk.demoDays ?? []).includes(key)) return;
  const barbers = db.team.members.filter((member) => member.branchIds.includes(branchId) && member.status === "active" && (member.role.startsWith("barbero") || member.isAlsoBarber));
  const services = new Set(db.services.items.map((item) => item.id));
  const entries: MockQueueEntry[] = PEOPLE.filter((person) => person.serviceIds.every((id) => services.has(id))).map((person, index) => ({
    id: `q_demo_${branchId}_${day}_${index}`,
    branchId,
    day,
    firstName: person.firstName,
    phone: person.phone,
    clientId: null,
    serviceIds: person.serviceIds,
    barberId: person.barber === null ? null : (barbers[person.barber]?.id ?? null),
    status: "waiting",
    joinedAt: new Date(at.getTime() - person.minutesAgo * MINUTE_MS).toISOString(),
    source: person.source,
    calledAt: null,
    appointmentId: null,
    leftAt: null,
    // Ya se les avisó al unirse: el «ya casi te toca» de la demo no llena el buzón de mensajes.
    notifiedAt: person.phone ? at.toISOString() : null,
  }));
  db.frontDesk = { ...db.frontDesk, queue: [...db.frontDesk.queue, ...entries], demoDays: [...(db.frontDesk.demoDays ?? []), key] };
  db.persist();
}
