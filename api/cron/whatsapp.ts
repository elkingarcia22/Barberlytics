import { timingSafeEqual } from "node:crypto";
import { jsonError } from "../../server/http/request.js";
import { runDue } from "../../server/whatsapp/queue.js";

/**
 * GET /api/cron/whatsapp — el cron de Vercel (vercel.json) envía lo que ya toca de la cola. Vercel
 * manda `Authorization: Bearer <CRON_SECRET>`; sin ese secreto configurado no atiende a nadie.
 */
export async function GET(request: Request): Promise<Response> {
  const secret = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.CRON_SECRET?.trim();
  if (!secret) return jsonError(503, "cron_not_configured", "Falta CRON_SECRET en el servidor.");
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return jsonError(401, "unauthorized", "No autorizado.");
  const counts = await runDue();
  return new Response(JSON.stringify(counts), { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}
