import { delay, http, HttpResponse } from "msw";
import { AUDIENCE_OF_ROLE, eventOfNotification } from "@/features/settings/sections/notificationCatalog";
import { ACCOUNTS, db } from "../db";
import { isManager, sessionOf } from "../session";
import { appointmentsOn } from "../calendar/handlers";
import { dateKey, type MockAppointment } from "../calendar/seed";
import { cycleWindow } from "../payroll/compute";
import { stockLevel, stockStatus } from "../inventory/stock";

/**
 * La bandeja de avisos (docs/API_CONTRACT.md, «Avisos»). No hay tabla de avisos: salen de lo que ya
 * pasó en el sistema —una reserva en línea, una cancelación, un WhatsApp que no salió, una caja que
 * no cuadró— y cada rol ve solo los suyos. Lo leído se guarda por cuenta.
 *
 * El contrato aún no recibe el rol del equipo en la sesión: la app manda `role` y `memberId` (el
 * mismo criterio que usa para sus pantallas). El backend real lo sacará de la sesión.
 */

const BASE = "*/api";
const LATENCY_MS = 150;
const DAY_MS = 86_400_000;
const RECENT_DAYS = 7;
const MAX_ITEMS = 30;
/** Diferencia de caja a partir de la cual se avisa. */
const REGISTER_THRESHOLD = 1;
const LOW_RATING = 3;

type Role = "owner" | "admin" | "recepcion" | "barbero-comision" | "barbero-renta";
const ROLES: readonly Role[] = ["owner", "admin", "recepcion", "barbero-comision", "barbero-renta"];
const MANAGERS: readonly Role[] = ["owner", "admin"];
const FRONT: readonly Role[] = ["owner", "admin", "recepcion"];

export type NotificationKind = "onlineBooking" | "cancelled" | "noShow" | "whatsappFailed" | "whatsappReply" | "lowStock" | "outOfStock" | "registerDifference" | "registerOpen" | "payrollDue" | "payrollPaid" | "lowReview" | "absenceRequested" | "absenceDecided";

export interface MockNotification {
  id: string;
  kind: NotificationKind;
  at: string;
  href: string;
  tone: "info" | "warning" | "negative" | "positive";
  /** Los datos para escribir el aviso en el idioma de quien lo lee. */
  params: Record<string, string | number>;
  /** Para quién es: roles y, si es de un barbero en particular, su ficha. */
  roles: readonly Role[];
  memberId?: string | null;
}

function requireAuth(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const accountId = token ? db.sessions.get(token) : undefined;
  return ACCOUNTS.find((item) => item.id === accountId) ?? null;
}

const clientName = (id: string) => db.calendar.clients.find((item) => item.id === id)?.name ?? "";
const timeOf = (iso: string) => iso.slice(11, 16);
const recent = (iso: string, now: Date) => now.getTime() - new Date(iso).getTime() <= RECENT_DAYS * DAY_MS && new Date(iso).getTime() <= now.getTime();
const lastEvent = (item: MockAppointment, event: string) => [...item.history].reverse().find((entry) => entry.event === event);

function appointmentEvents(branchId: string, now: Date): MockNotification[] {
  const items: MockNotification[] = [];
  // La agenda se genera por día al pedirla: se genera la misma ventana siempre para que la bandeja no cambie sola.
  for (let offset = -RECENT_DAYS; offset <= RECENT_DAYS; offset += 1) appointmentsOn(branchId, dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)));
  for (const item of db.calendar.appointments.filter((appointment) => appointment.branchId === branchId)) {
    const base = { client: clientName(item.clientId), day: item.start.slice(0, 10), time: timeOf(item.start) };
    const href = `/calendario?fecha=${item.start.slice(0, 10)}&cita=${item.id}`;
    if (item.source === "online" && recent(item.createdAt, now)) items.push({ id: `online:${item.id}`, kind: "onlineBooking", at: item.createdAt, href, tone: "info", params: base, roles: FRONT, memberId: item.barberId });
    const cancelled = item.status === "cancelled" ? lastEvent(item, "status:cancelled") : undefined;
    if (cancelled && recent(cancelled.at, now)) items.push({ id: `cancel:${item.id}`, kind: "cancelled", at: cancelled.at, href, tone: "warning", params: { ...base, by: cancelled.actor }, roles: FRONT, memberId: item.barberId });
    const noShow = item.status === "no_show" ? lastEvent(item, "status:no_show") : undefined;
    if (noShow && recent(noShow.at, now)) items.push({ id: `noshow:${item.id}`, kind: "noShow", at: noShow.at, href, tone: "warning", params: base, roles: FRONT, memberId: item.barberId });
  }
  for (const message of (db.booking.outbox ?? []).filter((entry) => entry.status === "failed")) {
    const appointment = db.calendar.appointments.find((entry) => entry.id === message.appointmentId);
    if (appointment && appointment.branchId !== branchId) continue;
    items.push({
      id: `wa:${message.id}`,
      kind: "whatsappFailed",
      at: message.sentAt ?? message.sendAt,
      href: appointment ? `/calendario?fecha=${appointment.start.slice(0, 10)}&cita=${appointment.id}` : `/clientes/${message.clientId}`,
      tone: "negative",
      params: { client: clientName(message.clientId), error: message.error ?? "" },
      roles: FRONT,
    });
  }
  // Lo que respondieron por WhatsApp y recepción tiene que resolver (confirmar y BAJA ya se aplicaron solos).
  for (const reply of (db.booking.inbound ?? []).filter((entry) => (entry.intent === "reschedule" || entry.intent === "cancel" || entry.intent === "other") && recent(entry.at, now))) {
    const appointment = reply.appointmentId ? db.calendar.appointments.find((entry) => entry.id === reply.appointmentId) : undefined;
    if (appointment && appointment.branchId !== branchId) continue;
    items.push({
      id: `reply:${reply.id}`,
      kind: "whatsappReply",
      at: reply.at,
      href: appointment ? `/calendario?fecha=${appointment.start.slice(0, 10)}&cita=${appointment.id}` : reply.clientId ? `/clientes/${reply.clientId}` : "/calendario",
      tone: reply.intent === "other" ? "info" : "warning",
      params: { client: reply.clientId ? clientName(reply.clientId) : `+${reply.from}`, text: reply.text },
      roles: FRONT,
      memberId: appointment?.barberId ?? null,
    });
  }
  return items;
}

