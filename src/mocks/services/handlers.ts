import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { accountById, db } from "../db";
import { barbersOf, memberName, type MockServiceOverride, type MockTeamMember } from "../team/seed";
import { imageOrNull } from "../media";
import { UNCATEGORIZED_ID, seedResources, type MockCatalogService, type MockServiceCategory, type MockServiceResource } from "./seed";
import { servicePriceIn, withBranchPrice } from "../catalogPrices";

/**
 * Los endpoints del catálogo de servicios del backend simulado. Reproducen
 * docs/API_CONTRACT.md (sección «Servicios»): el catálogo de una sucursal
 * con sus categorías, la ficha de un servicio con quién lo ofrece, el alta
 * y la edición de servicios, combos y categorías, y el orden de la reserva.
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const MAX_DURATION_MIN = 480;

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
const numberOrNull = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);
const branchOf = (request: Request) => new URL(request.url).searchParams.get("branchId") ?? "ma";

const findService = (id: string | readonly string[] | undefined) => db.services.items.find((item) => item.id === id);
/** Los recursos, con solo los servicios que siguen existiendo (borrar un servicio lo saca de su recurso). */
const resources = (): MockServiceResource[] => (db.services.resources ?? seedResources()).map((item) => ({ ...item, serviceIds: item.serviceIds.filter((id) => findService(id)) }));
const MAX_RESOURCE_UNITS = 20;

function validateResource(input: Record<string, unknown>) {
  const fields: Record<string, string[]> = {};
  const name = text(input.name);
  const units = numberOrNull(input.units);
  const serviceIds = Array.isArray(input.serviceIds) ? input.serviceIds.filter((id): id is string => typeof id === "string" && Boolean(findService(id))) : [];
  if (name.length < 2) fields.name = ["Ponle un nombre de al menos dos letras."];
  if (resources().some((item) => item.name.toLowerCase() === name.toLowerCase() && item.id !== input.id)) fields.name = ["Ya hay un recurso con ese nombre."];
  if (units === null || !Number.isInteger(units) || units < 1 || units > MAX_RESOURCE_UNITS) fields.units = [`Entre 1 y ${MAX_RESOURCE_UNITS} unidades.`];
  if (serviceIds.length === 0) fields.serviceIds = ["Elige al menos un servicio que lo use."];
  return { fields, values: { name, description: text(input.description), units: units ?? 1, serviceIds: [...new Set(serviceIds)] } };
}

const findCategory = (id: string | readonly string[] | undefined) => db.services.categories.find((item) => item.id === id);

/** Sin fila propia, un barbero ofrece el servicio con lo del catálogo. */
const overrideOf = (member: MockTeamMember, serviceId: string): MockServiceOverride | undefined => member.services.find((item) => item.serviceId === serviceId);
const offers = (member: MockTeamMember, serviceId: string): boolean => overrideOf(member, serviceId)?.offered ?? true;

function view(service: MockCatalogService, branchId: string) {
  const barbers = barbersOf(db.team.members, db.team.orders, branchId);
  const { activeBranchIds, branchPrices, ...rest } = service;
  return { ...rest, branchPrice: branchPrices?.[branchId] ?? null, active: activeBranchIds.includes(branchId), offeredBy: barbers.filter((member) => offers(member, service.id)).length, teamSize: barbers.length };
}

function detail(service: MockCatalogService, branchId: string) {
  const barbers = barbersOf(db.team.members, db.team.orders, branchId);
  return {
    ...view(service, branchId),
    team: barbers.map((member) => {
      const override = overrideOf(member, service.id);
      return {
        memberId: member.id,
        name: memberName(member),
        avatarUrl: member.avatarUrl,
        offered: override?.offered ?? true,
        price: override?.price ?? servicePriceIn(service.id, branchId),
        durationMin: override?.durationMin ?? service.durationMin,
        custom: Boolean(override && (override.price !== null || override.durationMin !== null || override.newClientPrice !== null || override.loyaltyPrice !== null)),
      };
    }),
  };
}

