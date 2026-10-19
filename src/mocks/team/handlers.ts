import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { ACCOUNTS, db } from "../db";
import { isManager, sessionOf } from "../session";
import {
  isBarberRole,
  memberName,
  PERMISSION_ROWS,
  ROLE_PERMISSION_DEFAULTS,
  type MockBranchOrder,
  type MockLevel,
  type MockLineupEntry,
  type MockPermissions,
  type MockScheduleOverride,
  type MockTeamMember,
  type MockTeamRole,
  type MockWorkingRange,
} from "./seed";

/**
 * Los endpoints del equipo del backend simulado. Reproducen
 * docs/API_CONTRACT.md (sección «Equipo»): el directorio de una sucursal, la
 * ficha completa de cada persona, los niveles, el orden de los barberos, las
 * horas de la semana y la activación por sucursal.
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const ROLES: readonly MockTeamRole[] = ["owner", "admin", "recepcion", "barbero-comision", "barbero-renta"];
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const CLOCK = /^\d{2}:\d{2}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

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
const branchOf = (request: Request) => new URL(request.url).searchParams.get("branchId") ?? "ma";

const findMember = (id: string | readonly string[] | undefined) => db.team.members.find((item) => item.id === id);

function saveMember(updated: MockTeamMember) {
  db.team.members = db.team.members.map((item) => (item.id === updated.id ? updated : item));
  db.persist();
  return HttpResponse.json(updated);
}

/** Recorta la matriz a las columnas que existen en cada fila. */
function sanitizePermissions(input: unknown, fallback: MockPermissions): MockPermissions {
  if (!input || typeof input !== "object") return fallback;
  const result: MockPermissions = {};
  for (const row of PERMISSION_ROWS) {
    const cells = (input as Record<string, unknown>)[row.id];
    if (!cells || typeof cells !== "object") continue;
    result[row.id] = Object.fromEntries(row.columns.filter((column) => typeof (cells as Record<string, unknown>)[column] === "boolean").map((column) => [column, (cells as Record<string, boolean>)[column]]));
  }
  return result;
}

function validateProfile(input: Record<string, unknown>, existing?: MockTeamMember) {
  const fields: Record<string, string[]> = {};
  const firstName = text(input.firstName) || existing?.firstName || "";
  const lastName = text(input.lastName) || existing?.lastName || "";
  const phone = text(input.phone) || existing?.phone || "";
  const email = (text(input.email) || existing?.email || "").toLowerCase();
  if (firstName.length < 2) fields.firstName = ["Escribe el nombre."];
  if (lastName.length < 2) fields.lastName = ["Escribe el apellido."];
  if (phone.replace(/\D/g, "").length < 8) fields.phone = ["Escribe un celular válido."];
  if (!EMAIL.test(email)) fields.email = ["Escribe un correo válido."];
  if (db.team.members.some((member) => member.email === email && member.id !== existing?.id)) fields.email = ["Ya hay alguien con ese correo."];
  const levelId = input.levelId === null ? null : text(input.levelId) || existing?.levelId || null;
  if (levelId && !db.team.levels.some((level) => level.id === levelId)) fields.levelId = ["Ese nivel no existe."];
  return { fields, values: { firstName, lastName, phone, email, levelId } };
}

function validateSchedule(input: unknown): Record<string, MockWorkingRange | null> | null {
  if (!input || typeof input !== "object") return null;
  const result: Record<string, MockWorkingRange | null> = {};
  for (const day of ["0", "1", "2", "3", "4", "5", "6"]) {
    const value = (input as Record<string, unknown>)[day];
    if (!value || typeof value !== "object") {
      result[day] = null;
      continue;
    }
    const range = value as Record<string, unknown>;
    if (!CLOCK.test(text(range.start)) || !CLOCK.test(text(range.end)) || text(range.end) <= text(range.start)) return null;
    result[day] = { start: text(range.start), end: text(range.end) };
  }
  return result;
}

