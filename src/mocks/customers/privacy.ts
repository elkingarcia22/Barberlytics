import { delay, http, HttpResponse } from "msw";
import { db } from "../db";
import { WALK_IN_CLIENT, type MockClient } from "../calendar/seed";
import { cardsOf } from "../booking/logic";
import { branchCountry } from "../settings/branchRules";
import { hasStepUp, isManager, sessionOf, stepUpRequired, unauthorized, forbidden } from "../session";
import { profileOf, saveProfile } from "./handlers";
import type { MockPrivacyRequest } from "./seed";
import { consentCountryOf } from "@/features/legal/consent";

/**
 * Los derechos del titular sobre sus datos (docs/API_CONTRACT.md, «Clientes › Datos y privacidad»):
 * exportar todo lo que hay de un cliente, borrarlo (anonimizar: el historial contable queda sin datos
 * personales) y llevar el registro de cada solicitud con su plazo legal. Exportar y borrar los hace el
 * dueño o un administrador; borrar pide confirmar la identidad (`X-Step-Up`) porque no se deshace.
 */

const BASE = "*/api";
const LATENCY_MS = 150;
const DAY_MS = 86_400_000;
const MAX_NOTE = 500;
const TYPES: readonly MockPrivacyRequest["type"][] = ["access", "export", "rectify", "erase", "revoke", "other"];
const CHANNELS: readonly MockPrivacyRequest["channel"][] = ["app", "phone", "email", "in_person", "whatsapp", "sms"];
const ERASED_NAME = "Cliente borrado";

const requests = (): MockPrivacyRequest[] => db.customers.privacyRequests ?? [];
const saveRequests = (items: MockPrivacyRequest[]) => {
  db.customers = { ...db.customers, privacyRequests: items };
  db.persist();
};
// «Walk in» es el cliente comodín de las citas sin nombre: no es una persona y no tiene datos que pedir.
const findClient = (id: unknown) => (id === WALK_IN_CLIENT.id ? undefined : db.calendar.clients.find((client) => client.id === id));
const error = (status: number, code: string, message: string) => HttpResponse.json({ code, message }, { status });

/** Suma días hábiles (lunes a viernes; los festivos aún no se descuentan). */
function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from);
  let left = days;
  while (left > 0) {
    date.setTime(date.getTime() + DAY_MS);
    const weekday = date.getDay();
    if (weekday !== 0 && weekday !== 6) left -= 1;
  }
  return date;
}

/**
 * El plazo para responder según el país de la sede del cliente: Colombia 10 días hábiles para consultas
 * (ver, exportar) y 15 para reclamos (corregir, borrar, retirar); México 20 hábiles (ARCO); EE. UU. y el
 * resto, 45 días (CCPA). Plazos de producto: los confirma el abogado.
 */
export function dueDateOf(type: MockPrivacyRequest["type"], country: string, from = new Date()): Date {
  const code = consentCountryOf(country);
  if (code === "CO") return addBusinessDays(from, type === "access" || type === "export" ? 10 : 15);
  if (code === "MX") return addBusinessDays(from, 20);
  return new Date(from.getTime() + 45 * DAY_MS);
}

/** Anota una solicitud; `done` si se resolvió en el acto (exportar, borrar, retirar un permiso desde la app). */
export function logPrivacyRequest(client: MockClient, type: MockPrivacyRequest["type"], channel: MockPrivacyRequest["channel"], note: string, by: string, done: boolean, at = new Date()): MockPrivacyRequest {
  const request: MockPrivacyRequest = {
    id: `prq_${Math.random().toString(36).slice(2, 10)}`,
    clientId: client.id,
    clientName: client.name,
    type,
    channel,
    status: done ? "done" : "open",
    note: note.slice(0, MAX_NOTE),
    requestedAt: at.toISOString(),
    dueAt: dueDateOf(type, branchCountry(profileOf(client).branchId), at).toISOString(),
    doneAt: done ? at.toISOString() : null,
    by,
  };
  saveRequests([request, ...requests()]);
  return request;
}

