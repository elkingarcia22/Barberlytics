import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { db } from "../db";
import { forbidden, isBarber, sessionOf, unauthorized } from "../session";
import { profileOf } from "../customers/handlers";
import { branchCurrency, branchOf } from "../settings/branchRules";
import { appointmentAccount } from "./account";
import { withSmsFooter } from "../messages/handlers";
import type { MockAppointment, MockDepositRequest } from "./seed";

/**
 * Pedir un anticipo desde la cita (docs/API_CONTRACT.md, «Calendario › Anticipo»): recepción elige cuánto y lo
 * manda por SMS o correo con un enlace; el cliente lo paga en la página de la pasarela de la sede y queda como
 * pagado en línea, así la caja cobra solo el resto y el riesgo de no venir baja. Solo con una pasarela conectada:
 * sin ella no hay cómo cobrar en línea.
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const asRecord = (body: DefaultBodyType): Record<string, unknown> => (body && typeof body === "object" ? (body as Record<string, unknown>) : {});
const error = (status: number, code: string, message: string, extra: Record<string, unknown> = {}) => HttpResponse.json({ code, message, ...extra }, { status });
const round2 = (value: number) => Math.round(value * 100) / 100;

/** Si la sede puede cobrar en línea: tiene pasarela y está conectada. */
function hasGateway(branchId: string): boolean {
  const gatewayId = branchOf(branchId)?.gatewayId;
  return Boolean(gatewayId && db.settings.lists.gateways.some((item) => item.id === gatewayId && item.connected === true));
}

const money = (amount: number, branchId: string) => new Intl.NumberFormat("es-CO", { style: "currency", currency: branchCurrency(branchId), maximumFractionDigits: branchCurrency(branchId) === "COP" ? 0 : 2 }).format(amount);

const whenOf = (start: string) => new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }).format(new Date(start));

/** El texto del mensaje: para qué es, cuánto y el enlace. */
function depositMessage(appointment: MockAppointment, amount: number, link: string): string {
  const client = db.calendar.clients.find((item) => item.id === appointment.clientId);
  const first = client?.name.split(" ")[0] ?? "";
  const branch = String(branchOf(appointment.branchId)?.name ?? "");
  return `Hola ${first}, para guardar tu cita del ${whenOf(appointment.start)} en ${branch} deja un anticipo de ${money(amount, appointment.branchId)}: ${link}. Se descuenta de lo que pagues ese día.`;
}

const replace = (updated: MockAppointment) => {
  db.calendar.appointments = db.calendar.appointments.map((item) => (item.id === updated.id ? updated : item));
  db.persist();
};

const historyEntry = (actor: string, event: string) => ({ id: `h_${Math.random().toString(36).slice(2, 9)}`, at: new Date().toISOString(), actor, event });

/** El anticipo pagado pasa a lo pagado en línea de la cita: la caja cobra solo lo que falta. */
function settle(appointment: MockAppointment, request: MockDepositRequest, at: string): MockAppointment {
  const online = appointment.online;
  return {
    ...appointment,
    depositRequest: { ...request, status: "paid", paidAt: at },
    online: { reservation: online?.reservation ?? `dep_${request.token.slice(0, 8)}`, method: online?.method ?? "card", paid: round2((online?.paid ?? 0) + request.amount), tip: online?.tip ?? 0, discount: online?.discount ?? 0 },
    history: [...appointment.history, historyEntry("Cliente", "deposit:paid")],
  };
}

