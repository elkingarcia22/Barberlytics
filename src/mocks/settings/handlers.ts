import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { isValidTaxId, packOf, type TaxIdKind } from "@/features/settings/countryPack";
import { accountById, db } from "../db";
import { forbidden, hasStepUp, isManager, sessionOf, stepUpRequired } from "../session";
import { GATEWAY_SPECS, isGatewayProvider, keyLooksValid } from "@/features/settings/gatewayProviders";
import type { MockListItem, MockSettingsList, MockSettingsSection } from "./seed";

/**
 * Los endpoints de configuración del backend simulado. Reproducen
 * docs/API_CONTRACT.md (sección «Configuración»): un documento por ajuste
 * (`/settings/:section`) y cinco listas con alta, edición y borrado
 * (`/settings/lists/:list`).
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const SECTIONS: readonly MockSettingsSection[] = ["business", "booking", "pricing", "tips", "cardFee", "commissions", "payrollCycle", "notifications", "company", "billing"];
const LISTS: readonly MockSettingsList[] = ["branches", "closures", "taxGroups", "devices", "gateways"];
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const URL_LIKE = /^https?:\/\/\S+\.\S+/;

type Fields = Record<string, string[]>;
type Body = Record<string, unknown>;

function error(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return HttpResponse.json({ code, message, ...extra }, { status });
}

function requireAuth(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const accountId = token ? db.sessions.get(token) : undefined;
  return accountById(accountId) ?? null;
}

const asRecord = (body: DefaultBodyType | unknown): Body => (body && typeof body === "object" && !Array.isArray(body) ? (body as Body) : {});
const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const num = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);
const between = (value: unknown, min: number, max: number): boolean => {
  const n = num(value);
  return n !== null && n >= min && n <= max;
};

/** Lo que el servidor no deja pasar en cada documento; el resto lo valida el formulario. */
const SECTION_RULES: Partial<Record<MockSettingsSection, (body: Body) => Fields>> = {
  business: (body) => {
    const fields: Fields = {};
    for (const key of ["website", "instagram", "facebook", "googleMaps"]) {
      const value = text(body[key]);
      if (value && !URL_LIKE.test(value)) fields[key] = ["Escribe un enlace completo, con https://."];
    }
    if (text(body.openTime) >= text(body.closeTime)) fields.closeTime = ["El cierre tiene que ser después de la apertura."];
    return fields;
  },
  booking: (body) => {
    const fields: Fields = {};
    if (!between(body.minNotice, 0, 10_000)) fields.minNotice = ["Escribe la anticipación mínima."];
    if (!between(body.lateFeePercent, 0, 100)) fields.lateFeePercent = ["El cargo va de 0 a 100 %."];
    if (!between(body.maxCancellations, 0, 99)) fields.maxCancellations = ["Escribe un número de 0 a 99."];
    const surge = asRecord(body.surge);
    if (surge.enabled === true && !between(surge.occupancy, 1, 100)) fields.surge = ["La ocupación va de 1 a 100 %."];
    return fields;
  },
  tips: (body): Fields => {
    const options = Array.isArray(body.options) ? body.options.map(asRecord) : [];
    if (options.some((option) => !between(option.value, 0.01, 100_000))) return { options: ["Cada opción necesita un valor mayor que cero."] };
    const keys = options.map((option) => `${String(option.type)}:${String(option.value)}`);
    if (new Set(keys).size !== keys.length) return { options: ["Hay dos opciones iguales."] };
    return {};
  },
  cardFee: (body): Fields => {
    if (body.enabled !== true) return {};
    const fields: Fields = {};
    if (text(body.name).length < 2) fields.name = ["Ponle un nombre al recargo."];
    if (!between(body.rate, 0.01, 100_000)) fields.rate = ["Escribe un valor mayor que cero."];
    return fields;
  },
  payrollCycle: (body): Fields => (between(body.startDay, 1, 31) ? {} : { startDay: ["Elige un día del 1 al 31."] }),
  company: (body): Fields => (text(body.name).length < 2 ? { name: ["Escribe el nombre de la empresa."] } : {}),
};

const TAX_ID_ERRORS: Readonly<Record<TaxIdKind, string>> = {
  nit: "El NIT no cuadra con su dígito de verificación.",
  rfc: "El RFC no tiene la forma del SAT (letras, fecha AAMMDD y homoclave).",
  ein: "El EIN son nueve dígitos: 12-3456789.",
};

