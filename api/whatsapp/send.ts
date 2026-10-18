import { isSameOrigin, readJsonBody } from "../../server/http/request.js";
import { readWhatsAppConfig, sendTemplate } from "../../server/whatsapp/whatsapp.js";

/**
 * POST /api/whatsapp/send — envía una plantilla de WhatsApp (confirmación, recordatorio, hueco
 * liberado). Solo desde la propia app (mismo origen) y solo plantillas fijas; sin cuenta conectada
 * responde 501 y la app lo deja como simulado. El backend real lo llamará desde su cola de envíos.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return new Response(JSON.stringify({ code: "forbidden", message: "Origen no permitido." }), { status: 403, headers: { "content-type": "application/json" } });
  return sendTemplate(await readJsonBody(request), readWhatsAppConfig());
}
