import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { accountById, db } from "../db";
import { imageOrNull } from "../media";
import { UNCATEGORIZED_PRODUCT_ID, type MockCatalogProduct, type MockProductCategory } from "./seed";
import { withBranchPrice } from "../catalogPrices";

/**
 * Los endpoints del catálogo de productos del backend simulado. Reproducen
 * docs/API_CONTRACT.md (sección «Productos»): el catálogo de una sucursal
 * con sus categorías, la ficha, el alta y la edición, la activación por
 * sucursal y las categorías.
 */

const BASE = "*/api";
const LATENCY_MS = 200;

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
const textOrNull = (value: unknown): string | null => text(value) || null;
const numberOrNull = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);
const branchOf = (request: Request) => new URL(request.url).searchParams.get("branchId") ?? "ma";

const findProduct = (id: string | readonly string[] | undefined) => db.products.items.find((item) => item.id === id);
const findCategory = (id: string | readonly string[] | undefined) => db.products.categories.find((item) => item.id === id);

function view(product: MockCatalogProduct, branchId: string) {
  const { activeBranchIds, branchPrices, ...rest } = product;
  return { ...rest, branchPrice: branchPrices?.[branchId] ?? null, active: activeBranchIds.includes(branchId) };
}

const catalog = (branchId: string) => ({ categories: db.products.categories, items: db.products.items.map((item) => view(item, branchId)) });

function validateProduct(input: Record<string, unknown>, currentId: string | null) {
  const fields: Record<string, string[]> = {};
  const name = text(input.name);
  const price = numberOrNull(input.price);
  const cost = numberOrNull(input.cost);
  const taxRate = numberOrNull(input.taxRate);
  const categoryId = text(input.categoryId);
  const sku = textOrNull(input.sku);

  if (name.length < 2) fields.name = ["Escribe el nombre."];
  else if (db.products.items.some((item) => item.id !== currentId && item.name.toLowerCase() === name.toLowerCase())) fields.name = ["Ya hay un producto con ese nombre."];
  if (price === null || price < 0) fields.price = ["Escribe el precio de venta."];
  const branchPrice = numberOrNull(input.branchPrice);
  if (branchPrice !== null && branchPrice < 0) fields.branchPrice = ["El precio no puede ser negativo."];
  if (cost !== null && cost < 0) fields.cost = ["El precio de compra no puede ser negativo."];
  if (taxRate !== null && (taxRate < 0 || taxRate > 100)) fields.taxRate = ["El impuesto va de 0 a 100 %."];
  if (!findCategory(categoryId)) fields.categoryId = ["Elige una categoría."];
  if (typeof input.imageUrl === "string" && input.imageUrl.trim() !== "" && imageOrNull(input.imageUrl) === null) fields.imageUrl = ["La foto no es válida o pesa más de 1 MB."];
  if (sku !== null && db.products.items.some((item) => item.id !== currentId && item.sku?.toLowerCase() === sku.toLowerCase())) fields.sku = ["Ese SKU ya lo tiene otro producto."];

  return {
    fields,
    values: {
      name,
      description: text(input.description),
      categoryId,
      price: price ?? 0,
      cost,
      taxRate,
      sku,
      brand: textOrNull(input.brand),
      distributor: textOrNull(input.distributor),
      visibility: input.visibility === "private" ? ("private" as const) : ("public" as const),
      sellable: input.sellable !== false,
      imageUrl: imageOrNull(input.imageUrl),
    } satisfies Omit<MockCatalogProduct, "id" | "activeBranchIds" | "createdAt">,
  };
}

function validateCategory(input: Record<string, unknown>, currentId: string | null) {
  const fields: Record<string, string[]> = {};
  const name = text(input.name);
  if (name.length < 2) fields.name = ["Escribe el nombre de la categoría."];
  else if (db.products.categories.some((item) => item.id !== currentId && item.name.toLowerCase() === name.toLowerCase())) fields.name = ["Ya hay una categoría con ese nombre."];
  return { fields, values: { name, description: text(input.description) } };
}

