import { parseSendInput, readWhatsAppConfig, sendTemplate, type MessageKind, type SendInput, type WhatsAppConfig } from "./whatsapp.js";
import { isPromoAllowed, nextPromoSlot, type SendCountry, type SendPlace } from "../../src/features/legal/sendWindow.js";

/**
 * La cola de WhatsApp en el servidor. Antes la cola corría en el navegador y llamaba a una función
 * pública que enviaba lo que le pidieran; ahora la app solo **encola** (con su sesión firmada), un
 * cron envía lo que ya toca con reintentos, y la app consulta el estado para reflejarlo en la cita.
 *
 * Dónde se guarda: Upstash Redis (REST) si están `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`;
 * en local, en memoria del servidor de desarrollo. En Vercel sin Upstash no hay cola (la memoria de
 * una función no sobrevive entre llamadas) y responde 501: la app deja los mensajes como simulados.
 */

export type QueueStatus = "scheduled" | "sent" | "simulated" | "failed" | "cancelled";

export interface QueueItem extends SendInput {
  /** El id del mensaje en la app: único dentro de la barbería. */
  id: string;
  tid: string;
  sendAt: string;
  /** Prueba del permiso del cliente; obligatoria para lo que Meta cuenta como marketing. */
  consent: { version: string; at: string } | null;
  /** Dónde está la sede (país, estado, zona): una promoción solo sale en la franja legal de esa hora. */
  place?: SendPlace | null;
  status: QueueStatus;
  attempts: number;
  nextAttemptAt: string;
  providerId: string | null;
  error: string | null;
  sentAt: string | null;
  createdBy: string;
  /** Lo que WhatsApp dice después de aceptarlo (por el webhook): entregado o leído. */
  delivery?: "delivered" | "read" | null;
}

/** Lo que la app ve de cada mensaje encolado. */
export interface QueueView {
  id: string;
  status: QueueStatus;
  providerId: string | null;
  error: string | null;
  sentAt: string | null;
  attempts: number;
  delivery: "delivered" | "read" | null;
}

/** Una respuesta del cliente que llegó por el webhook, ya clasificada. */
export interface InboxEvent {
  /** Orden de llegada dentro de la barbería: la app pide «lo que vino después de N». */
  seq: number;
  /** El id de WhatsApp del mensaje entrante (para no aplicarlo dos veces). */
  wamid: string;
  at: string;
  /** El celular del cliente, solo dígitos. */
  from: string;
  intent: "confirm" | "reschedule" | "cancel" | "stop" | "start" | "help" | "other";
  /** Lo que escribió o el botón que tocó, recortado. */
  text: string;
  /** El mensaje de la app al que responde (el id del outbox), si se sabe. */
  messageId: string | null;
  /** Por dónde llegó; sin él, WhatsApp. */
  channel?: "whatsapp" | "sms";
}

/**
 * Las dos listas de baja: `promo` (BAJA en cualquier canal: no más promociones) y `sms` (STOP por SMS:
 * ningún SMS a ese número, tampoco los de sus citas).
 */
export type OptOutList = "promo" | "sms";

export interface OutboxStore {
  get(tid: string, id: string): Promise<QueueItem | null>;
  put(item: QueueItem): Promise<void>;
  /** Los que ya tocan (`nextAttemptAt` ≤ ahora), los más viejos primero. */
  due(now: number, limit: number): Promise<QueueItem[]>;
  /** Toma un mensaje para enviarlo; `false` si otro envío ya lo tiene (dos crons a la vez). */
  claim(item: QueueItem): Promise<boolean>;
  /** El id de WhatsApp de lo enviado → de qué mensaje es, para entender respuestas y entregas. */
  indexProvider(providerId: string, tid: string, id: string): Promise<void>;
  byProvider(providerId: string): Promise<{ tid: string; id: string } | null>;
  /** Guarda una respuesta (una sola vez por `wamid`) y le pone su número de orden. */
  pushInbox(tid: string, event: Omit<InboxEvent, "seq">): Promise<InboxEvent | null>;
  inbox(tid: string, after: number, limit: number): Promise<InboxEvent[]>;
  /** Quien escribió BAJA/STOP: no recibe promociones (`promo`, por defecto) o ningún SMS (`sms`). */
  setOptOut(tid: string, phone: string, optedOut: boolean, list?: OptOutList): Promise<void>;
  isOptedOut(tid: string, phone: string, list?: OptOutList): Promise<boolean>;
  /** Anota una promoción a ese número para la hora en que sale (el tope por cliente). */
  notePromo(tid: string, phone: string, id: string, at: number): Promise<void>;
  /** Los ids de las promociones a ese número que salen entre `from` y `to`. */
  promosBetween(tid: string, phone: string, from: number, to: number): Promise<string[]>;
}

