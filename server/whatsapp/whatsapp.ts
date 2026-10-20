/**
 * Enviar mensajes de WhatsApp con la API oficial (Meta Cloud API). Solo plantillas aprobadas: los
 * mensajes que inicia la barbería (confirmación, recordatorios, hueco liberado) tienen que ser
 * plantillas; el texto libre solo vale dentro de las 24 h que abre una respuesta del cliente.
 *
 * Sin `WHATSAPP_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID` responde 501 y la app marca el mensaje como
 * simulado: la demo funciona igual sin una cuenta conectada. Las claves viven en el servidor
 * (`.env.local` en local, variables de Vercel en producción) y nunca llegan al navegador.
 */

export const MESSAGE_KINDS = ["confirmation", "rescheduled", "reminder24h", "reminder2h", "reminder", "slotFreed", "reactivation", "queueAlmost", "giftCard"] as const;
export type MessageKind = (typeof MESSAGE_KINDS)[number];

/** El nombre de cada plantilla en el WhatsApp Manager; se cambian con `WHATSAPP_TEMPLATE_<KIND>`. */
const DEFAULT_TEMPLATES: Record<MessageKind, string> = {
  confirmation: "cita_confirmacion",
  rescheduled: "cita_reprogramada",
  reminder24h: "cita_recordatorio_24h",
  reminder2h: "cita_recordatorio_2h",
  /** Un recordatorio a otra hora que 24 h o 2 h (Configuración › Recordatorios): la hora va en la plantilla. */
  reminder: "cita_recordatorio",
  slotFreed: "hueco_liberado",
  /** «Te toca volver»: es de marketing en Meta y solo va a quien aceptó promociones. */
  reactivation: "reactivacion_cliente",
  /** «Ya casi te toca»: a quien se unió a la fila sin cita y dejó su celular. Botones «Voy» / «Ya no voy». */
  queueAlmost: "fila_casi_tu_turno",
  /** La tarjeta de regalo que alguien compró: a quien la recibe, con el código y el saldo. Es de servicio, no de marketing. */
  giftCard: "tarjeta_regalo",
};

const GRAPH_VERSION = "v21.0";
const MAX_PARAMS = 8;
const MAX_PARAM_LENGTH = 200;
/** Un número en formato internacional, sin «+»: entre 8 y 15 dígitos. */
const PHONE = /^\d{8,15}$/;

export interface WhatsAppConfig {
  token: string | null;
  phoneNumberId: string | null;
  language: string;
  templates: Record<MessageKind, string>;
}

export function readWhatsAppConfig(env: Record<string, string | undefined> = process.env): WhatsAppConfig {
  const templates = Object.fromEntries(MESSAGE_KINDS.map((kind) => [kind, env[`WHATSAPP_TEMPLATE_${kind.toUpperCase()}`] || DEFAULT_TEMPLATES[kind]])) as Record<MessageKind, string>;
  return { token: env.WHATSAPP_TOKEN || null, phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID || null, language: env.WHATSAPP_TEMPLATE_LANGUAGE || "es", templates };
}

export const isConfigured = (config: WhatsAppConfig): boolean => Boolean(config.token && config.phoneNumberId);

export interface SendInput {
  to: string;
  kind: MessageKind;
  /** Los valores de la plantilla, en orden ({{1}}, {{2}}…). */
  params: string[];
  /** El final del enlace del botón (p. ej. el token para confirmar), si la plantilla lo lleva. */
  buttonParam?: string;
}

/** Valida lo que llega del navegador; devuelve el mensaje listo o por qué no. */
export function parseSendInput(body: unknown): SendInput | string {
  if (!body || typeof body !== "object") return "Falta el mensaje.";
  const record = body as Record<string, unknown>;
  const to = typeof record.to === "string" ? record.to.replace(/\D/g, "") : "";
  if (!PHONE.test(to)) return "El número no es válido.";
  const kind = record.kind;
  if (!MESSAGE_KINDS.includes(kind as MessageKind)) return "Ese tipo de mensaje no existe.";
  const params = Array.isArray(record.params) ? record.params : [];
  if (params.length > MAX_PARAMS || params.some((item) => typeof item !== "string" || item.length === 0 || item.length > MAX_PARAM_LENGTH)) return "Los valores de la plantilla no son válidos.";
  const buttonParam = typeof record.buttonParam === "string" && record.buttonParam.length <= MAX_PARAM_LENGTH ? record.buttonParam : undefined;
  return { to, kind: kind as MessageKind, params: params as string[], buttonParam };
}

/** El cuerpo que espera la Graph API para una plantilla con sus valores y, si hay, el botón con enlace. */
export function templatePayload(input: SendInput, config: WhatsAppConfig) {
  const components: Record<string, unknown>[] = [{ type: "body", parameters: input.params.map((text) => ({ type: "text", text })) }];
  if (input.buttonParam) components.push({ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: input.buttonParam }] });
  return { messaging_product: "whatsapp", to: input.to, type: "template", template: { name: config.templates[input.kind], language: { code: config.language }, components } };
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

type Fetcher = typeof fetch;

/** Envía la plantilla. 501 sin cuenta conectada; 502 si WhatsApp la rechaza (con su motivo). */
export async function sendTemplate(body: unknown, config: WhatsAppConfig, fetcher: Fetcher = fetch): Promise<Response> {
  const input = parseSendInput(body);
  if (typeof input === "string") return json(400, { code: "validation", message: input });
  if (!isConfigured(config)) return json(501, { code: "not_configured", message: "WhatsApp no está conectado: el mensaje queda como simulado." });
  try {
    const response = await fetcher(`https://graph.facebook.com/${GRAPH_VERSION}/${config.phoneNumberId}/messages`, {
      method: "POST",
      headers: { authorization: `Bearer ${config.token}`, "content-type": "application/json" },
      body: JSON.stringify(templatePayload(input, config)),
    });
    const payload = (await response.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string; code?: number } };
    if (!response.ok) return json(502, { code: "provider_error", message: payload.error?.message ?? "WhatsApp rechazó el mensaje.", providerCode: payload.error?.code ?? null });
    return json(200, { id: payload.messages?.[0]?.id ?? null });
  } catch {
    return json(502, { code: "provider_unreachable", message: "No se pudo contactar a WhatsApp. Se reintenta en el próximo envío." });
  }
}
