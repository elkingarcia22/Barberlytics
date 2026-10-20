import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { accountById, db } from "../db";
import { moveStock, setMin, soldByProduct, stockLevel, stockStatus } from "./stock";

/**
 * Los endpoints del inventario ligero (docs/API_CONTRACT.md, «Inventario»): existencias por sucursal
 * con su estado, entradas, conteos, mermas y uso interno con motivo, el mínimo y el historial.
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const PACE_DAYS = 30;
const MAX_QTY = 10_000;
const MAX_MIN = 1_000;
const MAX_NOTE = 200;
const MOVEMENTS_SHOWN = 50;
const MANUAL = ["receive", "count", "waste", "internal"] as const;
type ManualKind = (typeof MANUAL)[number];

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

/** Lo que se lleva en inventario: los productos activos en la sucursal que se venden. */
const stockedIn = (branchId: string) => db.products.items.filter((item) => item.sellable && item.activeBranchIds.includes(branchId));

function itemOf(branchId: string, productId: string, sold30: Readonly<Record<string, number>> = soldByProduct(branchId, PACE_DAYS)) {
  const product = db.products.items.find((item) => item.id === productId);
  const level = stockLevel(branchId, productId);
  const sold = sold30[productId] ?? 0;
  const perDay = sold / PACE_DAYS;
  const last = db.inventory.movements.find((item) => item.branchId === branchId && item.productId === productId);
  return {
    productId,
    name: product?.name ?? productId,
    sku: product?.sku ?? null,
    categoryId: product?.categoryId ?? null,
    imageUrl: product?.imageUrl ?? null,
    onHand: level.onHand,
    min: level.min,
    status: stockStatus(level),
    sold30: sold,
    /** Para cuántos días alcanza al ritmo de los últimos 30; `null` sin ventas. */
    daysLeft: perDay > 0 ? Math.max(0, Math.floor(level.onHand / perDay)) : null,
    lastMovementAt: last?.at ?? null,
  };
}

export const inventoryHandlers = [
  http.get(`${BASE}/inventory`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const branchId = new URL(request.url).searchParams.get("branchId") ?? "";
    if (!branchId) return error(422, "validation", "Falta la sucursal.");
    const sold = soldByProduct(branchId, PACE_DAYS);
    const items = stockedIn(branchId)
      .map((product) => itemOf(branchId, product.id, sold))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
    return HttpResponse.json({
      items,
      low: items.filter((item) => item.status !== "ok").length,
    });
  }),

  /** Entrada (llegó mercancía), conteo (hay tantas), merma o uso interno: siempre queda en el historial. */
  http.post(`${BASE}/inventory/movements`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = text(input.branchId);
    const productId = text(input.productId);
    const kind = text(input.kind) as ManualKind;
    const qty = Number(input.qty);
    const note = text(input.note).slice(0, MAX_NOTE);
    const fields: Record<string, string[]> = {};
    if (!branchId || !stockedIn(branchId).some((item) => item.id === productId)) fields.productId = ["Ese producto no se vende en esta sucursal."];
    if (!MANUAL.includes(kind)) fields.kind = ["Elige qué pasó."];
    if (!Number.isInteger(qty) || qty < (kind === "count" ? 0 : 1) || qty > MAX_QTY) fields.qty = [kind === "count" ? "Escribe cuántas hay (0 o más)." : "Escribe cuántas unidades (1 o más)."];
    if ((kind === "waste" || kind === "internal") && note.length < 3) fields.note = ["Di por qué salen."];
    if (Object.keys(fields).length > 0)
      return error(422, "validation", "Revisa los campos marcados.", {
        fields,
      });
    const current = stockLevel(branchId, productId).onHand;
    const delta = kind === "count" ? qty - current : kind === "receive" ? qty : -qty;
    moveStock({
      branchId,
      productId,
      delta,
      reason: kind,
      note,
      by: account.user.name,
    });
    db.persist();
    return HttpResponse.json(itemOf(branchId, productId), { status: 201 });
  }),

  http.patch(`${BASE}/inventory/:productId`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = text(input.branchId);
    const productId = String(params.productId);
    const min = Number(input.min);
    if (!branchId || !stockedIn(branchId).some((item) => item.id === productId)) return error(404, "not_found", "Ese producto no se vende en esta sucursal.");
    if (!Number.isInteger(min) || min < 0 || min > MAX_MIN)
      return error(422, "validation", "El mínimo va de 0 a 1.000.", {
        fields: { min: ["El mínimo va de 0 a 1.000."] },
      });
    setMin(branchId, productId, min);
    db.persist();
    return HttpResponse.json(itemOf(branchId, productId));
  }),

  http.get(`${BASE}/inventory/:productId/movements`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const branchId = new URL(request.url).searchParams.get("branchId") ?? "";
    const items = db.inventory.movements
      .filter((item) => item.branchId === branchId && item.productId === params.productId)
      .slice(0, MOVEMENTS_SHOWN)
      .map(({ id, delta, onHand, reason, ref, note, at, by }) => ({
        id,
        delta,
        onHand,
        reason,
        ref,
        note,
        at,
        by,
      }));
    return HttpResponse.json({ items });
  }),
];