function weekDays(weekStart: string): string[] {
  const start = new Date(`${weekStart}T00:00:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  });
}

const lineupFrom = (input: unknown, ids: readonly string[]): MockLineupEntry[] | null => {
  if (!Array.isArray(input)) return null;
  const entries = input.map((item) => asRecord(item as DefaultBodyType)).filter((item) => ids.includes(text(item.memberId))).map((item) => ({ memberId: text(item.memberId), enabled: item.enabled === true }));
  return entries;
};

export const teamHandlers = [
  http.get(`${BASE}/team/members`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const branchId = branchOf(request);
    const all = new URL(request.url).searchParams.get("all") === "true";
    const members = all ? db.team.members : db.team.members.filter((member) => member.branchIds.includes(branchId));
    // Sin gestionar al equipo no se ven el dinero ni los contactos de los colegas (sí los propios).
    const session = sessionOf(request);
    const redact = (member: MockTeamMember): MockTeamMember => (session && !isManager(session) && member.id !== session.memberId ? { ...member, phone: "", email: "", compensation: null, payments: null } : member);
    return HttpResponse.json({ items: members.map(redact), levels: db.team.levels });
  }),

  http.get(`${BASE}/team/members/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const member = findMember(params.id);
    return member ? HttpResponse.json(member) : error(404, "not_found", "Esa persona no existe.");
  }),

  http.post(`${BASE}/team/members`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const role = text(input.role) as MockTeamRole;
    if (!ROLES.includes(role)) return error(422, "validation", "Elige un rol.", { fields: { role: ["Elige un rol."] } });
    const { fields, values } = validateProfile(input);
    const isBarber = isBarberRole(role);
    if (isBarber && !values.levelId) fields.levelId = ["Elige el nivel del barbero."];
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const branchId = text(input.branchId) || "ma";
    const id = `team-${String(db.team.members.length + 1).padStart(2, "0")}-${Date.now().toString(36).slice(-3)}`;
    const member: MockTeamMember = {
      id,
      ...values,
      role,
      homeBranchId: branchId,
      branchIds: role === "owner" ? ["ma", "nc", "ri", "ut"] : [branchId],
      status: "invited",
      avatarUrl: text(input.avatarUrl) || null,
      code: String(1000 + Math.floor(Math.random() * 9000)),
      description: text(input.description),
      instagram: text(input.instagram),
      facebook: text(input.facebook),
      bookingVisible: input.bookingVisible !== false,
      skills: Array.isArray(input.skills) ? input.skills.filter((item): item is string => typeof item === "string") : [],
      gallery: Array.isArray(input.gallery) ? input.gallery.filter((item): item is string => typeof item === "string").slice(0, 5) : [],
      isAlsoBarber: input.isAlsoBarber === true,
      services: Array.isArray(input.services) ? (input.services as MockTeamMember["services"]) : [],
      compensation: role === "barbero-comision" ? ((input.compensation as MockTeamMember["compensation"]) ?? { type: "commission", basic: 40, recurring: null, walkIn: null, noPreference: null, newClient: null, productPercent: null, salary: null, scale: [] }) : null,
      payments: role === "barbero-renta" ? ((input.payments as MockTeamMember["payments"]) ?? { rentBase: 0, walkInDeduction: 0, newClientDeduction: 0, noPreferenceDeduction: 0, bankName: "", accountNumber: "" }) : null,
      schedule: validateSchedule(input.schedule) ?? Object.fromEntries(["0", "1", "2", "3", "4", "5", "6"].map((day) => [day, null])),
      permissions: sanitizePermissions(input.permissions, ROLE_PERMISSION_DEFAULTS[role]),
      options: (input.options as MockTeamMember["options"]) ?? {
        tips: true,
        multipleAppointments: false,
        newClients: true,
        clientCancel: { enabled: false, channels: [], hours: 0, minutes: 0 },
        intervalMinutes: 30,
        reminders: [],
        social: "",
        link: "",
      },
      createdAt: new Date().toISOString(),
    };
    db.team.members = [member, ...db.team.members];
    if (isBarber) {
      db.team.orders = db.team.orders.map((order) =>
        order.branchId === branchId
          ? { ...order, calendar: [...order.calendar, id], walkIn: [...order.walkIn, { memberId: id, enabled: true }], noPreference: [...order.noPreference, { memberId: id, enabled: true }] }
          : order
      );
    }
    db.persist();
    return HttpResponse.json(member, { status: 201 });
  }),

  http.patch(`${BASE}/team/members/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const existing = findMember(params.id);
    if (!existing) return error(404, "not_found", "Esa persona no existe.");
    const input = asRecord(await request.json().catch(() => ({})));
    const fields: Record<string, string[]> = {};
    let next: MockTeamMember = { ...existing };

    if (["firstName", "lastName", "phone", "email", "levelId"].some((key) => key in input)) {
      const profile = validateProfile(input, existing);
      Object.assign(fields, profile.fields);
      next = { ...next, ...profile.values };
    }
    if (typeof input.description === "string") next = { ...next, description: input.description.trim() };
    if (typeof input.instagram === "string") next = { ...next, instagram: input.instagram.trim() };
    if (typeof input.facebook === "string") next = { ...next, facebook: input.facebook.trim() };
    if (typeof input.bookingVisible === "boolean") next = { ...next, bookingVisible: input.bookingVisible };
    if (typeof input.isAlsoBarber === "boolean") next = { ...next, isAlsoBarber: input.isAlsoBarber };
    if (input.avatarUrl === null || typeof input.avatarUrl === "string") next = { ...next, avatarUrl: input.avatarUrl || null };
    if (Array.isArray(input.skills)) next = { ...next, skills: input.skills.filter((item): item is string => typeof item === "string") };
    if (Array.isArray(input.gallery)) next = { ...next, gallery: input.gallery.filter((item): item is string => typeof item === "string").slice(0, 5) };
    if (Array.isArray(input.services)) next = { ...next, services: input.services as MockTeamMember["services"] };
    if (input.compensation && typeof input.compensation === "object") {
      const compensation = input.compensation as MockTeamMember["compensation"];
      if (compensation && compensation.type === "commission" && (typeof compensation.basic !== "number" || compensation.basic <= 0 || compensation.basic > 100)) fields.basic = ["La comisión básica va de 1 a 100 %."];
      next = { ...next, compensation };
    }
    if (input.payments && typeof input.payments === "object") next = { ...next, payments: input.payments as MockTeamMember["payments"] };
    if ("schedule" in input) {
      const schedule = validateSchedule(input.schedule);
      if (!schedule) fields.schedule = ["Cada día marcado necesita una hora de cierre posterior a la de inicio."];
      else next = { ...next, schedule };
    }
    if (input.permissions) next = { ...next, permissions: sanitizePermissions(input.permissions, existing.permissions) };
    if (input.options && typeof input.options === "object") next = { ...next, options: input.options as MockTeamMember["options"] };
    if (typeof input.status === "string") {
      if (!["active", "invited", "inactive"].includes(input.status)) fields.status = ["Estado inválido."];
      else next = { ...next, status: input.status as MockTeamMember["status"] };
    }
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    return saveMember(next);
  }),

  http.delete(`${BASE}/team/members/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    const member = findMember(params.id);
    if (!member) return error(404, "not_found", "Esa persona no existe.");
    if (member.role === "owner") return error(403, "forbidden", "Un dueño no se borra: inactívalo.");
    db.team.members = db.team.members.filter((item) => item.id !== member.id);
    db.team.orders = db.team.orders.map((order) => ({
      ...order,
      calendar: order.calendar.filter((id) => id !== member.id),
      walkIn: order.walkIn.filter((entry) => entry.memberId !== member.id),
      noPreference: order.noPreference.filter((entry) => entry.memberId !== member.id),
    }));
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),

  http.put(`${BASE}/team/activation`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = text(input.branchId);
    const ids = Array.isArray(input.memberIds) ? input.memberIds.filter((id): id is string => typeof id === "string") : null;
    if (!branchId || !ids) return error(422, "validation", "Faltan la sucursal o las personas.");
    db.team.members = db.team.members.map((member) => {
      const active = ids.includes(member.id);
      const branchIds = active ? [...new Set([...member.branchIds, branchId])] : member.branchIds.filter((id) => id !== branchId);
      return { ...member, branchIds };
    });
    db.persist();
    return HttpResponse.json({ items: db.team.members.filter((member) => member.branchIds.includes(branchId)), levels: db.team.levels });
  }),

  // ---------- Niveles ----------
  http.get(`${BASE}/team/levels`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    return HttpResponse.json({ items: db.team.levels });
  }),

  http.post(`${BASE}/team/levels`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const name = text(asRecord(await request.json().catch(() => ({}))).name);
    if (name.length < 2) return error(422, "validation", "Escribe el nombre del nivel.", { fields: { name: ["Escribe el nombre del nivel."] } });
    if (db.team.levels.some((level) => level.name.toLowerCase() === name.toLowerCase())) return error(422, "validation", "Ya existe un nivel con ese nombre.", { fields: { name: ["Ya existe un nivel con ese nombre."] } });
    const level: MockLevel = { id: `lvl_${Date.now().toString(36)}`, name };
    db.team.levels = [...db.team.levels, level];
    db.persist();
    return HttpResponse.json(level, { status: 201 });
  }),

  http.patch(`${BASE}/team/levels/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const level = db.team.levels.find((item) => item.id === params.id);
    if (!level) return error(404, "not_found", "Ese nivel no existe.");
    const name = text(asRecord(await request.json().catch(() => ({}))).name);
    if (name.length < 2) return error(422, "validation", "Escribe el nombre del nivel.", { fields: { name: ["Escribe el nombre del nivel."] } });
    const updated = { ...level, name };
    db.team.levels = db.team.levels.map((item) => (item.id === level.id ? updated : item));
    db.persist();
    return HttpResponse.json(updated);
  }),

  http.delete(`${BASE}/team/levels/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!db.team.levels.some((item) => item.id === params.id)) return error(404, "not_found", "Ese nivel no existe.");
    const inUse = db.team.members.filter((member) => member.levelId === params.id).length;
    if (inUse > 0) return error(409, "conflict", `Ese nivel lo tienen ${inUse} barberos. Pásalos a otro nivel antes de borrarlo.`);
    db.team.levels = db.team.levels.filter((item) => item.id !== params.id);
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),

  // ---------- Orden ----------
  http.get(`${BASE}/team/order`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const branchId = branchOf(request);
    const order = db.team.orders.find((item) => item.branchId === branchId) ?? { branchId, calendar: [], walkIn: [], noPreference: [] };
    return HttpResponse.json(order);
  }),

  http.put(`${BASE}/team/order`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = text(input.branchId);
    if (!branchId) return error(422, "validation", "Falta la sucursal.");
    const ids = db.team.members.filter((member) => member.branchIds.includes(branchId)).map((member) => member.id);
    const existing = db.team.orders.find((item) => item.branchId === branchId) ?? { branchId, calendar: [], walkIn: [], noPreference: [] };
    const next: MockBranchOrder = {
      branchId,
      calendar: Array.isArray(input.calendar) ? input.calendar.filter((id): id is string => typeof id === "string" && ids.includes(id)) : existing.calendar,
      walkIn: lineupFrom(input.walkIn, ids) ?? existing.walkIn,
      noPreference: lineupFrom(input.noPreference, ids) ?? existing.noPreference,
    };
    db.team.orders = [...db.team.orders.filter((item) => item.branchId !== branchId), next];
    db.persist();
    return HttpResponse.json(next);
  }),

  // ---------- Horas de la semana ----------
  http.get(`${BASE}/team/schedule`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const url = new URL(request.url);
    const branchId = branchOf(request);
    const weekStart = url.searchParams.get("week") ?? "";
    if (!DAY_KEY.test(weekStart)) return error(422, "validation", "La semana debe ser AAAA-MM-DD (lunes).", { fields: { week: ["Semana inválida."] } });
    const days = weekDays(weekStart);
    const barbers = db.team.members.filter((member) => (isBarberRole(member.role) || member.isAlsoBarber) && member.status !== "inactive" && member.branchIds.includes(branchId));
    const rows = barbers.map((member) => ({
      memberId: member.id,
      name: memberName(member),
      avatarUrl: member.avatarUrl,
      days: days.map((date) => {
        const override = db.team.overrides.find((item) => item.memberId === member.id && item.date === date);
        const weekday = String(new Date(`${date}T00:00:00`).getDay());
        return { date, range: override ? override.range : (member.schedule[weekday] ?? null), overridden: Boolean(override) };
      }),
    }));
    return HttpResponse.json({ weekStart, days, rows });
  }),

  http.put(`${BASE}/team/schedule/override`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const memberId = text(input.memberId);
    const date = text(input.date);
    if (!findMember(memberId)) return error(404, "not_found", "Esa persona no existe.");
    if (!DAY_KEY.test(date)) return error(422, "validation", "Fecha inválida.", { fields: { date: ["Fecha inválida."] } });
    let range: MockWorkingRange | null = null;
    if (input.range && typeof input.range === "object") {
      const value = input.range as Record<string, unknown>;
      if (!CLOCK.test(text(value.start)) || !CLOCK.test(text(value.end)) || text(value.end) <= text(value.start)) {
        return error(422, "validation", "La hora fin debe ser posterior a la de inicio.", { fields: { end: ["La hora fin debe ser posterior a la de inicio."] } });
      }
      range = { start: text(value.start), end: text(value.end) };
    }
    const override: MockScheduleOverride = { id: `ovr_${Date.now().toString(36)}`, memberId, date, range };
    db.team.overrides = [...db.team.overrides.filter((item) => !(item.memberId === memberId && item.date === date)), override];
    db.persist();
    return HttpResponse.json(override);
  }),

  http.delete(`${BASE}/team/schedule/override`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const url = new URL(request.url);
    const memberId = url.searchParams.get("memberId") ?? "";
    const date = url.searchParams.get("date") ?? "";
    db.team.overrides = db.team.overrides.filter((item) => !(item.memberId === memberId && item.date === date));
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),
];
