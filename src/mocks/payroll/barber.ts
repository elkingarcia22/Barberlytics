import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { db } from "../db";
import { forbidden, isBarber, isManager, sessionOf, unauthorized, type MockSession } from "../session";
import { peekAppointmentsOn } from "../calendar/handlers";
import { dateKey } from "../calendar/seed";
import { branchNow } from "../settings/branchRules";
import { memberName } from "../team/seed";
import { cycleWindow } from "./compute";
import { periodPayroll } from "./handlers";
import type { MockMemberGoal, MockPayDispute } from "./state";

/**
 * Lo que el barbero ve de su dinero además de la nómina del periodo (docs/API_CONTRACT.md, «Nómina › Del barbero»):
 * el estado de cuenta de la renta ciclo por ciclo, el certificado de ingresos de un rango largo, su meta del ciclo con
 * la brecha al siguiente tramo y «Esto no cuadra». El barbero pide siempre lo suyo; quien gestiona, el de cualquiera.
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const DEFAULT_CYCLES = 8;
const MAX_CYCLES = 26;
const MAX_CERTIFICATE_DAYS = 366;
const REBOOK_DAYS = 7;
/** Hasta dónde se miran citas futuras para saber si dejó la siguiente. */
const REBOOK_LOOKAHEAD_DAYS = 28;
const MIN_MESSAGE = 10;
const MAX_MESSAGE = 500;
const MIN_ANSWER = 5;

const round = (value: number) => Math.round(value * 100) / 100;
const asRecord = (body: DefaultBodyType): Record<string, unknown> => (body && typeof body === "object" ? (body as Record<string, unknown>) : {});
const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const error = (status: number, code: string, message: string, extra: Record<string, unknown> = {}) => HttpResponse.json({ code, message, ...extra }, { status });
const addDays = (day: string, delta: number) => dateKey(new Date(new Date(`${day}T12:00:00`).getTime() + delta * DAY_MS));
const todayOf = (branchId: string) => branchNow(branchId).slice(0, 10);

type Row = Record<string, unknown> & { memberId: string; payout: string; net: number };
const num = (row: Row, key: string): number => (typeof row[key] === "number" ? (row[key] as number) : 0);

/** De quién se pide: el barbero, siempre lo suyo; quien gestiona, el que diga `memberId`. */
function whoseOf(session: MockSession, requested: string | null): string | Response {
  if (isBarber(session)) return session.memberId ?? "";
  if (!isManager(session)) return forbidden("Esto lo ven el dueño, el administrador y cada barbero (lo suyo).");
  return requested ?? "";
}

function memberRow(branchId: string, memberId: string, from: string, to: string, peek = true): Row | null {
  return (periodPayroll(branchId, from, to, { peek })?.members.find((member) => member.memberId === memberId) as Row | undefined) ?? null;
}

/** El estado de cuenta de la renta: ciclo por ciclo, lo que guardó la barbería, la renta, lo pagado y el saldo que se arrastra. */
export function rentStatement(branchId: string, memberId: string, cycles: number) {
  const windows: { from: string; to: string }[] = [];
  let cursor = new Date(`${todayOf(branchId)}T12:00:00`);
  for (let index = 0; index < cycles; index += 1) {
    const window = cycleWindow(cursor);
    windows.unshift({ from: dateKey(window.from), to: dateKey(window.to) });
    cursor = new Date(window.from.getTime() - DAY_MS);
  }
  let running = 0;
  const rows = windows.flatMap(({ from, to }) => {
    const result = periodPayroll(branchId, from, to, { peek: true });
    const row = result?.members.find((member) => member.memberId === memberId) as Row | undefined;
    if (!row || row.payout !== "rent") return [];
    // Un ciclo pagado: si la barbería le debía (guardó más de lo que él debía), ya se lo transfirió con la nómina.
    const paidOut = result?.run?.status === "paid" && row.net > 0 ? row.net : 0;
    const balance = round(num(row, "balance") - paidOut);
    running = round(running + balance);
    return [{ from, to, status: result?.run?.status ?? "open", held: num(row, "held"), rent: num(row, "rent"), deductions: num(row, "deductions"), adjustments: num(row, "adjustmentsTotal"), paid: num(row, "rentPaid"), paidOut, balance, running }];
  });
  const payments = (db.payroll.rentPayments ?? [])
    .filter((item) => item.branchId === branchId && item.memberId === memberId && rows.length > 0 && item.date >= rows[0].from)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(({ id, amount, method, date, note, by }) => ({ id, amount, method, date, note, by }));
  return { rows, payments, balance: running };
}