/** Lo que Meta cuenta como marketing: solo a quien aceptó promociones. */
export const MARKETING_KINDS: readonly MessageKind[] = ["reactivation"];
/**
 * El tope de promociones por cliente: una cada 30 días, contando antes y después de la que se encola (una
 * programada para dentro de dos semanas también cuenta). Lo anulado, lo fallido y lo que no salió no cuenta.
 */
export const PROMO_CAP = 1;
export const PROMO_CAP_DAYS = 30;
const PROMO_CAP_MS = PROMO_CAP_DAYS * 86_400_000;
/** Intentos ante un error de WhatsApp o de red antes de darlo por fallido; espera 5, 10, 20 min. */
export const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 5 * 60_000;
/** Mensajes por lote: al encolar y en cada pasada del cron. */
export const MAX_BATCH = 50;
/** Un recordatorio no se programa a más de 400 días. */
const MAX_AHEAD_MS = 400 * 86_400_000;
const ID = /^[\w-]{1,64}$/;
/** Lo que se guarda vive 60 días: de sobra para mostrarlo en la cita. */
const TTL_SECONDS = 60 * 86_400;

const serverEnv = (): Record<string, string | undefined> => (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};

export const viewOf = (item: QueueItem): QueueView => ({ id: item.id, status: item.status, providerId: item.providerId, error: item.error, sentAt: item.sentAt, attempts: item.attempts, delivery: item.delivery ?? null });

/** Respuestas que se guardan por barbería: las más viejas se descartan (la app ya las aplicó). */
const INBOX_KEEP = 500;

// ── Almacenes ────────────────────────────────────────────────────────────────────────────────────

const keyOf = (tid: string, id: string) => `${tid}:${id}`;

export function createMemoryStore(): OutboxStore {
  const items = new Map<string, QueueItem>();
  const claimed = new Set<string>();
  const providers = new Map<string, { tid: string; id: string }>();
  const inboxes = new Map<string, InboxEvent[]>();
  const optOuts = new Set<string>();
  const promos = new Map<string, Map<string, number>>();
  return {
    get: async (tid, id) => items.get(keyOf(tid, id)) ?? null,
    put: async (item) => {
      items.set(keyOf(item.tid, item.id), item);
      claimed.delete(keyOf(item.tid, item.id));
    },
    due: async (now, limit) =>
      [...items.values()]
        .filter((item) => item.status === "scheduled" && Date.parse(item.nextAttemptAt) <= now)
        .sort((a, b) => a.nextAttemptAt.localeCompare(b.nextAttemptAt))
        .slice(0, limit),
    claim: async (item) => {
      const key = keyOf(item.tid, item.id);
      if (claimed.has(key)) return false;
      claimed.add(key);
      return true;
    },
    indexProvider: async (providerId, tid, id) => {
      providers.set(providerId, { tid, id });
    },
    byProvider: async (providerId) => providers.get(providerId) ?? null,
    pushInbox: async (tid, event) => {
      const list = inboxes.get(tid) ?? [];
      if (list.some((item) => item.wamid === event.wamid)) return null;
      const saved: InboxEvent = { ...event, seq: (list.at(-1)?.seq ?? 0) + 1 };
      inboxes.set(tid, [...list, saved].slice(-INBOX_KEEP));
      return saved;
    },
    inbox: async (tid, after, limit) => (inboxes.get(tid) ?? []).filter((item) => item.seq > after).slice(0, limit),
    setOptOut: async (tid, phone, optedOut, list = "promo") => {
      if (optedOut) optOuts.add(`${list}:${keyOf(tid, phone)}`);
      else optOuts.delete(`${list}:${keyOf(tid, phone)}`);
    },
    isOptedOut: async (tid, phone, list = "promo") => optOuts.has(`${list}:${keyOf(tid, phone)}`),
    notePromo: async (tid, phone, id, at) => {
      const key = keyOf(tid, phone);
      promos.set(key, new Map(promos.get(key)).set(id, at));
    },
    promosBetween: async (tid, phone, from, to) => [...(promos.get(keyOf(tid, phone)) ?? new Map<string, number>()).entries()].filter(([, at]) => at >= from && at <= to).map(([id]) => id),
  };
}

