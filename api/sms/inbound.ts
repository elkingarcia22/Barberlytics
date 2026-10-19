import { jsonError } from "../../server/http/request.js";
import { handleSms, twiml, verifySmsSignature } from "../../server/sms/inbound.js";
import { readOutboxStore } from "../../server/whatsapp/queue.js";

/**
 * POST /api/sms/inbound — lo que responden los clientes por SMS (ver server/sms/inbound): STOP/BAJA,
 * START/ALTA, HELP/AYUDA y las respuestas a sus citas. Firmado con `SMS_AUTH_TOKEN` (el token de la
 * cuenta de Twilio); sin él no atiende. `SMS_WEBHOOK_URL` es la URL exacta configurada en el proveedor
 * (la firma se calcula sobre ella; detrás de un proxy `request.url` puede no coincidir).
 */

const MAX_BYTES = 20_000;

const env = (): Record<string, string | undefined> => (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};

export async function POST(request: Request): Promise<Response> {
  const token = env().SMS_AUTH_TOKEN?.trim();
  if (!token) return jsonError(503, "webhook_not_configured", "Falta SMS_AUTH_TOKEN en el servidor.");
  const raw = await request.text();
  if (Buffer.byteLength(raw) > MAX_BYTES) return jsonError(413, "too_large", "Aviso demasiado grande.");
  const params = new URLSearchParams(raw);
  const url = env().SMS_WEBHOOK_URL?.trim() || request.url;
  if (!verifySmsSignature(url, params, request.headers.get("x-twilio-signature"), token)) return jsonError(401, "bad_signature", "Firma inválida.");
  const store = readOutboxStore();
  if (!store) return jsonError(501, "queue_not_configured", "La bandeja de mensajes no está configurada.");
  const result = await handleSms(store, params, {
    fromNumber: env().SMS_FROM_NUMBER?.replace(/\D/g, "") || null,
    brand: env().SMS_BRAND_NAME?.trim() || "Tu barbería",
    contact: env().SMS_HELP_CONTACT?.trim() || "la barbería",
  });
  return new Response(twiml(result.reply), { status: 200, headers: { "content-type": "text/xml; charset=utf-8" } });
}