function stockEvents(branchId: string, now: Date): MockNotification[] {
  return db.products.items
    .filter((item) => item.sellable && item.activeBranchIds.includes(branchId))
    .flatMap((product) => {
      const level = stockLevel(branchId, product.id);
      const status = stockStatus(level);
      if (status === "ok") return [];
      return [{ id: `stock:${branchId}:${product.id}:${status}:${level.onHand}`, kind: status === "out" ? "outOfStock" : "lowStock", at: now.toISOString(), href: "/productos?vista=existencias", tone: status === "out" ? "negative" : "warning", params: { product: product.name, count: level.onHand }, roles: MANAGERS } satisfies MockNotification];
    });
}

function registerEvents(branchId: string, now: Date): MockNotification[] {
  const items: MockNotification[] = (db.register?.closures ?? [])
    .filter((closure) => closure.branchId === branchId && Math.abs(closure.difference) >= REGISTER_THRESHOLD && recent(closure.closedAt, now))
    .map((closure) => ({ id: `register:${closure.id}`, kind: "registerDifference", at: closure.closedAt, href: "/transacciones", tone: "negative", params: { day: closure.date, amount: closure.difference, by: closure.closedBy }, roles: MANAGERS }));
  // La caja de ayer que tuvo cobros y nadie cerró.
  const yesterday = dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const charged = appointmentsOn(branchId, yesterday).some((item) => item.status === "paid");
  const closed = (db.register?.closures ?? []).some((closure) => closure.branchId === branchId && closure.date === yesterday);
  if (charged && !closed) items.push({ id: `register-open:${branchId}:${yesterday}`, kind: "registerOpen", at: `${yesterday}T21:00:00`, href: "/transacciones", tone: "warning", params: { day: yesterday }, roles: FRONT });
  return items;
}

function payrollEvents(branchId: string, now: Date): MockNotification[] {
  const items: MockNotification[] = [];
  // El ciclo que ya terminó y nadie aprobó.
  const current = cycleWindow(now);
  const previous = cycleWindow(new Date(current.from.getTime() - DAY_MS));
  const from = dateKey(previous.from);
  const to = dateKey(previous.to);
  if (!db.payroll.runs.some((run) => run.branchId === branchId && run.from === from && run.to === to)) items.push({ id: `payroll-due:${branchId}:${from}`, kind: "payrollDue", at: `${dateKey(current.from)}T08:00:00`, href: `/nomina`, tone: "info", params: { from, to }, roles: MANAGERS });
  // A cada barbero, que ya le pagaron.
  for (const run of db.payroll.runs.filter((item) => item.branchId === branchId && item.status === "paid" && item.paidAt && recent(item.paidAt, now))) {
    for (const member of run.members as { memberId: string; net?: number }[]) {
      items.push({ id: `paid:${run.id}:${member.memberId}`, kind: "payrollPaid", at: run.paidAt as string, href: "/mi-pago", tone: "positive", params: { from: run.from, to: run.to, amount: member.net ?? 0, method: run.method ?? "" }, roles: ["barbero-comision", "barbero-renta"], memberId: member.memberId });
    }
  }
  return items;
}

