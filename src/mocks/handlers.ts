import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { ACCOUNTS, db, type MockAccount, type MockAuthProvider, type MockBranding, type MockUser, type MockUserRole, type MockUserStatus } from "./db";
import { calendarHandlers } from "./calendar/handlers";
import { teamHandlers } from "./team/handlers";
import { customersHandlers } from "./customers/handlers";
import { relationshipHandlers } from "./customers/relationship";
import { incomeHandlers } from "./reports/income";
import { inventoryHandlers } from "./inventory/handlers";
import { servicesHandlers } from "./services/handlers";
import { productsHandlers } from "./products/handlers";
import { transactionsHandlers } from "./transactions/handlers";
import { expensesHandlers } from "./expenses/handlers";
import { payrollHandlers } from "./payroll/handlers";
import { registerHandlers } from "./register/handlers";
import { messagesHandlers } from "./messages/handlers";
import { settingsHandlers } from "./settings/handlers";
import { bookingHandlers } from "./booking/handlers";
import { buildBusinessMetrics } from "./metrics";
import { buildBarbersMetrics, buildCustomersMetrics, buildInsightsMetrics, buildMarketingMetrics } from "./metricsTabs";

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

/** Intentos fallidos seguidos con un mismo celular antes de bloquearlo. */
export const MAX_LOGIN_FAILURES = 4;

function lockedError() {
  return error(429, "rate_limited", "Bloqueamos el acceso con este número por seguridad tras varios intentos fallidos.", {
    details: { reason: "locked" },
  });
}

function registerFailure(phone: string, message: string) {
  const failures = (db.loginFailures.get(phone) ?? 0) + 1;
  db.loginFailures.set(phone, failures);
  if (failures >= MAX_LOGIN_FAILURES) return lockedError();
  return error(401, "unauthorized", message, { details: { attemptsLeft: MAX_LOGIN_FAILURES - failures } });
}