/** El certificado de ingresos: mes por mes de un rango (hasta un año), con lo ganado; con renta, lo vendido y lo que pagó. */
export function incomeCertificate(branchId: string, memberId: string, from: string, to: string) {
  const months: { month: string; from: string; to: string }[] = [];
  for (let start = from; start <= to; ) {
    const date = new Date(`${start}T12:00:00`);
    const end = dateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0));
    months.push({ month: start.slice(0, 7), from: start, to: end < to ? end : to });
    start = addDays(end, 1);
  }
  let payout = "commission";
  const rows = months.flatMap((chunk) => {
    const row = memberRow(branchId, memberId, chunk.from, chunk.to);
    if (!row) return [];
    payout = row.payout;
    const rent = row.payout === "rent";
    const tips = num(row, "tips");
    const sales = rent ? round(num(row, "serviceSales") + num(row, "productSales")) : round(num(row, "serviceCommission") + num(row, "productCommission") + num(row, "salary"));
    const chair = (row.chairExpenses as { total?: number } | undefined)?.total ?? 0;
    const costs = rent ? round(num(row, "rent") + num(row, "deductions") + chair) : 0;
    const adjustments = num(row, "adjustmentsTotal");
    const earned = rent ? num(row, "profit") : round(sales + tips + adjustments);
    return [{ ...chunk, services: num(row, "services"), sales, tips, adjustments: rent ? 0 : adjustments, costs, earned }];
  });
  const sum = (key: "services" | "sales" | "tips" | "adjustments" | "costs" | "earned") => round(rows.reduce((total, row) => total + row[key], 0));
  return { from, to, payout, rows, totals: { services: sum("services"), sales: sum("sales"), tips: sum("tips"), adjustments: sum("adjustments"), costs: sum("costs"), earned: sum("earned") } };
}

/** La meta del ciclo en curso y cómo va: ventas de servicios y de productos, rebooking y, en escala, cuánto falta al siguiente tramo. */
export function goalProgress(branchId: string, memberId: string) {
  const today = todayOf(branchId);
  const window = cycleWindow(new Date(`${today}T12:00:00`));
  const from = dateKey(window.from);
  const to = dateKey(window.to);
  const row = memberRow(branchId, memberId, from, to, false);
  const goal = (db.payroll.memberGoals ?? []).find((item) => item.branchId === branchId && item.memberId === memberId) ?? null;
  const serviceSales = row ? num(row, "serviceSales") : 0;
  const productSales = row ? num(row, "productSales") : 0;

  // Rebooking: de sus citas cobradas del ciclo, cuántos clientes dejaron otra en la semana siguiente.
  const horizon = Array.from({ length: Math.round((new Date(`${addDays(today, REBOOK_LOOKAHEAD_DAYS)}T12:00:00`).getTime() - window.from.getTime()) / DAY_MS) + 1 }, (_, index) => addDays(from, index));
  const all = horizon.flatMap((day) => peekAppointmentsOn(branchId, day));
  const paid = all.filter((item) => item.barberId === memberId && item.status === "paid" && item.start.slice(0, 10) >= from && item.start.slice(0, 10) <= today);
  const rebooked = paid.filter((item) => all.some((other) => other.clientId === item.clientId && other.id !== item.id && other.status !== "cancelled" && other.createdAt >= item.start && new Date(other.createdAt).getTime() - new Date(item.start).getTime() <= REBOOK_DAYS * DAY_MS)).length;
  const rebookRate = paid.length === 0 ? 0 : Math.round((rebooked / paid.length) * 100);

  const rules = row?.rules as { type?: string; scale?: { from: number; percent: number }[] } | null | undefined;
  const tiers = rules?.type === "scale" ? [...(rules.scale ?? [])].sort((a, b) => a.from - b.from) : [];
  const current = [...tiers].reverse().find((tier) => tier.from <= serviceSales) ?? null;
  const next = tiers.find((tier) => tier.from > serviceSales) ?? null;
  const nextTier = next ? { percent: next.percent, from: next.from, missing: round(next.from - serviceSales), currentPercent: current?.percent ?? null } : null;
  return { cycle: { from, to }, goal, progress: { serviceSales, productSales, rebookRate, visits: paid.length }, nextTier };
}

