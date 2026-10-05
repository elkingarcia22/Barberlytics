import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { ACCOUNTS, db } from "../db";
import type { MockExpense, MockExpenseFrequency } from "./seed";

/**
 * Los endpoints de gastos del backend simulado. Reproducen
 * docs/API_CONTRACT.md (sección «Gastos»): los gastos de una sucursal, y su
 * alta, edición y borrado.
 *
 * Un gasto es de la sucursal (`ownerMemberId: null`) o de un barbero de renta.
 * La lista sin `ownerMemberId` trae los de la sucursal; con él, solo los de esa
 * persona. Los guardados antes del campo no lo traen y cuentan como de la sucursal.
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const FREQUENCIES: readonly MockExpenseFrequency[] = ["weekly", "biweekly", "monthly", "quarterly", "semiannual", "annual"];

function error(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return HttpResponse.json({ code, message, ...extra }, { status });
}

function requireAuth(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const accountId = token ? db.sessions.get(token) : undefined;
  return ACCOUNTS.find((item) => item.id === accountId) ?? null;
}

const asRecord = (body: DefaultBodyType): Record<string, unknown> => (body && typeof body === "object" ? (body as Record<string, unknown>) : {});
const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const findExpense = (id: string | readonly string[] | undefined) => db.expenses.find((item) => item.id === id);

function validate(input: Record<string, unknown>) {
  const fields: Record<string, string[]> = {};
  const kind = input.kind === "variable" ? ("variable" as const) : ("fixed" as const);
  const name = text(input.name);
  const amount = typeof input.amount === "number" && Number.isFinite(input.amount) ? input.amount : null;
  const frequency = FREQUENCIES.find((item) => item === input.frequency) ?? null;
  if (name.length < 2) fields.name = ["Escribe el nombre del gasto."];
  if (amount === null || amount <= 0) fields.amount = ["Escribe un valor mayor que cero."];
  if (kind === "fixed" && frequency === null) fields.frequency = ["Elige cada cuánto se paga."];
  return { fields, values: { kind, name, amount: amount ?? 0, frequency: kind === "fixed" ? frequency : null, description: text(input.description) } };
}

export const expensesHandlers = [
  http.get(`${BASE}/expenses`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const params = new URL(request.url).searchParams;
    const branchId = params.get("branchId") ?? "ma";
    const owner = params.get("ownerMemberId") || null;
    const items = db.expenses
      .map((item) => ({ ...item, ownerMemberId: item.ownerMemberId ?? null }))
      .filter((item) => item.branchId === branchId && item.ownerMemberId === owner)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return HttpResponse.json({ items });
  }),

  http.post(`${BASE}/expenses`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const { fields, values } = validate(input);
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const expense: MockExpense = { ...values, id: `exp_${Date.now().toString(36)}`, branchId: text(input.branchId) || "ma", ownerMemberId: text(input.ownerMemberId) || null, createdAt: new Date().toISOString() };
    db.expenses = [expense, ...db.expenses];
    db.persist();
    return HttpResponse.json(expense, { status: 201 });
  }),

  http.patch(`${BASE}/expenses/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const expense = findExpense(params.id);
    if (!expense) return error(404, "not_found", "Ese gasto no existe.");
    /* Un gasto no cambia de tipo: fijo y variable se cuentan distinto. */
    const { fields, values } = validate({ ...asRecord(await request.json().catch(() => ({}))), kind: expense.kind });
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const updated: MockExpense = { ...expense, ownerMemberId: expense.ownerMemberId ?? null, ...values };
    db.expenses = db.expenses.map((item) => (item.id === updated.id ? updated : item));
    db.persist();
    return HttpResponse.json(updated);
  }),

  http.delete(`${BASE}/expenses/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const expense = findExpense(params.id);
    if (!expense) return error(404, "not_found", "Ese gasto no existe.");
    db.expenses = db.expenses.filter((item) => item.id !== expense.id);
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),
];