const TICKET_REASONS = ["recovery", "lockout", "other"] as const;
const OTP_CHANNELS = ["sms", "email"] as const;
const SIGNUP_TEXT_FIELDS = ["firstName", "lastName", "company", "country", "timezone"] as const;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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
  // `channel: "email"` manda el código al correo de respaldo de la cuenta en vez
  // de por SMS. Responde 204 siempre: no revela si el número existe ni si su
  // cuenta tiene correo de respaldo. El código vale igual llegue por donde llegue.
  http.post(`${BASE}/auth/otp/request`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json().catch(() => ({}))) as { phone?: string; channel?: string };
    const phone = normalizePhone(body.phone);
    if (!PHONE_E164.test(phone)) return error(422, "validation_error", "Escribe un celular válido.", { fields: { phone: ["Escribe un celular válido."] } });
    if (body.channel !== undefined && !OTP_CHANNELS.includes(body.channel as (typeof OTP_CHANNELS)[number])) {
      return error(422, "validation_error", "Canal inválido.", { fields: { channel: ["Elige SMS o correo."] } });
    }
    if ((db.loginFailures.get(phone) ?? 0) >= MAX_LOGIN_FAILURES) return lockedError();
    return new HttpResponse(null, { status: 204 });
  }),

  // Cada fallo seguido suma; al cuarto el número queda bloqueado (429 con
  // `details.reason: "locked"`) hasta que soporte lo libere. Entrar lo pone en cero.
  http.post(`${BASE}/auth/otp/verify`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json().catch(() => ({}))) as { phone?: string; code?: string };
    const phone = normalizePhone(body.phone);
    if ((db.loginFailures.get(phone) ?? 0) >= MAX_LOGIN_FAILURES) return lockedError();
    const account = ACCOUNTS.find((item) => item.phone === phone);
    if (!account) return registerFailure(phone, "Ese número no está registrado en ninguna barbería.");
    if (body.code !== OTP_CODE) return registerFailure(phone, "El código no es correcto o ya venció. Pide uno nuevo.");
    db.loginFailures.delete(phone);
    return openSession(account);
  }),

  // Crear cuenta: deja la barbería pendiente de activar y avisa por correo.
  http.post(`${BASE}/auth/signup`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const fields: Record<string, string[]> = {};
    for (const key of SIGNUP_TEXT_FIELDS) if (!text(body[key])) fields[key] = ["Este campo es obligatorio."];
    const email = text(body.email).toLowerCase();
    if (!EMAIL.test(email)) fields.email = ["Escribe un correo válido."];
    else if (ACCOUNTS.some((item) => item.email === email)) fields.email = ["Ya hay una cuenta con ese correo. Inicia sesión."];
    if (!PHONE_E164.test(normalizePhone(body.phone))) fields.phone = ["Escribe un celular válido."];
    const barbers = Number(body.barbers);
    if (!Number.isInteger(barbers) || barbers < 1) fields.barbers = ["Escribe cuántos barberos tiene tu equipo."];
    if (Object.keys(fields).length) return error(422, "validation_error", "Revisa los campos marcados.", { fields });
    return new HttpResponse(null, { status: 204 });
  }),

  // Ticket a soporte: sin sesión, desde el login. Devuelve el número para seguirlo.
  http.post(`${BASE}/support/tickets`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const fields: Record<string, string[]> = {};
    if (!text(body.name)) fields.name = ["Escribe tu nombre completo."];
    if (!text(body.company)) fields.company = ["Escribe el nombre de tu barbería."];
    if (!EMAIL.test(text(body.email))) fields.email = ["Escribe un correo válido."];
    if (!PHONE_E164.test(normalizePhone(body.phone))) fields.phone = ["Escribe un celular válido."];
    if (!text(body.message)) fields.message = ["Cuéntanos qué pasó."];
    if (!TICKET_REASONS.includes(body.reason as (typeof TICKET_REASONS)[number])) fields.reason = ["Motivo inválido."];
    if (Object.keys(fields).length) return error(422, "validation_error", "Revisa los campos marcados.", { fields });
    const id = `BL-${String(1000 + Math.floor(Math.random() * 9000))}`;
    return HttpResponse.json({ id }, { status: 201 });
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

  // Correo de respaldo: es de la persona, no de la barbería. Configurarlo pide
  // verificarlo con un código; hasta entonces no sirve para entrar.
  http.get(`${BASE}/auth/backup-email`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    return HttpResponse.json({ email: db.backupEmails[account.id] ?? null });
  }),

  http.post(`${BASE}/auth/backup-email`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    const body = (await request.json().catch(() => ({}))) as { email?: unknown };
    const email = text(body.email).toLowerCase();
    if (!EMAIL.test(email)) return error(422, "validation_error", "Escribe un correo válido.", { fields: { email: ["Escribe un correo válido."] } });
    db.pendingBackupEmails.set(account.id, email);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${BASE}/auth/backup-email/verify`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    const body = (await request.json().catch(() => ({}))) as { email?: unknown; code?: unknown };
    const email = text(body.email).toLowerCase();
    if (db.pendingBackupEmails.get(account.id) !== email) {
      return error(409, "conflict", "Pide un código para ese correo antes de verificarlo.");
    }
    if (body.code !== OTP_CODE) {
      return error(422, "validation_error", "El código no es correcto o ya venció.", { fields: { code: ["El código no es correcto o ya venció."] } });
    }
    db.pendingBackupEmails.delete(account.id);
    db.backupEmails = { ...db.backupEmails, [account.id]: email };
    db.persist();
    return HttpResponse.json({ email });
  }),

  http.delete(`${BASE}/auth/backup-email`, async ({ request }) => {
    await delay(LATENCY_MS);
    const account = requireAuth(request);
    if (!account) return error(401, "unauthorized", "Tu sesión expiró.");
    db.backupEmails = Object.fromEntries(Object.entries(db.backupEmails).filter(([id]) => id !== account.id));
    db.pendingBackupEmails.delete(account.id);
    db.persist();
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
  // Feedback de campañas: en producción lo atiende la función de Vercel
  // `api/feedback`, que lo guarda en la hoja de Google de la campaña. Aquí se
  // guarda en memoria para poder inspeccionarlo.
  http.post(`${BASE}/feedback`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const comment = typeof body?.comment === "string" ? body.comment.trim() : "";
    if (!body || typeof body.campaignId !== "string" || comment.length < 5) {
      return error(422, "validation_error", "El comentario necesita al menos 5 caracteres.");
    }
    db.feedback.push({ ...body, receivedAt: new Date().toISOString() });
    return HttpResponse.json({ ok: true });
  }),
  // Adjuntos del feedback: en producción el servidor abre una sesión de subida
  // de Drive y el navegador le manda los bytes; aquí las dos mitades son mock.
  http.post(`${BASE}/feedback/attachments`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json().catch(() => null)) as { name?: unknown; size?: unknown } | null;
    if (!body || typeof body.name !== "string" || typeof body.size !== "number") {
      return error(422, "validation_error", "Solo se aceptan imágenes JPG o PNG de hasta 5 MB y videos de hasta 30 MB.");
    }
    const id = `adjunto-mock-${String(db.feedbackUploads.length + 1).padStart(4, "0")}`;
    db.feedbackUploads.push({ id, name: body.name, size: body.size });
    return HttpResponse.json({ ok: true, uploadUrl: new URL(`/api/feedback/attachments/upload/${id}`, request.url).toString() });
  }),
  http.put(`${BASE}/feedback/attachments/upload/:id`, async ({ params }) => {
    await delay(LATENCY_MS);
    return HttpResponse.json({ id: String(params.id) });
  }),
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

  // ---------- Métricas ----------
  ...(
    [
      ["business", buildBusinessMetrics],
      ["customers", buildCustomersMetrics],
      ["barbers", buildBarbersMetrics],
      ["marketing", buildMarketingMetrics],
    ] as const
  ).map(([tab, build]) =>
    http.get(`${BASE}/metrics/${tab}`, async ({ request }) => {
      await delay(LATENCY_MS);
      if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
      const url = new URL(request.url);
      return HttpResponse.json(
        build({
          granularity: url.searchParams.get("granularity"),
          date: url.searchParams.get("date"),
          barberId: url.searchParams.get("barberId"),
          branchId: url.searchParams.get("branchId"),
        })
      );
    })
  ),

  http.get(`${BASE}/metrics/insights`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    return HttpResponse.json(buildInsightsMetrics(new Date(), new URL(request.url).searchParams.get("branchId") ?? "ma"));
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

  // ---------- Calendario ----------
  ...calendarHandlers,

  // ---------- Equipo ----------
  ...teamHandlers,

  // ---------- Clientes ----------
  ...relationshipHandlers,
  ...incomeHandlers,
  ...inventoryHandlers,
  ...customersHandlers,

  // ---------- Servicios ----------
  ...servicesHandlers,

  // ---------- Productos ----------
  ...productsHandlers,

  // ---------- Transacciones ----------
  ...transactionsHandlers,

  // ---------- Gastos ----------
  ...expensesHandlers,

  // ---------- Nómina ----------
  ...payrollHandlers,
  ...registerHandlers,
  ...messagesHandlers,

  // ---------- Configuración ----------
  ...settingsHandlers,
  // La reserva en línea: la cara pública de la barbería, sin sesión de la app.
  ...bookingHandlers,
];