type Fetcher = typeof fetch;

/** Upstash Redis por REST: cada mensaje en `wa:item:<tid>:<id>` y los pendientes en el índice `wa:due`. */
export function createUpstashStore(url: string, token: string, fetcher: Fetcher = fetch): OutboxStore {
  const pipeline = async (commands: (string | number)[][]): Promise<unknown[]> => {
    const response = await fetcher(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(commands),
    });
    if (!response.ok) throw new Error(`Upstash respondió ${response.status}.`);
    const results = (await response.json()) as { result?: unknown; error?: string }[];
    const failed = results.find((entry) => entry.error);
    if (failed) throw new Error(`Upstash: ${failed.error}`);
    return results.map((entry) => entry.result);
  };
  const parse = (raw: unknown): QueueItem | null => {
    if (typeof raw !== "string") return null;
    try {
      return JSON.parse(raw) as QueueItem;
    } catch {
      return null;
    }
  };
  return {
    get: async (tid, id) => parse((await pipeline([["GET", `wa:item:${keyOf(tid, id)}`]]))[0]),
    put: async (item) => {
      const member = keyOf(item.tid, item.id);
      await pipeline([
        ["SET", `wa:item:${member}`, JSON.stringify(item), "EX", TTL_SECONDS],
        item.status === "scheduled" ? ["ZADD", "wa:due", Date.parse(item.nextAttemptAt), member] : ["ZREM", "wa:due", member],
        ["DEL", `wa:lock:${member}`],
      ]);
    },
    due: async (now, limit) => {
      const [members] = await pipeline([["ZRANGE", "wa:due", "-inf", now, "BYSCORE", "LIMIT", 0, limit]]);
      if (!Array.isArray(members) || members.length === 0) return [];
      const [raws] = await pipeline([["MGET", ...members.map((member) => `wa:item:${String(member)}`)]]);
      return (Array.isArray(raws) ? raws : []).map(parse).filter((item): item is QueueItem => item !== null && item.status === "scheduled");
    },
    claim: async (item) => {
      const [result] = await pipeline([["SET", `wa:lock:${keyOf(item.tid, item.id)}`, "1", "NX", "EX", 120]]);
      return result === "OK";
    },
    indexProvider: async (providerId, tid, id) => {
      await pipeline([["SET", `wa:provider:${providerId}`, keyOf(tid, id), "EX", TTL_SECONDS]]);
    },
    byProvider: async (providerId) => {
      const [raw] = await pipeline([["GET", `wa:provider:${providerId}`]]);
      if (typeof raw !== "string") return null;
      const split = raw.indexOf(":");
      return split > 0 ? { tid: raw.slice(0, split), id: raw.slice(split + 1) } : null;
    },
    pushInbox: async (tid, event) => {
      // Una sola vez por mensaje de WhatsApp: Meta reintenta el webhook si no contestamos a tiempo.
      const [fresh] = await pipeline([["SET", `wa:seen:${event.wamid}`, "1", "NX", "EX", TTL_SECONDS]]);
      if (fresh !== "OK") return null;
      const [seq] = await pipeline([["INCR", `wa:inboxseq:${tid}`]]);
      const saved: InboxEvent = { ...event, seq: Number(seq) };
      await pipeline([
        ["RPUSH", `wa:inbox:${tid}`, JSON.stringify(saved)],
        ["LTRIM", `wa:inbox:${tid}`, -INBOX_KEEP, -1],
      ]);
      return saved;
    },
    inbox: async (tid, after, limit) => {
      const [raws] = await pipeline([["LRANGE", `wa:inbox:${tid}`, 0, -1]]);
      return (Array.isArray(raws) ? raws : [])
        .map((raw) => {
          try {
            return JSON.parse(String(raw)) as InboxEvent;
          } catch {
            return null;
          }
        })
        .filter((item): item is InboxEvent => item !== null && item.seq > after)
        .slice(0, limit);
    },
    setOptOut: async (tid, phone, optedOut, list = "promo") => {
      await pipeline([[optedOut ? "SADD" : "SREM", optOutKey(tid, list), phone]]);
    },
    isOptedOut: async (tid, phone, list = "promo") => {
      const [member] = await pipeline([["SISMEMBER", optOutKey(tid, list), phone]]);
      return member === 1;
    },
    // Un índice ordenado por número: id → hora de salida; vive lo que dura el tope más un margen.
    notePromo: async (tid, phone, id, at) => {
      await pipeline([
        ["ZADD", `wa:promos:${keyOf(tid, phone)}`, at, id],
        ["EXPIRE", `wa:promos:${keyOf(tid, phone)}`, Math.ceil((PROMO_CAP_MS * 2) / 1000)],
      ]);
    },
    promosBetween: async (tid, phone, from, to) => {
      const [ids] = await pipeline([["ZRANGE", `wa:promos:${keyOf(tid, phone)}`, from, to, "BYSCORE"]]);
      return Array.isArray(ids) ? ids.map(String) : [];
    },
  };
}

