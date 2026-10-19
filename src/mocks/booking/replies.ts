import { db } from "../db";
import type { MockAppointment } from "../calendar/seed";
import { findByPhone, profileOf, saveProfile } from "../customers/handlers";
import type { MockInboundReply } from "./state";
import { logPrivacyRequest } from "../customers/privacy";

/**
 * Las respuestas de los clientes por WhatsApp, aplicadas a la cita y a su ficha. Llegan clasificadas
 * por el servidor (`server/whatsapp/inbound.ts`, con reglas) desde `/api/whatsapp/inbox`:
 *
 * - **Confirmo** → la cita queda confirmada (`via: "whatsapp"`).
 * - **Reprogramar** → `reschedule_requested`: recepción la mueve; no se mueve sola.
 * - **Cancelar** → `declined`: recepción la cancela o le escribe. No se cancela sola: una palabra mal
 *   entendida no puede tumbar una cita.
 * - **BAJA/STOP** → el cliente deja de aceptar promociones (el servidor ya las bloquea).
 * - Lo demás queda escrito en la cita y avisa a recepción.
 *
 * La cita sale del mensaje al que responde; si no responde a ninguno, de su próxima cita por venir.
 * A «ya casi te toca» (la fila sin cita) se responde «Voy» o «Ya no voy»: lo segundo lo saca de la fila.
 */

export interface InboxEvent {
  wamid: string;
  at: string;
  from: string;
  intent: MockInboundReply["intent"];
  text: string;
  messageId: string | null;
  /** Por dónde llegó; sin él, WhatsApp. */
  channel?: "whatsapp" | "sms";
  /** Solo la demo: la cita a la que va, cuando no hay mensaje al que responder. */
  appointmentId?: string;
}

/** Hasta cuántas horas después de empezar una cita se le sigue atribuyendo una respuesta sin contexto. */
const LATE_HOURS = 2;
const HOUR_MS = 3_600_000;

const historyId = () => `h_${Math.random().toString(36).slice(2, 9)}`;
const ACTOR = "Cliente (respondió el mensaje)";

/** La próxima cita por venir del cliente (o la que acaba de empezar). */
function nextAppointmentOf(clientId: string, now: Date): MockAppointment | undefined {
  return db.calendar.appointments
    .filter((item) => item.clientId === clientId && item.status === "scheduled" && new Date(item.start).getTime() >= now.getTime() - LATE_HOURS * HOUR_MS)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
}

function targetOf(event: InboxEvent, now: Date): { appointment: MockAppointment | undefined; clientId: string | null } {
  const direct = event.appointmentId ? db.calendar.appointments.find((item) => item.id === event.appointmentId) : undefined;
  if (direct) return { appointment: direct.status === "scheduled" ? direct : undefined, clientId: direct.clientId };
  const message = event.messageId ? (db.booking.outbox ?? []).find((item) => item.id === event.messageId) : undefined;
  if (message) {
    const appointment = db.calendar.appointments.find((item) => item.id === message.appointmentId);
    return { appointment: appointment?.status === "scheduled" ? appointment : undefined, clientId: message.clientId };
  }
  const client = findByPhone(`+${event.from}`);
  return { appointment: client ? nextAppointmentOf(client.id, now) : undefined, clientId: client?.id ?? null };
}

const CONFIRMATION: Partial<Record<MockInboundReply["intent"], "confirmed" | "reschedule_requested" | "declined">> = {
  confirm: "confirmed",
  reschedule: "reschedule_requested",
  cancel: "declined",
};

/** La entrada de la fila sin cita a la que responde: por el mensaje «ya casi te toca» o, sin él, por su celular hoy. */
function queueEntryOf(event: InboxEvent, now: Date) {
  const message = event.messageId ? (db.booking.outbox ?? []).find((item) => item.id === event.messageId) : undefined;
  if (message?.queueEntryId) return db.frontDesk.queue.find((entry) => entry.id === message.queueEntryId && entry.status === "waiting");
  const today = now.toISOString().slice(0, 10);
  return db.frontDesk.queue.find((entry) => entry.status === "waiting" && entry.phone?.replace(/\D/g, "") === event.from && entry.joinedAt.slice(0, 10) === today);
}

/** Aplica una respuesta; `null` si ya estaba aplicada. */
export function applyReply(event: InboxEvent, now: Date = new Date()): MockInboundReply | null {
  if ((db.booking.inbound ?? []).some((item) => item.id === event.wamid)) return null;
  const answersQueue = Boolean(event.messageId && (db.booking.outbox ?? []).find((item) => item.id === event.messageId)?.queueEntryId);
  const { appointment, clientId } = answersQueue ? { appointment: undefined, clientId: null } : targetOf(event, now);
  // «Ya no voy» a la fila sin cita: sale de la fila y cuenta como que se fue.
  const queueEntry = !appointment && event.intent === "cancel" ? queueEntryOf(event, now) : undefined;
  if (queueEntry) db.frontDesk = { ...db.frontDesk, queue: db.frontDesk.queue.map((entry) => (entry.id === queueEntry.id ? { ...entry, status: "left", leftAt: event.at } : entry)) };
  const status = CONFIRMATION[event.intent];
  if (appointment && status) {
    const updated: MockAppointment = {
      ...appointment,
      confirmation: { status, at: event.at, via: "whatsapp" },
      history: [...appointment.history, { id: historyId(), at: event.at, actor: ACTOR, event: status === "confirmed" ? "confirmed" : `reply:${event.intent}` }],
    };
    db.calendar.appointments = db.calendar.appointments.map((item) => (item.id === updated.id ? updated : item));
  } else if (appointment && event.intent === "other") {
    db.calendar.appointments = db.calendar.appointments.map((item) => (item.id === appointment.id ? { ...item, history: [...item.history, { id: historyId(), at: event.at, actor: ACTOR, event: "reply:other" }] } : item));
  }
  const client = clientId ? db.calendar.clients.find((item) => item.id === clientId) : undefined;
  if (client && (event.intent === "stop" || event.intent === "start")) {
    const profile = profileOf(client);
    const sms = event.channel === "sms";
    // Volver a aceptar promociones pide el texto del permiso: con ALTA solo se anota; con BAJA se retira ya.
    // STOP por SMS además corta todos los SMS a ese número (también los de sus citas) hasta que responda ALTA.
    if (event.intent === "stop") {
      saveProfile(client.id, { ...profile, marketingConsent: { accepted: false, at: event.at, source: sms ? "sms" : "whatsapp" }, ...(sms ? { smsStop: { at: event.at } } : {}) });
      logPrivacyRequest(client, "revoke", sms ? "sms" : "whatsapp", sms ? "Respondió STOP por SMS: sin promociones ni SMS." : "Respondió BAJA por WhatsApp: sin promociones.", "Cliente", true, new Date(event.at));
    } else if (sms && profile.smsStop) saveProfile(client.id, { ...profile, smsStop: null });
  }
  const reply: MockInboundReply = { id: event.wamid, at: event.at, from: event.from, intent: event.intent, text: event.text, channel: event.channel, appointmentId: appointment?.id ?? null, clientId };
  db.booking.inbound = [...(db.booking.inbound ?? []), reply];
  db.persist();
  return reply;
}

/** Las respuestas ligadas a una cita, de la más reciente a la más vieja. */
export const repliesOf = (appointmentId: string): MockInboundReply[] =>
  (db.booking.inbound ?? []).filter((item) => item.appointmentId === appointmentId).sort((a, b) => b.at.localeCompare(a.at));
