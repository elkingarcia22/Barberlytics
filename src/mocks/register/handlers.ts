import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { accountById, db } from "../db";
import { forbidden, isBarber, isManager, sessionOf } from "../session";
import { countTotal } from "@/features/transactions/denominations";
import { cycleWindow } from "../payroll/compute";
import { appointmentsOn } from "../calendar/handlers";
import { dateKey } from "../calendar/seed";
import type { MockCashMovement, MockRegisterClosure } from "./state";

/**
 * El cierre de caja de una sucursal y un día. Reproduce docs/API_CONTRACT.md (sección «Caja»).
 *
 * Lo esperado sale de las cuentas del día: en efectivo, lo cobrado en caja (la parte en efectivo
 * de un pago mixto incluida) y las ventas de mostrador, menos lo devuelto en efectivo. Tarjeta y
 * enlace se informan para cuadrar con el datáfono; lo pagado en línea no pasa por la caja.
 *
 * El efectivo que cobra un barbero de renta es suyo y no entra al cajón (la misma regla que usa la
 * nómina: `collectedBy: "barber"`). Se informa aparte, en `renterCash`, para que nadie lo busque.
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NOTE = 300;

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

export interface RegisterExpected {
  cash: number;
  card: number;
  link: number;
  /** Lo pagado al reservar en línea de las citas cobradas hoy: no pasa por la caja. */
  online: number;
  /** Lo devuelto hoy: en efectivo sale de la caja; a tarjeta, del datáfono. */
  refundsCash: number;
  refundsCard: number;
  /** Cuentas cobradas en el día (citas y ventas). */
  accounts: number;
  /** El efectivo que cobraron los barberos de renta: es de ellos y no entra al cajón. */
  renterCash: number;
  /** Entradas y salidas de efectivo del día que no son cobros (ya sumadas o restadas en `cash`). */
  movementsIn: number;
  movementsOut: number;
}

const isRenter = (barberId: string): boolean => db.team.members.find((member) => member.id === barberId)?.role === "barbero-renta";

/** Lo que debió moverse en la caja ese día, por medio de pago. */
export function expectedOf(branchId: string, date: string): RegisterExpected {
  const totals = { cash: 0, card: 0, link: 0, online: 0, refundsCash: 0, refundsCard: 0, accounts: 0, renterCash: 0 };
  for (const item of appointmentsOn(branchId, date)) {
    const payment = item.payment;
    if (item.status === "paid" && payment && dateKey(new Date(payment.paidAt)) === date) {
      // En caja entró lo cobrado menos lo que ya estaba pagado en línea.
      const atCounter = round(payment.total - (payment.prepaid ?? 0));
      totals.online += payment.prepaid ?? 0;
      totals.accounts += 1;
      const renter = isRenter(item.barberId);
      if (payment.method === "mixed" && payment.split) {
        if (renter) totals.renterCash += payment.split.cash;
        else totals.cash += payment.split.cash;
        totals.card += payment.split.card;
      } else if (payment.method === "cash") {
        if (renter) totals.renterCash += atCounter;
        else totals.cash += atCounter;
      }
      else if (payment.method === "link") totals.link += atCounter;
      else totals.card += atCounter;
    }
    for (const refund of item.refunds ?? []) {
      if (dateKey(new Date(refund.at)) !== date) continue;
      if (refund.to === "cash") totals.refundsCash += refund.amount;
      else if (refund.to === "card") totals.refundsCard += refund.amount;
    }
  }
  const movements = movementsOf(branchId, date);
  const movementsIn = round(movements.filter((item) => item.type === "in").reduce((sum, item) => sum + item.amount, 0));
  const movementsOut = round(movements.filter((item) => item.type === "out").reduce((sum, item) => sum + item.amount, 0));
  for (const sale of db.calendar.sales.filter((item) => item.branchId === branchId && dateKey(new Date(item.paidAt)) === date)) {
    totals.accounts += 1;
    if (sale.method === "cash") totals.cash += sale.total;
    else if (sale.method === "link") totals.link += sale.total;
    else totals.card += sale.total;
  }
  return {
    cash: round(totals.cash - totals.refundsCash + movementsIn - movementsOut),
    card: round(totals.card - totals.refundsCard),
    link: round(totals.link),
    online: round(totals.online),
    refundsCash: round(totals.refundsCash),
    refundsCard: round(totals.refundsCard),
    accounts: totals.accounts,
    renterCash: round(totals.renterCash),
    movementsIn,
    movementsOut,
  };
}

const movementsOf = (branchId: string, date: string): MockCashMovement[] => (db.register?.movements ?? []).filter((item) => item.branchId === branchId && item.date === date);

const closureOf = (branchId: string, date: string): MockRegisterClosure | undefined => (db.register?.closures ?? []).find((item) => item.branchId === branchId && item.date === date);

