import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { accountById, db } from "../db";
import { forbidden, isBarber, isManager, sessionOf } from "../session";
import { appointmentsOn, hoursOn, peekAppointmentsOn } from "../calendar/handlers";
import { dateKey } from "../calendar/seed";
import { barbersOf } from "../team/seed";
import { applyTipPool, cycleWindow, payrollOf, tipPoolSettings } from "./compute";
import { chairExpensesIn } from "../expenses/chair";
import { memberAt } from "../team/payoutSchedule";
import type { MockAdjustmentKind, MockLoan, MockPayrollRun } from "./state";

/**
 * La nómina del backend simulado. Reproduce docs/API_CONTRACT.md (sección «Nómina»).
 *
 * Mientras el periodo está abierto se calcula sobre las citas cobradas (ver `compute.ts`) y se le
 * pueden sumar ajustes. Al aprobarlo queda una foto fija: lo que se paga ya no cambia aunque se
 * edite una cita o una regla. Pagado, se anota con qué se pagó. Reabrir un aprobado pide motivo.
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const DAYS_PER_WEEK = 7;
const MAX_RANGE_DAYS = 62;
const KINDS: readonly MockAdjustmentKind[] = ["bonus", "deduction", "advance", "shortage"];
const MAX_INSTALLMENTS = 24;

/** Las ventas de mostrador de la sucursal en el rango (comisiona quien vendió). */
export const salesIn = (branchId: string, from: string, to: string) => db.calendar.sales.filter((sale) => sale.branchId === branchId && dateKey(new Date(sale.paidAt)) >= from && dateKey(new Date(sale.paidAt)) <= to);
const loansOf = (branchId: string): MockLoan[] => (db.payroll.loans ?? []).filter((loan) => loan.branchId === branchId);
const MAX_NOTE = 200;

function error(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return HttpResponse.json({ code, message, ...extra }, { status });
}

function requireAuth(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const accountId = token ? db.sessions.get(token) : undefined;
  return accountById(accountId) ?? null;
}

const asRecord = (body: DefaultBodyType): Record<string, unknown> => (body && typeof body === "object" ? (body as Record<string, unknown>) : {});
const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const round = (value: number) => Math.round(value * 100) / 100;
const clockMinutes = (clock: string) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5));

/** El periodo pedido, o el error que lo explica. */
function periodOf(branchId: string, from: string, to: string): { days: number; weeks: number } | Response {
  if (!DAY_KEY.test(from) || !DAY_KEY.test(to) || to < from) return error(422, "validation", "El rango de fechas no es válido.", { fields: { from: ["Elige un rango de fechas válido."] } });
  const days = Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / DAY_MS) + 1;
  if (days > MAX_RANGE_DAYS) return error(422, "validation", `El rango no puede pasar de ${MAX_RANGE_DAYS} días.`, { fields: { to: [`Elige un rango de hasta ${MAX_RANGE_DAYS} días.`] } });
  if (!branchId) return error(422, "validation", "Falta la sucursal.");
  /* La renta y el salario son por semana: un mes de 30 días son 30/7 semanas. */
  return { days, weeks: round(days / DAYS_PER_WEEK) };
}

const runOf = (branchId: string, from: string, to: string) => db.payroll.runs.find((run) => run.branchId === branchId && run.from === from && run.to === to);
const adjustmentsOf = (branchId: string, from: string, to: string) => db.payroll.adjustments.filter((item) => item.branchId === branchId && item.from === from && item.to === to);

