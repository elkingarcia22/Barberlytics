import { createHmac, timingSafeEqual } from "node:crypto";
import { DEMO_TENANT } from "../auth/demoAccounts.js";
import type { InboxEvent, OutboxStore } from "./queue.js";

/**
 * Lo que llega de WhatsApp (el webhook de Meta): las respuestas del cliente y el estado de lo enviado.
 *
 * - **Respuestas.** «Confirmo», «Reprogramar», «Cancelar» (botón o texto) y BAJA/STOP se clasifican con
 *   reglas, no con un modelo: son pocas palabras y equivocarse aquí cuesta una cita. Lo que no se
 *   entiende queda como «otra» para que lo lea recepción. Se guardan en la bandeja de la barbería y
 *   la app las aplica a la cita y al cliente (`/api/whatsapp/inbox`).
 * - **BAJA/STOP.** El servidor deja de aceptar promociones para ese número en ese momento, sin esperar
 *   a la app; «ALTA»/«START» lo vuelve a permitir.
 * - **Estados.** Entregado y leído se guardan en el mensaje; si WhatsApp avisa que falló después de
 *   aceptarlo, el mensaje queda fallido con su motivo.
 *
 * La firma (`X-Hub-Signature-256`, HMAC con `WHATSAPP_APP_SECRET`) es obligatoria: sin ella cualquiera
 * podría confirmar o cancelar citas ajenas.
 */

export type ReplyIntent = InboxEvent["intent"];

const MAX_TEXT = 500;

const plain = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Botones de las plantillas (payload) → intención. */
const PAYLOADS: Readonly<Record<string, ReplyIntent>> = { CONFIRM: "confirm", RESCHEDULE: "reschedule", CANCEL: "cancel", STOP: "stop" };

/** Palabras sueltas que bastan solas (el mensaje entero es eso). */
const EXACT: ReadonlyArray<[RegExp, ReplyIntent]> = [
  [/^(stop|baja|parar|unsubscribe|cancelar suscripcion|no mas mensajes|no mas promociones)$/, "stop"],
  [/^(start|alta|unstop|suscribir)$/, "start"],
  [/^(si|sii+|ok|okay|okey|dale|listo|confirmo|confirmado|confirmada|confirm|yes|yep|ahi estare|alli estare|de una|perfecto|voy|ya voy|voy para alla|on my way|1)$/, "confirm"],
  [/^(2|reprogramar|cambiar|reagendar|reschedule)$/, "reschedule"],
  [/^(3|cancelar|cancela|cancel|no puedo|no voy)$/, "cancel"],
];

/** Frases que dicen lo mismo dentro de un mensaje más largo. El orden importa: cancelar gana a confirmar. */
const CONTAINS: ReadonlyArray<[RegExp, ReplyIntent]> = [
  [/\b(no (me )?(envien|manden|escriban) (mas )?(mensajes|promociones)|darme de baja|unsubscribe)\b/, "stop"],
  [/\b(cancel(ar|o|a|en)?|anular|ya no voy|no voy a ir|me sali de la fila|no (podre|puedo|voy a poder) (ir|llegar|asistir)|can t make it|cannot make it|not coming)\b/, "cancel"],
  [/\b(reprogram\w*|reagend\w*|cambiar (la )?(hora|cita|fecha|dia)|otro dia|otra hora|mas tarde|mas temprano|mover (la )?cita|reschedul\w*)\b/, "reschedule"],
  [/\b(confirm\w*|alli estare|ahi estare|cuenten conmigo|see you|i ll be there|nos vemos)\b/, "confirm"],
];

/** Qué quiere decir la respuesta. Reglas: lo que no encaja es `other` y lo lee una persona. */
export function classifyReply(text: string, payload?: string | null): ReplyIntent {
  const fromButton = payload ? PAYLOADS[payload.trim().toUpperCase()] : undefined;
  if (fromButton) return fromButton;
  const words = plain(text);
  if (!words) return "other";
  for (const [pattern, intent] of EXACT) if (pattern.test(words)) return intent;
  for (const [pattern, intent] of CONTAINS) if (pattern.test(words)) return intent;
  return "other";
}

