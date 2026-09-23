import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { ACCOUNTS, db, type MockAccount, type MockAuthProvider, type MockBranding, type MockUser, type MockUserRole, type MockUserStatus } from "./db";

/**
 * Handlers del backend simulado. Reproducen el contrato de docs/API_CONTRACT.md
 * con la misma forma de errores que espera `src/lib/api/client.ts`.
 */

const BASE = "*/api";
const LATENCY_MS = 250;

function error(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return HttpResponse.json({ code, message, ...extra }, { status });
}

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

function requireAuth(request: Request) {
  const token = bearer(request);
  const accountId = token ? db.sessions.get(token) : undefined;
  const account = ACCOUNTS.find((item) => item.id === accountId);
  return account ?? null;
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), meta: { page: safePage, pageSize, total, totalPages } };
}

/** 1 MB de imagen ≈ 1,4 M caracteres en base64. */
const MAX_LOGO_CHARS = 1_400_000;
const LOGO_PATTERN = /^data:image\/(png|svg\+xml|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_BRAND_NAME = 60;

function validateBranding(body: DefaultBodyType) {
  const input = (body ?? {}) as Record<string, unknown>;
  const fields: Record<string, string[]> = {};
  const values: Pick<MockBranding, "name" | "logo" | "logoDark"> = { name: null, logo: null, logoDark: null };
  if (input.name !== null && input.name !== undefined) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (name.length === 0 || name.length > MAX_BRAND_NAME) fields.name = [`Escribe un nombre de 1 a ${MAX_BRAND_NAME} caracteres.`];
    else values.name = name;
  }
  for (const key of ["logo", "logoDark"] as const) {
    const value = input[key];
    if (value === null || value === undefined) continue;
    if (typeof value !== "string" || !LOGO_PATTERN.test(value)) {
      fields[key] = ["Sube un PNG, SVG, JPG o WebP."];
    } else if (value.length > MAX_LOGO_CHARS) {
      fields[key] = ["El logo pesa más de 1 MB."];
    } else {
      values[key] = value;
    }
  }
  if (!values.logo && values.logoDark) fields.logo = ["Sube primero el logo para fondos claros."];
  return { fields, values };
}

/** Código por SMS del backend simulado; en producción cada envío genera uno distinto. */
export const OTP_CODE = "246810";
const AUTH_PROVIDERS: readonly MockAuthProvider[] = ["google", "microsoft"];
const PHONE_E164 = /^\+\d{8,15}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function normalizePhone(value: unknown): string {
  return typeof value === "string" ? value.replace(/[^\d+]/g, "") : "";
}

function openSession(account: MockAccount) {
  const token = `mock-${account.id}-${Math.random().toString(36).slice(2)}`;
  db.sessions.set(token, account.id);
  db.persist();
  return HttpResponse.json({ accessToken: token, user: account.user });
}

const USER_STATUSES: readonly MockUserStatus[] = ["active", "invited", "inactive"];
const USER_ROLES: readonly MockUserRole[] = ["admin", "manager", "member"];

function validateUserInput(body: DefaultBodyType, existing?: MockUser) {
  const fields: Record<string, string[]> = {};
  const input = (body ?? {}) as Partial<MockUser>;
  const name = typeof input.name === "string" ? input.name.trim() : existing?.name ?? "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : existing?.email ?? "";
  const area = typeof input.area === "string" ? input.area.trim() : existing?.area ?? "";
  const role = (input.role ?? existing?.role ?? "member") as MockUserRole;
  const status = (input.status ?? existing?.status ?? "invited") as MockUserStatus;
  if (name.length < 3) fields.name = ["El nombre debe tener al menos 3 caracteres."];
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fields.email = ["Escribe un correo válido."];
  if (db.users.some((user) => user.email === email && user.id !== existing?.id)) fields.email = ["Ya existe una persona con ese correo."];
  if (!area) fields.area = ["Elige un área."];
  if (!USER_ROLES.includes(role)) fields.role = ["Rol inválido."];
  if (!USER_STATUSES.includes(status)) fields.status = ["Estado inválido."];
  return { fields, values: { name, email, area, role, status } };
}

