import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { db } from "../db";
import { appointmentsOn } from "../calendar/handlers";
import { WALK_IN_CLIENT, parseClock, type MockAppointment } from "../calendar/seed";
import { durationOf } from "../booking/logic";
import { newConfirmToken } from "../booking/reminders";
import { findByPhone } from "../customers/handlers";
import { branchCountry, branchNow } from "../settings/branchRules";
import { consentCountryOf } from "@/features/legal/consent";
import { forbidden, isBarber, isManager, sessionOf, unauthorized, type MockSession } from "../session";
import { memberName } from "../team/seed";
import { lineupTurn } from "../team/workforce";
import { estimateIfJoined, estimateQueue } from "./estimate";
import type { MockKioskDevice, MockQueueEntry } from "./state";

/**
 * Recepción (docs/API_CONTRACT.md, «Recepción y kiosco»).
 *
 * - **Kiosco por sede.** Un dueño o administrador crea el kiosco de una sede y le sale un código de 6
 *   dígitos (10 minutos, una vez). La tablet abre `/kiosco`, escribe el código y recibe su token, que
 *   manda en `X-Kiosk-Token`. No es la sesión de nadie: se revoca desde Configuración.
 * - **Check-in.** El cliente escribe su celular y ve solo su nombre de pila y la hora de su cita de hoy
 *   en esa sede; al marcar «Ya llegué» la cita pasa a «Llegó» y se avisa al barbero y a recepción.
 * - **Fila sin cita.** Quien llega sin cita se une a la fila (en el kiosco o en recepción) con su
 *   servicio y, si quiere, su barbero; ve su lugar y la espera aproximada (`estimate.ts`). Recepción lo
 *   llama (queda una cita «Llegó» con quien le toca) o lo marca como que se fue.
 */

const BASE = "*/api";
const LATENCY_MS = 150;
const PAIRING_MS = 10 * 60_000;
const MAX_NAME = 40;
const MAX_DEVICE_NAME = 40;
const MAX_QUEUE = 40;
/** Consultas de celular por kiosco y minuto: alcanza para la fila de la mañana, no para probar números. */
const LOOKUPS_PER_MINUTE = 20;
/** Intentos de emparejar por minuto (en toda la demo): un código de 6 dígitos no se adivina así. */
const PAIR_ATTEMPTS_PER_MINUTE = 10;
/** Una cita se puede marcar «Ya llegué» desde 2 h antes hasta 1 h después de su hora. */
const EARLY_MIN = 120;
const LATE_MIN = 60;

const asRecord = (body: DefaultBodyType): Record<string, unknown> => (body && typeof body === "object" ? (body as Record<string, unknown>) : {});
const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const error = (status: number, code: string, message: string, extra: Record<string, unknown> = {}) => HttpResponse.json({ code, message, ...extra }, { status });
const randomId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] ?? "";
const digits = (value: string) => value.replace(/\D/g, "");
const branchName = (branchId: string) => (db.settings.lists.branches.find((item) => item.id === branchId)?.name as string | undefined) ?? branchId;
const historyEntry = (actor: string, event: string) => ({ id: randomId("h"), at: new Date().toISOString(), actor, event });

const hits = new Map<string, number[]>();
function limited(key: string, limit: number, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((at) => now - at < 60_000);
  hits.set(key, [...recent, now]);
  return recent.length >= limit;
}
/** Para las pruebas: cada una empieza sin consultas acumuladas. */
export const resetKioskLimits = () => hits.clear();

const saveDevices = (devices: MockKioskDevice[]) => {
  db.frontDesk = { ...db.frontDesk, devices };
  db.persist();
};
const saveQueue = (queue: MockQueueEntry[]) => {
  db.frontDesk = { ...db.frontDesk, queue };
  db.persist();
};

/** Lo que se ve de un kiosco en Configuración: nunca el token. */
const deviceView = (device: MockKioskDevice) => ({
  id: device.id,
  branchId: device.branchId,
  branchName: branchName(device.branchId),
  name: device.name,
  status: device.revokedAt ? "revoked" : device.token ? "active" : "pending",
  pairingCode: device.token || device.revokedAt ? null : device.pairingCode,
  pairingExpiresAt: device.token || device.revokedAt ? null : device.pairingExpiresAt,
  createdAt: device.createdAt,
  createdBy: device.createdBy,
  pairedAt: device.pairedAt,
  lastSeenAt: device.lastSeenAt,
});

const newCode = () => String(Math.floor(100_000 + Math.random() * 900_000));

