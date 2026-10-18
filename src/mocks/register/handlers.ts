import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { ACCOUNTS, db } from "../db";
import { appointmentsOn } from "../calendar/handlers";
import { dateKey } from "../calendar/seed";
import type { MockRegisterClosure } from "./state";

/**
 * El cierre de caja de una sucursal y un día. Reproduce docs/API_CONTRACT.md (sección «Caja»).
 *
 * Lo esperado sale de las cuentas del día: en efectivo, lo cobrado en caja (la parte en efectivo
 * de un pago mixto incluida) y las ventas de mostrador, menos lo devuelto en efectivo. Tarjeta y
 * enlace se informan para cuadrar con el datáfono; lo pagado en línea no pasa por la caja.
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
  return ACCOUNTS.find((item) => item.id === accountId) ?? null;
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
}

/** Lo que debió moverse en la caja ese día, por medio de pago. */
export function expectedOf(branchId: string, date: string): RegisterExpected {
  const totals = { cash: 0, card: 0, link: 0, online: 0, refundsCash: 0, refundsCard: 0, accounts: 0 };
  for (const item of appointmentsOn(branchId, date)) {
    const payment = item.payment;
    if (item.status === "paid" && payment && dateKey(new Date(payment.paidAt)) === date) {
      // En caja entró lo cobrado menos lo que ya estaba pagado en línea.
      const atCounter = round(payment.total - (payment.prepaid ?? 0));
      totals.online += payment.prepaid ?? 0;
      totals.accounts += 1;
      if (payment.method === "mixed" && payment.split) {
        totals.cash += payment.split.cash;
        totals.card += payment.split.card;
      } else if (payment.method === "cash") totals.cash += atCounter;
      else if (payment.method === "link") totals.link += atCounter;
      else totals.card += atCounter;
    }
    for (const refund of item.refunds ?? []) {
      if (dateKey(new Date(refund.at)) !== date) continue;
      if (refund.to === "cash") totals.refundsCash += refund.amount;
      else if (refund.to === "card") totals.refundsCard += refund.amount;
    }
  }
  for (const sale of db.calendar.sales.filter((item) => item.branchId === branchId && dateKey(new Date(item.paidAt)) === date)) {
    totals.accounts += 1;
    if (sale.method === "cash") totals.cash += sale.total;
    else if (sale.method === "link") totals.link += sale.total;
    else totals.card += sale.total;
  }
  return {
    cash: round(totals.cash - totals.refundsCash),
    card: round(totals.card - totals.refundsCard),
    link: round(totals.link),
    online: round(totals.online),
    refundsCash: round(totals.refundsCash),
    refundsCard: round(totals.refundsCard),
    accounts: totals.accounts,
  };
}

const closureOf = (branchId: string, date: string): MockRegisterClosure | undefined => (db.register?.closures ?? []).find((item) => item.branchId === branchId && item.date === date);

export const registerHandlers = [
  http.get(`${BASE}/register`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const params = new URL(request.url).searchParams;
    const branchId = params.get("branchId") ?? "";
    const date = params.get("date") ?? "";
    if (!branchId || !DAY_KEY.test(date)) return error(422, "validation", "Falta la sucursal o la fecha no es válida.");
    return HttpResponse.json({ branchId, date, expected: expectedOf(branchId, date), closure: closureOf(branchId, date) ?? null });
  }),

  http.post(`${BASE}/register/close`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = text(input.branchId);
    const date = text(input.date);
    const opening = Number(input.opening);
    const counted = Number(input.counted);
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
    // Una diferencia se explica: sin nota no se cierra con faltante ni sobrante.
    if (difference !== 0 && note.length < 3) return error(422, "validation", "Explica la diferencia antes de cerrar.", { fields: { note: ["Explica por qué sobra o falta."] } });
    const closure: MockRegisterClosure = { id: `reg_${Date.now().toString(36)}`, branchId, date, opening: round(opening), expectedCash, counted: round(counted), difference, note, closedAt: new Date().toISOString(), closedBy: account.user.name };
    db.register = { closures: [...(db.register?.closures ?? []), closure] };
    db.persist();
    return HttpResponse.json(closure, { status: 201 });
  }),
];
