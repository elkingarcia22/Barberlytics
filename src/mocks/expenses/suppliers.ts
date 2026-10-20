import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { db } from "../db";
import { forbidden, isManager, sessionOf, unauthorized } from "../session";
import { branchNow } from "../settings/branchRules";
import { PAYMENTS_PER_YEAR } from "../reports/income";
import { payablesOf } from "./payables";
import { expenseDate, type MockExpense, type MockSupplier } from "./seed";

/**
 * Los proveedores (docs/API_CONTRACT.md, «Gastos › Proveedores»): a quién se le paga, con su NIT o EIN y su contacto, y
 * cuánto se le paga. Un gasto queda unido a su proveedor por `supplierId` o, los de antes, por el nombre. Los ve y los
 * crea quien registra gastos; los borra gerencia (sus gastos conservan el nombre).
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const DAY_MS = 86_400_000;
const WINDOW_DAYS = 90;
const MONTHS_IN_WINDOW = 3;
const MONTHS_PER_YEAR = 12;
const MAX_NAME = 80;

const asRecord = (body: DefaultBodyType): Record<string, unknown> => (body && typeof body === "object" ? (body as Record<string, unknown>) : {});
const text = (value: unknown, max = 120): string => (typeof value === "string" ? value.trim().slice(0, max) : "");
const error = (status: number, code: string, message: string, extra: Record<string, unknown> = {}) => HttpResponse.json({ code, message, ...extra }, { status });
const round = (value: number) => Math.round(value * 100) / 100;
const sameName = (a: string | undefined, b: string) => (a ?? "").trim().toLowerCase() === b.trim().toLowerCase();

/** El proveedor de un gasto: el que tiene guardado o, si no, el de su mismo nombre. */
export const supplierIdOf = (expense: Pick<MockExpense, "supplierId" | "supplier">): string | null =>
  expense.supplierId ?? (expense.supplier ? (db.suppliers.find((item) => sameName(expense.supplier, item.name))?.id ?? null) : null);

/** Lo que se le paga a cada proveedor: cuántos gastos, cuánto al mes (fijos llevados al mes + variables de 90 días), el último y lo pendiente del mes. */
export function suppliersWithStats(branchId: string, owner: string | null, now = new Date()) {
  const expenses = db.expenses.filter((item) => item.branchId === branchId && (item.ownerMemberId ?? null) === owner);
  const since = new Date(now.getTime() - WINDOW_DAYS * DAY_MS).toISOString().slice(0, 10);
  const today = branchNow(branchId).slice(0, 10);
  const pending = payablesOf(branchId, owner, today.slice(0, 7), today).items.filter((item) => item.status !== "paid");
  return db.suppliers
    .map((supplier) => {
      const mine = expenses.filter((item) => supplierIdOf(item) === supplier.id);
      const fixedMonthly = mine.filter((item) => item.kind === "fixed" && item.frequency && !(item.endDate && item.endDate < today)).reduce((sum, item) => sum + (item.amount * PAYMENTS_PER_YEAR[item.frequency!]) / MONTHS_PER_YEAR, 0);
      const variable = mine.filter((item) => item.kind === "variable" && expenseDate(item) >= since).reduce((sum, item) => sum + item.amount, 0);
      // El último: un variable por su fecha; un fijo por su último vencimiento pagado (no por cuándo empezó).
      const paidDues = db.expensePayments.filter((payment) => mine.some((expense) => expense.id === payment.expenseId)).map((payment) => payment.dueDate);
      const last = [...mine.filter((item) => item.kind === "variable").map(expenseDate), ...paidDues].filter((date) => date <= today).sort().at(-1) ?? null;
      const owed = pending.filter((item) => mine.some((expense) => expense.id === item.expenseId)).reduce((sum, item) => sum + item.amount, 0);
      return { ...supplier, expenses: mine.length, perMonth: round(fixedMonthly + variable / MONTHS_IN_WINDOW), lastDate: last, pending: round(owed) };
    })
    .sort((a, b) => b.perMonth - a.perMonth || a.name.localeCompare(b.name, "es"));
}

