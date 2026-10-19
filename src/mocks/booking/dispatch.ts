import { db } from "../db";
import type { MockAppointment } from "../calendar/seed";
import { profileOf } from "../customers/handlers";
import { serverFetch } from "@/lib/api/serverSession";
import type { MockOutboxMessage } from "./state";

/**
 * El outbox de la app y la cola de WhatsApp del servidor (`/api/whatsapp/queue`, ver
 * server/whatsapp/queue). La app ya no envía: **encola** cada mensaje programado con su hora, anula
 * en la cola los que se cancelan aquí y refleja lo que el cron del servidor envió (o no pudo).
 *
 * Sin cola (501 sin almacén configurado, 404 sin funciones, sin red) la demo sigue como antes: lo que
 * ya toca queda como enviado **simulado**.
 */

export interface WhatsAppPayload {
  to: string;
  kind: MockOutboxMessage["kind"];
  params: string[];
  buttonParam?: string;
}

/** Un mensaje para la cola: la plantilla, cuándo sale y, si es promoción, el permiso del cliente. */
export interface QueueRequest extends WhatsAppPayload {
  id: string;
  sendAt: string;
  consent: { version: string; at: string } | null;
}

/** Lo que la cola dice de cada mensaje. */
export interface QueueView {
  id: string;
  status: "scheduled" | "sent" | "simulated" | "failed" | "cancelled";
  providerId: string | null;
  error: string | null;
  sentAt: string | null;
}

/** La cola del servidor. `null`: no hay cola (y los mensajes se simulan aquí). */
export interface Queue {
  enqueue(items: QueueRequest[]): Promise<QueueView[] | null>;
  cancel(ids: string[]): Promise<QueueView[] | null>;
  status(ids: string[]): Promise<QueueView[] | null>;
}

/** Mensajes por petición: el tope de la cola del servidor. */
const BATCH = 50;
const QUEUE_ENDPOINT = "/api/whatsapp/queue";

async function viewsOf(response: Response): Promise<QueueView[] | null> {
  if (!response.ok) return null;
  const body = (await response.json().catch(() => null)) as { items?: QueueView[] } | null;
  return Array.isArray(body?.items) ? body.items : null;
}

const call = async (init: RequestInit, ids?: string[]): Promise<QueueView[] | null> => {
  try {
    const url = ids ? `${QUEUE_ENDPOINT}?ids=${encodeURIComponent(ids.join(","))}` : QUEUE_ENDPOINT;
    return await viewsOf(await serverFetch(url, init));
  } catch {
    return null;
  }
};

/** La cola de verdad, con la sesión firmada del equipo. */
export const httpQueue: Queue = {
  enqueue: (items) => call({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items }) }),
  cancel: (ids) => call({ method: "DELETE" }, ids),
  status: (ids) => call({ method: "GET" }, ids),
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
      : message.kind === "reminder"
        ? [firstName(client.name), when, barber ? barber.firstName : branch, String(message.hoursBefore ?? "")]
        : [firstName(client.name), when, barber ? barber.firstName : branch];
  // El botón de la plantilla: confirmar la cita o, si se liberó una hora, reservarla.
  const buttonParam = message.kind === "slotFreed" || message.kind === "reactivation" ? `${branchId}?hora=${encodeURIComponent(start)}` : appointment?.confirmToken;
  return { to: message.to, kind: message.kind, params, buttonParam };
}

const chunks = <T,>(items: T[]): T[][] => Array.from({ length: Math.ceil(items.length / BATCH) }, (_, index) => items.slice(index * BATCH, (index + 1) * BATCH));

/** El permiso del cliente para promociones, como prueba para la cola (versión del texto y cuándo). */
function consentOf(message: MockOutboxMessage): QueueRequest["consent"] {
  const client = db.calendar.clients.find((item) => item.id === message.clientId);
  const consent = client ? profileOf(client).marketingConsent : undefined;
  return consent?.accepted ? { version: consent.version ?? "sin-version", at: consent.at } : null;
}

