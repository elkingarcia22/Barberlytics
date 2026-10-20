import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { dueDatesIn, payableStatus } from "@/features/expenses/payables";
import { db, type MockExpensePayment } from "../db";
import { forbidden, isBarber, isManager, sessionOf, unauthorized } from "../session";
import { branchNow } from "../settings/branchRules";
import { expenseDate, type MockExpense } from "./seed";

/**
 * Las cuentas por pagar (docs/API_CONTRACT.md, «Gastos › Por pagar»): los vencimientos de los gastos fijos en un mes,
 * con su estado (pagado, vencido, vence esta semana, más adelante), y marcarlos pagados o deshacerlo. El gasto fijo sigue
 * contando en el estado de resultados por mes; esto es la caja: qué se pagó y qué falta.
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const MONTH = /^\d{4}-\d{2}$/;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const METHODS = ["cash", "bank", "card", "wallet"] as const;

const asRecord = (body: DefaultBodyType): Record<string, unknown> => (body && typeof body === "object" ? (body as Record<string, unknown>) : {});
const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const error = (status: number, code: string, message: string, extra: Record<string, unknown> = {}) => HttpResponse.json({ code, message, ...extra }, { status });

/** Quién ve y paga los gastos de quién: gerencia los de la barbería; el barbero de renta, los suyos. */
function ownerOf(request: Request, requested: string | null): string | null | Response {
  const session = sessionOf(request);
  if (!session) return unauthorized();
  if (session.teamRole === "barbero-renta") return session.memberId;
  if (isBarber(session) || !isManager(session)) return forbidden("Las cuentas por pagar las ve el dueño o el administrador.");
  return requested;
}

const vencimientos = (expense: MockExpense, month: string) => dueDatesIn({ kind: expense.kind, frequency: expense.frequency, start: expenseDate(expense), endDate: expense.endDate ?? null, dueDay: expense.dueDay ?? null }, month);

/** Los vencimientos del mes de una sede, con su pago si ya se hizo. */
export function payablesOf(branchId: string, owner: string | null, month: string, today: string) {
  const items = db.expenses
    .filter((expense) => expense.branchId === branchId && (expense.ownerMemberId ?? null) === owner && expense.kind === "fixed")
    .flatMap((expense) =>
      vencimientos(expense, month).map((dueDate) => {
        const payment = db.expensePayments.find((item) => item.expenseId === expense.id && item.dueDate === dueDate) ?? null;
        return { expenseId: expense.id, name: expense.name, categoryId: expense.categoryId ?? "other", supplier: expense.supplier ?? "", amount: expense.amount, dueDate, status: payableStatus(dueDate, today, payment !== null), payment };
      })
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name, "es"));
  const pending = items.filter((item) => item.status !== "paid");
  const sumOf = (list: typeof items) => Math.round(list.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
  return {
    month,
    items,
    totals: { due: sumOf(items), paid: sumOf(items.filter((item) => item.status === "paid")), pending: sumOf(pending), overdue: sumOf(items.filter((item) => item.status === "overdue")) },
  };
}

export const payableHandlers = [
  http.get(`${BASE}/expenses/payables`, async ({ request }) => {
    await delay(LATENCY_MS);
    const params = new URL(request.url).searchParams;
    const branchId = params.get("branchId") ?? "ma";
    const month = params.get("month") ?? "";
    if (!MONTH.test(month)) return error(422, "validation", "Falta el mes («AAAA-MM»).");
    const owner = ownerOf(request, params.get("ownerMemberId") || null);
    if (owner instanceof Response) return owner;
    return HttpResponse.json(payablesOf(branchId, owner, month, branchNow(branchId).slice(0, 10)));
  }),

  // Marcar pagado un vencimiento (con el medio, si se dice).
  http.post(`${BASE}/expenses/:id/payments`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    const expense = db.expenses.find((item) => item.id === params.id);
    if (!expense) return error(404, "not_found", "Ese gasto no existe.");
    const owner = ownerOf(request, expense.ownerMemberId ?? null);
    if (owner instanceof Response) return owner;
    if ((expense.ownerMemberId ?? null) !== owner) return forbidden("Ese gasto no es tuyo.");
    const input = asRecord(await request.json().catch(() => ({})));
    const dueDate = text(input.dueDate);
    if (!DAY_KEY.test(dueDate) || !vencimientos(expense, dueDate.slice(0, 7)).includes(dueDate)) return error(422, "validation", "Ese gasto no vence ese día.", { fields: { dueDate: ["Ese gasto no vence ese día."] } });
    if (db.expensePayments.some((item) => item.expenseId === expense.id && item.dueDate === dueDate)) return error(409, "conflict", "Ese vencimiento ya está pagado.");
    const method = METHODS.find((item) => item === input.method) ?? expense.paymentMethod ?? null;
    const payment: MockExpensePayment = { id: `pay_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, expenseId: expense.id, dueDate, amount: expense.amount, paidAt: new Date().toISOString(), method, by: session.account.user.name };
    db.expensePayments = [...db.expensePayments, payment];
    db.persist();
    return HttpResponse.json(payment, { status: 201 });
  }),

  // Deshacer un pago marcado por error.
  http.delete(`${BASE}/expenses/:id/payments/:paymentId`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const expense = db.expenses.find((item) => item.id === params.id);
    if (!expense) return error(404, "not_found", "Ese gasto no existe.");
    const owner = ownerOf(request, expense.ownerMemberId ?? null);
    if (owner instanceof Response) return owner;
    if ((expense.ownerMemberId ?? null) !== owner) return forbidden("Ese gasto no es tuyo.");
    if (!db.expensePayments.some((item) => item.id === params.paymentId && item.expenseId === expense.id)) return error(404, "not_found", "Ese pago no existe.");
    db.expensePayments = db.expensePayments.filter((item) => item.id !== params.paymentId);
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),
];
