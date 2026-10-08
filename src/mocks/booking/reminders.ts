import { db } from "../db";
import type { MockAppointment } from "../calendar/seed";
import type { MockOutboxMessage } from "./state";

/**
 * Los mensajes que la reserva deja programados, como haría el servidor real con su proveedor de
 * WhatsApp/SMS: la confirmación al reservar (con «Confirmo» / «Reprogramar») y los recordatorios
 * 24 h y 2 h antes. Mover la cita los reprograma; cancelarla los anula. En la demo no se envía
 * nada: quedan en `db.booking.outbox` para que el backend real los tome de aquí.
 */

const HOUR_MS = 3_600_000;
const REMINDERS: readonly { kind: MockOutboxMessage["kind"]; hoursBefore: number }[] = [
  { kind: "reminder24h", hoursBefore: 24 },
  { kind: "reminder2h", hoursBefore: 2 },
];

const outbox = (): MockOutboxMessage[] => db.booking.outbox ?? [];
let seq = 0;
const nextId = () => `msg_${Date.now().toString(36)}_${(seq += 1)}`;

/** Programa la confirmación y los recordatorios que aún estén en el futuro. */
export function scheduleMessages(appointment: MockAppointment, phone: string, now = new Date()): void {
  const start = new Date(appointment.start).getTime();
  const base = { appointmentId: appointment.id, clientId: appointment.clientId, to: phone, channel: "whatsapp" as const, status: "scheduled" as const };
  const messages: MockOutboxMessage[] = [{ ...base, id: nextId(), kind: "confirmation", sendAt: now.toISOString() }];
  for (const reminder of REMINDERS) {
    const sendAt = start - reminder.hoursBefore * HOUR_MS;
    if (sendAt > now.getTime()) messages.push({ ...base, id: nextId(), kind: reminder.kind, sendAt: new Date(sendAt).toISOString() });
  }
  db.booking.outbox = [...outbox(), ...messages];
}

/** Anula lo pendiente de una cita (al cancelarla o antes de reprogramarla). */
export function cancelMessages(appointmentId: string): void {
  db.booking.outbox = outbox().map((message) => (message.appointmentId === appointmentId && message.status === "scheduled" ? { ...message, status: "cancelled" } : message));
}

/** La cita cambió de hora: los recordatorios se mueven con ella (sin repetir la confirmación). */
export function rescheduleMessages(appointment: MockAppointment, phone: string, now = new Date()): void {
  cancelMessages(appointment.id);
  scheduleMessages(appointment, phone, now);
  // El aviso del cambio sale ya; los recordatorios quedan para la hora nueva.
  db.booking.outbox = outbox().map((message) => (message.appointmentId === appointment.id && message.kind === "confirmation" && message.status === "scheduled" ? { ...message, kind: "rescheduled" } : message));
}

/** A cuántos de la lista de espera se avisa por cada hueco que se libera (gana el primero que reserva). */
const REFILL_NOTIFY = 3;
const durationOfService = (serviceId: string): number => db.services.items.find((item) => item.id === serviceId)?.durationMin ?? 30;

/**
 * Se liberó una hora (alguien canceló): avisa por WhatsApp a los primeros de la lista de espera de
 * ese día cuya franja la incluye, cuyo barbero (si pidieron uno) es el mismo y cuyo servicio cabe.
 * El primero que la reserve se la queda. Devuelve a quién se avisó.
 */
export function offerFreedSlot(freed: MockAppointment, now = new Date()): string[] {
  const day = freed.start.slice(0, 10);
  const hour = `${freed.start.slice(11, 13)}:00`;
  const matches = db.calendar.waitlist
    .filter((entry) => entry.branchId === freed.branchId && entry.clientId !== freed.clientId)
    .filter((entry) => entry.slots.some((slot) => slot.date === day && slot.time === hour))
    .filter((entry) => entry.barberId === null || entry.barberId === freed.barberId)
    .filter((entry) => durationOfService(entry.serviceId) <= freed.durationMin)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, REFILL_NOTIFY);
  const messages: MockOutboxMessage[] = matches.map((entry) => ({
    id: nextId(),
    appointmentId: freed.id,
    clientId: entry.clientId,
    to: db.calendar.clients.find((client) => client.id === entry.clientId)?.phone ?? "",
    channel: "whatsapp",
    kind: "slotFreed",
    sendAt: now.toISOString(),
    status: "scheduled",
    offer: { start: freed.start, barberId: freed.barberId, branchId: freed.branchId },
  }));
  db.booking.outbox = [...outbox(), ...messages];
  return matches.map((entry) => entry.clientId);
}