export const barberPayHandlers = [
  http.get(`${BASE}/payroll/rent-statement`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    const params = new URL(request.url).searchParams;
    const memberId = whoseOf(session, params.get("memberId"));
    if (memberId instanceof Response) return memberId;
    const branchId = params.get("branchId") ?? "";
    if (!branchId || !memberId) return error(422, "validation", "Falta la sucursal o la persona.");
    const member = db.team.members.find((item) => item.id === memberId);
    if (!member?.payments) return error(409, "not_rent", "Esa persona no paga renta.");
    const cycles = Math.min(MAX_CYCLES, Math.max(1, Number(params.get("cycles")) || DEFAULT_CYCLES));
    return HttpResponse.json({ memberId, name: memberName(member), ...rentStatement(branchId, memberId, cycles) });
  }),

  http.get(`${BASE}/payroll/certificate`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    const params = new URL(request.url).searchParams;
    const memberId = whoseOf(session, params.get("memberId"));
    if (memberId instanceof Response) return memberId;
    const branchId = params.get("branchId") ?? "";
    const from = params.get("from") ?? "";
    const requestedTo = params.get("to") ?? "";
    const member = db.team.members.find((item) => item.id === memberId);
    if (!branchId || !member) return error(422, "validation", "Falta la sucursal o la persona.");
    if (!DAY_KEY.test(from) || !DAY_KEY.test(requestedTo) || requestedTo < from) return error(422, "validation", "El rango de fechas no es válido.", { fields: { from: ["Elige un rango de fechas válido."] } });
    // Lo que no ha pasado no se certifica: el rango termina hoy.
    const today = todayOf(branchId);
    const to = requestedTo > today ? today : requestedTo;
    if (to < from) return error(422, "validation", "El rango empieza en el futuro.", { fields: { from: ["Elige fechas que ya pasaron."] } });
    const days = Math.round((new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime()) / DAY_MS) + 1;
    if (days > MAX_CERTIFICATE_DAYS) return error(422, "validation", "El certificado cubre hasta un año.", { fields: { to: ["Elige hasta un año."] } });
    return HttpResponse.json({ memberId, name: memberName(member), generatedAt: new Date().toISOString(), ...incomeCertificate(branchId, memberId, from, to) });
  }),

  http.get(`${BASE}/payroll/goals`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    const params = new URL(request.url).searchParams;
    const memberId = whoseOf(session, params.get("memberId"));
    if (memberId instanceof Response) return memberId;
    const branchId = params.get("branchId") ?? "";
    if (!branchId || !memberId) return error(422, "validation", "Falta la sucursal o la persona.");
    return HttpResponse.json(goalProgress(branchId, memberId));
  }),

  // Poner, cambiar o quitar (todo en `null`) la meta de alguien. Dueño o administrador.
  http.put(`${BASE}/payroll/goals`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("La meta la pone el dueño o el administrador.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = text(input.branchId);
    const memberId = text(input.memberId);
    if (!branchId || !db.team.members.some((item) => item.id === memberId)) return error(422, "validation", "Falta la sucursal o la persona.");
    const amount = (value: unknown, max: number): number | null | "bad" => (value === null || value === undefined || value === "" ? null : Number(value) > 0 && Number(value) <= max ? round(Number(value)) : "bad");
    const serviceSales = amount(input.serviceSales, 1_000_000_000);
    const productSales = amount(input.productSales, 1_000_000_000);
    const rebookRate = amount(input.rebookRate, 100);
    const fields: Record<string, string[]> = {};
    if (serviceSales === "bad") fields.serviceSales = ["Escribe un valor mayor que 0."];
    if (productSales === "bad") fields.productSales = ["Escribe un valor mayor que 0."];
    if (rebookRate === "bad") fields.rebookRate = ["Escribe un porcentaje de 1 a 100."];
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa la meta.", { fields });
    const others = (db.payroll.memberGoals ?? []).filter((item) => !(item.branchId === branchId && item.memberId === memberId));
    const empty = serviceSales === null && productSales === null && rebookRate === null;
    const goal: MockMemberGoal = { branchId, memberId, serviceSales: serviceSales as number | null, productSales: productSales as number | null, rebookRate: rebookRate as number | null, setBy: session.account.user.name, setAt: new Date().toISOString() };
    db.payroll = { ...db.payroll, memberGoals: empty ? others : [...others, goal] };
    db.persist();
    return HttpResponse.json(goalProgress(branchId, memberId));
  }),

  http.get(`${BASE}/payroll/disputes`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    const params = new URL(request.url).searchParams;
    const memberId = whoseOf(session, params.get("memberId"));
    if (memberId instanceof Response) return memberId;
    const branchId = params.get("branchId") ?? "";
    const status = params.get("status");
    const items = (db.payroll.disputes ?? [])
      .filter((item) => (!branchId || item.branchId === branchId) && (!memberId || item.memberId === memberId) && (!status || item.status === status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return HttpResponse.json({ items });
  }),

  // «Esto no cuadra»: el barbero reclama un periodo o una cita suya.
  http.post(`${BASE}/payroll/disputes`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isBarber(session) || !session.memberId) return forbidden("El reclamo lo hace el barbero sobre su propio pago.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = text(input.branchId);
    const from = text(input.from);
    const to = text(input.to);
    const message = text(input.message).slice(0, MAX_MESSAGE);
    if (!branchId || !DAY_KEY.test(from) || !DAY_KEY.test(to)) return error(422, "validation", "Falta el periodo.");
    if (message.length < MIN_MESSAGE) return error(422, "validation", "Cuenta qué no cuadra.", { fields: { message: ["Cuenta qué no cuadra (10 caracteres o más)."] } });
    const appointmentId = text(input.appointmentId) || null;
    const appointment = appointmentId ? db.calendar.appointments.find((item) => item.id === appointmentId) : null;
    if (appointmentId && (!appointment || appointment.barberId !== session.memberId)) return error(422, "validation", "Esa cita no es tuya.");
    const disputes = db.payroll.disputes ?? [];
    if (disputes.some((item) => item.status === "open" && item.memberId === session.memberId && item.from === from && item.appointmentId === appointmentId)) return error(409, "conflict", "Ya hay un reclamo abierto por eso.");
    const client = appointment ? db.calendar.clients.find((item) => item.id === appointment.clientId)?.name : null;
    const service = appointment ? appointment.serviceIds.map((id) => db.services.items.find((item) => item.id === id)?.name ?? id).join(" + ") : null;
    const dispute: MockPayDispute = {
      id: `dsp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      branchId,
      memberId: session.memberId,
      memberName: session.account.user.name,
      from,
      to,
      appointmentId,
      appointmentLabel: appointment ? [client, service].filter(Boolean).join(" · ") : null,
      appointmentAt: appointment?.start ?? null,
      message,
      createdAt: new Date().toISOString(),
      status: "open",
      answer: null,
      answeredBy: null,
      answeredAt: null,
    };
    db.payroll = { ...db.payroll, disputes: [dispute, ...disputes] };
    db.persist();
    return HttpResponse.json(dispute, { status: 201 });
  }),

  http.post(`${BASE}/payroll/disputes/:id/answer`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("Responde el dueño o el administrador.");
    const disputes = db.payroll.disputes ?? [];
    const dispute = disputes.find((item) => item.id === params.id);
    if (!dispute) return error(404, "not_found", "Ese reclamo no existe.");
    if (dispute.status === "answered") return error(409, "conflict", "Ese reclamo ya tiene respuesta.");
    const answer = text(asRecord(await request.json().catch(() => ({}))).answer).slice(0, MAX_MESSAGE);
    if (answer.length < MIN_ANSWER) return error(422, "validation", "Escribe la respuesta.", { fields: { answer: ["Escribe la respuesta."] } });
    const answered: MockPayDispute = { ...dispute, status: "answered", answer, answeredBy: session.account.user.name, answeredAt: new Date().toISOString() };
    db.payroll = { ...db.payroll, disputes: disputes.map((item) => (item.id === dispute.id ? answered : item)) };
    db.persist();
    return HttpResponse.json(answered);
  }),
];