const LIST_RULES: Record<MockSettingsList, (body: Body, currentId: string | null) => Fields> = {
  branches: (body, currentId) => {
    const fields: Fields = {};
    const name = text(body.name);
    if (name.length < 2) fields.name = ["Escribe el nombre de la sucursal."];
    else if (db.settings.lists.branches.some((item) => item.id !== currentId && text(item.name).toLowerCase() === name.toLowerCase())) fields.name = ["Ya hay una sucursal con ese nombre."];
    for (const key of ["country", "state", "city", "timezone", "currency"]) if (!text(body[key])) fields[key] = ["Este dato es obligatorio."];
    if (text(body.phone).replace(/\D/g, "").length < 8) fields.phone = ["Escribe un teléfono válido."];
    // La identificación fiscal con la forma de su país (NIT con dígito de verificación, RFC, EIN).
    const pack = packOf(text(body.country));
    if (pack && !isValidTaxId(pack.country, text(body.taxId))) fields.taxId = [TAX_ID_ERRORS[pack.taxIdKind]];
    const taxGroupId = body.taxGroupId ?? null;
    if (taxGroupId !== null && !db.settings.lists.taxGroups.some((item) => item.id === taxGroupId)) fields.taxGroupId = ["Ese impuesto no existe."];
    const gatewayId = body.gatewayId ?? null;
    if (gatewayId !== null && !db.settings.lists.gateways.some((item) => item.id === gatewayId)) fields.gatewayId = ["Esa pasarela no existe."];
    return fields;
  },
  closures: (body) => {
    const fields: Fields = {};
    const start = text(body.startDate);
    const end = text(body.endDate);
    if (!DAY_KEY.test(start)) fields.startDate = ["Elige la fecha de inicio."];
    if (!DAY_KEY.test(end)) fields.endDate = ["Elige la fecha de fin."];
    else if (DAY_KEY.test(start) && end < start) fields.endDate = ["El fin no puede ser antes del inicio."];
    if (!Array.isArray(body.branchIds) || body.branchIds.length === 0) fields.branchIds = ["Elige al menos una sucursal."];
    return fields;
  },
  taxGroups: (body, currentId) => {
    const fields: Fields = {};
    const name = text(body.name);
    if (name.length < 2) fields.name = ["Escribe el nombre del impuesto."];
    else if (db.settings.lists.taxGroups.some((item) => item.id !== currentId && text(item.name).toLowerCase() === name.toLowerCase())) fields.name = ["Ya hay un impuesto con ese nombre."];
    const taxes = Array.isArray(body.taxes) ? body.taxes.map(asRecord) : [];
    if (taxes.length === 0 || taxes.some((tax) => text(tax.name).length < 1 || !between(tax.percent, 0.01, 100))) fields.taxes = ["Cada tasa necesita nombre y un porcentaje entre 0 y 100."];
    return fields;
  },
  devices: (body, currentId) => {
    const fields: Fields = {};
    if (text(body.name).length < 2) fields.name = ["Ponle un nombre al datáfono."];
    const serial = text(body.serial);
    if (serial.length < 4) fields.serial = ["Escribe el serial."];
    else if (db.settings.lists.devices.some((item) => item.id !== currentId && text(item.serial) === serial)) fields.serial = ["Ese serial ya está registrado."];
    if (text(body.tpn).length < 4) fields.tpn = ["Escribe el TPN."];
    return fields;
  },
  gateways: (body, currentId) => {
    const fields: Fields = {};
    const current = currentId ? db.settings.lists.gateways.find((item) => item.id === currentId) : undefined;
    // El proveedor no cambia al editar: otra cuenta es otra pasarela.
    const provider = current ? current.provider : body.provider;
    if (!isGatewayProvider(provider)) return { provider: ["Elige la pasarela."] };
    if (text(body.name).length < 2) fields.name = ["Ponle un nombre a la pasarela."];
    if (!keyLooksValid(provider, "public", text(body.publicKey))) fields.publicKey = [`Esa no es una clave pública de ${GATEWAY_SPECS[provider].name}.`];
    const secret = text(body.secretKey);
    if (!current && !secret) fields.secretKey = ["Escribe la clave secreta."];
    else if (secret && !keyLooksValid(provider, "secret", secret)) fields.secretKey = [`Esa no es una clave secreta de ${GATEWAY_SPECS[provider].name}.`];
    return fields;
  },
};

/** Lo que no se puede borrar porque una sucursal lo usa: la sucursal se quedaría sin impuesto o sin cobro. */
const IN_USE: Partial<Record<MockSettingsList, { key: string; message: string }>> = {
  taxGroups: { key: "taxGroupId", message: "Hay sucursales que cobran con este impuesto. Cámbiales el impuesto antes de borrarlo." },
  gateways: { key: "gatewayId", message: "Hay sucursales que cobran con esta pasarela. Cámbiales la pasarela antes de borrarla." },
};

