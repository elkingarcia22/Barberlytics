import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { ACCOUNTS, db } from "../db";
import { messagesOf, syncOutbox } from "../booking/dispatch";

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

/** Lo más largo que se acepta de un mensaje al cliente (un recibo con varias líneas cabe de sobra). */
const MAX_BODY = 2000;

function fieldError(field: string, message: string) {
  return HttpResponse.json({ code: "validation", message, fields: { [field]: [message] } }, { status: 422 });
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
    return HttpResponse.json({ items });
  }),

  // Mandar al cliente, desde el panel de la cita, su recibo o el enlace para reagendar: por SMS o correo, en el momento.
  http.post("*/api/appointments/:id/messages", async ({ request, params }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    const appointment = db.calendar.appointments.find((item) => item.id === params.id);
    if (!appointment) return error(404, "not_found", "Esa cita no existe.");
    const input = asRecord(await request.json().catch(() => ({})));
    const kind = input.kind === "receipt" || input.kind === "rebookLink" ? input.kind : null;
    const channel = input.channel === "sms" ? "sms" : input.channel === "email" ? "email" : null;
    const to = String(input.to ?? "").trim();
    const body = String(input.body ?? "").trim();
    if (!kind || !channel) return fieldError("kind", "Elige qué mandar y por dónde.");
    if (kind === "receipt" && appointment.status !== "paid") return error(409, "conflict", "La cita aún no está cobrada.");
    if (channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return fieldError("to", "Revisa el correo.");
    if (channel === "sms" && to.replace(/\D/g, "").length < 8) return fieldError("to", "Revisa el celular.");
    if (body.length === 0 || body.length > MAX_BODY) return fieldError("body", "El mensaje está vacío o es muy largo.");
    const now = new Date().toISOString();
    db.booking.outbox = [
      ...(db.booking.outbox ?? []),
      { id: `msg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, appointmentId: appointment.id, clientId: appointment.clientId, to, channel, kind, sendAt: now, sentAt: now, status: "sent", simulated: true, body, by: account.user.name },
    ];
    db.persist();
    return HttpResponse.json({ channel, to }, { status: 201 });
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
