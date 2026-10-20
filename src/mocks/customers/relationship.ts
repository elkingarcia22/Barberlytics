import { delay, http, HttpResponse } from "msw";
import { ACCOUNTS, db } from "../db";
import { WALK_IN_CLIENT, type MockClient } from "../calendar/seed";
import { activePackages } from "../booking/packages";
import { cardsOf, loyaltyOf, serviceName } from "../booking/logic";
import { barberName, profileOf, saveProfile } from "./handlers";
import { consentProof, promoWindowOf } from "../settings/branchRules";
import { isBarber, sessionOf } from "../session";
import { HEALTH_CONSENT_VERSION } from "@/features/legal/consent";
import { logPrivacyRequest } from "./privacy";
import { sendGiftCard } from "../booking/giftCards";
import { PROMO_CAP_DAYS, promoNear } from "./promoCap";

/**
 * La relación con el cliente que la reserva ya conoce y la ficha no enseñaba (docs/API_CONTRACT.md,
 * «Clientes»): membresía, paquetes, saldo a favor, tarjetas de regalo que compró, tarjetas guardadas,
 * reseñas, lista de espera, mensajes enviados y el permiso para escribirle promociones.
 */

const BASE = "*/api";
const LATENCY_MS = 150;
const MESSAGES_SHOWN = 12;
const MAX_BODY = 1_000;
const PURPOSES = ["thanks", "rebook", "birthday", "free"] as const;
/** Volver y cumpleaños son promoción: piden el permiso del cliente (Ley 1581 / 2300). */
const PROMOTIONAL: ReadonlySet<string> = new Set(["rebook", "birthday"]);
/** A cuántos se les escribe de una vez desde la lista. */
const MAX_BULK = 50;

function error(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message }, { status });
}

function requireAuth(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const accountId = token ? db.sessions.get(token) : undefined;
  return ACCOUNTS.find((item) => item.id === accountId) ?? null;
}

const findClient = (id: unknown): MockClient | undefined => (id === WALK_IN_CLIENT.id ? undefined : db.calendar.clients.find((client) => client.id === id && !profileOf(client).deleted));

export function relationshipOf(client: MockClient, now = new Date()) {
  const profile = profileOf(client);
  const loyalty = loyaltyOf(client);
  const today = now.toISOString().slice(0, 10);
  return {
    membership: loyalty && {
      every: loyalty.every,
      progress: loyalty.progress,
      available: loyalty.available,
      reward: loyalty.rewardName,
      rewardValue: loyalty.rewardValue,
    },
    packages: activePackages(client.id, now).map((item) => ({
      id: item.id,
      name: item.name,
      service: serviceName(item.serviceId),
      remaining: item.remaining,
      total: item.total,
      expiresAt: item.expiresAt,
    })),
    credit: db.booking.credits[client.id] ?? 0,
    giftCards: (db.booking.giftCards ?? [])
      .filter((card) => card.buyerId === client.id)
      .map((card) => ({
        code: card.code,
        recipientName: card.recipientName,
        initial: card.initial,
        balance: card.balance,
        createdAt: card.createdAt,
        // Si el código le llegó a quien la recibe (el mensaje de la cola), para reenviarlo si falló.
        sent: giftSentOf(card.messageId),
      })),
    cards: cardsOf(client.id).map((card) => ({
      id: card.id,
      brand: card.brand,
      last4: card.last4,
      expMonth: card.expMonth,
      expYear: card.expYear,
    })),
    reviews: (db.booking.reviews ?? [])
      .filter((review) => review.clientId === client.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        barber: barberName(review.barberId) ?? review.barberId,
        createdAt: review.createdAt,
      })),
    waitlist: db.calendar.waitlist
      .filter((entry) => entry.clientId === client.id && entry.slots.some((slot) => slot.date >= today))
      .map((entry) => ({
        id: entry.id,
        branchId: entry.branchId,
        service: serviceName(entry.serviceId),
        barber: barberName(entry.barberId),
        slots: entry.slots.filter((slot) => slot.date >= today),
        createdAt: entry.createdAt,
      })),
    messages: (db.booking.outbox ?? [])
      .filter((message) => message.clientId === client.id && message.status !== "scheduled" && message.status !== "cancelled")
      .sort((a, b) => (b.sentAt ?? b.sendAt).localeCompare(a.sentAt ?? a.sendAt))
      .slice(0, MESSAGES_SHOWN)
      .map((message) => ({
        id: message.id,
        appointmentId: message.appointmentId,
        kind: message.kind,
        channel: message.channel,
        status: message.status,
        at: message.sentAt ?? message.sendAt,
        simulated: message.simulated === true,
        error: message.error ?? null,
        body: message.body ?? null,
        by: message.by ?? null,
      })),
    consent: { marketing: profile.marketingConsent ?? null, health: profile.healthConsent ?? null, smsStop: profile.smsStop ?? null },
    // La franja legal de promociones en su sede (Ley 2300, TCPA): el mensaje manual de «volver» o cumpleaños la respeta.
    promoWindow: promoWindowOf(profile.branchId, now),
    // El tope por cliente: si ya tiene una promoción cerca, cuándo fue (o será).
    promoCap: promoNear(client.id, now),
  };
}

