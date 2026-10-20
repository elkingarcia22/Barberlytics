import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { ALERT_IDS, isEmptyFilter, matchesGroup, type GroupFilters } from "@/features/customers/groupFilter";
import { nextPromoSlot } from "@/features/legal/sendWindow";
import { estimateCost } from "@/features/marketing/messagePricing";
import { normalizePromoCode } from "@/features/booking/pricing";
import { db } from "../db";
import { forbidden, isBarber, isManager, sessionOf, unauthorized } from "../session";
import { WALK_IN_CLIENT, type MockClient } from "../calendar/seed";
import { agendaBarbers, customerSummary, profileOf } from "../customers/handlers";
import { promoNear } from "../customers/promoCap";
import { branchCountry, branchSendPlace } from "../settings/branchRules";
import type { MockCampaign, MockCustomerGroup, MockGroupFilters } from "../customers/seed";
import type { MockOutboxMessage } from "../booking/state";

/**
 * Grupos y campañas (docs/API_CONTRACT.md, «Clientes › Grupos y campañas»). Un grupo es un filtro de Clientes con
 * nombre (segmento, aviso, etiqueta, origen). Una campaña le escribe por WhatsApp a ese grupo: antes de mandar se ve
 * a cuántos sí y a cuántos no (sin permiso de promociones, sin celular, con una promoción reciente, bloqueados), un
 * ejemplo del mensaje y lo que costaría. Cada mensaje sale en la franja legal de la sede de su cliente y cuenta para
 * el tope mensual. Después, la campaña dice cuántos salieron, cuántos reservaron en 14 días, lo cobrado y el retorno.
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const MAX_BODY = 600;
const MAX_NAME = 60;
const RESULT_WINDOW_DAYS = 14;
const DAY_MS = 86_400_000;

const asRecord = (body: DefaultBodyType | unknown): Record<string, unknown> => (body && typeof body === "object" ? (body as Record<string, unknown>) : {});
const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const error = (status: number, code: string, message: string, extra: Record<string, unknown> = {}) => HttpResponse.json({ code, message, ...extra }, { status });
const round2 = (value: number) => Math.round(value * 100) / 100;

/** Los filtros como llegan, limpios: lo que no se reconoce queda vacío. */
export function filtersFrom(input: unknown): MockGroupFilters {
  const raw = asRecord(input);
  const alert = ALERT_IDS.find((id) => id === raw.alert) ?? null;
  return { segment: text(raw.segment) || null, alert, tag: text(raw.tag).toLowerCase() || null, source: text(raw.source) || null };
}

const realClients = (): MockClient[] => db.calendar.clients.filter((client) => client.id !== WALK_IN_CLIENT.id && !profileOf(client).deleted);

/** Los clientes del grupo, con la misma regla que la lista de Clientes. */
export function audienceOf(filters: GroupFilters, now = new Date()): MockClient[] {
  const agenda = agendaBarbers(now.getTime());
  return realClients().filter((client) => matchesGroup(customerSummary(client, agenda), filters, now));
}

export type ExclusionReason = "noConsent" | "noPhone" | "promoCap" | "blocked";

/** Por qué no se le puede mandar una promoción a un cliente ahora, o `null` si sí. */
function exclusionOf(client: MockClient, now: Date): ExclusionReason | null {
  const profile = profileOf(client);
  if (profile.blocked) return "blocked";
  if (!client.phone || client.phone.replace(/\D/g, "").length < 8) return "noPhone";
  if (profile.marketingConsent?.accepted !== true) return "noConsent";
  if (promoNear(client.id, now)) return "promoCap";
  return null;
}

const firstName = (name: string) => name.split(" ")[0] || name;

/** El texto que recibe un cliente: sus marcas reemplazadas. */
export const renderBody = (body: string, client: MockClient, coupon: string | null): string => body.replace(/\{nombre\}/g, firstName(client.name)).replace(/\{cupon\}/g, coupon ?? "");

interface Plan {
  audience: MockClient[];
  eligible: MockClient[];
  excluded: Record<ExclusionReason, number>;
  cost: number;
}

function planOf(filters: GroupFilters, now: Date): Plan {
  const audience = audienceOf(filters, now);
  const excluded: Record<ExclusionReason, number> = { noConsent: 0, noPhone: 0, promoCap: 0, blocked: 0 };
  const eligible: MockClient[] = [];
  for (const client of audience) {
    const reason = exclusionOf(client, now);
    if (reason) excluded[reason] += 1;
    else eligible.push(client);
  }
  const cost = estimateCost(eligible.map((client) => branchCountry(profileOf(client).branchId)));
  return { audience, eligible, excluded, cost };
}