function reviewEvents(now: Date): MockNotification[] {
  return (db.booking.reviews ?? [])
    .filter((review) => review.rating <= LOW_RATING && recent(review.createdAt, now))
    .map((review) => ({ id: `review:${review.id}`, kind: "lowReview", at: review.createdAt, href: review.clientId ? `/clientes/${review.clientId}` : "/metricas", tone: "negative", params: { client: review.clientName, rating: review.rating, comment: review.comment.slice(0, 120) }, roles: ["owner"] }));
}

function absenceEvents(branchId: string, now: Date): MockNotification[] {
  return (db.team.absences ?? [])
    .filter((item) => item.branchId === branchId)
    .flatMap((item): MockNotification[] => {
      const params = { name: db.team.members.find((member) => member.id === item.memberId)?.firstName ?? "", from: item.startDate, to: item.endDate };
      if (item.status === "pending") return [{ id: `absence:${item.id}`, kind: "absenceRequested", at: item.requestedAt, href: "/usuarios/ausencias", tone: "info", params, roles: MANAGERS }];
      if (item.decidedAt && item.requestedBy !== item.decidedBy && recent(item.decidedAt, now)) return [{ id: `absence-decided:${item.id}`, kind: "absenceDecided", at: item.decidedAt, href: "/usuarios/ausencias", tone: item.status === "approved" ? "positive" : "warning", params: { ...params, status: item.status }, roles: ["recepcion", "barbero-comision", "barbero-renta"], memberId: item.memberId }];
      return [];
    });
}

const isOn = (role: Role, item: MockNotification): boolean => {
  const eventId = eventOfNotification(item.kind, item.params.status);
  if (!eventId) return true;
  const toggles = ((db.settings.sections.notifications ?? {}) as { toggles?: Record<string, boolean> }).toggles ?? {};
  return toggles[`${AUDIENCE_OF_ROLE[role]}.${eventId}.push`] !== false;
};

/** Los avisos de una sucursal para ese rol (y, si es barbero, solo los suyos). */
export function notificationsFor(branchId: string, role: Role, memberId: string | null, now = new Date()): MockNotification[] {
  const all = [...appointmentEvents(branchId, now), ...stockEvents(branchId, now), ...registerEvents(branchId, now), ...payrollEvents(branchId, now), ...reviewEvents(now), ...absenceEvents(branchId, now)];
  const barber = role === "barbero-comision" || role === "barbero-renta";
  return all
    .filter((item) => (barber ? item.memberId === memberId && (item.roles.includes(role) || ["onlineBooking", "cancelled", "noShow"].includes(item.kind)) : item.roles.includes(role) && (item.kind !== "absenceDecided" || item.memberId === memberId)))
    // Lo que se apagó en Configuración › Recordatorios y avisos («En la app») no sale en la campana.
    .filter((item) => isOn(role, item))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, MAX_ITEMS);
}

const parseRole = (value: string | null): Role => (ROLES as readonly string[]).includes(value ?? "") ? (value as Role) : "barbero-comision";

export const notificationsHandlers = [
  http.get(`${BASE}/notifications`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return HttpResponse.json({ code: "unauthorized", message: "Tu sesión expiró." }, { status: 401 });
    const params = new URL(request.url).searchParams;
    // El rol sale de la sesión; solo quien gestiona puede pedir los de otro rol («ver como»).
    const session = sessionOf(request)!;
    const role = isManager(session) ? parseRole(params.get("role") ?? session.teamRole) : session.teamRole;
    const memberId = isManager(session) ? (params.get("memberId") ?? session.memberId) : session.memberId;
    const items = notificationsFor(params.get("branchId") ?? "ma", role, memberId);
    const read = new Set(db.notificationsRead.filter((key) => key.startsWith(`${account.id}:`)).map((key) => key.slice(account.id.length + 1)));
    const view = items.map((item) => ({ id: item.id, kind: item.kind, at: item.at, href: item.href, tone: item.tone, params: item.params, read: read.has(item.id) }));
    return HttpResponse.json({ items: view, unread: view.filter((item) => !item.read).length });
  }),

  /** `{ ids }` marca esos como leídos. */
  http.post(`${BASE}/notifications/read`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return HttpResponse.json({ code: "unauthorized", message: "Tu sesión expiró." }, { status: 401 });
    const input = (await request.json().catch(() => null)) as { ids?: unknown } | null;
    const ids = Array.isArray(input?.ids) ? input.ids.filter((id): id is string => typeof id === "string").slice(0, 200) : [];
    const keys = new Set([...db.notificationsRead, ...ids.map((id) => `${account.id}:${id}`)]);
    db.notificationsRead = [...keys].slice(-2_000);
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),
];
