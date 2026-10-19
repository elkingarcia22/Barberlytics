import { jsonError, readJsonBody } from "../../server/http/request.js";
import { guardPaid, type PaidGuard } from "../../server/auth/guard.js";
import { MAX_BATCH, cancel, enqueue, readOutboxStore, statusOf, type OutboxStore } from "../../server/whatsapp/queue.js";

/**
 * /api/whatsapp/queue — la cola de WhatsApp del servidor (ver server/whatsapp/queue). Con sesión del
 * equipo; todo queda dentro de la barbería de la sesión.
 * - POST `{ items: [{ id, to, kind, params, buttonParam?, sendAt, consent? }] }` encola o reprograma.
 * - DELETE `?ids=a,b` anula los que aún no salieron.
 * - GET `?ids=a,b` dice en qué va cada uno.
 * Sin dónde guardar la cola responde 501 y la app deja los mensajes como simulados.
 */

const GUARD: PaidGuard = { name: "whatsapp-queue", quota: { perMinute: 60, perDay: 3000 }, ipPerMinute: 120 };
/** Un lote de 50 mensajes con sus valores. */
const MAX_BYTES = 60_000;

const json = (status: number, body: unknown): Response => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

const notConfigured = () => jsonError(501, "queue_not_configured", "La cola de WhatsApp no está configurada: los mensajes quedan como simulados.");

const idsOf = (request: Request): string[] =>
  (new URL(request.url).searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, MAX_BATCH);

async function withQueue(request: Request, run: (store: OutboxStore, tid: string, sub: string) => Promise<Response>): Promise<Response> {
  const session = guardPaid(request, GUARD);
  if (session instanceof Response) return session;
  const store = readOutboxStore();
  if (!store) return notConfigured();
  try {
    return await run(store, session.tid, session.sub);
  } catch {
    return jsonError(502, "queue_unreachable", "No se pudo leer la cola. Se reintenta en un momento.");
  }
}

export function POST(request: Request): Promise<Response> {
  return withQueue(request, async (store, tid, sub) => {
    const body = (await readJsonBody(request, MAX_BYTES)) as { items?: unknown } | undefined;
    if (!body || !Array.isArray(body.items)) return jsonError(400, "validation", "Faltan los mensajes.");
    return json(200, await enqueue(store, tid, sub, body.items));
  });
}

export function DELETE(request: Request): Promise<Response> {
  return withQueue(request, async (store, tid) => json(200, { items: await cancel(store, tid, idsOf(request)) }));
}

export function GET(request: Request): Promise<Response> {
  return withQueue(request, async (store, tid) => json(200, { items: await statusOf(store, tid, idsOf(request)) }));
}
