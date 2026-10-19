import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { ACCOUNTS, db } from "../db";
import { forbidden, isBarber, isManager, sessionOf } from "../session";
import { EXPENSE_CATEGORY_IDS, EXPENSE_PAYMENT_METHODS, expenseDate, type MockExpense, type MockExpenseAttachment, type MockExpenseFrequency } from "./seed";

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
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ATTACHMENTS = 3;
/* Un data URL de ~1 MB de archivo pesa ~1,37 MB en texto. */
const MAX_ATTACHMENT_CHARS = 1_400_000;
const ATTACHMENT_TYPE = /^data:(image\/(png|jpeg|webp|heic)|application\/pdf);base64,/;
const MAX_SUPPLIER = 80;

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

const today = (): string => new Date().toISOString().slice(0, 10);

/** Los comprobantes válidos: hasta 3 fotos o PDF de ~1 MB; `null` si alguno no lo es. */
function attachmentsOf(value: unknown): MockExpenseAttachment[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_ATTACHMENTS) return null;
  const items = value.map((raw) => asRecord(raw as DefaultBodyType));
  if (items.some((item) => typeof item.dataUrl !== "string" || item.dataUrl.length > MAX_ATTACHMENT_CHARS || !ATTACHMENT_TYPE.test(item.dataUrl))) return null;
  return items.map((item, index) => ({ id: text(item.id) || `att_${Date.now().toString(36)}_${index}`, name: text(item.name).slice(0, 120) || `comprobante-${index + 1}`, type: String(item.dataUrl).slice(5, String(item.dataUrl).indexOf(";")), dataUrl: String(item.dataUrl) }));
}

function validate(input: Record<string, unknown>) {
  const fields: Record<string, string[]> = {};
  const kind = input.kind === "variable" ? ("variable" as const) : ("fixed" as const);
  const name = text(input.name);
  const amount = typeof input.amount === "number" && Number.isFinite(input.amount) ? input.amount : null;
  const frequency = FREQUENCIES.find((item) => item === input.frequency) ?? null;
  const date = text(input.date) || today();
  const categoryId = EXPENSE_CATEGORY_IDS.find((item) => item === input.categoryId) ?? "other";
  const paymentMethod = EXPENSE_PAYMENT_METHODS.find((item) => item === input.paymentMethod) ?? null;
  const attachments = attachmentsOf(input.attachments);
  if (name.length < 2) fields.name = ["Escribe el nombre del gasto."];
  if (amount === null || amount <= 0) fields.amount = ["Escribe un valor mayor que cero."];
  if (kind === "fixed" && frequency === null) fields.frequency = ["Elige cada cuánto se paga."];
  if (!DAY_KEY.test(date)) fields.date = ["Elige la fecha."];
  else if (kind === "variable" && date > today()) fields.date = ["Un gasto variable no puede ser de una fecha futura."];
  if (attachments === null) fields.attachments = ["Hasta 3 fotos o PDF de 1 MB cada uno."];
  return {
    fields,
    values: { kind, name, amount: amount ?? 0, frequency: kind === "fixed" ? frequency : null, description: text(input.description), date, categoryId, paymentMethod, supplier: text(input.supplier).slice(0, MAX_SUPPLIER), attachments: attachments ?? [] },
  };
}

/** Lo que devuelve la API: con fecha y categoría aunque el gasto se guardara antes de esos campos. */
const view = (item: MockExpense): MockExpense => ({ ...item, ownerMemberId: item.ownerMemberId ?? null, date: expenseDate(item), endDate: item.endDate ?? null, categoryId: item.categoryId ?? "other", paymentMethod: item.paymentMethod ?? null, supplier: item.supplier ?? "", attachments: item.attachments ?? [], createdBy: item.createdBy ?? null });

export const expensesHandlers = [
  http.get(`${BASE}/expenses`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const params = new URL(request.url).searchParams;
    const branchId = params.get("branchId") ?? "ma";
    // El barbero de renta ve solo sus gastos; el de comisión no tiene gastos que ver.
    const session = sessionOf(request);
    if (session?.teamRole === "barbero-comision") return forbidden("Los gastos son de la barbería.");
    const owner = session?.teamRole === "barbero-renta" ? session.memberId : params.get("ownerMemberId") || null;
    const items = db.expenses
      .map(view)
      .filter((item) => item.branchId === branchId && item.ownerMemberId === owner)
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || b.createdAt.localeCompare(a.createdAt));
    return HttpResponse.json({ items });
  }),

  http.post(`${BASE}/expenses`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const { fields, values } = validate(input);
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const session = sessionOf(request)!;
    if (!isManager(session) && session.teamRole !== "barbero-renta") return forbidden("Los gastos los registran el dueño, el administrador o el barbero de renta (los suyos).");
    const ownerMemberId = session.teamRole === "barbero-renta" ? session.memberId : text(input.ownerMemberId) || null;
    const expense: MockExpense = { ...values, id: `exp_${Date.now().toString(36)}`, branchId: text(input.branchId) || "ma", ownerMemberId, createdAt: new Date().toISOString(), endDate: null, createdBy: account.user.name };
    db.expenses = [expense, ...db.expenses];
    db.persist();
    return HttpResponse.json(view(expense), { status: 201 });
  }),

  http.patch(`${BASE}/expenses/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const expense = findExpense(params.id);
    if (!expense) return error(404, "not_found", "Ese gasto no existe.");
    const session = sessionOf(request)!;
    if (!isManager(session) && !(isBarber(session) && expense.ownerMemberId === session.memberId)) return forbidden("Ese gasto no es tuyo.");
    /* Un gasto no cambia de tipo: fijo y variable se cuentan distinto. */
    const { fields, values } = validate({ ...asRecord(await request.json().catch(() => ({}))), kind: expense.kind });
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const updated: MockExpense = { ...expense, ownerMemberId: expense.ownerMemberId ?? null, ...values };
    db.expenses = db.expenses.map((item) => (item.id === updated.id ? updated : item));
    db.persist();
    return HttpResponse.json(view(updated));
  }),

  /* Un fijo que se deja de pagar se termina, no se borra: los meses pasados lo siguen contando. */
  http.post(`${BASE}/expenses/:id/end`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const expense = findExpense(params.id);
    if (!expense) return error(404, "not_found", "Ese gasto no existe.");
    const session = sessionOf(request)!;
    if (!isManager(session) && !(isBarber(session) && expense.ownerMemberId === session.memberId)) return forbidden("Ese gasto no es tuyo.");
    if (expense.kind !== "fixed") return error(409, "conflict", "Solo un gasto fijo se termina.");
    const input = asRecord(await request.json().catch(() => ({})));
    const endDate = input.endDate === null ? null : text(input.endDate) || today();
    if (endDate !== null && (!DAY_KEY.test(endDate) || endDate < expenseDate(expense))) return error(422, "validation", "La fecha de fin no puede ser antes del inicio.", { fields: { endDate: ["La fecha de fin no puede ser antes del inicio."] } });
    const updated: MockExpense = { ...expense, endDate };
    db.expenses = db.expenses.map((item) => (item.id === updated.id ? updated : item));
    db.persist();
    return HttpResponse.json(view(updated));
  }),

  http.delete(`${BASE}/expenses/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const expense = findExpense(params.id);
    if (!expense) return error(404, "not_found", "Ese gasto no existe.");
    const session = sessionOf(request)!;
    if (!isManager(session) && !(isBarber(session) && expense.ownerMemberId === session.memberId)) return forbidden("Ese gasto no es tuyo.");
    db.expenses = db.expenses.filter((item) => item.id !== expense.id);
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),
];