const view = (request: MockPrivacyRequest, now = Date.now()) => ({ ...request, overdue: request.status === "open" && Date.parse(request.dueAt) < now });

/** Todo lo que hay del cliente, legible: lo que se entrega cuando pide sus datos. */
export function exportOf(client: MockClient) {
  const profile = profileOf(client);
  const serviceName = (id: string) => db.services.items.find((item) => item.id === id)?.name ?? id;
  const memberName = (id: string) => {
    const member = db.team.members.find((item) => item.id === id);
    return member ? `${member.firstName} ${member.lastName}` : id;
  };
  return {
    exportedAt: new Date().toISOString(),
    client: { id: client.id, name: client.name, phone: client.phone, email: profile.email, birthDate: profile.birthDate, country: profile.country, state: profile.state, city: profile.city, address: profile.address, zipcode: profile.zipcode, createdAt: profile.createdAt },
    consents: { marketing: profile.marketingConsent ?? null, health: profile.healthConsent ?? null },
    notes: client.notes.map(({ kind, text, createdAt }) => ({ kind, text, createdAt })),
    guests: profile.guests.map(({ name, relation }) => ({ name, relation })),
    appointments: db.calendar.appointments
      .filter((item) => item.clientId === client.id)
      .sort((a, b) => a.start.localeCompare(b.start))
      .map((item) => ({ start: item.start, branchId: item.branchId, services: item.serviceIds.map(serviceName), barber: memberName(item.barberId), status: item.status, paid: item.payment?.total ?? null, tip: item.payment?.tip ?? null, method: item.payment?.method ?? null })),
    messages: (db.booking.outbox ?? []).filter((item) => item.clientId === client.id).map(({ kind, channel, status, sendAt, sentAt, body }) => ({ kind, channel, status, at: sentAt ?? sendAt, body: body ?? null })),
    replies: (db.booking.inbound ?? []).filter((item) => item.clientId === client.id).map(({ at, intent, text }) => ({ at, intent, text })),
    reviews: (db.booking.reviews ?? []).filter((item) => item.clientId === client.id).map(({ rating, comment, createdAt }) => ({ rating, comment, createdAt })),
    cards: cardsOf(client.id).map(({ brand, last4, expMonth, expYear }) => ({ brand, last4, expMonth, expYear })),
    credit: db.booking.credits[client.id] ?? 0,
    privacyRequests: requests().filter((item) => item.clientId === client.id).map(({ type, channel, status, requestedAt, doneAt }) => ({ type, channel, status, requestedAt, doneAt })),
  };
}

/**
 * Borrar = anonimizar: el cliente deja de existir como persona (nombre, contacto, notas, permisos, tarjetas,
 * respuestas, fotos), pero sus citas y cobros quedan sin datos personales porque la contabilidad los exige.
 */
export function eraseClient(client: MockClient, at = new Date()): void {
  const iso = at.toISOString();
  db.calendar.clients = db.calendar.clients.map((item) => (item.id === client.id ? { ...item, name: ERASED_NAME, phone: "", notes: [] } : item));
  const profile = profileOf(client);
  saveProfile(client.id, { ...profile, email: "", country: "", state: "", city: "", address: "", zipcode: "", birthDate: null, guests: [], marketingConsent: undefined, healthConsent: undefined, deleted: true, erasedAt: iso });
  db.calendar.appointments = db.calendar.appointments.map((item) => (item.clientId === client.id ? { ...item, notes: null, referencePhotos: undefined } : item));
  db.booking.outbox = (db.booking.outbox ?? []).map((item) => (item.clientId === client.id ? { ...item, to: "", body: undefined, params: undefined } : item));
  db.booking.inbound = (db.booking.inbound ?? []).map((item) => (item.clientId === client.id ? { ...item, from: "", text: "" } : item));
  db.booking.reviews = (db.booking.reviews ?? []).map((item) => (item.clientId === client.id ? { ...item, clientName: ERASED_NAME } : item));
  if (db.booking.cards?.[client.id]) db.booking.cards = { ...db.booking.cards, [client.id]: [] };
  db.frontDesk = { ...db.frontDesk, queue: db.frontDesk.queue.map((entry) => (entry.clientId === client.id ? { ...entry, firstName: "—", phone: null } : entry)) };
  db.persist();
}

