import { delay, http, HttpResponse } from "msw";
import { isOverdue } from "@/features/customers/overdue";
import { db } from "../db";
import { forbidden, isBarber, isManager, sessionOf, unauthorized } from "../session";
import { WALK_IN_CLIENT } from "../calendar/seed";
import { availability, barberPrice } from "../booking/logic";
import { reviewsOf } from "../booking/reviews";
import { agendaBarbers, customerSummary, profileOf } from "../customers/handlers";
import { branchNow } from "../settings/branchRules";

/**
 * Lo del barbero que no es su pago (docs/API_CONTRACT.md, «Equipo › Del barbero»): su reputación —promedio, tendencia,
 * reparto de estrellas, lo que más repiten sus clientes y las últimas reseñas— y sus clientes por volver, con el primer
 * hueco libre de su agenda para ofrecérselo. El barbero ve lo suyo; quien gestiona, el de cualquiera.
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const DAY_MS = 86_400_000;
const TREND_DAYS = 90;
const RECENT_REVIEWS = 10;
const MAX_DUE = 50;
const SLOT_LOOKAHEAD_DAYS = 14;
const USUAL_SERVICE = "svc_corte";

/** Lo que repiten los clientes en sus comentarios, por palabras: un tema bueno o uno por cuidar. */
const THEMES: readonly { id: string; tone: "positive" | "negative"; pattern: RegExp }[] = [
  { id: "punctual", tone: "positive", pattern: /puntual|a tiempo|rápid|prolij/i },
  { id: "cut", tone: "positive", pattern: /corte|fade|degradad|exact/i },
  { id: "beard", tone: "positive", pattern: /barba|perfilad|navaja/i },
  { id: "care", tone: "positive", pattern: /explic|paciente|cuidados|ambiente|amable/i },
  { id: "wait", tone: "negative", pattern: /espera|tarde|demor/i },
];

const round1 = (value: number) => Math.round(value * 10) / 10;
const averageOf = (ratings: readonly number[]) => (ratings.length === 0 ? null : round1(ratings.reduce((sum, value) => sum + value, 0) / ratings.length));
const error = (status: number, code: string, message: string) => HttpResponse.json({ code, message }, { status });

/** De quién se pide: el barbero, solo lo suyo; quien gestiona, el de cualquiera. */
function allowed(request: Request, memberId: string): Response | null {
  const session = sessionOf(request);
  if (!session) return unauthorized();
  if (isBarber(session)) return session.memberId === memberId ? null : forbidden("Solo puedes ver lo tuyo.");
  return isManager(session) ? null : forbidden("Esto lo ven el dueño, el administrador y cada barbero (lo suyo).");
}

export function reputationOf(memberId: string, now = new Date()) {
  const all = reviewsOf(memberId, now);
  const age = (iso: string) => (now.getTime() - new Date(iso).getTime()) / DAY_MS;
  const last = all.filter((review) => age(review.createdAt) <= TREND_DAYS).map((review) => review.rating);
  const previous = all.filter((review) => age(review.createdAt) > TREND_DAYS && age(review.createdAt) <= TREND_DAYS * 2).map((review) => review.rating);
  const comments = all.map((review) => review.comment).filter(Boolean);
  return {
    rating: averageOf(all.map((review) => review.rating)),
    total: all.length,
    sample: all.length > 0 && all.every((review) => review.sample === true),
    last90: { rating: averageOf(last), count: last.length },
    previous90: { rating: averageOf(previous), count: previous.length },
    distribution: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: all.filter((review) => review.rating === stars).length })),
    themes: THEMES.map((theme) => ({ id: theme.id, tone: theme.tone, count: comments.filter((comment) => theme.pattern.test(comment)).length })).filter((theme) => theme.count > 0).sort((a, b) => b.count - a.count),
    recent: all.slice(0, RECENT_REVIEWS).map(({ id, clientName, rating, comment, createdAt, sample }) => ({ id, clientName, rating, comment, createdAt, sample: sample === true })),
  };
}

/** El primer hueco de su agenda en las dos semanas que vienen para su servicio de siempre, o `null`. */
function nextSlotOf(branchId: string, memberId: string): { day: string; time: string; serviceId: string } | null {
  const serviceId = barberPrice(memberId, USUAL_SERVICE, branchId) !== null ? USUAL_SERVICE : (db.services.items.find((item) => barberPrice(memberId, item.id, branchId) !== null)?.id ?? null);
  if (!serviceId) return null;
  const today = new Date(`${branchNow(branchId).slice(0, 10)}T12:00:00`);
  for (let offset = 0; offset < SLOT_LOOKAHEAD_DAYS; offset += 1) {
    const date = new Date(today.getTime() + offset * DAY_MS);
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const slot = availability(branchId, day, [serviceId], memberId)[0];
    if (slot) return { day, time: slot.time, serviceId };
  }
  return null;
}

/** Sus clientes a los que les toca volver, en riesgo o perdidos, del más atrasado al menos. */
export function dueClientsOf(branchId: string, memberId: string, now = new Date()) {
  const agenda = agendaBarbers(now.getTime());
  // La misma regla que los avisos de Clientes («le toca volver», «en riesgo») más los perdidos: la cifra cuadra en las dos.
  const items = db.calendar.clients
    .filter((client) => client.id !== WALK_IN_CLIENT.id && !profileOf(client).deleted)
    .map((client) => customerSummary(client, agenda))
    .filter((row) => !row.blocked && (row.preferredBarberId === memberId || row.barberIds.includes(memberId)) && (row.segment === "atRisk" || row.segment === "lost" || isOverdue(row, now)))
    .map((row) => ({ ...row, daysSince: row.lastVisitAt ? Math.floor((now.getTime() - new Date(row.lastVisitAt).getTime()) / DAY_MS) : null }))
    .sort((a, b) => (b.daysSince ?? 0) - (a.daysSince ?? 0))
    .slice(0, MAX_DUE);
  return { items, nextSlot: nextSlotOf(branchId, memberId) };
}

export const barberHomeHandlers = [
  http.get(`${BASE}/team/members/:id/reputation`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const memberId = String(params.id);
    const denied = allowed(request, memberId);
    if (denied) return denied;
    if (!db.team.members.some((item) => item.id === memberId)) return error(404, "not_found", "Esa persona no existe.");
    return HttpResponse.json(reputationOf(memberId));
  }),

  http.get(`${BASE}/team/members/:id/due-clients`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const memberId = String(params.id);
    const denied = allowed(request, memberId);
    if (denied) return denied;
    const branchId = new URL(request.url).searchParams.get("branchId") ?? "";
    if (!branchId) return error(422, "validation", "Falta la sucursal.");
    return HttpResponse.json(dueClientsOf(branchId, memberId));
  }),
];