/** Lo que llega de una campaña o de su vista previa: filtros (de un grupo o sueltos), texto y cupón. */
function readDraft(input: Record<string, unknown>): { filters: MockGroupFilters; group: MockCustomerGroup | null; body: string; couponCode: string | null; fields: Record<string, string[]> } {
  const group = (db.customers.groups ?? []).find((item) => item.id === input.groupId) ?? null;
  const filters = group ? group.filters : filtersFrom(input.filters);
  const body = text(input.body);
  const fields: Record<string, string[]> = {};
  if (body.length < 5 || body.length > MAX_BODY) fields.body = [`Escribe el mensaje (de 5 a ${MAX_BODY} caracteres).`];
  const rawCoupon = text(input.couponCode);
  const couponCode = rawCoupon ? normalizePromoCode(rawCoupon) : null;
  if (couponCode && !(db.settings.lists.coupons ?? []).some((item) => normalizePromoCode(text(item.code)) === couponCode && item.active !== false)) fields.couponCode = ["Ese cupón no existe o está apagado."];
  if (body.includes("{cupon}") && !couponCode) fields.couponCode = ["El mensaje usa {cupon}: elige uno."];
  if (!group && isEmptyFilter(filters)) fields.filters = ["Elige un grupo o al menos un filtro: una campaña no va a todos sin mirar."];
  return { filters, group, body, couponCode, fields };
}

/** Los resultados de una campaña: lo enviado, quién reservó en 14 días, lo cobrado, el uso del cupón y el retorno. */
export function resultsOf(campaign: MockCampaign, now = new Date()) {
  const messages = (db.booking.outbox ?? []).filter((item) => item.campaignId === campaign.id);
  const count = (status: MockOutboxMessage["status"]) => messages.filter((item) => item.status === status).length;
  const start = Date.parse(campaign.sendAt);
  const end = start + RESULT_WINDOW_DAYS * DAY_MS;
  const recipients = new Set(campaign.recipients);
  const booked = db.calendar.appointments.filter((item) => recipients.has(item.clientId) && Date.parse(item.createdAt) >= start && Date.parse(item.createdAt) <= end && item.status !== "cancelled");
  const revenue = round2(booked.filter((item) => item.status === "paid").reduce((sum, item) => sum + (item.payment ? item.payment.total - item.payment.tip : 0), 0));
  const couponUses = campaign.couponCode ? (db.booking.couponRedemptions ?? []).filter((item) => item.code === campaign.couponCode && recipients.has(item.clientId) && Date.parse(item.at) >= start && Date.parse(item.at) <= end).length : 0;
  const bookedClients = new Set(booked.map((item) => item.clientId)).size;
  return {
    sent: count("sent"),
    scheduled: count("scheduled"),
    failed: count("failed"),
    cancelled: count("cancelled"),
    bookedClients,
    bookings: booked.length,
    revenue,
    couponUses,
    cost: campaign.estimatedCost,
    /** Lo cobrado por cada peso gastado; `null` sin costo. */
    roi: campaign.estimatedCost > 0 ? round2(revenue / campaign.estimatedCost) : null,
    /** Aún dentro de la ventana de 14 días: la cifra puede crecer. */
    open: now.getTime() < end,
  };
}

const groupView = (group: MockCustomerGroup, now = new Date()) => ({ ...group, size: audienceOf(group.filters, now).length });
const campaignView = (campaign: MockCampaign, now = new Date()) => ({ ...campaign, recipients: campaign.recipients.length, results: resultsOf(campaign, now) });

const saveGroups = (groups: MockCustomerGroup[]) => {
  db.customers = { ...db.customers, groups };
  db.persist();
};