/** El kiosco de la petición, por su token; actualiza cuándo se vio por última vez. */
function kioskOf(request: Request): MockKioskDevice | null {
  const token = request.headers.get("x-kiosk-token");
  const device = token ? db.frontDesk.devices.find((item) => item.token === token && !item.revokedAt) : undefined;
  if (!device) return null;
  saveDevices(db.frontDesk.devices.map((item) => (item.id === device.id ? { ...item, lastSeenAt: new Date().toISOString() } : item)));
  return device;
}

const kioskUnauthorized = () => error(401, "kiosk_unauthorized", "Este kiosco no está activo. Pídele a alguien del equipo que lo active.");

/* ------------------------------------------------------------------ fila */

const queueToday = (branchId: string, at = new Date()) => {
  const day = branchNow(branchId, at).slice(0, 10);
  return db.frontDesk.queue.filter((entry) => entry.branchId === branchId && entry.day === day);
};

/** La fila de hoy con la espera de cada uno y cómo va el día (atendidos, se fueron). */
function queueView(branchId: string, at = new Date()) {
  const today = queueToday(branchId, at);
  const estimates = estimateQueue(branchId, today, at);
  const services = db.services.items;
  const waiting = today
    .filter((entry) => entry.status === "waiting")
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))
    .map((entry) => {
      const estimate = estimates.get(entry.id);
      return {
        id: entry.id,
        firstName: entry.firstName,
        clientId: entry.clientId,
        hasPhone: entry.phone !== null,
        services: entry.serviceIds.map((id) => services.find((item) => item.id === id)?.name ?? id),
        serviceIds: entry.serviceIds,
        barberId: entry.barberId,
        barberName: entry.barberId ? memberName(db.team.members.find((member) => member.id === entry.barberId) ?? { firstName: "", lastName: "" }) : null,
        joinedAt: entry.joinedAt,
        source: entry.source,
        position: estimate?.position ?? 0,
        waitMin: estimate?.waitMin ?? null,
        waitMax: estimate?.waitMax ?? null,
        suggestedBarberId: estimate?.barberId ?? null,
        suggestedBarberName: estimate?.barberName ?? null,
      };
    });
  return {
    branchId,
    waiting,
    served: today.filter((entry) => entry.status === "called").length,
    left: today.filter((entry) => entry.status === "left").length,
  };
}

interface JoinInput {
  firstName: string;
  phone: string | null;
  serviceIds: string[];
  barberId: string | null;
}

function parseJoin(body: Record<string, unknown>): JoinInput | Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  const firstName = text(body.firstName).slice(0, MAX_NAME);
  if (firstName.length < 2) fields.firstName = ["Escribe tu nombre."];
  const phoneDigits = digits(text(body.phone));
  if (phoneDigits && (phoneDigits.length < 8 || phoneDigits.length > 15)) fields.phone = ["Ese celular no parece válido."];
  const serviceIds = (Array.isArray(body.serviceIds) ? body.serviceIds : []).filter((id): id is string => typeof id === "string" && db.services.items.some((item) => item.id === id && item.kind !== "combo"));
  if (serviceIds.length === 0) fields.serviceIds = ["Elige un servicio."];
  const barberId = typeof body.barberId === "string" && body.barberId ? body.barberId : null;
  if (barberId && !db.team.members.some((member) => member.id === barberId)) fields.barberId = ["Ese barbero no existe."];
  return Object.keys(fields).length > 0 ? fields : { firstName, phone: phoneDigits ? `+${phoneDigits}` : null, serviceIds, barberId };
}

function join(branchId: string, input: JoinInput, source: MockQueueEntry["source"], at = new Date()): MockQueueEntry | Response {
  const today = queueToday(branchId, at).filter((entry) => entry.status === "waiting");
  if (today.length >= MAX_QUEUE) return error(409, "queue_full", "La fila está llena por hoy. Pregunta en recepción.");
  if (input.phone && today.some((entry) => entry.phone === input.phone)) return error(409, "already_waiting", "Ya estás en la fila con ese celular.");
  const client = input.phone ? findByPhone(input.phone) : undefined;
  const entry: MockQueueEntry = {
    id: randomId("q"),
    branchId,
    day: branchNow(branchId, at).slice(0, 10),
    firstName: input.firstName,
    phone: input.phone,
    clientId: client?.id ?? null,
    serviceIds: input.serviceIds,
    barberId: input.barberId,
    status: "waiting",
    joinedAt: at.toISOString(),
    source,
    calledAt: null,
    appointmentId: null,
    leftAt: null,
  };
  saveQueue([...db.frontDesk.queue, entry]);
  return entry;
}

