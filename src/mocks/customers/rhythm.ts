import { delay, http, HttpResponse } from "msw";
import { db } from "../db";
import { WALK_IN_CLIENT, type MockClient } from "../calendar/seed";
import { visitSuggestion } from "../booking/logic";
import { forbidden, isManager, sessionOf, unauthorized } from "../session";
import { memberName } from "../team/seed";
import { isOverdue } from "@/features/customers/overdue";
import { lifecycleOf } from "./seed";
import { branchSendPlace, promoWindowOf } from "../settings/branchRules";
import { nextPromoSlot } from "@/features/legal/sendWindow";
import { profileOf } from "./handlers";

/**
 * El ritmo del cliente (docs/API_CONTRACT.md, «Clientes»): cuándo le toca volver según su
 * frecuencia, con huecos reales con su barbero, y la reactivación de los que ya se pasaron. Nada se
 * envía solo: el dueño revisa la lista y aprueba; solo sale a quien aceptó promociones, y no se
 * repite a quien ya se le escribió en el último mes.
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const DAY_MS = 86_400_000;
const RECENT_DAYS = 30;
const MAX_CANDIDATES = 40;
const REACTIVATE: ReadonlySet<string> = new Set(["atRisk", "lost"]);

const findClient = (id: unknown): MockClient | undefined => (id === WALK_IN_CLIENT.id ? undefined : db.calendar.clients.find((client) => client.id === id && !profileOf(client).deleted));
const barberLabel = (id: string) => {
  const member = db.team.members.find((item) => item.id === id);
  return member ? memberName(member) : id;
};

/** Cuándo le toca y los huecos que se le pueden ofrecer (con su barbero si puede). */
export function nextVisitOf(client: MockClient) {
  const suggestion = visitSuggestion(client);
  if (!suggestion) return null;
  return { ...suggestion, options: suggestion.options.map((option) => ({ ...option, barberName: barberLabel(option.barberId) })) };
}

const contactedRecently = (clientId: string, now: Date) => (db.booking.outbox ?? []).some((message) => message.clientId === clientId && message.kind === "reactivation" && message.status !== "cancelled" && now.getTime() - new Date(message.sendAt).getTime() < RECENT_DAYS * DAY_MS);

/** Los que ya se pasaron de su ritmo (le toca, en riesgo o perdidos) en la sucursal, con lo que se sabe para decidir si escribirles. */
export function reactivationCandidates(branchId: string, now = new Date()) {
  return db.calendar.clients
    .filter((client) => client.id !== WALK_IN_CLIENT.id && !profileOf(client).deleted && profileOf(client).branchId === branchId)
    .map((client) => ({ client, profile: profileOf(client), life: lifecycleOf(client, profileOf(client).blocked, now) }))
    // Le toca volver, está en riesgo (dos ciclos sin venir) o ya se perdió: los tres se pueden reactivar.
    .filter(({ client, life }) => REACTIVATE.has(life.segment) || isOverdue({ segment: life.segment, lastVisitAt: life.lastVisitAt, visitEveryDays: client.visitEveryDays }, now))
    .slice(0, MAX_CANDIDATES)
    .map(({ client, profile, life }) => {
      const suggestion = nextVisitOf(client);
      const option = suggestion?.options[0] ?? null;
      return {
        clientId: client.id,
        name: client.name,
        segment: life.segment,
        everyDays: client.visitEveryDays,
        daysSince: life.lastVisitAt ? Math.floor((now.getTime() - new Date(life.lastVisitAt).getTime()) / DAY_MS) : null,
        consent: profile.marketingConsent?.accepted === true,
        hasPhone: Boolean(client.phone),
        recentlyContacted: contactedRecently(client.id, now),
        offer: option ? { start: option.start, barberId: option.barberId, barberName: option.barberName, branchId: suggestion?.branchId ?? branchId } : null,
      };
    })
    .sort((a, b) => (b.daysSince ?? 0) - (a.daysSince ?? 0));
}

export const rhythmHandlers = [
  http.get(`${BASE}/customers/:id/next-visit`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!sessionOf(request)) return unauthorized();
    const client = findClient(params.id);
    if (!client) return HttpResponse.json({ code: "not_found", message: "Ese cliente no existe." }, { status: 404 });
    return HttpResponse.json({ suggestion: nextVisitOf(client) });
  }),

  http.get(`${BASE}/customers/reactivation`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("La reactivación la aprueba el dueño o el administrador.");
    const branchId = new URL(request.url).searchParams.get("branchId") ?? "ma";
    return HttpResponse.json({ items: reactivationCandidates(branchId), window: promoWindowOf(branchId) });
  }),

  /** Aprobar: pone en la cola de WhatsApp a los elegidos que se pueden escribir; dice por qué se salta a los demás. */
  http.post(`${BASE}/customers/reactivation`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("La reactivación la aprueba el dueño o el administrador.");
    const input = (await request.json().catch(() => null)) as { branchId?: unknown; clientIds?: unknown } | null;
    const branchId = typeof input?.branchId === "string" ? input.branchId : "ma";
    const wanted = new Set(Array.isArray(input?.clientIds) ? input.clientIds.filter((id): id is string => typeof id === "string") : []);
    const now = new Date();
    const candidates = reactivationCandidates(branchId, now).filter((item) => wanted.has(item.clientId));
    const skipped: { clientId: string; reason: "noConsent" | "recent" | "noPhone" | "noSlot" }[] = [];
    const queued = candidates.flatMap((item) => {
      const reason = !item.consent ? "noConsent" : item.recentlyContacted ? "recent" : !item.hasPhone ? "noPhone" : !item.offer ? "noSlot" : null;
      if (reason) {
        skipped.push({ clientId: item.clientId, reason });
        return [];
      }
      const client = findClient(item.clientId) as MockClient;
      // Es promoción: sale en la franja legal de la sede (Ley 2300, TCPA); si ahora no se puede, a la próxima apertura.
      const sendAt = nextPromoSlot(branchSendPlace(item.offer!.branchId), now).toISOString();
      return [{ id: `msg_${Date.now().toString(36)}_${item.clientId}`, appointmentId: "", clientId: item.clientId, to: client.phone, channel: "whatsapp" as const, kind: "reactivation" as const, sendAt, status: "scheduled" as const, by: session.account.user.name, offer: { start: item.offer!.start, barberId: item.offer!.barberId, branchId: item.offer!.branchId } }];
    });
    db.booking.outbox = [...queued, ...(db.booking.outbox ?? [])];
    db.persist();
    return HttpResponse.json({ queued: queued.length, skipped, sendAt: queued[0]?.sendAt ?? null });
  }),
];