export const campaignHandlers = [
  http.get(`${BASE}/customers/groups`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!sessionOf(request)) return unauthorized();
    return HttpResponse.json({ items: (db.customers.groups ?? []).map((group) => groupView(group)) });
  }),

  // Guardar el filtro de la lista con un nombre. Recepción y gerencia.
  http.post(`${BASE}/customers/groups`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (isBarber(session)) return forbidden("Los grupos los arma recepción o gerencia.");
    const input = asRecord(await request.json().catch(() => ({})));
    const name = text(input.name).slice(0, MAX_NAME);
    const filters = filtersFrom(input.filters);
    const fields: Record<string, string[]> = {};
    if (name.length < 2) fields.name = ["Ponle un nombre al grupo."];
    else if ((db.customers.groups ?? []).some((group) => group.name.toLowerCase() === name.toLowerCase())) fields.name = ["Ya hay un grupo con ese nombre."];
    if (isEmptyFilter(filters)) fields.filters = ["Elige al menos un filtro."];
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const group: MockCustomerGroup = { id: `grp_${Date.now().toString(36)}`, name, filters, createdAt: new Date().toISOString(), by: session.account.user.name };
    saveGroups([...(db.customers.groups ?? []), group]);
    return HttpResponse.json(groupView(group), { status: 201 });
  }),

  http.delete(`${BASE}/customers/groups/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (isBarber(session)) return forbidden("Los grupos los arma recepción o gerencia.");
    if (!(db.customers.groups ?? []).some((group) => group.id === params.id)) return error(404, "not_found", "Ese grupo no existe.");
    saveGroups((db.customers.groups ?? []).filter((group) => group.id !== params.id));
    return new HttpResponse(null, { status: 204 });
  }),

  // Antes de mandar: a cuántos sí y a cuántos no (con el motivo), un ejemplo del mensaje y lo que costaría.
  http.post(`${BASE}/campaigns/preview`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("Las campañas las manda el dueño o el administrador.");
    const draft = readDraft(asRecord(await request.json().catch(() => ({}))));
    if (Object.keys(draft.fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields: draft.fields });
    const now = new Date();
    const plan = planOf(draft.filters, now);
    const sample = plan.eligible[0] ?? plan.audience[0];
    const firstSlot = plan.eligible.map((client) => nextPromoSlot(branchSendPlace(profileOf(client).branchId), now).getTime()).sort((a, b) => a - b)[0];
    return HttpResponse.json({
      audience: plan.audience.length,
      eligible: plan.eligible.length,
      excluded: plan.excluded,
      cost: { amount: plan.cost, currency: "USD" },
      sample: sample ? { name: sample.name, text: renderBody(draft.body, sample, draft.couponCode) } : null,
      names: plan.eligible.slice(0, 5).map((client) => client.name),
      firstSendAt: firstSlot ? new Date(firstSlot).toISOString() : null,
    });
  }),

  // Mandar: cada mensaje va a la cola en la franja legal de la sede de su cliente (o a la hora pedida, si es después).
  http.post(`${BASE}/campaigns`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("Las campañas las manda el dueño o el administrador.");
    const input = asRecord(await request.json().catch(() => ({})));
    const draft = readDraft(input);
    const name = text(input.name).slice(0, MAX_NAME);
    if (name.length < 2) draft.fields.name = ["Ponle un nombre a la campaña."];
    const scheduleAt = text(input.scheduleAt) ? new Date(text(input.scheduleAt)) : null;
    if (scheduleAt && Number.isNaN(scheduleAt.getTime())) draft.fields.scheduleAt = ["Esa hora no es válida."];
    if (Object.keys(draft.fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields: draft.fields });
    const now = new Date();
    const from = scheduleAt && scheduleAt > now ? scheduleAt : now;
    const plan = planOf(draft.filters, now);
    if (plan.eligible.length === 0) return error(409, "empty_audience", "Nadie del grupo puede recibir la campaña ahora (permiso, celular o tope).", { details: { excluded: plan.excluded } });
    const id = `cmp_${now.getTime().toString(36)}`;
    const messages: MockOutboxMessage[] = plan.eligible.map((client, index) => ({
      id: `msg_cmp_${now.getTime().toString(36)}_${index}`,
      appointmentId: "",
      clientId: client.id,
      to: client.phone,
      channel: "whatsapp",
      kind: "campaign",
      sendAt: nextPromoSlot(branchSendPlace(profileOf(client).branchId), from).toISOString(),
      status: "scheduled",
      params: [firstName(client.name), renderBody(draft.body, client, draft.couponCode)],
      body: renderBody(draft.body, client, draft.couponCode),
      by: session.account.user.name,
      campaignId: id,
    }));
    const campaign: MockCampaign = { id, name, groupId: draft.group?.id ?? null, filters: draft.filters, body: draft.body, couponCode: draft.couponCode, createdAt: now.toISOString(), by: session.account.user.name, sendAt: from.toISOString(), recipients: plan.eligible.map((client) => client.id), excluded: plan.excluded, estimatedCost: plan.cost, status: "scheduled" };
    db.booking.outbox = [...messages, ...(db.booking.outbox ?? [])];
    db.customers = { ...db.customers, campaigns: [campaign, ...(db.customers.campaigns ?? [])] };
    db.persist();
    return HttpResponse.json(campaignView(campaign, now), { status: 201 });
  }),

  http.get(`${BASE}/campaigns`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("Las campañas las ve el dueño o el administrador.");
    return HttpResponse.json({ items: (db.customers.campaigns ?? []).map((campaign) => campaignView(campaign)) });
  }),

  // Cancelar lo que aún no salió de una campaña.
  http.post(`${BASE}/campaigns/:id/cancel`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("Las campañas las maneja el dueño o el administrador.");
    const campaign = (db.customers.campaigns ?? []).find((item) => item.id === params.id);
    if (!campaign) return error(404, "not_found", "Esa campaña no existe.");
    db.booking.outbox = (db.booking.outbox ?? []).map((item) => (item.campaignId === campaign.id && item.status === "scheduled" ? { ...item, status: "cancelled" as const } : item));
    const cancelled: MockCampaign = { ...campaign, status: "cancelled" };
    db.customers = { ...db.customers, campaigns: (db.customers.campaigns ?? []).map((item) => (item.id === campaign.id ? cancelled : item)) };
    db.persist();
    return HttpResponse.json(campaignView(cancelled));
  }),
];
