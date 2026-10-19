import { createHmac, timingSafeEqual } from "node:crypto";
import { DEMO_TENANT } from "../auth/demoAccounts.js";
import { classifyReply } from "../whatsapp/inbound.js";
import type { InboxEvent, OutboxStore } from "../whatsapp/queue.js";

/**
 * Lo que responden los clientes por SMS (el webhook del proveedor, con el formato de Twilio: un
 * formulario con `From`, `To`, `Body` y `MessageSid`, firmado en `X-Twilio-Signature`).
 *
 * - **STOP/BAJA** (y las palabras que exigen los operadores de EE. UU.: STOPALL, UNSUBSCRIBE, CANCEL, END,
 *   QUIT): ese número no recibe más SMS de la barbería, ni siquiera los de sus citas, y deja de aceptar
 *   promociones por cualquier canal. Se contesta una sola vez para confirmarlo.
 * - **START/ALTA**: vuelve a recibir SMS (las promociones siguen pidiendo su permiso con el texto legal).
 * - **HELP/AYUDA**: quién escribe, para qué y cómo darse de baja.
 * - Lo demás («confirmo», «cancelar la cita»…) se clasifica como en WhatsApp y va a la bandeja.
 *
 * La barbería sale del número que recibió el SMS (`SMS_FROM_NUMBER`); mientras haya una sola, es la demo.
 */

export type SmsKeyword = "stop" | "start" | "help";

const plain = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Las palabras de los operadores (CTIA) y sus equivalentes en español: el mensaje entero es esa palabra. */
const KEYWORDS: ReadonlyArray<[RegExp, SmsKeyword]> = [
  [/^(stop|stopall|unsubscribe|cancel|end|quit|baja|parar|detener|no mas)$/, "stop"],
  [/^(start|unstop|alta|reanudar)$/, "start"],
  [/^(help|info|ayuda)$/, "help"],
];

const ENGLISH = /^(stop|stopall|unsubscribe|cancel|end|quit|start|unstop|help|info)$/;

export function smsKeyword(text: string): SmsKeyword | null {
  const words = plain(text);
  for (const [pattern, keyword] of KEYWORDS) if (pattern.test(words)) return keyword;
  return null;
}

/** Qué quiere decir el SMS: primero las palabras de baja y ayuda; luego, como una respuesta de WhatsApp. */
export function classifySms(text: string): InboxEvent["intent"] {
  return smsKeyword(text) ?? classifyReply(text);
}

/**
 * La firma de Twilio: HMAC-SHA1 con el token de la cuenta sobre la URL del webhook seguida de cada
 * parámetro del formulario (ordenados por nombre, nombre y valor pegados), en base64.
 */
export function smsSignature(url: string, params: URLSearchParams, authToken: string): string {
  const keys = [...new Set(params.keys())].sort();
  const data = url + keys.map((key) => key + params.getAll(key).join("")).join("");
  return createHmac("sha1", authToken).update(data, "utf8").digest("base64");
}

export function verifySmsSignature(url: string, params: URLSearchParams, header: string | null, authToken: string): boolean {
  if (!header) return false;
  const expected = Buffer.from(smsSignature(url, params, authToken));
  const given = Buffer.from(header);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export interface SmsConfig {
  /** El número de la barbería que recibe los SMS, solo dígitos. */
  fromNumber: string | null;
  /** Cómo se presenta en la respuesta a HELP. */
  brand: string;
  /** Dónde pedir ayuda: teléfono o correo. */
  contact: string;
}

/** La respuesta de una palabra clave, en el idioma en que la escribió. */
export function keywordReply(keyword: SmsKeyword, english: boolean, config: SmsConfig): string {
  const { brand, contact } = config;
  if (english) {
    if (keyword === "stop") return `${brand}: you're unsubscribed and won't get more texts. Reply START to resubscribe.`;
    if (keyword === "start") return `${brand}: you're subscribed again to appointment texts. Reply STOP to opt out.`;
    return `${brand}: appointment texts and, if you agreed, offers. Msg & data rates may apply. Help: ${contact}. Reply STOP to opt out.`;
  }
  if (keyword === "stop") return `${brand}: te diste de baja y no recibirás más SMS. Responde ALTA para volver.`;
  if (keyword === "start") return `${brand}: vuelves a recibir los SMS de tus citas. Responde BAJA para no recibir más.`;
  return `${brand}: mensajes de tus citas y, si lo aceptaste, promociones. Ayuda: ${contact}. Responde BAJA para no recibir más.`;
}

const escapeXml = (text: string): string => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** La respuesta al proveedor (TwiML): un mensaje de vuelta o nada. */
export const twiml = (message: string | null): string => `<?xml version="1.0" encoding="UTF-8"?><Response>${message ? `<Message>${escapeXml(message)}</Message>` : ""}</Response>`;

const MAX_TEXT = 500;

export interface SmsResult {
  saved: boolean;
  intent: InboxEvent["intent"] | null;
  /** Lo que se le contesta al cliente (TwiML). */
  reply: string | null;
}

/** Aplica un SMS entrante: baja o alta del número, guarda la respuesta en la bandeja y dice qué contestar. */
export async function handleSms(store: OutboxStore, params: URLSearchParams, config: SmsConfig, now = new Date()): Promise<SmsResult> {
  const from = (params.get("From") ?? "").replace(/\D/g, "");
  const to = (params.get("To") ?? "").replace(/\D/g, "");
  const sid = params.get("MessageSid") ?? params.get("SmsSid") ?? "";
  const text = (params.get("Body") ?? "").slice(0, MAX_TEXT);
  if (!from || !sid) return { saved: false, intent: null, reply: null };
  const tid = config.fromNumber && to === config.fromNumber ? DEMO_TENANT : null;
  if (!tid) return { saved: false, intent: null, reply: null };
  const keyword = smsKeyword(text);
  const intent = classifySms(text);
  if (keyword === "stop") {
    // STOP por SMS corta todos los SMS de ese número y retira las promociones en cualquier canal.
    await store.setOptOut(tid, from, true, "sms");
    await store.setOptOut(tid, from, true);
  } else if (keyword === "start") {
    await store.setOptOut(tid, from, false, "sms");
  }
  const saved = await store.pushInbox(tid, { wamid: `sms:${sid}`, at: now.toISOString(), from, intent, text, messageId: null, channel: "sms" });
  // A un aviso repetido del proveedor no se le contesta otra vez.
  const reply = saved && keyword ? keywordReply(keyword, ENGLISH.test(plain(text)), config) : null;
  return { saved: saved !== null, intent, reply };
}