function catalog(branchId: string) {
  return { categories: db.services.categories, items: db.services.items.map((item) => view(item, branchId)) };
}

function saveService(updated: MockCatalogService) {
  db.services = { ...db.services, items: db.services.items.map((item) => (item.id === updated.id ? updated : item)) };
  db.persist();
}

/** Valida lo que captura el formulario de servicio o combo. */
function validateService(input: Record<string, unknown>, currentId: string | null) {
  const fields: Record<string, string[]> = {};
  const kind = input.kind === "combo" ? "combo" : "service";
  const name = text(input.name);
  const price = numberOrNull(input.price);
  const cost = numberOrNull(input.cost);
  const durationMin = numberOrNull(input.durationMin);
  const taxRate = numberOrNull(input.taxRate);
  const categoryId = text(input.categoryId);
  const includes = Array.isArray(input.includes) ? input.includes.filter((id): id is string => typeof id === "string") : [];
  const prep = asRecord(input.prep as DefaultBodyType);
  const prepMinutes = numberOrNull(prep.minutes) ?? 0;

  if (name.length < 2) fields.name = ["Escribe el nombre."];
  else if (db.services.items.some((item) => item.id !== currentId && item.name.toLowerCase() === name.toLowerCase())) fields.name = ["Ya hay un servicio con ese nombre."];
  if (price === null || price < 0) fields.price = ["Escribe el precio."];
  const branchPrice = numberOrNull(input.branchPrice);
  if (branchPrice !== null && branchPrice < 0) fields.branchPrice = ["El precio no puede ser negativo."];
  if (cost !== null && cost < 0) fields.cost = ["El costo no puede ser negativo."];
  if (durationMin === null || durationMin < 5 || durationMin > MAX_DURATION_MIN) fields.durationMin = [`La duración va de 5 a ${MAX_DURATION_MIN} minutos.`];
  if (taxRate !== null && (taxRate < 0 || taxRate > 100)) fields.taxRate = ["El impuesto va de 0 a 100 %."];
  if (!findCategory(categoryId)) fields.categoryId = ["Elige una categoría."];
  if (typeof input.imageUrl === "string" && input.imageUrl.trim() !== "" && imageOrNull(input.imageUrl) === null) fields.imageUrl = ["La foto no es válida o pesa más de 1 MB."];
  if (kind === "combo") {
    const valid = includes.filter((id) => db.services.items.some((item) => item.id === id && item.kind === "service"));
    if (valid.length < 2) fields.includes = ["Un combo agrupa al menos dos servicios."];
  }
  if (prep.enabled === true && (prepMinutes < 1 || prepMinutes > 60)) fields.prep = ["El tiempo de preparación va de 1 a 60 minutos."];

  return {
    fields,
    values: {
      kind,
      name,
      description: text(input.description),
      categoryId,
      price: price ?? 0,
      cost,
      durationMin: durationMin ?? 0,
      taxRate,
      visibility: input.visibility === "private" ? ("private" as const) : ("public" as const),
      multiservice: input.multiservice === true,
      prep: { enabled: prep.enabled === true, minutes: prep.enabled === true ? prepMinutes : 0, position: prep.position === "end" ? ("end" as const) : ("start" as const) },
      giftCards: input.giftCards !== false,
      includes: kind === "combo" ? includes : [],
      imageUrl: imageOrNull(input.imageUrl),
    } satisfies Omit<MockCatalogService, "id" | "activeBranchIds" | "createdAt">,
  };
}

function validateCategory(input: Record<string, unknown>, currentId: string | null) {
  const fields: Record<string, string[]> = {};
  const name = text(input.name);
  if (name.length < 2) fields.name = ["Escribe el nombre de la categoría."];
  else if (db.services.categories.some((item) => item.id !== currentId && item.name.toLowerCase() === name.toLowerCase())) fields.name = ["Ya hay una categoría con ese nombre."];
  return { fields, values: { name, description: text(input.description), visibility: input.visibility === "private" ? ("private" as const) : ("public" as const) } };
}

