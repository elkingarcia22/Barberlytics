import { isFromApp, jsonError, rateLimited, readJsonBody } from "../../server/http/request.js";
import { readWhatsAppConfig, sendTemplate } from "../../server/whatsapp/whatsapp.js";

/** Mensajes por minuto que acepta una IP: la cola de una barbería no pasa de unos pocos. */
const SENDS_PER_MINUTE = 20;

/**
 * POST /api/whatsapp/send — envía una plantilla de WhatsApp (confirmación, recordatorio, hueco
 * liberado). Solo desde la propia app (con `Origin` o `Referer` de este sitio), con tope por IP y
 * solo plantillas fijas; sin cuenta conectada responde 501 y la app lo deja como simulado.
 *
 * Mientras la cola corra en el navegador, esto es lo que hay. En producción la cola debe correr en
 * el servidor (un cron) y esta función dejar de ser pública.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isFromApp(request)) return jsonError(403, "forbidden", "Origen no permitido.");
  if (rateLimited(request, "whatsapp", SENDS_PER_MINUTE, 60_000)) return jsonError(429, "rate_limited", "Demasiados envíos seguidos. Espera un momento.");
  return sendTemplate(await readJsonBody(request), readWhatsAppConfig());
}