/** En qué va el mensaje con el código de una tarjeta de regalo. */
function giftSentOf(messageId: string | null | undefined): { status: "scheduled" | "sent" | "failed"; at: string } | null {
  const message = messageId ? (db.booking.outbox ?? []).find((item) => item.id === messageId) : undefined;
  if (!message || message.status === "cancelled") return null;
  return { status: message.status === "sent" ? "sent" : message.status === "failed" ? "failed" : "scheduled", at: message.sentAt ?? message.sendAt };
}

type SendBlock = "noPhone" | "noConsent" | "outsideWindow" | "promoCap" | "notFound";

/** Si a ese cliente se le puede escribir ese mensaje ahora, y si no, por qué (las mismas reglas que `POST …/messages`). */
function sendCheck(client: MockClient | undefined, purpose: string, now = new Date()): SendBlock | null {
  if (!client) return "notFound";
  if (!client.phone) return "noPhone";
  if (!PROMOTIONAL.has(purpose)) return null;
  const profile = profileOf(client);
  if (profile.marketingConsent?.accepted !== true) return "noConsent";
  if (promoNear(client.id, now)) return "promoCap";
  if (!promoWindowOf(profile.branchId, now).allowed) return "outsideWindow";
  return null;
}

export const relationshipHandlers = [
  // Reenviar el código de una tarjeta de regalo que compró el cliente (no llegó, o la persona lo perdió).
  http.post(`${BASE}/customers/:id/gift-cards/:code/resend`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    const session = sessionOf(request);
    if (session && isBarber(session)) return error(403, "forbidden", "Las tarjetas de regalo las maneja recepción.");
    const client = findClient(params.id);
    const card = (db.booking.giftCards ?? []).find((item) => item.code === params.code && item.buyerId === client?.id);
    if (!client || !card) return error(404, "not_found", "Esa tarjeta de regalo no existe.");
    if (card.balance <= 0) return error(409, "conflict", "Esa tarjeta ya no tiene saldo.");
    sendGiftCard(card, client.name, profileOf(client).branchId, account.user.name);
    db.persist();
    return HttpResponse.json(relationshipOf(client));
  }),

  /**
   * Antes de escribirles a varios (desde un aviso o una selección): a quién sí y a quién no, con el motivo.
   * Cada mensaje se abre y se anota uno por uno con `POST /customers/:id/messages`.
   */
  http.post(`${BASE}/customers/messages/check`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = (await request.json().catch(() => null)) as { ids?: unknown; purpose?: unknown } | null;
    const purpose = PURPOSES.find((item) => item === input?.purpose);
    const ids = Array.isArray(input?.ids) ? input.ids.filter((id): id is string => typeof id === "string").slice(0, MAX_BULK) : [];
    if (!purpose || ids.length === 0) return HttpResponse.json({ code: "validation", message: "Elige a quién y para qué." }, { status: 422 });
    const now = new Date();
    return HttpResponse.json({
      items: ids.map((id) => {
        const client = findClient(id);
        return { id, name: client?.name ?? "", phone: client?.phone ?? "", blocked: sendCheck(client, purpose, now) };
      }),
    });
  }),

  http.get(`${BASE}/customers/:id/relationship`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const client = findClient(params.id);
    if (!client) return error(404, "not_found", "Ese cliente no existe.");
    return HttpResponse.json(relationshipOf(client));
  }),

  /**
   * Un mensaje escrito desde la ficha: el equipo lo abre en WhatsApp (wa.me) y aquí queda anotado en su
   * historial. Volver y cumpleaños son promoción: sin permiso del cliente no se registran (409).
   */
  http.post(`${BASE}/customers/:id/messages`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    const client = findClient(params.id);
    if (!client) return error(404, "not_found", "Ese cliente no existe.");
    const input = (await request.json().catch(() => null)) as { purpose?: unknown; body?: unknown } | null;
    const purpose = PURPOSES.find((item) => item === input?.purpose);
    const body = typeof input?.body === "string" ? input.body.trim() : "";
    if (!purpose || body.length < 2 || body.length > MAX_BODY) return HttpResponse.json({ code: "validation", message: "Escribe el mensaje.", fields: { body: ["Escribe el mensaje."] } }, { status: 422 });
    if (PROMOTIONAL.has(purpose) && profileOf(client).marketingConsent?.accepted !== true) return error(409, "no_consent", "Este cliente no aceptó recibir promociones. Pregúntale antes de escribirle.");
    if (PROMOTIONAL.has(purpose) && promoNear(client.id)) return error(409, "promo_cap", `Ya recibió una promoción en los últimos ${PROMO_CAP_DAYS} días: es el tope por cliente.`);
    if (PROMOTIONAL.has(purpose) && !promoWindowOf(profileOf(client).branchId).allowed) return error(409, "outside_window", "Fuera del horario legal para promociones en su sede. Escríbele cuando abra la franja.");
    const now = new Date().toISOString();
    const message = { id: `msg_${Date.now().toString(36)}`, appointmentId: "", clientId: client.id, to: client.phone, channel: "whatsapp" as const, kind: "manual" as const, sendAt: now, sentAt: now, status: "sent" as const, body, purpose, by: account.user.name };
    db.booking.outbox = [message, ...(db.booking.outbox ?? [])];
    db.persist();
    return HttpResponse.json(relationshipOf(client), { status: 201 });
  }),

  /**
   * Retirar el permiso es siempre posible; darlo desde el mostrador solo si el cliente lo dijo, y queda
   * con fecha y origen («app») para poder probarlo.
   */
  http.patch(`${BASE}/customers/:id/consent`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const client = findClient(params.id);
    if (!client) return error(404, "not_found", "Ese cliente no existe.");
    const input = (await request.json().catch(() => null)) as {
      marketing?: unknown;
      health?: unknown;
    } | null;
    if (typeof input?.marketing !== "boolean" && typeof input?.health !== "boolean")
      return HttpResponse.json(
        {
          code: "validation",
          message: "Falta si acepta o no.",
          fields: { marketing: ["required"] },
        },
        { status: 422 }
      );
    const session = sessionOf(request);
    const now = new Date().toISOString();
    if (typeof input.marketing === "boolean") {
      saveProfile(client.id, {
        ...profileOf(client),
        marketingConsent: {
          accepted: input.marketing,
          at: now,
          source: "app",
          ...consentProof(profileOf(client).branchId),
        },
      });
      if (!input.marketing) logPrivacyRequest(client, "revoke", "app", "Retiró el permiso de promociones.", session?.account.user.name ?? "", true);
    }
    if (typeof input.health === "boolean") {
      // El de salud lo anota quien recibe al cliente (recepción o gerencia), no el barbero de turno.
      if (session && isBarber(session)) return error(403, "forbidden", "El permiso de salud lo anota recepción o gerencia.");
      saveProfile(client.id, { ...profileOf(client), healthConsent: { accepted: input.health, at: now, source: "app", version: HEALTH_CONSENT_VERSION, by: session?.account.user.name } });
      if (!input.health) {
        // Retirarlo borra lo anotado: alergias y medicamentos no se guardan sin permiso.
        const updated = { ...client, notes: client.notes.filter((note) => note.kind === "note") };
        db.calendar.clients = db.calendar.clients.map((item) => (item.id === client.id ? updated : item));
        logPrivacyRequest(client, "revoke", "app", "Retiró el permiso de salud: se borraron sus alergias y medicamentos.", session?.account.user.name ?? "", true);
      }
      db.persist();
    }
    return HttpResponse.json(relationshipOf(db.calendar.clients.find((item) => item.id === client.id) ?? client));
  }),
];
