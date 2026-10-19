import { delay, http, HttpResponse } from "msw";
import { db } from "../db";
import { appointmentAccount } from "../calendar/account";
import { appointmentsOn } from "../calendar/handlers";
import { dateKey, type MockAppointment } from "../calendar/seed";
import { payrollOf } from "../payroll/compute";
import { forbidden, isBarber, isManager, sessionOf, unauthorized } from "../session";
import { barbersOf, memberName } from "../team/seed";

/**
 * Revisión antes de cerrar (docs/API_CONTRACT.md, «Revisión antes de cerrar»): antes de aprobar la
 * nómina o de cerrar la caja, lo que se ve raro frente al historial o frente a las reglas. Son reglas
 * explicables, no un modelo: cada alerta dice qué pasó, con la cita o la persona, para revisarlo en un
 * toque. No bloquean: quien aprueba decide, pero ve primero lo que conviene mirar.
 */

const BASE = "*/api";
const LATENCY_MS = 250;
const DAY_MS = 86_400_000;
const HISTORY_PERIODS = 4;
const MIN_HISTORY = 3;
const NET_CHANGE = 0.4;
const TIP_SHARE = 0.5;
const ADJUSTMENT_SHARE = 0.5;
const DISCOUNT_SHARE = 0.3;
const REFUND_SHARE = 0.5;
const DUPLICATE_SALE_MS = 10 * 60_000;

export type Severity = "high" | "medium" | "info";
export interface Finding {
  id: string;
  severity: Severity;
  kind: string;
  params: Record<string, string | number>;
  /** Para abrir lo que la causó. */
  appointmentId?: string;
  /** El día de esa cita (AAAA-MM-DD), para abrirla en la agenda. */
  date?: string;
  memberId?: string;
}

const round = (value: number) => Math.round(value * 100) / 100;
const dayList = (from: string, to: string) => {
  const days: string[] = [];
  for (let day = new Date(`${from}T12:00:00`); dateKey(day) <= to; day = new Date(day.getTime() + DAY_MS)) days.push(dateKey(day));
  return days;
};
const barberName = (id: string) => {
  const member = db.team.members.find((item) => item.id === id);
  return member ? memberName(member) : "";
};
const clientName = (id: string) => db.calendar.clients.find((client) => client.id === id)?.name ?? "";
const severityRank: Record<Severity, number> = { high: 0, medium: 1, info: 2 };
/** De lo grave a lo informativo, y con el día de la cita para poder abrirla. */
const sortFindings = (items: Finding[]): Finding[] =>
  [...items]
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
    .map((item) => (item.appointmentId ? { ...item, date: db.calendar.appointments.find((entry) => entry.id === item.appointmentId)?.start.slice(0, 10) } : item));

function periodPayroll(branchId: string, from: string, to: string) {
  const days = dayList(from, to);
  const appointments = days.flatMap((day) => appointmentsOn(branchId, day));
  const adjustments = db.payroll.adjustments.filter((item) => item.branchId === branchId && item.from === from && item.to === to);
  return { appointments, adjustments, members: barbersOf(db.team.members, db.team.orders, branchId).map((member) => ({ member, row: payrollOf(member, appointments, days.length / 7, branchId, adjustments) })) };
}