/** `wa:optout:<tid>` se queda como estaba (promociones); los SMS detenidos van aparte. */
const optOutKey = (tid: string, list: OptOutList) => (list === "promo" ? `wa:optout:${tid}` : `sms:stop:${tid}`);

let memoryStore: OutboxStore | null = null;

/** El almacén que toca según el entorno; `null` si no hay dónde guardar la cola de forma fiable. */
export function readOutboxStore(env: Record<string, string | undefined> = serverEnv()): OutboxStore | null {
  const url = env.UPSTASH_REDIS_REST_URL?.trim();
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && token) return createUpstashStore(url, token);
  if (env.VERCEL) return null;
  memoryStore ??= createMemoryStore();
  return memoryStore;
}

// ── Encolar, anular, consultar ───────────────────────────────────────────────────────────────────

export interface EnqueueInput extends SendInput {
  id: string;
  sendAt: string;
  consent: { version: string; at: string } | null;
  place: SendPlace | null;
}

const COUNTRIES: readonly SendCountry[] = ["CO", "US", "MX", "GENERIC"];

const isTimeZone = (value: unknown): value is string => {
  if (typeof value !== "string" || !value || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

function parsePlace(raw: unknown): SendPlace | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const country = COUNTRIES.find((item) => item === record.country);
  if (!country || !isTimeZone(record.timeZone)) return null;
  const state = typeof record.state === "string" ? record.state.slice(0, 40) : null;
  return { country, state, timeZone: record.timeZone };
}

/** Valida un mensaje para encolar; devuelve el mensaje o por qué no. */
export function parseEnqueueItem(raw: unknown, now = Date.now()): EnqueueInput | string {
  if (!raw || typeof raw !== "object") return "Falta el mensaje.";
  const record = raw as Record<string, unknown>;
  if (typeof record.id !== "string" || !ID.test(record.id)) return "El id del mensaje no es válido.";
  const send = parseSendInput(record);
  if (typeof send === "string") return send;
  const sendAt = typeof record.sendAt === "string" ? Date.parse(record.sendAt) : Number.NaN;
  if (!Number.isFinite(sendAt) || sendAt - now > MAX_AHEAD_MS) return "La hora de envío no es válida.";
  const rawConsent = record.consent as Record<string, unknown> | null | undefined;
  const consent =
    rawConsent && typeof rawConsent.version === "string" && rawConsent.version.length <= 40 && typeof rawConsent.at === "string" && Number.isFinite(Date.parse(rawConsent.at))
      ? { version: rawConsent.version, at: rawConsent.at }
      : null;
  if (MARKETING_KINDS.includes(send.kind) && !consent) return "Un mensaje de promoción necesita el permiso del cliente.";
  const place = parsePlace(record.place);
  if (MARKETING_KINDS.includes(send.kind) && !place) return "Un mensaje de promoción necesita el país y la zona de la sede (franja legal de envío).";
  return { ...send, id: record.id, sendAt: new Date(sendAt).toISOString(), consent, place };
}

export interface EnqueueResult {
  items: QueueView[];
  rejected: { id: string | null; message: string }[];
}

/**
 * Encola (o reprograma) mensajes. Uno que ya salió no se toca: encolar dos veces el mismo id no lo
 * envía dos veces.
 */
export async function enqueue(store: OutboxStore, tid: string, by: string, raws: unknown[], now = Date.now()): Promise<EnqueueResult> {
  const result: EnqueueResult = { items: [], rejected: [] };
  for (const raw of raws.slice(0, MAX_BATCH)) {
    const input = parseEnqueueItem(raw, now);
    if (typeof input === "string") {
      const id = raw && typeof raw === "object" && typeof (raw as { id?: unknown }).id === "string" ? (raw as { id: string }).id : null;
      result.rejected.push({ id, message: input });
      continue;
    }
    if (MARKETING_KINDS.includes(input.kind) && (await store.isOptedOut(tid, input.to))) {
      result.rejected.push({ id: input.id, message: "El cliente pidió no recibir promociones (BAJA)." });
      continue;
    }
    const existing = await store.get(tid, input.id);
    if (existing && existing.status !== "scheduled") {
      result.items.push(viewOf(existing));
      continue;
    }
    const promo = MARKETING_KINDS.includes(input.kind);
    // Una promoción fuera de la franja legal espera a la próxima apertura, a la hora de la sede.
    const nextAttemptAt = input.place && promo ? nextPromoSlot(input.place, new Date(Math.max(Date.parse(input.sendAt), now))).toISOString() : input.sendAt;
    if (promo && (await promosNear(store, tid, input.to, input.id, Date.parse(nextAttemptAt))) >= PROMO_CAP) {
      result.rejected.push({ id: input.id, message: `Ya tiene una promoción en ${PROMO_CAP_DAYS} días: es el tope por cliente.` });
      continue;
    }
    const item: QueueItem = {
      ...input,
      tid,
      status: "scheduled",
      attempts: existing?.attempts ?? 0,
      nextAttemptAt,
      providerId: null,
      error: null,
      sentAt: null,
      createdBy: existing?.createdBy ?? by,
    };
    await store.put(item);
    if (promo) await store.notePromo(tid, item.to, item.id, Date.parse(nextAttemptAt));
    result.items.push(viewOf(item));
  }
  return result;
}

/** Cuántas promociones vivas (por salir o ya salidas) tiene ese número a menos de 30 días de `at`, sin contar `id`. */
async function promosNear(store: OutboxStore, tid: string, phone: string, id: string, at: number): Promise<number> {
  const ids = (await store.promosBetween(tid, phone, at - PROMO_CAP_MS, at + PROMO_CAP_MS)).filter((other) => other !== id);
  const items = await Promise.all(ids.map((other) => store.get(tid, other)));
  return items.filter((item) => item && (item.status === "scheduled" || item.status === "sent" || item.status === "simulated")).length;
}

/** Anula los que aún no salieron; los demás se devuelven como están. */
export async function cancel(store: OutboxStore, tid: string, ids: string[]): Promise<QueueView[]> {
  const views: QueueView[] = [];
  for (const id of ids.filter((value) => ID.test(value)).slice(0, MAX_BATCH)) {
    const item = await store.get(tid, id);
    if (!item) continue;
    if (item.status !== "scheduled") {
      views.push(viewOf(item));
      continue;
    }
    const cancelled: QueueItem = { ...item, status: "cancelled" };
    await store.put(cancelled);
    views.push(viewOf(cancelled));
  }
  return views;
}

export async function statusOf(store: OutboxStore, tid: string, ids: string[]): Promise<QueueView[]> {
  const items = await Promise.all(ids.filter((value) => ID.test(value)).slice(0, MAX_BATCH).map((id) => store.get(tid, id)));
  return items.filter((item): item is QueueItem => item !== null).map(viewOf);
}

// ── Enviar lo que toca (el cron) ─────────────────────────────────────────────────────────────────

export interface RunCounts {
  sent: number;
  simulated: number;
  failed: number;
  retried: number;
  /** Promociones que el cron encontró fuera de la franja: vuelven a la cola para la próxima apertura. */
  deferred: number;
  /** Promociones anuladas porque el cliente escribió BAJA después de encolarlas. */
  cancelled: number;
}

/** Qué pasó con un envío, según lo que respondió `sendTemplate`. */
async function outcomeOf(response: Response): Promise<{ kind: "sent" | "simulated" | "rejected" | "retry"; id: string | null; message: string | null }> {
  const body = (await response.json().catch(() => ({}))) as { id?: string | null; message?: string };
  if (response.ok) return { kind: "sent", id: body.id ?? null, message: null };
  if (response.status === 501) return { kind: "simulated", id: null, message: null };
  // 400: el mensaje está mal y reintentar no lo arregla; 502: WhatsApp o la red, se reintenta.
  return { kind: response.status === 400 ? "rejected" : "retry", id: null, message: body.message ?? `WhatsApp respondió ${response.status}.` };
}

/** Envía lo que ya toca, con reintentos. Lo llama el cron (y, en local, el servidor de desarrollo). */
export async function runDue(store: OutboxStore | null = readOutboxStore(), config: WhatsAppConfig = readWhatsAppConfig(serverEnv()), fetcher: Fetcher = fetch, now = Date.now()): Promise<RunCounts> {
  const counts: RunCounts = { sent: 0, simulated: 0, failed: 0, retried: 0, deferred: 0, cancelled: 0 };
  if (!store) return counts;
  for (const item of await store.due(now, MAX_BATCH)) {
    if (!(await store.claim(item))) continue;
    const promo = MARKETING_KINDS.includes(item.kind);
    // Justo antes de enviar se mira otra vez: pudo escribir BAJA, o el cron pudo llegar tarde y fuera de la franja.
    if (promo && (await store.isOptedOut(item.tid, item.to))) {
      counts.cancelled += 1;
      await store.put({ ...item, status: "cancelled", error: "El cliente pidió no recibir promociones (BAJA)." });
      continue;
    }
    if (promo && item.place && !isPromoAllowed(item.place, new Date(now))) {
      counts.deferred += 1;
      await store.put({ ...item, nextAttemptAt: nextPromoSlot(item.place, new Date(now)).toISOString() });
      continue;
    }
    const outcome = await outcomeOf(await sendTemplate(item, config, fetcher));
    const at = new Date(now).toISOString();
    const attempts = item.attempts + 1;
    if (outcome.kind === "retry" && attempts < MAX_ATTEMPTS) {
      counts.retried += 1;
      const retryAt = new Date(now + RETRY_BASE_MS * 2 ** (attempts - 1));
      await store.put({ ...item, attempts, error: outcome.message, nextAttemptAt: (promo && item.place ? nextPromoSlot(item.place, retryAt) : retryAt).toISOString() });
      continue;
    }
    const status: QueueStatus = outcome.kind === "sent" ? "sent" : outcome.kind === "simulated" ? "simulated" : "failed";
    counts[status] += 1;
    await store.put({ ...item, attempts, status, providerId: outcome.id, error: outcome.message, sentAt: at });
    if (outcome.id) await store.indexProvider(outcome.id, item.tid, item.id);
  }
  return counts;
}