export const depositHandlers = [
  // Pedir el anticipo: cuánto y por dónde (SMS y/o correo). Otra vez con uno pendiente lo reemplaza.
  http.post(`${BASE}/appointments/:id/deposit`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    const appointment = db.calendar.appointments.find((item) => item.id === params.id);
    if (!appointment) return error(404, "not_found", "Esa cita no existe.");
    if (isBarber(session) && appointment.barberId !== session.memberId) return forbidden("Solo pides anticipo en tus citas.");
    if (appointment.status !== "scheduled") return error(409, "conflict", "El anticipo se pide antes de que llegue el cliente.");
    if (appointment.depositRequest?.status === "paid") return error(409, "conflict", "Ese anticipo ya está pagado.");
    if (!hasGateway(appointment.branchId)) return error(409, "no_gateway", "Esta sede no tiene una pasarela conectada: conéctala en Configuración › Pagos para cobrar en línea.");
    const input = asRecord(await request.json().catch(() => ({})));
    const amount = round2(Number(input.amount));
    const due = appointmentAccount(appointment).due;
    if (!(amount > 0) || amount > due) return error(422, "validation", "Revisa el monto.", { fields: { amount: [`El anticipo va de más de 0 hasta lo que falta por pagar (${money(due, appointment.branchId)}).`] } });
    const targets = (Array.isArray(input.channels) ? input.channels : []).map((item) => asRecord(item as DefaultBodyType)).map((item) => ({ channel: item.channel === "email" ? ("email" as const) : item.channel === "sms" ? ("sms" as const) : null, to: String(item.to ?? "").trim() }));
    if (targets.length === 0 || targets.some((item) => item.channel === null)) return error(422, "validation", "Elige por dónde mandarlo.", { fields: { channels: ["Elige SMS, correo o los dos."] } });
    const fields: Record<string, string[]> = {};
    for (const item of targets) {
      if (item.channel === "email" && !EMAIL.test(item.to)) fields.email = ["Revisa el correo."];
      if (item.channel === "sms" && item.to.replace(/\D/g, "").length < 8) fields.sms = ["Revisa el celular."];
    }
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const client = db.calendar.clients.find((item) => item.id === appointment.clientId);
    if (targets.some((item) => item.channel === "sms") && client && profileOf(client).smsStop) return error(409, "sms_stopped", "Este cliente respondió STOP: no se le pueden mandar SMS. Mándalo por correo.");

    const token = crypto.randomUUID().replace(/-/g, "");
    const link = `${new URL(request.url).origin}/reservar/anticipo?token=${token}`;
    const now = new Date().toISOString();
    const by = session.account.user.name;
    const body = depositMessage(appointment, amount, link);
    db.booking.outbox = [
      ...(db.booking.outbox ?? []),
      ...targets.map((item, index) => ({ id: `msg_${Date.now().toString(36)}${index}${Math.random().toString(36).slice(2, 6)}`, appointmentId: appointment.id, clientId: appointment.clientId, to: item.to, channel: item.channel as "sms" | "email", kind: "depositLink" as const, sendAt: now, sentAt: now, status: "sent" as const, simulated: true, body: item.channel === "sms" ? withSmsFooter(body) : body, by })),
    ];
    const depositRequest: MockDepositRequest = { token, amount, status: "requested", requestedAt: now, by, channels: targets.map((item) => item.channel as "sms" | "email") };
    replace({ ...appointment, depositRequest, history: [...appointment.history, historyEntry(by, `deposit:requested:${amount}`)] });
    return HttpResponse.json({ depositRequest: { ...depositRequest, link } }, { status: 201 });
  }),

  // Retirar el pedido (ya no hace falta o se acordó otra cosa): el enlace deja de servir.
  http.delete(`${BASE}/appointments/:id/deposit`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    const appointment = db.calendar.appointments.find((item) => item.id === params.id);
    if (!appointment?.depositRequest) return error(404, "not_found", "Esa cita no tiene anticipo pedido.");
    if (isBarber(session) && appointment.barberId !== session.memberId) return forbidden("Solo cambias tus citas.");
    if (appointment.depositRequest.status !== "requested") return error(409, "conflict", "Solo se retira un anticipo sin pagar.");
    replace({ ...appointment, depositRequest: { ...appointment.depositRequest, status: "cancelled" }, history: [...appointment.history, historyEntry(session.account.user.name, "deposit:cancelled")] });
    return new HttpResponse(null, { status: 204 });
  }),

  // La página del enlace, sin sesión: lo justo para pagar (nombre de pila, sede, fecha y monto).
  http.get(`${BASE}/booking/deposit`, async ({ request }) => {
    await delay(LATENCY_MS);
    const token = new URL(request.url).searchParams.get("token") ?? "";
    const appointment = token ? db.calendar.appointments.find((item) => item.depositRequest?.token === token) : undefined;
    if (!appointment?.depositRequest || appointment.depositRequest.status === "cancelled") return error(404, "not_found", "Ese enlace ya no es válido.");
    const client = db.calendar.clients.find((item) => item.id === appointment.clientId);
    const barber = db.team.members.find((item) => item.id === appointment.barberId);
    return HttpResponse.json({
      status: appointment.status === "cancelled" || appointment.status === "no_show" ? "inactive" : appointment.depositRequest.status,
      amount: appointment.depositRequest.amount,
      currency: branchCurrency(appointment.branchId),
      start: appointment.start,
      client: client?.name.split(" ")[0] ?? "",
      barber: barber?.firstName ?? "",
      branch: String(branchOf(appointment.branchId)?.name ?? ""),
    });
  }),

  // Pagar: en producción lo confirma el webhook de la pasarela; aquí la demo lo da por pagado.
  http.post(`${BASE}/booking/deposit/pay`, async ({ request }) => {
    await delay(LATENCY_MS);
    const token = String(asRecord(await request.json().catch(() => ({}))).token ?? "");
    const appointment = token ? db.calendar.appointments.find((item) => item.depositRequest?.token === token) : undefined;
    const pending = appointment?.depositRequest;
    if (!appointment || !pending || pending.status === "cancelled") return error(404, "not_found", "Ese enlace ya no es válido.");
    if (pending.status === "paid") return HttpResponse.json({ status: "paid", paidAt: pending.paidAt ?? null });
    if (appointment.status !== "scheduled") return error(409, "conflict", "Esa cita ya no está activa.");
    const at = new Date().toISOString();
    replace(settle(appointment, pending, at));
    return HttpResponse.json({ status: "paid", paidAt: at });
  }),
];