const MIRRORED: Partial<Record<QueueView["status"], MockOutboxMessage["status"]>> = { sent: "sent", simulated: "sent", failed: "failed" };

export interface SyncCounts {
  sent: number;
  simulated: number;
  failed: number;
}

/**
 * Pone el outbox al día con la cola: encola lo programado que aún no está, anula en la cola lo que se
 * canceló aquí y refleja lo que ya salió. Sin cola, simula lo que ya toca. Devuelve lo que cambió.
 */
export async function syncOutbox(now: Date = new Date(), queue: Queue = httpQueue): Promise<SyncCounts> {
  const counts: SyncCounts = { sent: 0, simulated: 0, failed: 0 };
  const changes = new Map<string, Partial<MockOutboxMessage>>();
  const outbox = (db.booking.outbox ?? []).filter((message) => message.kind !== "manual");
  const at = now.toISOString();
  const mirror = (view: QueueView) => {
    const status = MIRRORED[view.status];
    if (!status) return;
    counts[view.status === "failed" ? "failed" : view.status === "simulated" ? "simulated" : "sent"] += 1;
    changes.set(view.id, { status, simulated: view.status === "simulated", providerId: view.providerId, error: view.error ?? undefined, sentAt: view.sentAt ?? at, queued: false });
  };

  // 1. Lo programado que la cola aún no tiene.
  const pending = outbox.filter((message) => message.status === "scheduled" && !message.queued);
  const requests: QueueRequest[] = [];
  for (const message of pending) {
    const payload = payloadOf(message);
    if (!payload) {
      counts.failed += 1;
      changes.set(message.id, { status: "failed", error: "Falta el número o la cita.", sentAt: at });
      continue;
    }
    requests.push({ ...payload, id: message.id, sendAt: message.sendAt, consent: consentOf(message) });
  }
  let hasQueue = true;
  for (const batch of chunks(requests)) {
    const views = await queue.enqueue(batch);
    if (!views) {
      hasQueue = false;
      break;
    }
    const accepted = new Set(views.map((view) => view.id));
    for (const view of views) {
      if (view.status === "scheduled") changes.set(view.id, { queued: true });
      else mirror(view);
    }
    // Lo que la cola rechazó (p. ej. una promoción sin permiso) queda fallido con su motivo.
    for (const request of batch.filter((item) => !accepted.has(item.id))) {
      counts.failed += 1;
      changes.set(request.id, { status: "failed", error: "La cola de WhatsApp no aceptó el mensaje.", sentAt: at });
    }
  }

  if (!hasQueue) {
    // Sin cola: la demo sigue, lo que ya toca queda como enviado simulado.
    for (const request of requests.filter((item) => !changes.has(item.id) && Date.parse(item.sendAt) <= now.getTime())) {
      counts.simulated += 1;
      changes.set(request.id, { status: "sent", simulated: true, providerId: null, sentAt: at });
    }
  } else {
    // 2. Lo que se canceló aquí y seguía en la cola. 3. Lo que la cola ya envió.
    const cancelled = outbox.filter((message) => message.status === "cancelled" && message.queued).map((message) => message.id);
    for (const batch of chunks(cancelled)) if (await queue.cancel(batch)) batch.forEach((id) => changes.set(id, { queued: false }));
    const waiting = outbox.filter((message) => message.status === "scheduled" && message.queued && Date.parse(message.sendAt) <= now.getTime()).map((message) => message.id);
    for (const batch of chunks(waiting)) (await queue.status(batch))?.forEach(mirror);
  }

  if (changes.size > 0) {
    db.booking.outbox = (db.booking.outbox ?? []).map((message) => (changes.has(message.id) ? { ...message, ...changes.get(message.id) } : message));
    db.persist();
  }
  return counts;
}

/** Los mensajes de una cita, del más reciente al más antiguo: lo que se ve en su panel. */
export const messagesOf = (appointment: Pick<MockAppointment, "id">): MockOutboxMessage[] =>
  (db.booking.outbox ?? []).filter((message) => message.appointmentId === appointment.id).sort((a, b) => b.sendAt.localeCompare(a.sendAt));
