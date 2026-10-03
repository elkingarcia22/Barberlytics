import { delay, http, HttpResponse } from "msw";
import { ACCOUNTS, db } from "../db";
import { appointmentsOn } from "../calendar/handlers";
import { dateKey, type MockAppointment } from "../calendar/seed";
import { barbersOf, memberName, type MockCompensation, type MockTeamMember } from "../team/seed";

/**
 * La nómina del backend simulado. No se guarda: se calcula sobre las citas
 * cobradas del rango y la compensación de cada barbero (su ficha en Equipo).
 * Reproduce docs/API_CONTRACT.md (sección «Nómina»).
 *
 * - Comisión: un porcentaje de cada servicio según quién trajo al cliente,
 *   más la comisión de productos y las propinas.
 * - Salario: un sueldo por semana, más la comisión de productos y las propinas.
 * - Renta: el barbero paga su puesto por semana y una deducción por cada
 *   cliente que le puso la barbería; las propinas son suyas.
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const DAYS_PER_WEEK = 7;
const MAX_RANGE_DAYS = 62;

type Rule = "walkIn" | "noPreference" | "newClient" | "recurring" | "basic";
type Payout = "commission" | "rent" | "salary";

function error(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return HttpResponse.json({ code, message, ...extra }, { status });
}

function requireAuth(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const accountId = token ? db.sessions.get(token) : undefined;
  return ACCOUNTS.find((item) => item.id === accountId) ?? null;
}

const round = (value: number) => Math.round(value * 100) / 100;

const payoutOf = (member: MockTeamMember): Payout => (member.role === "barbero-renta" ? "rent" : member.compensation?.type === "salary" ? "salary" : "commission");

/** Quién trajo al cliente decide la regla; la más específica gana. */
function ruleOf(appointment: MockAppointment): Rule {
  if (appointment.walkIn) return "walkIn";
  if (appointment.requestedBarberId === null) return "noPreference";
  const client = db.calendar.clients.find((item) => item.id === appointment.clientId);
  if (client?.type === "new") return "newClient";
  if (client && client.type !== "walkin") return "recurring";
  return "basic";
}

/** El porcentaje de la regla; si no tiene uno propio, el básico. En escala, el del tramo alcanzado. */
function rateOf(compensation: MockCompensation, rule: Rule, periodSales: number): number {
  if (compensation.type === "scale" && compensation.scale.length > 0) {
    const tier = [...compensation.scale].sort((a, b) => b.from - a.from).find((item) => periodSales >= item.from);
    return tier?.percent ?? compensation.basic;
  }
  const own = rule === "basic" ? null : compensation[rule];
  return own ?? compensation.basic;
}

const priceOf = (serviceIds: readonly string[]) => serviceIds.reduce((sum, id) => sum + (db.services.items.find((item) => item.id === id)?.price ?? 0), 0);
const productSalesOf = (appointment: MockAppointment) => appointment.products.reduce((sum, row) => sum + (db.products.items.find((item) => item.id === row.productId)?.price ?? 0) * row.qty, 0);

function payrollOf(member: MockTeamMember, appointments: readonly MockAppointment[], weeks: number) {
  const payout = payoutOf(member);
  const mine = appointments.filter((item) => item.barberId === member.id && item.status === "paid" && item.payment !== null);
  const serviceSales = mine.reduce((sum, item) => sum + priceOf(item.serviceIds), 0);
  const compensation = member.compensation;
  const payments = member.payments;

  const lines = mine
    .map((item) => {
      const rule = ruleOf(item);
      const sale = priceOf(item.serviceIds);
      const rate = payout === "commission" && compensation ? rateOf(compensation, rule, serviceSales) : null;
      const deduction = payout === "rent" && payments ? (rule === "walkIn" ? payments.walkInDeduction : rule === "noPreference" ? payments.noPreferenceDeduction : rule === "newClient" ? payments.newClientDeduction : 0) : 0;
      const client = db.calendar.clients.find((entry) => entry.id === item.clientId);
      const service = item.serviceIds.map((id) => db.services.items.find((entry) => entry.id === id)?.name ?? id).join(" + ");
      return {
        appointmentId: item.id,
        date: item.start,
        client: client?.name ?? "—",
        service,
        rule,
        rate,
        sale,
        commission: rate === null ? 0 : round((sale * rate) / 100),
        tip: item.payment?.tip ?? 0,
        deduction,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const productSales = mine.reduce((sum, item) => sum + productSalesOf(item), 0);
  const productPercent = compensation?.productPercent ?? 0;
  const serviceCommission = round(lines.reduce((sum, line) => sum + line.commission, 0));
  const productCommission = payout === "rent" ? 0 : round((productSales * productPercent) / 100);
  const tips = round(lines.reduce((sum, line) => sum + line.tip, 0));
  const salary = payout === "salary" ? round((compensation?.salary ?? 0) * weeks) : 0;
  const rent = payout === "rent" ? round((payments?.rentBase ?? 0) * weeks) : 0;
  const deductions = round(lines.reduce((sum, line) => sum + line.deduction, 0));
  /* Positivo: la barbería le paga. Negativo: el barbero le debe a la barbería. */
  const net = round(serviceCommission + productCommission + tips + salary - rent - deductions);

  return {
    memberId: member.id,
    name: memberName(member),
    avatarUrl: member.avatarUrl,
    payout,
    rules:
      payout === "commission" && compensation
        ? { type: compensation.type, basic: compensation.basic, recurring: compensation.recurring, walkIn: compensation.walkIn, noPreference: compensation.noPreference, newClient: compensation.newClient, productPercent: compensation.productPercent, scale: compensation.scale }
        : null,
    rentBase: payout === "rent" ? (payments?.rentBase ?? 0) : null,
    salaryBase: payout === "salary" ? (compensation?.salary ?? 0) : null,
    services: lines.length,
    serviceSales: round(serviceSales),
    productSales: round(productSales),
    serviceCommission,
    productCommission,
    tips,
    salary,
    rent,
    deductions,
    net,
    lines,
  };
}

export const payrollHandlers = [
  http.get(`${BASE}/payroll`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const params = new URL(request.url).searchParams;
    const branchId = params.get("branchId") ?? "ma";
    const from = params.get("from") ?? "";
    const to = params.get("to") ?? "";
    if (!DAY_KEY.test(from) || !DAY_KEY.test(to) || to < from) return error(422, "validation", "El rango de fechas no es válido.", { fields: { from: ["Elige un rango de fechas válido."] } });
    const start = new Date(`${from}T00:00:00`);
    const days = Math.round((new Date(`${to}T00:00:00`).getTime() - start.getTime()) / DAY_MS) + 1;
    if (days > MAX_RANGE_DAYS) return error(422, "validation", `El rango no puede pasar de ${MAX_RANGE_DAYS} días.`, { fields: { to: [`Elige un rango de hasta ${MAX_RANGE_DAYS} días.`] } });

    const appointments = Array.from({ length: days }, (_, index) => appointmentsOn(branchId, dateKey(new Date(start.getTime() + index * DAY_MS)))).flat();
    /* La renta y el salario son por semana: un mes de 30 días son 30/7 semanas. */
    const weeks = round(days / DAYS_PER_WEEK);
    const members = barbersOf(db.team.members, db.team.orders, branchId).map((member) => payrollOf(member, appointments, weeks));
    return HttpResponse.json({ from, to, weeks, members });
  }),
];
