import { jsonError } from "../../server/http/request.js";
import { guardPaid } from "../../server/auth/guard.js";
import { readOutboxStore } from "../../server/whatsapp/queue.js";

/**
 * GET /api/whatsapp/inbox?after=N — las respuestas de los clientes que llegaron por WhatsApp después
 * del número `N`, de la barbería de la sesión: `{ events: [{ seq, wamid, at, from, intent, text,
 * messageId }], cursor }`. La app las aplica a la cita y al cliente y guarda el `cursor`.
 */

const LIMIT = 100;

export async function GET(request: Request): Promise<Response> {
  const session = guardPaid(request, { name: "whatsapp-inbox", quota: { perMinute: 30, perDay: 3000 }, ipPerMinute: 60 });
  if (session instanceof Response) return session;
  const store = readOutboxStore();
  if (!store) return jsonError(501, "queue_not_configured", "La cola de WhatsApp no está configurada.");
  const after = Math.max(0, Math.floor(Number(new URL(request.url).searchParams.get("after")) || 0));
  try {
    const events = await store.inbox(session.tid, after, LIMIT);
    return new Response(JSON.stringify({ events, cursor: events.at(-1)?.seq ?? after }), { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  } catch {
    return jsonError(502, "queue_unreachable", "No se pudo leer la bandeja. Se reintenta en un momento.");
  }
}