function canUse(request: Request): Response | { manager: boolean; owner: string | null } {
  const session = sessionOf(request);
  if (!session) return unauthorized();
  if (isManager(session)) return { manager: true, owner: null };
  if (session.teamRole === "barbero-renta") return { manager: false, owner: session.memberId };
  return forbidden("Los proveedores los ven quienes registran gastos.");
}

function parse(input: Record<string, unknown>): Omit<MockSupplier, "id" | "createdAt"> | Response {
  const name = text(input.name, MAX_NAME);
  if (name.length < 2) return error(422, "validation", "Escribe el nombre del proveedor.", { fields: { name: ["Escribe el nombre del proveedor."] } });
  const email = text(input.email);
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return error(422, "validation", "Ese correo no es válido.", { fields: { email: ["Ese correo no es válido."] } });
  return { name, taxId: text(input.taxId, 30), phone: text(input.phone, 30), email, categoryId: text(input.categoryId, 40) || null, notes: text(input.notes, 300) };
}

export const supplierHandlers = [
  http.get(`${BASE}/expenses/suppliers`, async ({ request }) => {
    await delay(LATENCY_MS);
    const who = canUse(request);
    if (who instanceof Response) return who;
    const params = new URL(request.url).searchParams;
    const owner = who.manager ? params.get("ownerMemberId") || null : who.owner;
    return HttpResponse.json({ items: suppliersWithStats(params.get("branchId") ?? "ma", owner) });
  }),

  http.post(`${BASE}/expenses/suppliers`, async ({ request }) => {
    await delay(LATENCY_MS);
    const who = canUse(request);
    if (who instanceof Response) return who;
    const values = parse(asRecord(await request.json().catch(() => ({}))));
    if (values instanceof Response) return values;
    if (db.suppliers.some((item) => sameName(item.name, values.name))) return error(409, "conflict", "Ya hay un proveedor con ese nombre.", { fields: { name: ["Ya hay un proveedor con ese nombre."] } });
    const supplier: MockSupplier = { ...values, id: `sup_${Date.now().toString(36)}`, createdAt: new Date().toISOString() };
    db.suppliers = [...db.suppliers, supplier];
    db.persist();
    return HttpResponse.json(supplier, { status: 201 });
  }),

  // Cambiar sus datos; si cambia el nombre, sus gastos lo llevan.
  http.patch(`${BASE}/expenses/suppliers/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const who = canUse(request);
    if (who instanceof Response) return who;
    const current = db.suppliers.find((item) => item.id === params.id);
    if (!current) return error(404, "not_found", "Ese proveedor no existe.");
    const values = parse({ ...current, ...asRecord(await request.json().catch(() => ({}))) });
    if (values instanceof Response) return values;
    if (db.suppliers.some((item) => item.id !== current.id && sameName(item.name, values.name))) return error(409, "conflict", "Ya hay un proveedor con ese nombre.", { fields: { name: ["Ya hay un proveedor con ese nombre."] } });
    const updated = { ...current, ...values };
    db.suppliers = db.suppliers.map((item) => (item.id === current.id ? updated : item));
    db.expenses = db.expenses.map((item) => (supplierIdOf(item) === current.id || (item.supplierId == null && sameName(item.supplier, current.name)) ? { ...item, supplierId: current.id, supplier: updated.name } : item));
    db.persist();
    return HttpResponse.json(updated);
  }),

  http.delete(`${BASE}/expenses/suppliers/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("Los proveedores los borra el dueño o el administrador.");
    const current = db.suppliers.find((item) => item.id === params.id);
    if (!current) return error(404, "not_found", "Ese proveedor no existe.");
    // Sus gastos se quedan con el nombre: lo que se pagó no se borra.
    db.expenses = db.expenses.map((item) => (item.supplierId === current.id ? { ...item, supplierId: null } : item));
    db.suppliers = db.suppliers.filter((item) => item.id !== current.id);
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),
];
