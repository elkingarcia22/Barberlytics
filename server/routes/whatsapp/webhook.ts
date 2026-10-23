import { jsonError } from "../../http/request.js";
import { handleWebhook, verifySignature, verifySubscription } from "../../whatsapp/inbound.js";
import { readOutboxStore } from "../../whatsapp/queue.js";

/**
 * /api/whatsapp/webhook — lo que manda Meta (ver server/whatsapp/inbound).
 * - GET: verificación de la suscripción con `WHATSAPP_VERIFY_TOKEN` (devuelve `hub.challenge`).
 * - POST: respuestas de los clientes y estados de lo enviado, firmados con `WHATSAPP_APP_SECRET`.
 * Sin esos secretos no atiende: un webhook sin firma dejaría a cualquiera confirmar o cancelar citas.
 */

/** Un aviso de Meta trae como mucho unos pocos mensajes; con tope. */
const MAX_BYTES = 200_000;

const env = (): Record<string, string | undefined> => (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};

export function GET(request: Request): Response {
  const token = env().WHATSAPP_VERIFY_TOKEN?.trim();
  if (!token) return jsonError(503, "webhook_not_configured", "Falta WHATSAPP_VERIFY_TOKEN en el servidor.");
  const challenge = verifySubscription(new URL(request.url), token);
  return challenge === null ? jsonError(403, "forbidden", "Token de verificación incorrecto.") : new Response(challenge, { status: 200, headers: { "content-type": "text/plain" } });
}

export async function POST(request: Request): Promise<Response> {
  const secret = env().WHATSAPP_APP_SECRET?.trim();
  if (!secret) return jsonError(503, "webhook_not_configured", "Falta WHATSAPP_APP_SECRET en el servidor.");
  const raw = await request.text();
  if (Buffer.byteLength(raw) > MAX_BYTES) return jsonError(413, "too_large", "Aviso demasiado grande.");
  if (!verifySignature(raw, request.headers.get("x-hub-signature-256"), secret)) return jsonError(401, "bad_signature", "Firma inválida.");
  const store = readOutboxStore();
  if (!store) return jsonError(501, "queue_not_configured", "La cola de WhatsApp no está configurada.");
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return jsonError(400, "validation", "El aviso no es JSON.");
  }
  // Meta reintenta si no respondemos 200; los repetidos se descartan por su id.
  const result = await handleWebhook(store, body, { phoneNumberId: env().WHATSAPP_PHONE_NUMBER_ID?.trim() || null });
  return new Response(JSON.stringify(result), { status: 200, headers: { "content-type": "application/json" } });
}