/** Lo raro de una nómina antes de aprobarla. */
export function payrollReview(branchId: string, from: string, to: string): Finding[] {
  const length = dayList(from, to).length;
  const current = periodPayroll(branchId, from, to);
  // El historial: los periodos de la misma duración justo antes de este.
  const history = Array.from({ length: HISTORY_PERIODS }, (_, index) => {
    const end = new Date(new Date(`${from}T12:00:00`).getTime() - (index * length + 1) * DAY_MS);
    const start = new Date(end.getTime() - (length - 1) * DAY_MS);
    return periodPayroll(branchId, dateKey(start), dateKey(end));
  });
  const findings: Finding[] = [];
  for (const { member, row } of current.members) {
    const name = memberName(member);
    const past = history.map((period) => period.members.find((item) => item.member.id === member.id)?.row).filter((item): item is NonNullable<typeof item> => Boolean(item) && (item?.services ?? 0) > 0);
    if (past.length >= MIN_HISTORY && row.payout !== "rent") {
      const average = past.reduce((sum, item) => sum + item.net, 0) / past.length;
      if (average > 0 && Math.abs(row.net - average) / average > NET_CHANGE) findings.push({ id: `net:${member.id}`, severity: "medium", kind: "netChange", memberId: member.id, params: { name, net: round(row.net), average: round(average), change: Math.round(((row.net - average) / average) * 100) } });
    }
    if (row.payout === "salary" && row.services === 0) findings.push({ id: `salary:${member.id}`, severity: "medium", kind: "salaryNoServices", memberId: member.id, params: { name, salary: round(row.salary) } });
    if (row.payout === "rent") {
      // Como en Nómina: lo que pagó de renta en el periodo cuenta; si aun así queda negativo, la debe.
      const rentPaid = (db.payroll.rentPayments ?? []).filter((item) => item.branchId === branchId && item.memberId === member.id && item.date >= from && item.date <= to).reduce((sum, item) => sum + item.amount, 0);
      const balance = round(row.net + rentPaid);
      if (balance < 0) findings.push({ id: `rent:${member.id}`, severity: "info", kind: "rentOwed", memberId: member.id, params: { name, amount: -balance } });
    }
    for (const line of row.lines) {
      if (line.tip > 0 && line.sale > 0 && line.tip > line.sale * TIP_SHARE) findings.push({ id: `tip:${line.appointmentId}`, severity: "medium", kind: "tipOutlier", memberId: member.id, appointmentId: line.appointmentId, params: { name, client: line.client, tip: round(line.tip), sale: round(line.sale) } });
      if (line.sale === 0) findings.push({ id: `zero:${line.appointmentId}`, severity: "medium", kind: "zeroSale", memberId: member.id, appointmentId: line.appointmentId, params: { name, client: line.client } });
    }
    const gross = row.serviceCommission + row.productCommission + row.salary;
    for (const adjustment of row.adjustments) {
      if (gross > 0 && adjustment.amount > gross * ADJUSTMENT_SHARE) findings.push({ id: `adj:${adjustment.id}`, severity: "medium", kind: "bigAdjustment", memberId: member.id, params: { name, amount: round(adjustment.amount), adjustmentKind: adjustment.kind } });
    }
  }
  // Un cliente es nuevo una vez: la regla «cliente nuevo» pagada a quien ya vino en periodos anteriores.
  // Va en una sola alerta con los nombres, que es lo que se corrige (la etiqueta del cliente).
  const seenBefore = new Set(history.flatMap((period) => period.appointments.filter((item) => item.status === "paid").map((item) => item.clientId)));
  const repeated = current.members.flatMap(({ row }) => row.lines.filter((line) => line.rule === "newClient")).filter((line) => seenBefore.has(current.appointments.find((item) => item.id === line.appointmentId)?.clientId ?? ""));
  if (repeated.length > 0) {
    const clients = [...new Set(repeated.map((line) => line.client))];
    findings.push({ id: `new:${from}`, severity: "medium", kind: "newClientRepeat", params: { count: clients.length, names: clients.slice(0, 3).join(", ") } });
  }
  // Ajustes repetidos: misma persona, mismo tipo y mismo valor en el periodo.
  const seen = new Map<string, string>();
  for (const adjustment of current.adjustments) {
    const key = `${adjustment.memberId}:${adjustment.kind}:${adjustment.amount}`;
    const member = db.team.members.find((item) => item.id === adjustment.memberId);
    if (seen.has(key)) findings.push({ id: `dup-adj:${adjustment.id}`, severity: "high", kind: "duplicateAdjustment", memberId: adjustment.memberId, params: { name: member ? memberName(member) : adjustment.memberId, amount: round(adjustment.amount), adjustmentKind: adjustment.kind } });
    else seen.set(key, adjustment.id);
  }
  return sortFindings(findings);
}

