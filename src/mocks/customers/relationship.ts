import { delay, http, HttpResponse } from "msw";
import { ACCOUNTS, db } from "../db";
import { WALK_IN_CLIENT, type MockClient } from "../calendar/seed";
import { activePackages } from "../booking/packages";
import { cardsOf, loyaltyOf, serviceName } from "../booking/logic";
import { barberName, profileOf, saveProfile } from "./handlers";

/**
 * La relación con el cliente que la reserva ya conoce y la ficha no enseñaba (docs/API_CONTRACT.md,
 * «Clientes»): membresía, paquetes, saldo a favor, tarjetas de regalo que compró, tarjetas guardadas,
 * reseñas, lista de espera, mensajes enviados y el permiso para escribirle promociones.
 */

const BASE = "*/api";
const LATENCY_MS = 150;
const MESSAGES_SHOWN = 12;

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
      })),
    consent: { marketing: profile.marketingConsent ?? null },
  };
}

export const relationshipHandlers = [
  http.get(`${BASE}/customers/:id/relationship`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const client = findClient(params.id);
    if (!client) return error(404, "not_found", "Ese cliente no existe.");
    return HttpResponse.json(relationshipOf(client));
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
    } | null;
    if (typeof input?.marketing !== "boolean")
      return HttpResponse.json(
        {
          code: "validation",
          message: "Falta si acepta o no.",
          fields: { marketing: ["required"] },
        },
        { status: 422 }
      );
    saveProfile(client.id, {
      ...profileOf(client),
      marketingConsent: {
        accepted: input.marketing,
        at: new Date().toISOString(),
        source: "app",
      },
    });
    return HttpResponse.json(relationshipOf(client));
  }),
];