/** Recepción y gerencia manejan la fila; un barbero la ve (para saber quién viene) pero no la mueve. */
const canManageQueue = (session: MockSession) => isManager(session) || session.teamRole === "recepcion";

/** Llamar a quien sigue: queda una cita «Llegó» ahora, con el barbero elegido o con quien le toca. */
function callEntry(entry: MockQueueEntry, barberId: string | null, actor: string, at = new Date()): MockAppointment | Response {
  const estimate = estimateQueue(entry.branchId, queueToday(entry.branchId, at), at).get(entry.id);
  const chosen = barberId ?? entry.barberId ?? estimate?.barberId ?? lineupTurn(entry.branchId, "walkIn", at).next;
  if (!chosen) return error(409, "no_barber", "No hay un barbero libre para atenderlo ahora.");
  const local = branchNow(entry.branchId, at);
  const minute = parseClock(local.slice(11, 16));
  const start = `${local.slice(0, 10)}T${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}:00`;
  appointmentsOn(entry.branchId, local.slice(0, 10));
  const appointment: MockAppointment = {
    id: randomId("apt"),
    branchId: entry.branchId,
    clientId: entry.clientId ?? WALK_IN_CLIENT.id,
    barberId: chosen,
    requestedBarberId: entry.barberId,
    serviceIds: entry.serviceIds,
    products: [],
    start,
    durationMin: Math.max(15, durationOf(entry.serviceIds)),
    status: "arrived",
    barberReady: false,
    walkIn: true,
    source: "walkin",
    repeat: "none",
    seriesId: null,
    notes: entry.clientId ? null : `Sin cita: ${entry.firstName}`,
    createdAt: at.toISOString(),
    createdBy: actor,
    history: [historyEntry(actor, "walkin"), historyEntry(actor, "status:arrived")],
    payment: null,
    confirmToken: newConfirmToken(),
  };
  db.calendar.appointments = [appointment, ...db.calendar.appointments];
  saveQueue(db.frontDesk.queue.map((item) => (item.id === entry.id ? { ...item, status: "called", calledAt: at.toISOString(), appointmentId: appointment.id } : item)));
  return appointment;
}

/* ------------------------------------------------------------- check-in */

/** Las citas de hoy de ese celular en la sede del kiosco que aún se pueden marcar «Ya llegué». */
function todaysAppointments(branchId: string, phone: string, at = new Date()) {
  const client = findByPhone(phone);
  if (!client) return [];
  const local = branchNow(branchId, at);
  const now = parseClock(local.slice(11, 16));
  return appointmentsOn(branchId, local.slice(0, 10))
    .filter((item) => item.clientId === client.id && item.status === "scheduled")
    .filter((item) => {
      const start = parseClock(item.start.slice(11, 16));
      return start - EARLY_MIN <= now && now <= start + LATE_MIN;
    })
    .sort((a, b) => a.start.localeCompare(b.start));
}