const isSection = (value: unknown): value is MockSettingsSection => SECTIONS.includes(value as MockSettingsSection);
const isList = (value: unknown): value is MockSettingsList => LISTS.includes(value as MockSettingsList);

/** Lo que una lista guarda de cada fila: nunca el secreto de un datáfono ni de una pasarela. */
function listRow(list: MockSettingsList, body: Body, current?: MockListItem): Body {
  if (list === "branches") return { ...body, taxGroupId: body.taxGroupId ?? null, gatewayId: body.gatewayId ?? null };
  if (list === "gateways") {
    // La clave secreta no se guarda en la fila: vive aparte (storeGatewaySecret).
    const rest = Object.fromEntries(Object.entries(body).filter(([key]) => key !== "secretKey"));
    const provider = current?.provider ?? body.provider;
    return { ...rest, provider, publicKey: text(body.publicKey), name: text(body.name) };
  }
  if (list !== "devices") return body;
  const { authKey, ...rest } = body;
  return { ...rest, hasAuthKey: text(authKey).length > 0 || body.hasAuthKey === true };
}

/** Guarda la clave secreta aparte y marca la fila: conectada si las dos claves tienen la forma del proveedor. */
function storeGatewaySecret(item: MockListItem, secret: string): MockListItem {
  const secrets = secret ? { ...db.settings.gatewaySecrets, [item.id]: secret } : db.settings.gatewaySecrets;
  db.settings = { ...db.settings, gatewaySecrets: secrets };
  const saved = secrets[item.id] ?? "";
  const provider = item.provider;
  const connected = isGatewayProvider(provider) && keyLooksValid(provider, "public", text(item.publicKey)) && keyLooksValid(provider, "secret", saved);
  return { ...item, hasSecret: saved.length > 0, connected };
}

const listView = (list: MockSettingsList) => {
  const items = db.settings.lists[list];
  if (list !== "branches") return { items };
  /* Cuánta gente trabaja en cada sucursal sale del equipo, no se guarda. */
  return { items: items.map((item) => ({ ...item, teamSize: db.team.members.filter((member) => member.branchIds.includes(item.id) && member.status !== "inactive").length })) };
};

