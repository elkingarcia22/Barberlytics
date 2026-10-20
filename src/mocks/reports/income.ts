import { delay, http, HttpResponse } from "msw";
import { accountById, db } from "../db";
import { appointmentAccount } from "../calendar/account";
import { appointmentsOn } from "../calendar/handlers";
import { dateKey, type MockAppointment } from "../calendar/seed";
import { barberServicePrice, productPriceIn } from "../catalogPrices";
import { payrollOf } from "../payroll/compute";
import { barbersOf } from "../team/seed";
import { expenseDate, fixedActiveIn, type MockExpense } from "../expenses/seed";

/**
 * El estado de resultados de una sucursal en un mes (docs/API_CONTRACT.md, «Reportes»): lo que entró
 * por servicios, productos y renta de sillas, menos lo que costó ganarlo (producto vendido y
 * comisiones), menos lo fijo (salarios, ajustes y gastos). Y el punto de equilibrio: cuánto hay que
 * vender —y cuántos servicios al día, al ticket de verdad— para que lo fijo quede cubierto.
 *
 * Todo sin impuesto ni propina: el impuesto es del Estado y la propina, del barbero.
 */

const BASE = "*/api";
const LATENCY_MS = 250;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY_MS = 86_400_000;
const DAYS_PER_WEEK = 7;
const MONTHS_PER_YEAR = 12;
export const PAYMENTS_PER_YEAR: Readonly<Record<NonNullable<MockExpense["frequency"]>, number>> = {
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  quarterly: 4,
  semiannual: 2,
  annual: 1,
};

const round = (value: number) => Math.round(value * 100) / 100;
const sum = (values: readonly number[]) => round(values.reduce((total, value) => total + value, 0));

function requireAuth(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const accountId = token ? db.sessions.get(token) : undefined;
  return accountById(accountId) ?? null;
}

const productCost = (productId: string, qty: number) => (db.products.items.find((item) => item.id === productId)?.cost ?? 0) * qty;

/** Lo que dejó una cita cobrada, sin impuesto: repartido entre servicios y productos según su precio. */
function appointmentRevenue(item: MockAppointment): {
  services: number;
  products: number;
} {
  const account = appointmentAccount(item);
  // Con el impuesto encima o incluido, lo que queda sin él es el total menos el impuesto.
  const net = account.total - account.tax;
  const services = item.serviceIds.reduce((total, id) => total + barberServicePrice(item.barberId, id, item.branchId), 0);
  const products = item.products.reduce((total, row) => total + productPriceIn(row.productId, item.branchId) * row.qty, 0);
  const gross = services + products;
  const share = gross > 0 ? services / gross : 1;
  return { services: net * share, products: net * (1 - share) };
}

interface MonthRange {
  from: Date;
  days: number;
  /** Días ya vividos del mes (todo el mes si ya pasó). */
  elapsed: number;
}

function rangeOf(month: string, now: Date): MonthRange {
  const [year, index] = month.split("-").map(Number);
  const from = new Date(year, index - 1, 1);
  const days = new Date(year, index, 0).getDate();
  const elapsedMs = now.getTime() - from.getTime();
  const elapsed = elapsedMs < 0 ? 0 : Math.min(days, Math.floor(elapsedMs / DAY_MS) + 1);
  return { from, days, elapsed };
}

const dayOf = (range: MonthRange, index: number) => dateKey(new Date(range.from.getFullYear(), range.from.getMonth(), index + 1));