export const frontDeskHandlers = [
  /* ---------------- kioscos (Configuración) ---------------- */
  http.get(`${BASE}/front-desk/devices`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("Los kioscos los activa el dueño o un administrador.");
    const branchId = new URL(request.url).searchParams.get("branchId");
    return HttpResponse.json({ items: db.frontDesk.devices.filter((item) => !branchId || item.branchId === branchId).map(deviceView) });
  }),

  http.post(`${BASE}/front-desk/devices`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("Los kioscos los activa el dueño o un administrador.");
    const body = asRecord(await request.json().catch(() => ({})));
    const branchId = text(body.branchId);
    const name = text(body.name).slice(0, MAX_DEVICE_NAME) || "Recepción";
    if (!db.settings.lists.branches.some((item) => item.id === branchId)) return error(422, "validation", "Elige la sede del kiosco.", { fields: { branchId: ["Elige la sede del kiosco."] } });
    const now = new Date();
    const device: MockKioskDevice = { id: randomId("kio"), branchId, name, token: null, pairingCode: newCode(), pairingExpiresAt: new Date(now.getTime() + PAIRING_MS).toISOString(), createdAt: now.toISOString(), createdBy: session.account.user.name, pairedAt: null, lastSeenAt: null, revokedAt: null };
    saveDevices([...db.frontDesk.devices, device]);
    return HttpResponse.json(deviceView(device), { status: 201 });
  }),

  // Un código nuevo para la misma tablet (o para cambiarla): el token anterior deja de valer.
  http.post(`${BASE}/front-desk/devices/:id/code`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("Los kioscos los activa el dueño o un administrador.");
    const device = db.frontDesk.devices.find((item) => item.id === params.id && !item.revokedAt);
    if (!device) return error(404, "not_found", "Ese kiosco no existe.");
    const next: MockKioskDevice = { ...device, token: null, pairedAt: null, pairingCode: newCode(), pairingExpiresAt: new Date(Date.now() + PAIRING_MS).toISOString() };
    saveDevices(db.frontDesk.devices.map((item) => (item.id === device.id ? next : item)));
    return HttpResponse.json(deviceView(next));
  }),

  http.delete(`${BASE}/front-desk/devices/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("Los kioscos los activa el dueño o un administrador.");
    const device = db.frontDesk.devices.find((item) => item.id === params.id);
    if (!device) return error(404, "not_found", "Ese kiosco no existe.");
    saveDevices(db.frontDesk.devices.map((item) => (item.id === device.id ? { ...item, token: null, pairingCode: null, revokedAt: new Date().toISOString() } : item)));
    return new HttpResponse(null, { status: 204 });
  }),

  /* ---------------- fila (recepción) ---------------- */
  http.get(`${BASE}/front-desk/queue`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    const branchId = new URL(request.url).searchParams.get("branchId") ?? "ma";
    const view = queueView(branchId);
    // El barbero ve quién viene, sin el celular (ya va oculto) y sin lo que no le toca.
    return HttpResponse.json(isBarber(session) ? { ...view, waiting: view.waiting.map((item) => ({ ...item, clientId: null })) } : view);
  }),

  http.post(`${BASE}/front-desk/queue`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!canManageQueue(session)) return forbidden("La fila la maneja recepción.");
    const body = asRecord(await request.json().catch(() => ({})));
    const branchId = text(body.branchId) || "ma";
    const input = parseJoin(body);
    if (!("firstName" in input) || Array.isArray((input as Record<string, unknown>).firstName)) return error(422, "validation", "Revisa los campos marcados.", { fields: input });
    const entry = join(branchId, input as JoinInput, "reception");
    if (entry instanceof Response) return entry;
    return HttpResponse.json(queueView(branchId), { status: 201 });
  }),

  http.post(`${BASE}/front-desk/queue/:id/call`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!canManageQueue(session)) return forbidden("La fila la maneja recepción.");
    const entry = db.frontDesk.queue.find((item) => item.id === params.id && item.status === "waiting");
    if (!entry) return error(404, "not_found", "Esa persona ya no está en la fila.");
    const body = asRecord(await request.json().catch(() => ({})));
    const appointment = callEntry(entry, text(body.barberId) || null, session.account.user.name);
    if (appointment instanceof Response) return appointment;
    db.persist();
    return HttpResponse.json({ appointment, queue: queueView(entry.branchId) });
  }),

  http.post(`${BASE}/front-desk/queue/:id/leave`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!canManageQueue(session)) return forbidden("La fila la maneja recepción.");
    const entry = db.frontDesk.queue.find((item) => item.id === params.id && item.status === "waiting");
    if (!entry) return error(404, "not_found", "Esa persona ya no está en la fila.");
    const reason = text(asRecord(await request.json().catch(() => ({}))).reason) === "removed" ? "removed" : "left";
    saveQueue(db.frontDesk.queue.map((item) => (item.id === entry.id ? { ...item, status: reason, leftAt: new Date().toISOString() } : item)));
    return HttpResponse.json(queueView(entry.branchId));
  }),

  /* ---------------- el kiosco ---------------- */
  http.post(`${BASE}/kiosk/pair`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (limited("pair", PAIR_ATTEMPTS_PER_MINUTE)) return error(429, "rate_limited", "Demasiados intentos. Espera un minuto.");
    const code = digits(text(asRecord(await request.json().catch(() => ({}))).code));
    const now = Date.now();
    const device = db.frontDesk.devices.find((item) => !item.revokedAt && !item.token && item.pairingCode === code && item.pairingExpiresAt && Date.parse(item.pairingExpiresAt) > now);
    if (!device || code.length !== 6) return error(422, "invalid_code", "Ese código no sirve o ya venció. Pide uno nuevo en Configuración.");
    const token = `kio_${crypto.randomUUID()}`;
    const paired: MockKioskDevice = { ...device, token, pairingCode: null, pairingExpiresAt: null, pairedAt: new Date(now).toISOString(), lastSeenAt: new Date(now).toISOString() };
    saveDevices(db.frontDesk.devices.map((item) => (item.id === device.id ? paired : item)));
    return HttpResponse.json({ token, device: { id: paired.id, name: paired.name }, branch: { id: paired.branchId, name: branchName(paired.branchId) } });
  }),

  http.get(`${BASE}/kiosk/me`, async ({ request }) => {
    await delay(LATENCY_MS);
    const device = kioskOf(request);
    if (!device) return kioskUnauthorized();
    const branchId = device.branchId;
    const probe = estimateIfJoined(branchId, [], null);
    const lanes = lineupTurn(branchId, "walkIn").items;
    const services = db.services.items.filter((item) => item.kind === "service" && item.activeBranchIds.includes(branchId));
    return HttpResponse.json({
      device: { id: device.id, name: device.name },
      branch: { id: branchId, name: branchName(branchId) },
      // El país del celular que se propone primero (el de la sede); el cliente lo puede cambiar.
      phoneCountry: ((country) => (country === "GENERIC" ? null : country))(consentCountryOf(branchCountry(branchId))),
      shopName: (db.settings.sections.company as { name?: string }).name ?? "",
      services: services.map((item) => ({ id: item.id, name: item.name, durationMin: item.durationMin })),
      barbers: lanes.map((lane) => ({ id: lane.memberId, firstName: firstNameOf(lane.name), avatarUrl: lane.avatarUrl })),
      queue: { waiting: queueToday(branchId).filter((entry) => entry.status === "waiting").length, waitMin: probe?.waitMin ?? null, waitMax: probe?.waitMax ?? null },
    });
  }),

  // Solo nombre de pila y hora: en una pantalla compartida nadie ve el correo, el teléfono ni el barbero de otro.
  http.post(`${BASE}/kiosk/lookup`, async ({ request }) => {
    await delay(LATENCY_MS);
    const device = kioskOf(request);
    if (!device) return kioskUnauthorized();
    if (limited(`lookup:${device.id}`, LOOKUPS_PER_MINUTE)) return error(429, "rate_limited", "Demasiadas búsquedas seguidas. Espera un momento.");
    const phone = digits(text(asRecord(await request.json().catch(() => ({}))).phone));
    if (phone.length < 8 || phone.length > 15) return error(422, "validation", "Escribe tu celular completo.", { fields: { phone: ["Escribe tu celular completo."] } });
    const client = findByPhone(`+${phone}`);
    const items = todaysAppointments(device.branchId, `+${phone}`).map((item) => ({ id: item.id, time: item.start.slice(11, 16), firstName: firstNameOf(client?.name ?? "") }));
    return HttpResponse.json({ appointments: items });
  }),

  http.post(`${BASE}/kiosk/check-in`, async ({ request }) => {
    await delay(LATENCY_MS);
    const device = kioskOf(request);
    if (!device) return kioskUnauthorized();
    const body = asRecord(await request.json().catch(() => ({})));
    const phone = `+${digits(text(body.phone))}`;
    // Se vuelve a comprobar el celular: el id de una cita sola no basta para marcarla.
    const appointment = todaysAppointments(device.branchId, phone).find((item) => item.id === text(body.appointmentId));
    if (!appointment) return error(404, "not_found", "No encontramos esa cita para hoy. Pregunta en recepción.");
    const actor = `Kiosco · ${device.name}`;
    const arrived: MockAppointment = { ...appointment, status: "arrived", history: [...appointment.history, historyEntry(actor, "status:arrived")] };
    db.calendar.appointments = db.calendar.appointments.map((item) => (item.id === arrived.id ? arrived : item));
    db.persist();
    const client = db.calendar.clients.find((item) => item.id === arrived.clientId);
    const barber = db.team.members.find((member) => member.id === arrived.barberId);
    return HttpResponse.json({ firstName: firstNameOf(client?.name ?? ""), time: arrived.start.slice(11, 16), barberFirstName: barber ? barber.firstName : null });
  }),

  http.post(`${BASE}/kiosk/queue`, async ({ request }) => {
    await delay(LATENCY_MS);
    const device = kioskOf(request);
    if (!device) return kioskUnauthorized();
    const input = parseJoin(asRecord(await request.json().catch(() => ({}))));
    if (!("serviceIds" in input) || !Array.isArray((input as JoinInput).serviceIds) || typeof (input as JoinInput).firstName !== "string") return error(422, "validation", "Revisa los campos marcados.", { fields: input });
    const entry = join(device.branchId, input as JoinInput, "kiosk");
    if (entry instanceof Response) return entry;
    const estimate = estimateQueue(device.branchId, queueToday(device.branchId)).get(entry.id);
    return HttpResponse.json({ id: entry.id, firstName: entry.firstName, position: estimate?.position ?? 1, waitMin: estimate?.waitMin ?? null, waitMax: estimate?.waitMax ?? null, barberFirstName: estimate?.barberName ? firstNameOf(estimate.barberName) : null }, { status: 201 });
  }),
];