/** La nómina calculada hoy del periodo, con sus ajustes. Con `peek`, sin guardar los días que nadie abrió (rangos largos). */
function computeMembers(branchId: string, from: string, days: number, weeks: number, peek = false) {
  const start = new Date(`${from}T00:00:00`);
  const to = dateKey(new Date(start.getTime() + (days - 1) * DAY_MS));
  const dayOf = peek ? peekAppointmentsOn : appointmentsOn;
  const appointments = Array.from({ length: days }, (_, index) => dayOf(branchId, dateKey(new Date(start.getTime() + index * DAY_MS)))).flat();
  const adjustments = adjustmentsOf(branchId, from, to);
  const extras = { sales: salesIn(branchId, from, to), loans: loansOf(branchId), from, to };
  // Cada quien con su forma de pago de entonces: un cambio de comisión a renta no reescribe los periodos anteriores.
  const team = barbersOf(db.team.members, db.team.orders, branchId);
  const members = team.map((member) => payrollOf(memberAt(member, from), appointments, weeks, branchId, adjustments, extras));
  // La bolsa de propinas, si está encendida: se reparte por los minutos de turno de cada uno en el periodo.
  const pool = tipPoolSettings();
  if (!pool) return members;
  const dayKeys = Array.from({ length: days }, (_, index) => dateKey(new Date(start.getTime() + index * DAY_MS)));
  const weights = Object.fromEntries(team.map((member) => [member.id, dayKeys.reduce((sum, day) => sum + hoursOn(member, day).reduce((total, range) => total + clockMinutes(range.end) - clockMinutes(range.start), 0), 0)]));
  return applyTipPool(members, pool, weights);
}

type PayrollMemberRow = { memberId: string; payout: string; net: number };

/** Con renta: lo que pagó de renta en el periodo y cómo queda (positivo: la barbería le debe; negativo: debe él). */
function withRentPayments(member: PayrollMemberRow, branchId: string, from: string, to: string) {
  if (member.payout !== "rent") return member;
  const payments = (db.payroll.rentPayments ?? []).filter((item) => item.branchId === branchId && item.memberId === member.memberId && item.date >= from && item.date <= to);
  const rentPaid = round(payments.reduce((sum, item) => sum + item.amount, 0));
  // «Mi negocio»: lo que vendió (con propinas) menos lo que le paga a la barbería y los gastos de su silla.
  const row = member as PayrollMemberRow & { serviceSales?: number; productSales?: number; tips?: number; rent?: number; deductions?: number };
  const chairExpenses = chairExpensesIn(branchId, member.memberId, from, to);
  const profit = round((row.serviceSales ?? 0) + (row.productSales ?? 0) + (row.tips ?? 0) - (row.rent ?? 0) - (row.deductions ?? 0) - chairExpenses.total);
  return { ...member, rentPaid, balance: round(member.net + rentPaid), rentPayments: payments.map(({ id, amount, method, date, note, by }) => ({ id, amount, method, date, note, by })), chairExpenses, profit };
}

/**
 * La nómina de un periodo tal como la ve la pantalla: la foto fija si se aprobó, si no lo calculado hoy, con los pagos
 * de renta. La usan el estado de cuenta, el certificado, las metas y los avisos. `null` si el rango no es válido.
 */
export function periodPayroll(branchId: string, from: string, to: string, options: { peek?: boolean } = {}) {
  const period = periodOf(branchId, from, to);
  if (period instanceof Response) return null;
  const run = runOf(branchId, from, to);
  const all = (run ? run.members : computeMembers(branchId, from, period.days, period.weeks, options.peek)) as PayrollMemberRow[];
  return { run: run ?? null, weeks: run?.weeks ?? period.weeks, members: all.map((member) => withRentPayments(member, branchId, from, to)) as (PayrollMemberRow & Record<string, unknown>)[] };
}

const runView = (run: MockPayrollRun | undefined) =>
  run ? { id: run.id, status: run.status, approvedAt: run.approvedAt, approvedBy: run.approvedBy, paidAt: run.paidAt, paidBy: run.paidBy, method: run.method, reference: run.reference } : null;