export const servicesHandlers = [
  http.get(`${BASE}/services`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    return HttpResponse.json(catalog(branchOf(request)));
  }),

  /* El orden va antes que `:id`: si no, «order» se leería como un id. */
  http.put(`${BASE}/services/order`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const rank = (ids: unknown) => new Map((Array.isArray(ids) ? ids : []).filter((id): id is string => typeof id === "string").map((id, index) => [id, index]));
    const categoryRank = rank(input.categoryIds);
    const serviceRank = rank(input.serviceIds);
    const by = <T extends { id: string }>(ranks: Map<string, number>) => (a: T, b: T) => (ranks.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (ranks.get(b.id) ?? Number.MAX_SAFE_INTEGER);
    db.services = { categories: [...db.services.categories].sort(by(categoryRank)), items: [...db.services.items].sort(by(serviceRank)) };
    db.persist();
    return HttpResponse.json(catalog(branchOf(request)));
  }),

  /* Activar o desactivar varios a la vez en la sucursal activa. */
  http.put(`${BASE}/services/activation`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = text(input.branchId) || "ma";
    const ids = new Set(Array.isArray(input.serviceIds) ? input.serviceIds.filter((id): id is string => typeof id === "string") : []);
    const active = input.active === true;
    db.services = {
      ...db.services,
      items: db.services.items.map((item) => (ids.has(item.id) ? { ...item, activeBranchIds: active ? [...new Set([...item.activeBranchIds, branchId])] : item.activeBranchIds.filter((id) => id !== branchId) } : item)),
    };
    db.persist();
    return HttpResponse.json(catalog(branchId));
  }),

  http.get(`${BASE}/services/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const service = findService(params.id);
    if (!service) return error(404, "not_found", "Ese servicio no existe.");
    return HttpResponse.json(detail(service, branchOf(request)));
  }),

  http.post(`${BASE}/services`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const { fields, values } = validateService(input, null);
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const branchId = text(input.branchId) || "ma";
    const service: MockCatalogService = { ...values, branchPrices: withBranchPrice(undefined, branchId, input.branchPrice), id: `svc_${Date.now().toString(36)}`, activeBranchIds: [branchId], createdAt: new Date().toISOString() };
    db.services = { ...db.services, items: [...db.services.items, service] };
    db.persist();
    return HttpResponse.json(detail(service, branchId), { status: 201 });
  }),

  http.patch(`${BASE}/services/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const service = findService(params.id);
    if (!service) return error(404, "not_found", "Ese servicio no existe.");
    const input = asRecord(await request.json().catch(() => ({})));
    const { fields, values } = validateService({ ...input, kind: service.kind }, service.id);
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    // El precio propio de la sucursal desde la que se edita; las demás quedan como estaban.
    const updated: MockCatalogService = { ...service, ...values, branchPrices: withBranchPrice(service.branchPrices, branchOf(request), input.branchPrice) };
    saveService(updated);
    return HttpResponse.json(detail(updated, branchOf(request)));
  }),

  http.delete(`${BASE}/services/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const service = findService(params.id);
    if (!service) return error(404, "not_found", "Ese servicio no existe.");
    const combo = db.services.items.find((item) => item.includes.includes(service.id));
    if (combo) return error(409, "conflict", `Está dentro del combo «${combo.name}». Quítalo del combo antes de borrarlo.`);
    if (db.calendar.appointments.some((item) => item.serviceIds.includes(service.id) && (item.status === "scheduled" || item.status === "arrived" || item.status === "seated"))) {
      return error(409, "conflict", "Tiene citas por atender. Desactívalo para que no se pueda agendar más y bórralo cuando se atiendan.");
    }
    db.services = { ...db.services, items: db.services.items.filter((item) => item.id !== service.id) };
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),

  /* Quién lo ofrece en la sucursal: el resto de la fila de cada barbero no se toca. */
  http.put(`${BASE}/services/:id/team`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const service = findService(params.id);
    if (!service) return error(404, "not_found", "Ese servicio no existe.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = text(input.branchId) || "ma";
    const offering = new Set(Array.isArray(input.memberIds) ? input.memberIds.filter((id): id is string => typeof id === "string") : []);
    const inBranch = new Set(barbersOf(db.team.members, db.team.orders, branchId).map((member) => member.id));
    db.team.members = db.team.members.map((member) => {
      if (!inBranch.has(member.id)) return member;
      const offered = offering.has(member.id);
      const current = overrideOf(member, service.id);
      const row: MockServiceOverride = current ? { ...current, offered } : { serviceId: service.id, offered, price: null, newClientPrice: null, loyaltyPrice: null, durationMin: null, splitCommission: null, extraCommission: null };
      return { ...member, services: [...member.services.filter((item) => item.serviceId !== service.id), row] };
    });
    db.persist();
    return HttpResponse.json(detail(service, branchId));
  }),

  http.get(`${BASE}/service-resources`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    return HttpResponse.json({ items: resources() });
  }),

  http.post(`${BASE}/service-resources`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const { fields, values } = validateResource(asRecord(await request.json().catch(() => ({}))));
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const resource: MockServiceResource = { ...values, id: `res_${Date.now().toString(36)}` };
    db.services = { ...db.services, resources: [...resources(), resource] };
    db.persist();
    return HttpResponse.json(resource, { status: 201 });
  }),

  http.patch(`${BASE}/service-resources/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const current = resources().find((item) => item.id === params.id);
    if (!current) return error(404, "not_found", "Ese recurso no existe.");
    const { fields, values } = validateResource({ ...asRecord(await request.json().catch(() => ({}))), id: current.id });
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const updated: MockServiceResource = { ...current, ...values };
    db.services = { ...db.services, resources: resources().map((item) => (item.id === updated.id ? updated : item)) };
    db.persist();
    return HttpResponse.json(updated);
  }),

  http.delete(`${BASE}/service-resources/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!resources().some((item) => item.id === params.id)) return error(404, "not_found", "Ese recurso no existe.");
    db.services = { ...db.services, resources: resources().filter((item) => item.id !== params.id) };
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${BASE}/service-categories`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const { fields, values } = validateCategory(asRecord(await request.json().catch(() => ({}))), null);
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const category: MockServiceCategory = { ...values, id: `cat_${Date.now().toString(36)}` };
    /* «Sin categoría» se queda siempre al final. */
    const rest = db.services.categories.filter((item) => item.id !== UNCATEGORIZED_ID);
    const none = db.services.categories.filter((item) => item.id === UNCATEGORIZED_ID);
    db.services = { ...db.services, categories: [...rest, category, ...none] };
    db.persist();
    return HttpResponse.json(category, { status: 201 });
  }),

  http.patch(`${BASE}/service-categories/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const category = findCategory(params.id);
    if (!category) return error(404, "not_found", "Esa categoría no existe.");
    const { fields, values } = validateCategory(asRecord(await request.json().catch(() => ({}))), category.id);
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const updated: MockServiceCategory = { ...category, ...values };
    db.services = { ...db.services, categories: db.services.categories.map((item) => (item.id === updated.id ? updated : item)) };
    db.persist();
    return HttpResponse.json(updated);
  }),

  http.delete(`${BASE}/service-categories/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const category = findCategory(params.id);
    if (!category) return error(404, "not_found", "Esa categoría no existe.");
    if (category.id === UNCATEGORIZED_ID) return error(409, "conflict", "«Sin categoría» no se puede borrar: ahí caen los servicios que se quedan sin la suya.");
    db.services = {
      categories: db.services.categories.filter((item) => item.id !== category.id),
      items: db.services.items.map((item) => (item.categoryId === category.id ? { ...item, categoryId: UNCATEGORIZED_ID } : item)),
    };
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),
];