export const registerHandlers = [
  // Cargar el faltante de un cierre a la nómina de quien cerró o de quien responda: un ajuste «faltante de caja» en su ciclo.
  http.post(`${BASE}/register/:id/shortage`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!isManager(sessionOf(request)!)) return forbidden("El faltante lo carga el dueño o el administrador.");
    const closure = (db.register?.closures ?? []).find((item) => item.id === params.id);
    if (!closure) return error(404, "not_found", "Ese cierre no existe.");
    if (closure.difference >= 0) return error(409, "conflict", "Ese cierre no tiene faltante.");
    if (closure.shortage) return error(409, "conflict", "Ese faltante ya se cargó.");
    const memberId = text(asRecord(await request.json().catch(() => ({}))).memberId);
    if (!db.team.members.some((member) => member.id === memberId)) return error(422, "validation", "Elige a quién se le descuenta.", { fields: { memberId: ["Elige a quién se le descuenta."] } });
    const window = cycleWindow(new Date(`${closure.date}T00:00:00`));
    const from = dateKey(window.from);
    const to = dateKey(window.to);
    if (db.payroll.runs.some((run) => run.branchId === closure.branchId && run.from === from && run.to === to)) return error(409, "conflict", "La nómina de ese ciclo ya está aprobada: reábrela para cargar el faltante.");
    const adjustment = { id: `adj_${Date.now().toString(36)}`, branchId: closure.branchId, from, to, memberId, kind: "shortage" as const, amount: round(-closure.difference), note: `Faltante de caja del ${closure.date}`, createdAt: new Date().toISOString(), createdBy: account.user.name, closureId: closure.id };
    const updated: MockRegisterClosure = { ...closure, shortage: { memberId, adjustmentId: adjustment.id, by: account.user.name, at: adjustment.createdAt } };
    db.payroll = { ...db.payroll, adjustments: [...db.payroll.adjustments, adjustment] };
    db.register = { closures: (db.register?.closures ?? []).map((item) => (item.id === closure.id ? updated : item)), movements: db.register?.movements ?? [] };
    db.persist();
    return HttpResponse.json(updated);
  }),

  http.get(`${BASE}/register`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const params = new URL(request.url).searchParams;
    const branchId = params.get("branchId") ?? "";
    const date = params.get("date") ?? "";
    if (!branchId || !DAY_KEY.test(date)) return error(422, "validation", "Falta la sucursal o la fecha no es válida.");
    const closure = closureOf(branchId, date) ?? null;
    const expected = expectedOf(branchId, date);
    // A ciegas: quien cuenta sin gestionar (recepción) no ve el efectivo esperado hasta cerrar.
    const blind = !closure && !isManager(sessionOf(request)!);
    return HttpResponse.json({ branchId, date, blind, expected: blind ? { ...expected, cash: null } : expected, closure, movements: movementsOf(branchId, date) });
  }),

  // Una entrada o salida de efectivo del cajón que no es un cobro: queda con quién y por qué, y mueve lo esperado.
  http.post(`${BASE}/register/movements`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    if (isBarber(sessionOf(request)!)) return forbidden("El cajón lo mueven recepción, el administrador o el dueño.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = text(input.branchId);
    const date = text(input.date);
    const type = input.type === "in" || input.type === "out" ? input.type : null;
    const amount = Number(input.amount);
    const reason = text(input.reason).slice(0, MAX_NOTE);
    const fields: Record<string, string[]> = {};
    if (!branchId || !DAY_KEY.test(date)) fields.date = ["Falta la sucursal o la fecha no es válida."];
    if (!type) fields.type = ["Elige si entra o sale."];
    if (!Number.isFinite(amount) || amount <= 0) fields.amount = ["Escribe cuánto."];
    if (reason.length < 3) fields.reason = ["Di por qué."];
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    if (closureOf(branchId, date)) return error(409, "conflict", "La caja de ese día ya está cerrada.");
    const movement: MockCashMovement = { id: `mov_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, branchId, date, type: type!, amount: round(amount), reason, at: new Date().toISOString(), by: account.user.name };
    db.register = { closures: db.register?.closures ?? [], movements: [...(db.register?.movements ?? []), movement] };
    db.persist();
    return HttpResponse.json(movement, { status: 201 });
  }),

  http.post(`${BASE}/register/close`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    if (isBarber(sessionOf(request)!)) return forbidden("La caja la cierran recepción, el administrador o el dueño.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = text(input.branchId);
    const date = text(input.date);
    const opening = Number(input.opening);
    // Contado por denominación: el servidor vuelve a sumar (no se confía en el total que manda la pantalla).
    const denominations = input.denominations && typeof input.denominations === "object" ? Object.fromEntries(Object.entries(input.denominations as Record<string, unknown>).filter(([value, count]) => Number(value) > 0 && Number.isInteger(count) && (count as number) >= 0).map(([value, count]) => [value, count as number])) : null;
    const counted = denominations ? countTotal(denominations) : Number(input.counted);
    const fields: Record<string, string[]> = {};
    if (!branchId) fields.branchId = ["Falta la sucursal."];
    if (!DAY_KEY.test(date)) fields.date = ["La fecha no es válida."];
    if (!Number.isFinite(opening) || opening < 0) fields.opening = ["Escribe con cuánto abrió la caja (0 si abrió vacía)."];
    if (!Number.isFinite(counted) || counted < 0) fields.counted = ["Escribe el efectivo que contaste."];
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    if (closureOf(branchId, date)) return error(409, "conflict", "La caja de ese día ya está cerrada.");
    const expectedCash = expectedOf(branchId, date).cash;
    const difference = round(counted - (opening + expectedCash));
    const note = text(input.note).slice(0, MAX_NOTE);
    // Quien ve lo esperado explica la diferencia antes de cerrar; quien cuenta a ciegas no la conoce: la revisa gerencia.
    const blind = !isManager(sessionOf(request)!);
    if (!blind && difference !== 0 && note.length < 3) return error(422, "validation", "Explica la diferencia antes de cerrar.", { fields: { note: ["Explica por qué sobra o falta."] } });
    const closure: MockRegisterClosure = { id: `reg_${Date.now().toString(36)}`, branchId, date, opening: round(opening), expectedCash, counted: round(counted), difference, note, closedAt: new Date().toISOString(), closedBy: account.user.name, denominations, blind };
    db.register = { closures: [...(db.register?.closures ?? []), closure], movements: db.register?.movements ?? [] };
    db.persist();
    return HttpResponse.json(closure, { status: 201 });
  }),
];
