import { delay, http, HttpResponse } from "msw";
import { ACCOUNTS, db } from "../db";
import { appointmentsOn } from "../calendar/handlers";
import { dateKey, type MockAppointment, type MockSale } from "../calendar/seed";
import { hashOf } from "../customers/seed";
import { memberName } from "../team/seed";

/**
 * Las transacciones del backend simulado. No hay tabla propia: una «cuenta»
 * es lo que se le cobra a alguien, y sale de lo que ya existe —cada cita es
 * una cuenta (por cobrar, cobrada o anulada) y cada venta de mostrador es
 * otra—. Reproduce docs/API_CONTRACT.md (sección «Transacciones»).
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
/** Lo más que abarca una consulta: dos meses largos. */
const MAX_RANGE_DAYS = 62;
/** Una de cada tantas cuentas cobradas se devolvió, para que el estado exista en la lista. */
const REFUND_ONE_IN = 45;

function error(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return HttpResponse.json({ code, message, ...extra }, { status });
}

function requireAuth(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const accountId = token ? db.sessions.get(token) : undefined;
  return ACCOUNTS.find((item) => item.id === accountId) ?? null;
}

const barberName = (id: string): string | null => {
  const member = db.team.members.find((item) => item.id === id);
  return member ? memberName(member) : null;
};

const reference = (id: string): string => {
  const hex = (salt: number, length: number) => hashOf(id, salt).toString(16).padStart(8, "0").slice(0, length);
  return `${hex(1, 8)}-${hex(2, 4)}-${hex(3, 4)}-${hex(4, 4)}-${hex(5, 8)}${hex(6, 4)}`;
};

const invoiceOf = (id: string): string => String(hashOf(id, 9) % 100_000_000).padStart(8, "0");

function linesOf(serviceIds: readonly string[], products: readonly { productId: string; qty: number }[]) {
  const services = serviceIds.map((id) => {
    const service = db.services.items.find((item) => item.id === id);
    return { kind: "service" as const, name: service?.name ?? id, qty: 1, amount: service?.price ?? 0 };
  });
  const goods = products.map((row) => {
    const product = db.products.items.find((item) => item.id === row.productId);
    return { kind: "product" as const, name: product?.name ?? row.productId, qty: row.qty, amount: (product?.price ?? 0) * row.qty };
  });
  return [...services, ...goods];
}

function fromAppointment(appointment: MockAppointment) {
  const client = db.calendar.clients.find((item) => item.id === appointment.clientId);
  const lines = linesOf(appointment.serviceIds, appointment.products);
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const payment = appointment.payment;
  const tax = payment?.tax ?? 0;
  const total = subtotal + tax;
  const isVoid = appointment.status === "cancelled" || appointment.status === "no_show";
  const paid = appointment.status === "paid" && payment !== null;
  const refunded = paid && hashOf(appointment.id, 21) % REFUND_ONE_IN === 0;
  const status = isVoid ? "void" : refunded ? "refunded" : paid ? "paid" : "open";
  const charged = [...appointment.history].reverse().find((item) => item.event.startsWith("paid:"));
  const barber = barberName(appointment.barberId);
  return {
    id: appointment.id,
    kind: "appointment" as const,
    date: appointment.start,
    invoice: paid ? invoiceOf(appointment.id) : null,
    client: client ? { id: client.id, name: client.name, phone: client.phone } : null,
    barber,
    openedBy: appointment.createdBy,
    chargedBy: paid ? (charged?.actor ?? barber) : null,
    status,
    appointmentStatus: appointment.status,
    source: appointment.source,
    lines,
    subtotal,
    tax,
    tip: paid && !refunded ? (payment?.tip ?? 0) : 0,
    total,
    collected: status === "paid" ? total : 0,
    refunded: refunded ? total : 0,
    balance: status === "open" ? total : 0,
    method: paid ? (payment?.method ?? null) : null,
    paidAt: paid ? (payment?.paidAt ?? null) : null,
    reference: reference(appointment.id),
    appointmentId: appointment.id,
    durationMin: appointment.durationMin,
  };
}

function fromSale(sale: MockSale) {
  const lines = linesOf([], sale.items);
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  return {
    id: sale.id,
    kind: "sale" as const,
    date: sale.paidAt,
    invoice: invoiceOf(sale.id),
    client: null,
    barber: null,
    openedBy: null,
    chargedBy: null,
    status: "paid" as const,
    appointmentStatus: null,
    source: null,
    lines,
    subtotal,
    tax: 0,
    tip: 0,
    total: sale.total,
    collected: sale.total,
    refunded: 0,
    balance: 0,
    method: sale.method,
    paidAt: sale.paidAt,
    reference: reference(sale.id),
    appointmentId: null,
    durationMin: null,
  };
}

export const transactionsHandlers = [
  http.get(`${BASE}/transactions`, async ({ request }) => {
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
    const sales = db.calendar.sales.filter((sale) => {
      const day = dateKey(new Date(sale.paidAt));
      return sale.branchId === branchId && day >= from && day <= to;
    });
    const items = [...appointments.map(fromAppointment), ...sales.map(fromSale)].sort((a, b) => b.date.localeCompare(a.date));
    return HttpResponse.json({ from, to, items });
  }),
];