export const productsHandlers = [
  http.get(`${BASE}/products`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    return HttpResponse.json(catalog(branchOf(request)));
  }),

  /* Va antes que `:id`: si no, «activation» se leería como un id. */
  http.put(`${BASE}/products/activation`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = text(input.branchId) || "ma";
    const ids = new Set(Array.isArray(input.productIds) ? input.productIds.filter((id): id is string => typeof id === "string") : []);
    const active = input.active === true;
    db.products = {
      ...db.products,
      items: db.products.items.map((item) => (ids.has(item.id) ? { ...item, activeBranchIds: active ? [...new Set([...item.activeBranchIds, branchId])] : item.activeBranchIds.filter((id) => id !== branchId) } : item)),
    };
    db.persist();
    return HttpResponse.json(catalog(branchId));
  }),

  http.get(`${BASE}/products/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const product = findProduct(params.id);
    if (!product) return error(404, "not_found", "Ese producto no existe.");
    return HttpResponse.json(view(product, branchOf(request)));
  }),

  http.post(`${BASE}/products`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const { fields, values } = validateProduct(input, null);
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const branchId = text(input.branchId) || "ma";
    const product: MockCatalogProduct = { ...values, branchPrices: withBranchPrice(undefined, branchId, input.branchPrice), id: `prd_${Date.now().toString(36)}`, activeBranchIds: [branchId], createdAt: new Date().toISOString() };
    db.products = { ...db.products, items: [...db.products.items, product] };
    db.persist();
    return HttpResponse.json(view(product, branchId), { status: 201 });
  }),

  http.patch(`${BASE}/products/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const product = findProduct(params.id);
    if (!product) return error(404, "not_found", "Ese producto no existe.");
    const input = asRecord(await request.json().catch(() => ({})));
    const { fields, values } = validateProduct(input, product.id);
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    // El precio propio de la sucursal desde la que se edita; las demás quedan como estaban.
    const updated: MockCatalogProduct = { ...product, ...values, branchPrices: withBranchPrice(product.branchPrices, branchOf(request), input.branchPrice) };
    db.products = { ...db.products, items: db.products.items.map((item) => (item.id === updated.id ? updated : item)) };
    db.persist();
    return HttpResponse.json(view(updated, branchOf(request)));
  }),

  http.delete(`${BASE}/products/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const product = findProduct(params.id);
    if (!product) return error(404, "not_found", "Ese producto no existe.");
    if (db.calendar.appointments.some((item) => item.products.some((row) => row.productId === product.id) && (item.status === "scheduled" || item.status === "arrived" || item.status === "seated"))) {
      return error(409, "conflict", "Está en una cita por cobrar. Desactívalo para que no se venda más y bórralo cuando se cobre.");
    }
    db.products = { ...db.products, items: db.products.items.filter((item) => item.id !== product.id) };
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${BASE}/product-categories`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const { fields, values } = validateCategory(asRecord(await request.json().catch(() => ({}))), null);
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const category: MockProductCategory = { ...values, id: `pcat_${Date.now().toString(36)}` };
    /* «Sin categoría» se queda siempre al final. */
    const rest = db.products.categories.filter((item) => item.id !== UNCATEGORIZED_PRODUCT_ID);
    const none = db.products.categories.filter((item) => item.id === UNCATEGORIZED_PRODUCT_ID);
    db.products = { ...db.products, categories: [...rest, category, ...none] };
    db.persist();
    return HttpResponse.json(category, { status: 201 });
  }),

  http.patch(`${BASE}/product-categories/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const category = findCategory(params.id);
    if (!category) return error(404, "not_found", "Esa categoría no existe.");
    const { fields, values } = validateCategory(asRecord(await request.json().catch(() => ({}))), category.id);
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const updated: MockProductCategory = { ...category, ...values };
    db.products = { ...db.products, categories: db.products.categories.map((item) => (item.id === updated.id ? updated : item)) };
    db.persist();
    return HttpResponse.json(updated);
  }),

  http.delete(`${BASE}/product-categories/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const category = findCategory(params.id);
    if (!category) return error(404, "not_found", "Esa categoría no existe.");
    if (category.id === UNCATEGORIZED_PRODUCT_ID) return error(409, "conflict", "«Sin categoría» no se puede borrar: ahí caen los productos que se quedan sin la suya.");
    db.products = {
      categories: db.products.categories.filter((item) => item.id !== category.id),
      items: db.products.items.map((item) => (item.categoryId === category.id ? { ...item, categoryId: UNCATEGORIZED_PRODUCT_ID } : item)),
    };
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),
];