export const settingsHandlers = [
  http.get(`${BASE}/settings/lists/:list`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!isList(params.list)) return error(404, "not_found", "Esa lista no existe.");
    return HttpResponse.json(listView(params.list));
  }),

  http.post(`${BASE}/settings/lists/:list`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!isManager(sessionOf(request)!)) return forbidden("Solo el dueño o el administrador cambian la configuración.");
    const list = params.list;
    if (!isList(list)) return error(404, "not_found", "Esa lista no existe.");
    const body = asRecord(await request.json().catch(() => ({})));
    const fields = LIST_RULES[list](body, null);
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    // Guardar la clave secreta de una pasarela es mover dinero: pide confirmar que eres tú.
    if (list === "gateways" && text(body.secretKey) && !hasStepUp(request)) return stepUpRequired();
    const row: MockListItem = { ...listRow(list, body), id: `${list.slice(0, 3)}_${Date.now().toString(36)}`, ...(list === "branches" ? { status: "active", createdAt: new Date().toISOString() } : {}) };
    const item = list === "gateways" ? storeGatewaySecret(row, text(body.secretKey)) : row;
    db.settings = { ...db.settings, lists: { ...db.settings.lists, [list]: [...db.settings.lists[list], item] } };
    db.persist();
    return HttpResponse.json(listView(list), { status: 201 });
  }),

  http.patch(`${BASE}/settings/lists/:list/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!isManager(sessionOf(request)!)) return forbidden("Solo el dueño o el administrador cambian la configuración.");
    const list = params.list;
    if (!isList(list)) return error(404, "not_found", "Esa lista no existe.");
    const current = db.settings.lists[list].find((item) => item.id === params.id);
    if (!current) return error(404, "not_found", "Ese registro no existe.");
    const body = asRecord(await request.json().catch(() => ({})));
    const fields = LIST_RULES[list](body, current.id);
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    if (list === "gateways" && text(body.secretKey) && !hasStepUp(request)) return stepUpRequired();
    const merged: MockListItem = { ...current, ...listRow(list, { ...body, hasAuthKey: current.hasAuthKey }, current), id: current.id };
    const updated = list === "gateways" ? storeGatewaySecret(merged, text(body.secretKey)) : merged;
    db.settings = { ...db.settings, lists: { ...db.settings.lists, [list]: db.settings.lists[list].map((item) => (item.id === current.id ? updated : item)) } };
    db.persist();
    return HttpResponse.json(listView(list));
  }),

  http.delete(`${BASE}/settings/lists/:list/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!isManager(sessionOf(request)!)) return forbidden("Solo el dueño o el administrador cambian la configuración.");
    const list = params.list;
    if (!isList(list)) return error(404, "not_found", "Esa lista no existe.");
    if (!db.settings.lists[list].some((item) => item.id === params.id)) return error(404, "not_found", "Ese registro no existe.");
    if (list === "branches") {
      if (db.settings.lists.branches.length === 1) return error(409, "conflict", "El negocio necesita al menos una sucursal.");
      if (db.team.members.some((member) => member.branchIds.includes(String(params.id)) && member.status !== "inactive")) return error(409, "conflict", "Tiene personas del equipo activas. Muévelas a otra sucursal antes de borrarla.");
    }
    const guard = IN_USE[list];
    if (guard && db.settings.lists.branches.some((branch) => branch[guard.key] === params.id)) return error(409, "conflict", guard.message);
    if (list === "gateways") {
      const secrets = Object.fromEntries(Object.entries(db.settings.gatewaySecrets).filter(([id]) => id !== String(params.id)));
      db.settings = { ...db.settings, gatewaySecrets: secrets };
    }
    db.settings = { ...db.settings, lists: { ...db.settings.lists, [list]: db.settings.lists[list].filter((item) => item.id !== params.id) } };
    db.persist();
    return HttpResponse.json(listView(list));
  }),

  /* Probar la conexión con una pasarela: vale con que las dos claves tengan la forma de ese proveedor. */
  http.post(`${BASE}/settings/gateways/test`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!isManager(sessionOf(request)!)) return forbidden("Solo el dueño o el administrador cambian la configuración.");
    const body = asRecord(await request.json().catch(() => ({})));
    const provider = body.provider;
    if (!isGatewayProvider(provider)) return error(422, "validation", "Elige la pasarela.", { fields: { provider: ["Elige la pasarela."] } });
    const publicKey = text(body.publicKey);
    // Sin clave escrita se prueba con la guardada de la pasarela que tiene esa clave pública.
    const saved = db.settings.lists.gateways.find((item) => item.provider === provider && item.publicKey === publicKey);
    const secretKey = text(body.secretKey) || (saved ? (db.settings.gatewaySecrets[saved.id] ?? "") : "");
    const ok = keyLooksValid(provider, "public", publicKey) && keyLooksValid(provider, "secret", secretKey);
    const name = GATEWAY_SPECS[provider].name;
    return HttpResponse.json({ ok, message: ok ? `${name} respondió correctamente.` : `${name} rechazó las claves. Revisa que sean de la misma cuenta y del mismo modo (prueba o producción).` });
  }),

  http.post(`${BASE}/account/delete`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    // Borrar la barbería es solo del dueño (en la plantilla de sesión, `admin`), lo pida la pantalla que lo pida.
    if (account.user.role !== "admin") return error(403, "forbidden", "Solo el dueño puede eliminar la barbería.");
    if (!hasStepUp(request)) return stepUpRequired();
    const body = asRecord(await request.json().catch(() => ({})));
    const company = text(db.settings.sections.company.name);
    if (text(body.confirmation) !== company) return error(422, "validation", "El nombre no coincide.", { fields: { confirmation: ["Escribe el nombre de la empresa tal cual."] } });
    /* El mock no borra de verdad: deja la base como recién sembrada y cierra las sesiones. */
    db.reset();
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE}/settings/:section`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!isSection(params.section)) return error(404, "not_found", "Ese ajuste no existe.");
    return HttpResponse.json(db.settings.sections[params.section]);
  }),

  http.put(`${BASE}/settings/:section`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!isManager(sessionOf(request)!)) return forbidden("Solo el dueño o el administrador cambian la configuración.");
    const section = params.section;
    if (!isSection(section)) return error(404, "not_found", "Ese ajuste no existe.");
    const body = asRecord(await request.json().catch(() => ({})));
    const fields = SECTION_RULES[section]?.(body) ?? {};
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const current = db.settings.sections[section];
    let next: Body = { ...current, ...body };
    if (section === "booking") next = { ...next, links: current.links };
    if (section === "billing") next = { ...current, details: { ...asRecord(current.details), ...asRecord(body.details) } };
    db.settings = { ...db.settings, sections: { ...db.settings.sections, [section]: next } };
    db.persist();
    return HttpResponse.json(next);
  }),
];