export const privacyHandlers = [
  http.get(`${BASE}/customers/:id/export`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("Exportar los datos de un cliente lo hace el dueño o un administrador.");
    const client = findClient(params.id);
    if (!client || profileOf(client).erasedAt) return error(404, "not_found", "Ese cliente no existe.");
    const channel = CHANNELS.find((item) => item === new URL(request.url).searchParams.get("channel")) ?? "app";
    logPrivacyRequest(client, "export", channel, "Se entregó la copia de sus datos.", session.account.user.name, true);
    return HttpResponse.json(exportOf(client));
  }),

  http.post(`${BASE}/customers/:id/erase`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("Borrar los datos de un cliente lo hace el dueño o un administrador.");
    if (!hasStepUp(request)) return stepUpRequired();
    const client = findClient(params.id);
    if (!client || profileOf(client).erasedAt) return error(404, "not_found", "Ese cliente no existe.");
    const input = (await request.json().catch(() => ({}))) as { channel?: unknown; note?: unknown };
    const channel = CHANNELS.find((item) => item === input.channel) ?? "app";
    const note = typeof input.note === "string" ? input.note.trim() : "";
    // El registro se anota antes de borrar: así dice de quién era.
    logPrivacyRequest(client, "erase", channel, note || "Se borraron sus datos personales; el historial contable queda sin ellos.", session.account.user.name, true);
    eraseClient(client);
    return HttpResponse.json({ erasedAt: new Date().toISOString() });
  }),

  // Una solicitud que llegó por otro lado (teléfono, correo, en el local): queda abierta con su plazo.
  http.post(`${BASE}/customers/:id/privacy-requests`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session) && session.teamRole !== "recepcion") return forbidden("Las solicitudes las anota recepción o gerencia.");
    const client = findClient(params.id);
    if (!client) return error(404, "not_found", "Ese cliente no existe.");
    const input = (await request.json().catch(() => ({}))) as { type?: unknown; channel?: unknown; note?: unknown };
    const type = TYPES.find((item) => item === input.type);
    const channel = CHANNELS.find((item) => item === input.channel);
    if (!type || !channel) return HttpResponse.json({ code: "validation", message: "Elige qué pidió y por dónde.", fields: { type: type ? [] : ["required"], channel: channel ? [] : ["required"] } }, { status: 422 });
    const created = logPrivacyRequest(client, type, channel, typeof input.note === "string" ? input.note.trim() : "", session.account.user.name, false);
    return HttpResponse.json(view(created), { status: 201 });
  }),

  http.get(`${BASE}/privacy-requests`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session) && session.teamRole !== "recepcion") return forbidden("Las solicitudes las ve recepción o gerencia.");
    const params = new URL(request.url).searchParams;
    const clientId = params.get("clientId");
    const status = params.get("status");
    const items = requests().filter((item) => (!clientId || item.clientId === clientId) && (!status || item.status === status));
    return HttpResponse.json({ items: items.map((item) => view(item)), open: requests().filter((item) => item.status === "open").length });
  }),

  http.post(`${BASE}/privacy-requests/:id/done`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("Cerrar una solicitud lo hace el dueño o un administrador.");
    const target = requests().find((item) => item.id === params.id);
    if (!target) return error(404, "not_found", "Esa solicitud no existe.");
    const input = (await request.json().catch(() => ({}))) as { note?: unknown };
    const note = typeof input.note === "string" && input.note.trim() ? `${target.note}${target.note ? " · " : ""}${input.note.trim()}`.slice(0, MAX_NOTE) : target.note;
    const done: MockPrivacyRequest = { ...target, status: "done", doneAt: new Date().toISOString(), note };
    saveRequests(requests().map((item) => (item.id === target.id ? done : item)));
    return HttpResponse.json(view(done));
  }),
];