export const handlers = [
  // ---------- Auth ----------
  // Entrar es en dos pasos: el celular pide un código por SMS y el código abre
  // la sesión. Pedirlo responde 204 exista o no el número, para no revelar quién
  // está registrado; verificarlo sí dice si el número no es de ninguna barbería.
  http.post(`${BASE}/auth/otp/request`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json().catch(() => ({}))) as { phone?: string };
    if (!PHONE_E164.test(normalizePhone(body.phone))) return error(422, "validation_error", "Escribe un celular válido.", { fields: { phone: ["Escribe un celular válido."] } });
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${BASE}/auth/otp/verify`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json().catch(() => ({}))) as { phone?: string; code?: string };
    const account = ACCOUNTS.find((item) => item.phone === normalizePhone(body.phone));
    if (!account) return error(401, "unauthorized", "Ese número no está registrado en ninguna barbería.");
    if (body.code !== OTP_CODE) return error(401, "unauthorized", "El código no es correcto o ya venció. Pide uno nuevo.");
    return openSession(account);
  }),

  // Entrar con Google u Outlook: el frontend manda la credencial que le dio el
  // proveedor y el backend la valida y busca la cuenta vinculada. Aquí solo se
  // comprueba que el proveedor exista y se entra con la cuenta que lo tiene.
  http.post(`${BASE}/auth/oauth`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json().catch(() => ({}))) as { provider?: string; credential?: string };
    const provider = AUTH_PROVIDERS.find((item) => item === body.provider);
    if (!provider || !body.credential) return error(422, "validation_error", "Proveedor o credencial inválidos.");
    const account = ACCOUNTS.find((item) => item.providers.includes(provider));
    if (!account) return error(401, "unauthorized", "Esa cuenta no está vinculada a ninguna barbería.");
    return openSession(account);
  }),

  // Olvidé mi número: se manda al correo registrado. 204 exista o no el correo.
  http.post(`${BASE}/auth/recovery/request`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!EMAIL.test(email)) return error(422, "validation_error", "Escribe un correo válido.", { fields: { email: ["Escribe un correo válido."] } });
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE}/auth/me`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    return HttpResponse.json(account.user);
  }),

  http.post(`${BASE}/auth/logout`, async ({ request }) => {
    const token = bearer(request);
    if (token) db.sessions.delete(token);
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),

  // ---------- Dashboard ----------
  http.get(`${BASE}/dashboard/summary`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const active = db.users.filter((user) => user.status === "active").length;
    const invited = db.users.filter((user) => user.status === "invited").length;
    const byArea = Object.entries(
      db.users.reduce<Record<string, number>>((acc, user) => ({ ...acc, [user.area]: (acc[user.area] ?? 0) + 1 }), {})
    )
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count);
    const months = ["Abr", "May", "Jun", "Jul", "Ago", "Sep"];
    const signups = months.map((month, index) => ({ month, count: 4 + ((index * 7) % 9) }));
    return HttpResponse.json({
      kpis: {
        totalUsers: db.users.length,
        activeUsers: active,
        invitedUsers: invited,
        activationRate: db.users.length ? Math.round((active / db.users.length) * 100) : 0,
      },
      byArea,
      signups,
    });
  }),

  // ---------- Users ----------
  http.get(`${BASE}/users`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase().trim() ?? "";
    const status = url.searchParams.get("status") ?? "";
    const sort = url.searchParams.get("sort") ?? "name";
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Math.min(Number(url.searchParams.get("pageSize") ?? 20), 100);
    let items = db.users.filter(
      (user) =>
        (!status || user.status === status) &&
        (!search || user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search) || user.area.toLowerCase().includes(search))
    );
    const [field, direction] = sort.startsWith("-") ? [sort.slice(1), -1] : [sort, 1];
    items = [...items].sort((a, b) => {
      const av = String(a[field as keyof MockUser] ?? "");
      const bv = String(b[field as keyof MockUser] ?? "");
      return av.localeCompare(bv, "es") * direction;
    });
    return HttpResponse.json(paginate(items, page, pageSize));
  }),

  http.get(`${BASE}/users/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const user = db.users.find((item) => item.id === params.id);
    return user ? HttpResponse.json(user) : error(404, "not_found", "Esa persona no existe.");
  }),

  http.post(`${BASE}/users`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    if (account.user.role === "member") return error(403, "forbidden", "Solo administradores y líderes pueden crear personas.");
    const { fields, values } = validateUserInput(await request.json().catch(() => ({})));
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const user: MockUser = {
      id: `usr_${String(db.users.length + 1).padStart(4, "0")}`,
      ...values,
      createdAt: new Date().toISOString(),
      lastActiveAt: null,
      avatarUrl: null,
    };
    db.users = [user, ...db.users];
    db.persist();
    return HttpResponse.json(user, { status: 201 });
  }),

  http.patch(`${BASE}/users/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    const existing = db.users.find((item) => item.id === params.id);
    if (!existing) return error(404, "not_found", "Esa persona no existe.");
    const { fields, values } = validateUserInput(await request.json().catch(() => ({})), existing);
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const updated: MockUser = { ...existing, ...values };
    db.users = db.users.map((item) => (item.id === updated.id ? updated : item));
    db.persist();
    return HttpResponse.json(updated);
  }),

  http.delete(`${BASE}/users/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    if (account.user.role !== "admin") return error(403, "forbidden", "Solo un administrador puede eliminar personas.");
    const exists = db.users.some((item) => item.id === params.id);
    if (!exists) return error(404, "not_found", "Esa persona no existe.");
    db.users = db.users.filter((item) => item.id !== params.id);
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE}/company/branding`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    return HttpResponse.json(db.branding);
  }),

  http.put(`${BASE}/company/branding`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    if (account.user.role !== "admin") return error(403, "forbidden", "Solo un administrador puede cambiar la identidad de la empresa.");
    const { fields, values } = validateBranding(await request.json().catch(() => ({})));
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    db.branding = { ...values, updatedAt: new Date().toISOString() };
    db.persist();
    return HttpResponse.json(db.branding);
  }),
];
