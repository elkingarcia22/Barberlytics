import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { ACCOUNTS, db } from "../db";
import { messagesOf, syncOutbox } from "../booking/dispatch";
import { applyReply, repliesOf } from "../booking/replies";
import type { MockInboundReply } from "../booking/state";

/** Lo que «escribe» el cliente al simular una respuesta en la demo. */
const SIMULATED_TEXT: Readonly<Record<MockInboundReply["intent"], string>> = { confirm: "Confirmo", reschedule: "¿Me la pueden pasar a otra hora?", cancel: "No puedo ir, lo siento", stop: "BAJA", start: "ALTA", other: "¿Tienen parqueadero?" };

/**
 * Los mensajes al cliente (WhatsApp). Reproduce docs/API_CONTRACT.md (sección «Mensajes»): enviar
 * los que tocan, ver los de una cita y confirmar una cita desde el enlace del mensaje.
 */

const LATENCY_MS = 150;

function error(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message }, { status });
}

function requireAuth(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const accountId = token ? db.sessions.get(token) : undefined;
  return ACCOUNTS.find((item) => item.id === accountId) ?? null;
}

const asRecord = (body: DefaultBodyType): Record<string, unknown> => (body && typeof body === "object" ? (body as Record<string, unknown>) : {});

export const messagesHandlers = [
  // Pone el outbox al día con la cola de WhatsApp del servidor. La app lo llama al abrir y cada
  // minuto; el backend real encola al programar y no necesita esto.
  http.post("*/api/messages/dispatch", async ({ request }) => {
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    return HttpResponse.json(await syncOutbox());
  }),

  http.get("*/api/appointments/:id/messages", async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const appointment = db.calendar.appointments.find((item) => item.id === params.id);
    if (!appointment) return error(404, "not_found", "Esa cita no existe.");
    const items = messagesOf(appointment).map(({ id, kind, channel, sendAt, sentAt, status, simulated, error: failure }) => ({ id, kind, channel, sendAt, sentAt: sentAt ?? null, status, simulated: simulated === true, error: failure ?? null }));
    const replies = repliesOf(appointment.id).map(({ id, at, intent, text }) => ({ id, at, intent, text }));
    return HttpResponse.json({ items, replies });
  }),

  // Solo en la demo: como si el cliente respondiera por WhatsApp al último mensaje de la cita. Pasa por
  // la misma función que aplica las respuestas reales (`applyReply`).
  http.post("*/api/appointments/:id/simulate-reply", async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const appointment = db.calendar.appointments.find((item) => item.id === params.id);
    if (!appointment) return error(404, "not_found", "Esa cita no existe.");
    const intent = String(asRecord(await request.json().catch(() => ({}))).intent ?? "") as MockInboundReply["intent"];
    if (!(intent in SIMULATED_TEXT)) return error(422, "validation", "Esa respuesta no existe.");
    const client = db.calendar.clients.find((item) => item.id === appointment.clientId);
    const reply = applyReply({ wamid: `sim_${Math.random().toString(36).slice(2, 12)}`, at: new Date().toISOString(), from: (client?.phone ?? "").replace(/\D/g, ""), intent, text: SIMULATED_TEXT[intent], messageId: null, appointmentId: appointment.id });
    return HttpResponse.json({ reply });
  }),

  // El enlace «Confirmar» del mensaje: sin sesión, con el token de la cita.
  http.post("*/api/booking/confirm", async ({ request }) => {
    await delay(LATENCY_MS);
    const token = String(asRecord(await request.json().catch(() => ({}))).token ?? "");
    const appointment = token ? db.calendar.appointments.find((item) => item.confirmToken === token) : undefined;
    if (!appointment) return error(404, "not_found", "Ese enlace no es válido o la cita ya no existe.");
    if (appointment.status === "cancelled" || appointment.status === "no_show") return error(409, "conflict", "Esa cita ya no está activa.");
    const confirmed = appointment.confirmation?.status === "confirmed" ? appointment : { ...appointment, confirmation: { status: "confirmed" as const, at: new Date().toISOString(), via: "link" as const }, history: [...appointment.history, { id: `h_${Math.random().toString(36).slice(2, 9)}`, at: new Date().toISOString(), actor: "Cliente", event: "confirmed" }] };
    db.calendar.appointments = db.calendar.appointments.map((item) => (item.id === confirmed.id ? confirmed : item));
    db.persist();
    const client = db.calendar.clients.find((item) => item.id === confirmed.clientId);
    const branch = db.settings.lists.branches.find((item) => item.id === confirmed.branchId);
    return HttpResponse.json({ start: confirmed.start, client: client?.name.split(" ")[0] ?? "", branch: (branch?.name as string | undefined) ?? "", confirmedAt: confirmed.confirmation?.at ?? null });
  }),
];