/** El mes de una sucursal hasta hoy (o completo si ya pasó). */
export function incomeStatement(branchId: string, month: string, now = new Date()) {
  const range = rangeOf(month, now);
  const days = Array.from({ length: range.days }, (_, index) => dayOf(range, index));
  const lived = days.slice(0, range.elapsed);
  const appointments = lived.flatMap((day) => appointmentsOn(branchId, day));
  const paid = appointments.filter((item) => item.status === "paid" && item.payment);
  const first = days[0];
  const last = days[days.length - 1];
  const sales = db.calendar.sales.filter((sale) => sale.branchId === branchId && dateKey(new Date(sale.paidAt)) >= first && dateKey(new Date(sale.paidAt)) <= last);

  // Nómina del mes: comisiones (crecen con lo vendido), salarios y ajustes (fijos) y la renta que pagan los de renta.
  const weeks = round(range.elapsed / DAYS_PER_WEEK);
  const adjustments = db.payroll.adjustments.filter((item) => item.branchId === branchId && item.from >= first && item.to <= last);
  const payroll = barbersOf(db.team.members, db.team.orders, branchId).map((member) => payrollOf(member, appointments, weeks, branchId, adjustments, { sales, loans: db.payroll.loans ?? [], from: first, to: last }));
  const staff = payroll.filter((item) => item.payout !== "rent");
  const renters = new Set(payroll.filter((item) => item.payout === "rent").map((item) => item.memberId));

  // Ingresos: lo que cobró la barbería por su equipo (lo del barbero de renta es suyo) y la renta de sus sillas.
  const own = paid.filter((item) => !renters.has(item.barberId));
  const byAppointment = own.map(appointmentRevenue);
  const services = sum(byAppointment.map((item) => item.services));
  const saleRevenue = sales.map((sale) => sale.total - (sale.tax ?? 0));
  const products = sum([...byAppointment.map((item) => item.products), ...saleRevenue]);
  const refunds = sum(appointments.filter((item) => !renters.has(item.barberId)).flatMap((item) => (item.refunds ?? []).map((refund) => refund.amount)));

  const commissions = sum(staff.map((item) => item.serviceCommission + item.productCommission));
  const salaries = sum(staff.map((item) => item.salary));
  const payrollAdjustments = sum(staff.map((item) => item.adjustmentsTotal));
  const rent = sum(payroll.filter((item) => item.payout === "rent").map((item) => item.rent + item.deductions));

  const cogs = round(sum(own.flatMap((item) => item.products.map((row) => productCost(row.productId, row.qty)))) + sum(sales.flatMap((sale) => sale.items.map((row) => productCost(row.productId, row.qty)))));

  // Gastos de la sucursal: los fijos llevados al mes (en proporción a los días vividos) y los variables del mes.
  const shopExpenses = db.expenses.filter((item) => item.branchId === branchId && (item.ownerMemberId ?? null) === null);
  // Un fijo cuenta si corrió en el mes (empezó antes de que acabara y no se terminó antes de que empezara).
  const fixedMonthly = sum(shopExpenses.filter((item) => item.kind === "fixed" && item.frequency && fixedActiveIn(item, first, last)).map((item) => (item.amount * PAYMENTS_PER_YEAR[item.frequency!]) / MONTHS_PER_YEAR));
  const lived01 = range.days > 0 ? range.elapsed / range.days : 0;
  const expensesFixed = round(fixedMonthly * lived01);
  const expensesVariable = sum(shopExpenses.filter((item) => item.kind === "variable" && expenseDate(item) >= first && expenseDate(item) <= last).map((item) => item.amount));

  const revenue = round(services + products + rent - refunds);
  const variableCosts = round(cogs + commissions);
  const contribution = round(revenue - variableCosts);
  const fixedCosts = round(salaries + payrollAdjustments + expensesFixed + expensesVariable);
  const net = round(contribution - fixedCosts);

  // Punto de equilibrio sobre el mes completo: lo fijo de un mes entero contra el margen que deja cada peso vendido.
  const ratio = revenue > 0 ? contribution / revenue : 0;
  const fullFixed = lived01 > 0 ? round(fixedCosts / lived01) : 0;
  const tickets = own.length + sales.length;
  const avgTicket = tickets > 0 ? round((services + products) / tickets) : 0;
  const openDays = days.filter((day) => appointmentsOn(branchId, day).length > 0).length;
  const livedOpen = lived.filter((day) => appointmentsOn(branchId, day).length > 0).length;
  const breakEvenRevenue = ratio > 0 ? round(fullFixed / ratio) : null;
  const breakEven =
    breakEvenRevenue === null || avgTicket === 0 || openDays === 0
      ? null
      : {
          revenue: breakEvenRevenue,
          perDay: round(breakEvenRevenue / openDays),
          servicesPerDay: Math.ceil(breakEvenRevenue / avgTicket / openDays),
          actualPerDay: livedOpen > 0 ? round(tickets / livedOpen) : 0,
          avgTicket,
          openDays,
          contributionPercent: round(ratio * 100),
        };

  return {
    month,
    days: range.days,
    elapsedDays: range.elapsed,
    revenue: { services, products, rent, refunds, total: revenue },
    costs: {
      products: cogs,
      commissions,
      salaries,
      adjustments: payrollAdjustments,
      expensesFixed,
      expensesVariable,
    },
    contribution,
    fixedCosts,
    net,
    marginPercent: revenue > 0 ? round((net / revenue) * 100) : 0,
    breakEven,
  };
}

const previousMonth = (month: string): string => {
  const [year, index] = month.split("-").map(Number);
  const date = new Date(year, index - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const incomeHandlers = [
  http.get(`${BASE}/reports/income`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return HttpResponse.json({ code: "unauthorized", message: "Tu sesión expiró." }, { status: 401 });
    const params = new URL(request.url).searchParams;
    const branchId = params.get("branchId") ?? "";
    const month = params.get("month") ?? "";
    if (!branchId || !MONTH.test(month))
      return HttpResponse.json(
        {
          code: "validation",
          message: "Falta la sucursal o el mes (AAAA-MM).",
          fields: { month: ["Elige un mes."] },
        },
        { status: 422 }
      );
    const current = incomeStatement(branchId, month);
    // Un mes a medias se compara con el mismo tramo del anterior: 18 días contra 18 días, no contra 30.
    const prior = previousMonth(month);
    const [year, index] = prior.split("-").map(Number);
    const cutoff = current.elapsedDays < current.days ? new Date(year, index - 1, Math.min(current.elapsedDays, new Date(year, index, 0).getDate()), 23, 59) : new Date();
    const previous = incomeStatement(branchId, prior, cutoff);
    return HttpResponse.json({
      ...current,
      previous: {
        month: previous.month,
        elapsedDays: previous.elapsedDays,
        revenue: previous.revenue.total,
        net: previous.net,
      },
    });
  }),
];