/** Lo raro del día antes de cerrar la caja. */
export function registerReview(branchId: string, date: string): Finding[] {
  const findings: Finding[] = [];
  const day = appointmentsOn(branchId, date);
  const paid = day.filter((item) => item.status === "paid" && item.payment);
  // La misma cita cobrada dos veces: mismo cliente, mismo barbero, mismos servicios y mismo total el
  // mismo día. Las citas enlazadas (`linkId`) son a propósito y no cuentan.
  const byClient = new Map<string, MockAppointment[]>();
  for (const item of paid.filter((entry) => !entry.walkIn && !entry.linkId)) {
    const key = `${item.clientId}:${item.barberId}:${[...item.serviceIds].sort().join("+")}:${item.payment!.total}`;
    byClient.set(key, [...(byClient.get(key) ?? []), item]);
  }
  for (const [, items] of byClient) {
    if (items.length > 1) findings.push({ id: `dup:${items[1].id}`, severity: "high", kind: "duplicateCharge", appointmentId: items[1].id, params: { client: clientName(items[1].clientId), total: round(items[1].payment!.total), count: items.length } });
  }
  // Ventas de mostrador idénticas con minutos de diferencia.
  const sales = db.calendar.sales.filter((sale) => sale.branchId === branchId && dateKey(new Date(sale.paidAt)) === date).sort((a, b) => a.paidAt.localeCompare(b.paidAt));
  sales.forEach((sale, index) => {
    const prev = sales[index - 1];
    if (prev && prev.total === sale.total && JSON.stringify(prev.items) === JSON.stringify(sale.items) && new Date(sale.paidAt).getTime() - new Date(prev.paidAt).getTime() < DUPLICATE_SALE_MS) findings.push({ id: `dup-sale:${sale.id}`, severity: "high", kind: "duplicateSale", params: { total: round(sale.total) } });
  });
  for (const item of paid) {
    const account = appointmentAccount(item);
    const charged = account.total + (item.payment?.tip ?? 0);
    if ((item.payment?.tip ?? 0) > account.total * TIP_SHARE && account.total > 0) findings.push({ id: `tip:${item.id}`, severity: "medium", kind: "tipOutlier", appointmentId: item.id, params: { name: barberName(item.barberId), client: clientName(item.clientId), tip: round(item.payment!.tip), sale: round(account.total) } });
    if (account.subtotal > 0 && account.discount > account.subtotal * DISCOUNT_SHARE) findings.push({ id: `disc:${item.id}`, severity: "info", kind: "bigDiscount", appointmentId: item.id, params: { client: clientName(item.clientId), discount: round(account.discount), percent: Math.round((account.discount / account.subtotal) * 100) } });
    for (const refund of (item.refunds ?? []).filter((entry) => dateKey(new Date(entry.at)) === date)) {
      if (refund.amount > charged * REFUND_SHARE) findings.push({ id: `refund:${refund.id}`, severity: "medium", kind: "bigRefund", appointmentId: item.id, params: { client: clientName(item.clientId), amount: round(refund.amount), by: refund.by } });
      const chargedBy = [...item.history].reverse().find((entry) => entry.event === "status:paid")?.actor;
      if (refund.to === "cash" && chargedBy && chargedBy === refund.by) findings.push({ id: `self:${refund.id}`, severity: "medium", kind: "selfRefund", appointmentId: item.id, params: { client: clientName(item.clientId), amount: round(refund.amount), by: refund.by } });
    }
  }
  // Clientes que llegaron o están en la silla y no se cobraron: la caja cerraría sin ellos.
  const open = day.filter((item) => item.status === "arrived" || item.status === "seated");
  if (open.length > 0) findings.push({ id: `open:${date}`, severity: "high", kind: "openAccounts", appointmentId: open[0].id, params: { count: open.length } });
  return sortFindings(findings);
}

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export const reviewHandlers = [
  http.get(`${BASE}/payroll/review`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("La revisión de la nómina es del dueño y el administrador.");
    const params = new URL(request.url).searchParams;
    const from = params.get("from") ?? "";
    const to = params.get("to") ?? "";
    if (!DAY_KEY.test(from) || !DAY_KEY.test(to) || to < from) return HttpResponse.json({ code: "validation", message: "El periodo no es válido." }, { status: 422 });
    return HttpResponse.json({ items: payrollReview(params.get("branchId") ?? "ma", from, to) });
  }),

  http.get(`${BASE}/register/review`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (isBarber(session)) return forbidden("La caja la cierran recepción, el administrador o el dueño.");
    const params = new URL(request.url).searchParams;
    const date = params.get("date") ?? "";
    if (!DAY_KEY.test(date)) return HttpResponse.json({ code: "validation", message: "La fecha no es válida." }, { status: 422 });
    return HttpResponse.json({ items: registerReview(params.get("branchId") ?? "ma", date) });
  }),
];
