import { db } from "../db";
import type { MockAppointment } from "../calendar/seed";
import type { MockOutboxMessage } from "./state";

/**
 * Envía los mensajes del outbox que ya tocan. Cada uno sale como plantilla de WhatsApp por
 * `/api/whatsapp/send` (la función de servidor con las claves); si WhatsApp no está conectado
 * (501), queda como enviado **simulado** para que la demo siga; si WhatsApp lo rechaza, queda
 * fallido con su motivo. El backend real hará esto con una cola y reintentos.
 */

export interface SendResult {
  status: "sent" | "simulated" | "failed";
  providerId?: string | null;
  error?: string;
}

export interface WhatsAppPayload {
  to: string;
  kind: MockOutboxMessage["kind"];
  params: string[];
  buttonParam?: string;
}

export type Sender = (payload: WhatsAppPayload) => Promise<SendResult>;

/** El envío de verdad: la función de servidor. Fuera del navegador (pruebas) no hay a dónde mandar: simulado. */
export const httpSender: Sender = async (payload) => {
  if (typeof window === "undefined") return { status: "simulated" };
  try {
    const response = await fetch("/api/whatsapp/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    if (response.status === 501 || response.status === 404) return { status: "simulated" };
    const body = (await response.json().catch(() => ({}))) as { id?: string | null; message?: string };
    return response.ok ? { status: "sent", providerId: body.id ?? null } : { status: "failed", error: body.message ?? `WhatsApp respondió ${response.status}.` };
  } catch {
    return { status: "simulated" };
  }
};

const WHEN: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" };

const firstName = (name: string) => name.split(" ")[0] || name;

/** Los valores de la plantilla: a quién, qué, cuándo y con quién (en el orden de {{1}}, {{2}}…). */
export function payloadOf(message: MockOutboxMessage): WhatsAppPayload | null {
  const client = db.calendar.clients.find((item) => item.id === message.clientId);
  if (!client || !message.to) return null;
  const appointment = db.calendar.appointments.find((item) => item.id === message.appointmentId);
  const start = message.offer?.start ?? appointment?.start;
  if (!start) return null;
  const when = new Intl.DateTimeFormat("es-CO", WHEN).format(new Date(start));
  const barberId = message.offer?.barberId ?? appointment?.barberId;
  const barber = db.team.members.find((member) => member.id === barberId);
  const branchId = message.offer?.branchId ?? appointment?.branchId ?? "";
  const branch = (db.settings.lists.branches.find((item) => item.id === branchId)?.name as string | undefined) ?? branchId;
  const services = (appointment?.serviceIds ?? []).map((id) => db.services.items.find((service) => service.id === id)?.name ?? id).join(" + ");
  const params =
    message.kind === "confirmation" || message.kind === "rescheduled"
      ? [firstName(client.name), services || "tu cita", when, branch]
      : [firstName(client.name), when, barber ? barber.firstName : branch];
  // El botón de la plantilla: confirmar la cita o, si se liberó una hora, reservarla.
  const buttonParam = message.kind === "slotFreed" || message.kind === "reactivation" ? `${branchId}?hora=${encodeURIComponent(start)}` : appointment?.confirmToken;
  return { to: message.to, kind: message.kind, params, buttonParam };
}

/** Envía lo que toca a `now`. Devuelve cuántos salieron, cuántos se simularon y cuántos fallaron. */
export async function dispatchDue(now: Date = new Date(), sender: Sender = httpSender): Promise<{ sent: number; simulated: number; failed: number }> {
  const due = (db.booking.outbox ?? []).filter((message) => message.status === "scheduled" && new Date(message.sendAt).getTime() <= now.getTime());
  const counts = { sent: 0, simulated: 0, failed: 0 };
  const results = new Map<string, Partial<MockOutboxMessage>>();
  for (const message of due) {
    const payload = payloadOf(message);
    const result: SendResult = payload ? await sender(payload) : { status: "failed", error: "Falta el número o la cita." };
    counts[result.status] += 1;
    results.set(message.id, {
      status: result.status === "failed" ? "failed" : "sent",
      simulated: result.status === "simulated",
      providerId: result.providerId ?? null,
      error: result.error,
      sentAt: now.toISOString(),
    });
  }
  if (results.size > 0) {
    db.booking.outbox = (db.booking.outbox ?? []).map((message) => (results.has(message.id) ? { ...message, ...results.get(message.id) } : message));
    db.persist();
  }
  return counts;
}

/** Los mensajes de una cita, del más reciente al más antiguo: lo que se ve en su panel. */
export const messagesOf = (appointment: Pick<MockAppointment, "id">): MockOutboxMessage[] =>
  (db.booking.outbox ?? []).filter((message) => message.appointmentId === appointment.id).sort((a, b) => b.sendAt.localeCompare(a.sendAt));