/** La firma de Meta sobre el cuerpo tal como llegó. */
export function verifySignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`);
  const given = Buffer.from(header);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** La verificación de la suscripción (`GET` con `hub.challenge`): devuelve el reto o `null`. */
export function verifySubscription(url: URL, verifyToken: string): string | null {
  const params = url.searchParams;
  return params.get("hub.mode") === "subscribe" && params.get("hub.verify_token") === verifyToken ? params.get("hub.challenge") : null;
}

interface RawMessage {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { payload?: string; text?: string };
  interactive?: { button_reply?: { id?: string; title?: string } };
  context?: { id?: string };
}

interface RawStatus {
  id?: string;
  status?: string;
  errors?: { title?: string; message?: string }[];
}

interface RawValue {
  metadata?: { phone_number_id?: string };
  messages?: RawMessage[];
  statuses?: RawStatus[];
}

export interface ParsedReply {
  wamid: string;
  from: string;
  at: string;
  text: string;
  payload: string | null;
  contextId: string | null;
  phoneNumberId: string | null;
}

export interface ParsedStatus {
  providerId: string;
  status: "sent" | "delivered" | "read" | "failed";
  error: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** Las respuestas y los estados de un aviso de Meta; lo que no se reconoce se ignora. */
export function parseWebhook(body: unknown): { replies: ParsedReply[]; statuses: ParsedStatus[] } {
  const replies: ParsedReply[] = [];
  const statuses: ParsedStatus[] = [];
  const entries = isRecord(body) && Array.isArray(body.entry) ? body.entry : [];
  for (const entry of entries) {
    const changes = isRecord(entry) && Array.isArray(entry.changes) ? entry.changes : [];
    for (const change of changes) {
      if (!isRecord(change) || !isRecord(change.value)) continue;
      const value = change.value as RawValue;
      const phoneNumberId = value.metadata?.phone_number_id ?? null;
      for (const message of Array.isArray(value.messages) ? value.messages : []) {
        if (typeof message.id !== "string" || typeof message.from !== "string") continue;
        const text = message.text?.body ?? message.button?.text ?? message.interactive?.button_reply?.title ?? "";
        const payload = message.button?.payload ?? message.interactive?.button_reply?.id ?? null;
        const seconds = Number(message.timestamp);
        replies.push({
          wamid: message.id,
          from: message.from.replace(/\D/g, ""),
          at: Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : new Date().toISOString(),
          text: text.slice(0, MAX_TEXT),
          payload,
          contextId: message.context?.id ?? null,
          phoneNumberId,
        });
      }
      for (const status of Array.isArray(value.statuses) ? value.statuses : []) {
        if (typeof status.id !== "string" || !["sent", "delivered", "read", "failed"].includes(status.status ?? "")) continue;
        const error = status.errors?.[0];
        statuses.push({ providerId: status.id, status: status.status as ParsedStatus["status"], error: error ? (error.message ?? error.title ?? "WhatsApp no lo entregó.") : null });
      }
    }
  }
  return { replies, statuses };
}

export interface WebhookConfig {
  /** El número de la barbería en WhatsApp: mientras haya una sola, todo es de la demo. */
  phoneNumberId: string | null;
}

export interface WebhookResult {
  saved: number;
  optOuts: number;
  statuses: number;
}

/**
 * Aplica un aviso de Meta: guarda las respuestas en la bandeja de su barbería, marca BAJA/ALTA y pone
 * al día el estado de lo enviado. La barbería sale del mensaje al que responde; si no responde a
 * ninguno, del número de WhatsApp que lo recibió.
 */
export async function handleWebhook(store: OutboxStore, body: unknown, config: WebhookConfig): Promise<WebhookResult> {
  const { replies, statuses } = parseWebhook(body);
  const result: WebhookResult = { saved: 0, optOuts: 0, statuses: 0 };
  for (const reply of replies) {
    const origin = reply.contextId ? await store.byProvider(reply.contextId) : null;
    const tid = origin?.tid ?? (reply.phoneNumberId && reply.phoneNumberId === config.phoneNumberId ? DEMO_TENANT : null);
    if (!tid) continue;
    const intent = classifyReply(reply.text, reply.payload);
    if (intent === "stop" || intent === "start") {
      await store.setOptOut(tid, reply.from, intent === "stop");
      result.optOuts += 1;
    }
    const saved = await store.pushInbox(tid, { wamid: reply.wamid, at: reply.at, from: reply.from, intent, text: reply.text, messageId: origin?.id ?? null });
    if (saved) result.saved += 1;
  }
  for (const status of statuses) {
    const origin = await store.byProvider(status.providerId);
    const item = origin ? await store.get(origin.tid, origin.id) : null;
    if (!item) continue;
    result.statuses += 1;
    if (status.status === "failed") await store.put({ ...item, status: "failed", error: status.error });
    else if (status.status === "delivered" || status.status === "read") await store.put({ ...item, delivery: item.delivery === "read" ? "read" : status.status });
  }
  return result;
}