const historyEntry = (run: Pick<MockPayrollRun, "branchId" | "from" | "to">, actor: string, event: "approved" | "paid" | "reopened", reason: string | null = null) => ({
  id: `prh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
  branchId: run.branchId,
  from: run.from,
  to: run.to,
  at: new Date().toISOString(),
  actor,
  event,
  reason,
});

export const payrollHandlers = [
  http.get(`${BASE}/payroll`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const params = new URL(request.url).searchParams;
    const branchId = params.get("branchId") ?? "ma";
    const from = params.get("from") ?? "";
    const to = params.get("to") ?? "";
    const period = periodOf(branchId, from, to);
    if (period instanceof Response) return period;
    const run = runOf(branchId, from, to);
    // Aprobado o pagado: la foto fija. Abierto: lo calculado hoy, con sus ajustes.
    const all = (run ? run.members : computeMembers(branchId, from, period.days, period.weeks)) as { memberId: string }[];
    /* `memberId`: la nómina de una sola persona («Lo que llevo» / «Mi negocio» del barbero). */
    // Un barbero solo recibe su propia nómina, la pida como la pida.
    const session = sessionOf(request);
    // Recepción no ve lo que gana cada quien: la nómina es del dueño, el administrador y cada barbero (la suya).
    if (session && !isManager(session) && !isBarber(session)) return forbidden("La nómina es del dueño, el administrador y cada barbero (la suya).");
    const memberId = session && isBarber(session) ? session.memberId : params.get("memberId");
    // Los pagos de renta no se congelan al aprobar: se cuentan siempre, con la fecha en que se hicieron.
    const members = all.filter((member) => !memberId || member.memberId === memberId).map((member) => withRentPayments(member as PayrollMemberRow, branchId, from, to));
    const history = db.payroll.history.filter((item) => item.branchId === branchId && item.from === from && item.to === to).map(({ at, actor, event, reason }) => ({ at, actor, event, reason }));
    return HttpResponse.json({ from, to, weeks: run?.weeks ?? period.weeks, run: runView(run), history, members });
  }),

  http.post(`${BASE}/payroll/adjustments`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!isManager(sessionOf(request)!)) return forbidden("Solo el dueño o el administrador mueven la nómina.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = text(input.branchId);
    const from = text(input.from);
    const to = text(input.to);
    const period = periodOf(branchId, from, to);
    if (period instanceof Response) return period;
    if (runOf(branchId, from, to)) return error(409, "conflict", "El periodo ya está aprobado. Reábrelo para cambiar sus ajustes.");
    const kind = text(input.kind) as MockAdjustmentKind;
    const amount = Number(input.amount);
    const note = text(input.note).slice(0, MAX_NOTE);
    const memberId = text(input.memberId);
    const fields: Record<string, string[]> = {};
    if (!KINDS.includes(kind)) fields.kind = ["Elige qué tipo de ajuste es."];
    if (!Number.isFinite(amount) || amount <= 0) fields.amount = ["Escribe un valor mayor que cero."];
    if (note.length < 3) fields.note = ["Explica en pocas palabras por qué."];
    if (!db.team.members.some((member) => member.id === memberId)) fields.memberId = ["Esa persona no existe."];
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const adjustment = { id: `adj_${Date.now().toString(36)}`, branchId, from, to, memberId, kind, amount: round(amount), note, createdAt: new Date().toISOString(), createdBy: account.user.name };
    db.payroll = { ...db.payroll, adjustments: [...db.payroll.adjustments, adjustment] };
    db.persist();
    return HttpResponse.json(adjustment, { status: 201 });
  }),

  // Préstamos: se entregan aparte y se descuentan en cuotas, una por ciclo de pago (ver compute.loanInstallmentsIn).
  http.get(`${BASE}/payroll/loans`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return error(401, "unauthorized", "Tu sesión expiró.");
    const params = new URL(request.url).searchParams;
    const memberId = isManager(session) ? params.get("memberId") : session.memberId;
    if (!isManager(session) && !isBarber(session)) return forbidden("Los préstamos los ven el dueño, el administrador y cada barbero (los suyos).");
    const items = loansOf(params.get("branchId") ?? "ma").filter((loan) => !memberId || loan.memberId === memberId);
    return HttpResponse.json({ items });
  }),

  http.post(`${BASE}/payroll/loans`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!isManager(sessionOf(request)!)) return forbidden("Solo el dueño o el administrador mueven la nómina.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = text(input.branchId) || "ma";
    const memberId = text(input.memberId);
    const amount = Number(input.amount);
    const installments = Number(input.installments);
    const startDate = text(input.startDate) || dateKey(new Date());
    const note = text(input.note).slice(0, MAX_NOTE);
    const fields: Record<string, string[]> = {};
    if (!db.team.members.some((member) => member.id === memberId)) fields.memberId = ["Esa persona no existe."];
    if (!Number.isFinite(amount) || amount <= 0) fields.amount = ["Escribe un valor mayor que cero."];
    if (!Number.isInteger(installments) || installments < 1 || installments > MAX_INSTALLMENTS) fields.installments = [`De 1 a ${MAX_INSTALLMENTS} cuotas.`];
    if (!DAY_KEY.test(startDate)) fields.startDate = ["Elige desde cuándo."];
    if (note.length < 3) fields.note = ["Explica en pocas palabras por qué."];
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    // Una cuota no cae en un ciclo ya aprobado: el préstamo arranca en el ciclo de `startDate` y ese no puede estar cerrado.
    const first = cycleWindow(new Date(`${startDate}T00:00:00`));
    if (runOf(branchId, dateKey(first.from), dateKey(first.to))) return error(409, "conflict", "El ciclo de la primera cuota ya está aprobado: empieza el préstamo en el siguiente.");
    const loan: MockLoan = { id: `loan_${Date.now().toString(36)}`, branchId, memberId, amount: round(amount), installments, startDate, note, createdAt: new Date().toISOString(), createdBy: account.user.name, cancelledAt: null };
    db.payroll = { ...db.payroll, loans: [...(db.payroll.loans ?? []), loan] };
    db.persist();
    return HttpResponse.json(loan, { status: 201 });
  }),

  // Cancelar lo que falta (lo pagó de una vez o se perdona): las cuotas ya descontadas quedan.
  http.post(`${BASE}/payroll/loans/:id/cancel`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!isManager(sessionOf(request)!)) return forbidden("Solo el dueño o el administrador mueven la nómina.");
    const loan = (db.payroll.loans ?? []).find((item) => item.id === params.id);
    if (!loan) return error(404, "not_found", "Ese préstamo no existe.");
    const cancelled = { ...loan, cancelledAt: new Date().toISOString() };
    db.payroll = { ...db.payroll, loans: (db.payroll.loans ?? []).map((item) => (item.id === loan.id ? cancelled : item)) };
    db.persist();
    return HttpResponse.json(cancelled);
  }),

  http.delete(`${BASE}/payroll/adjustments/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!isManager(sessionOf(request)!)) return forbidden("Solo el dueño o el administrador mueven la nómina.");
    const adjustment = db.payroll.adjustments.find((item) => item.id === params.id);
    if (!adjustment) return error(404, "not_found", "Ese ajuste no existe.");
    if (runOf(adjustment.branchId, adjustment.from, adjustment.to)) return error(409, "conflict", "El periodo ya está aprobado. Reábrelo para cambiar sus ajustes.");
    db.payroll = { ...db.payroll, adjustments: db.payroll.adjustments.filter((item) => item.id !== adjustment.id) };
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),

  // Un pago de renta: lo que el barbero de renta le entregó a la barbería.
  http.post(`${BASE}/payroll/rent-payments`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!isManager(sessionOf(request)!)) return forbidden("Solo el dueño o el administrador mueven la nómina.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = text(input.branchId);
    const memberId = text(input.memberId);
    const amount = Number(input.amount);
    const method = text(input.method);
    const date = text(input.date) || new Date().toISOString().slice(0, 10);
    const member = db.team.members.find((item) => item.id === memberId);
    const fields: Record<string, string[]> = {};
    if (!member || member.role !== "barbero-renta") fields.memberId = ["Esa persona no paga renta."];
    if (!Number.isFinite(amount) || amount <= 0) fields.amount = ["Escribe cuánto pagó."];
    if (method.length < 2) fields.method = ["Di con qué pagó."];
    if (!DAY_KEY.test(date)) fields.date = ["La fecha no es válida."];
    if (!branchId) fields.branchId = ["Falta la sucursal."];
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const payment = { id: `rent_${Date.now().toString(36)}`, branchId, memberId, amount: round(amount), method, date, note: text(input.note).slice(0, MAX_NOTE), by: account.user.name };
    db.payroll = { ...db.payroll, rentPayments: [...(db.payroll.rentPayments ?? []), payment] };
    db.persist();
    return HttpResponse.json(payment, { status: 201 });
  }),

  http.delete(`${BASE}/payroll/rent-payments/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!isManager(sessionOf(request)!)) return forbidden("Solo el dueño o el administrador mueven la nómina.");
    if (!(db.payroll.rentPayments ?? []).some((item) => item.id === params.id)) return error(404, "not_found", "Ese pago no existe.");
    db.payroll = { ...db.payroll, rentPayments: db.payroll.rentPayments.filter((item) => item.id !== params.id) };
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),

  // Aprobar: la nómina del periodo queda como foto fija.
  http.post(`${BASE}/payroll/runs`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!isManager(sessionOf(request)!)) return forbidden("Solo el dueño o el administrador mueven la nómina.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = text(input.branchId);
    const from = text(input.from);
    const to = text(input.to);
    const period = periodOf(branchId, from, to);
    if (period instanceof Response) return period;
    if (runOf(branchId, from, to)) return error(409, "conflict", "Ese periodo ya está aprobado.");
    // Un periodo que se cruza con otro ya aprobado pagaría dos veces el mismo trabajo.
    const overlapping = db.payroll.runs.find((run) => run.branchId === branchId && run.from <= to && run.to >= from);
    if (overlapping) return error(409, "overlap", `Se cruza con el periodo ya aprobado del ${overlapping.from} al ${overlapping.to}. Reábrelo o elige otras fechas.`);
    const run: MockPayrollRun = {
      id: `prun_${Date.now().toString(36)}`,
      branchId,
      from,
      to,
      status: "approved",
      approvedAt: new Date().toISOString(),
      approvedBy: account.user.name,
      paidAt: null,
      paidBy: null,
      method: null,
      reference: null,
      weeks: period.weeks,
      members: computeMembers(branchId, from, period.days, period.weeks),
    };
    db.payroll = { ...db.payroll, runs: [...db.payroll.runs, run], history: [...db.payroll.history, historyEntry(run, account.user.name, "approved")] };
    db.persist();
    return HttpResponse.json(runView(run), { status: 201 });
  }),

  http.post(`${BASE}/payroll/runs/:id/pay`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!isManager(sessionOf(request)!)) return forbidden("Solo el dueño o el administrador mueven la nómina.");
    const run = db.payroll.runs.find((item) => item.id === params.id);
    if (!run) return error(404, "not_found", "Ese periodo no existe.");
    if (run.status === "paid") return error(409, "conflict", "Ese periodo ya está pagado.");
    const input = asRecord(await request.json().catch(() => ({})));
    const method = text(input.method);
    if (method.length < 2) return error(422, "validation", "Di con qué se pagó.", { fields: { method: ["Di con qué se pagó."] } });
    const paid: MockPayrollRun = { ...run, status: "paid", paidAt: new Date().toISOString(), paidBy: account.user.name, method, reference: text(input.reference) || null };
    db.payroll = { ...db.payroll, runs: db.payroll.runs.map((item) => (item.id === run.id ? paid : item)), history: [...db.payroll.history, historyEntry(run, account.user.name, "paid")] };
    db.persist();
    return HttpResponse.json(runView(paid));
  }),

  // Reabrir: vuelve a calcularse. Solo un aprobado (lo pagado se corrige en el periodo siguiente) y con motivo.
  http.post(`${BASE}/payroll/runs/:id/reopen`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!isManager(sessionOf(request)!)) return forbidden("Solo el dueño o el administrador mueven la nómina.");
    const run = db.payroll.runs.find((item) => item.id === params.id);
    if (!run) return error(404, "not_found", "Ese periodo no existe.");
    if (run.status === "paid") return error(409, "conflict", "Un periodo pagado no se reabre: corrígelo con un ajuste en el siguiente.");
    const reason = text(asRecord(await request.json().catch(() => ({}))).reason);
    if (reason.length < 5) return error(422, "validation", "Explica por qué se reabre.", { fields: { reason: ["Explica por qué se reabre."] } });
    db.payroll = { ...db.payroll, runs: db.payroll.runs.filter((item) => item.id !== run.id), history: [...db.payroll.history, historyEntry(run, account.user.name, "reopened", reason)] };
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),
];
