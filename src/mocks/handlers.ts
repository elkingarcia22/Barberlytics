import { supplierHandlers } from "./expenses/suppliers";
import { careerHandlers } from "./team/careers";
import { liveUser } from "./team/payoutSchedule";
import { shiftHandlers } from "./team/shifts";
import { timeClockHandlers } from "./team/timeClock";
import { barberHomeHandlers } from "./team/barberHome";
import { barberPayHandlers } from "./payroll/barber";
import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { allAccounts, accountById, db, type MockAccount, type MockAuthProvider, type MockBranding, type MockUser, type MockUserRole, type MockUserStatus } from "./db";
import { forbidden, hasStepUp, isBarber, isManager, sessionOf, stepUpRequired } from "./session";
import { calendarHandlers } from "./calendar/handlers";
import { depositHandlers } from "./calendar/deposits";
import { teamHandlers } from "./team/handlers";
import { scheduleHandlers } from "./team/scheduleHandlers";
import { memberActionHandlers } from "./team/memberActions";
import { customersHandlers } from "./customers/handlers";
import { relationshipHandlers } from "./customers/relationship";
import { customerImportHandlers } from "./customers/import";
import { rhythmHandlers } from "./customers/rhythm";
import { incomeHandlers } from "./reports/income";
import { weekHandlers } from "./reports/week";
import { menuHandlers } from "./reports/menu";
import { reviewHandlers } from "./review/checks";
import { ledgerHandlers } from "./transactions/ledger";
import { inventoryHandlers } from "./inventory/handlers";
import { notificationsHandlers } from "./notifications/handlers";
import { onboardingHandlers } from "./onboarding/handlers";
import { payableHandlers } from "./expenses/payables";
import { goalHandlers } from "./reports/goals";
import { loyaltyHandlers } from "./customers/loyalty";
import { couponHandlers } from "./marketing/coupons";
import { campaignHandlers } from "./marketing/campaigns";
import { emailTaken, phoneTaken, startBarbershop } from "./onboarding/starter";
import { workforceHandlers } from "./team/workforce";
import { servicesHandlers } from "./services/handlers";
import { productsHandlers } from "./products/handlers";
import { transactionsHandlers } from "./transactions/handlers";
import { expensesHandlers } from "./expenses/handlers";
import { payrollHandlers } from "./payroll/handlers";
import { registerHandlers } from "./register/handlers";
import { frontDeskHandlers } from "./frontDesk/handlers";
import { legalHandlers } from "./legal/handlers";
import { privacyHandlers } from "./customers/privacy";
import { legalVersion } from "@/features/legal/documents";
import { messagesHandlers } from "./messages/handlers";
import { settingsHandlers } from "./settings/handlers";
import { bookingHandlers } from "./booking/handlers";
import { ALL_BRANCHES, branchesOf, buildBusinessMetrics } from "./metrics";
import { buildBarbersMetrics, buildCustomersMetrics, buildInsightsMetrics, buildMarketingMetrics } from "./metricsTabs";
import { matchesPerson, matchesSearchText } from "@/lib/search/personSearch";

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
  const account = accountById(accountId);
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
/**
 * El bloqueo dura un rato, no para siempre: si no, cualquiera podría dejar al dueño fuera con 4 códigos falsos.
 * Crece si se repite en el mismo día (15 min → 1 h → 24 h), y el dueño lo levanta con su correo de respaldo.
 */
const LOCK_STEPS_MS = [15 * 60_000, 60 * 60_000, 24 * 60 * 60_000] as const;
const LOCK_MS = LOCK_STEPS_MS[0];
/** Pasado un día sin bloqueos, el siguiente vuelve a ser corto. */
const LOCK_MEMORY_MS = 24 * 60 * 60_000;
/** El código del correo para desbloquear vale 10 minutos y aguanta 5 intentos. */
const UNLOCK_CODE_MS = 10 * 60_000;
const MAX_UNLOCK_FAILURES = 5;
/** Pedir códigos tiene tope por número: cada SMS cuesta y se abusa de él para fraude (SMS pumping). */
const CODE_LIMIT = 5;
const CODE_WINDOW_MS = 15 * 60_000;
/** Cuánto vale una confirmación de identidad. */
const STEP_UP_MS = 5 * 60_000;
/** Un mismo mensaje para número desconocido y código malo: entrar no revela quién está registrado. */
const BAD_CODE = "El código no es correcto o ya venció. Pide uno nuevo.";

function isLocked(phone: string): boolean {
  const until = db.loginLocks.get(phone);
  if (until === undefined) return (db.loginFailures.get(phone) ?? 0) >= MAX_LOGIN_FAILURES;
  if (Date.now() < until) return true;
  db.loginLocks.delete(phone);
  db.loginFailures.delete(phone);
  return false;
}

function lockedError(phone: string) {
  const until = db.loginLocks.get(phone) ?? Date.now() + LOCK_MS;
  return error(429, "rate_limited", "Bloqueamos el acceso con este número por seguridad tras varios intentos fallidos. Espera la cuenta regresiva, desbloquéalo con tu correo de respaldo o pide ayuda a soporte.", {
    details: { reason: "locked", retryAfterSeconds: Math.max(0, Math.ceil((until - Date.now()) / 1000)) },
  });
}

/** Bloquea el número con la espera que le toca (crece si ya se bloqueó hoy) y avisa a su cuenta. */
function lockPhone(phone: string): void {
  const now = Date.now();
  const previous = db.lockHistory.get(phone);
  const count = previous && now - previous.at < LOCK_MEMORY_MS ? previous.count + 1 : 1;
  db.lockHistory.set(phone, { count, at: now });
  db.loginLocks.set(phone, now + LOCK_STEPS_MS[Math.min(count, LOCK_STEPS_MS.length) - 1]);
  // Aviso a la cuenta (si el número es de una): lo verá al entrar, sea o no quien se equivocó.
  const account = allAccounts().find((item) => item.phone === phone);
  if (account) {
    db.security = { ...db.security, events: [...db.security.events, { id: `sec_${now.toString(36)}`, accountId: account.id, kind: "locked" as const, label: "", at: new Date(now).toISOString() }].slice(-100) };
    db.persist();
  }
}

function registerFailure(phone: string) {
  const failures = (db.loginFailures.get(phone) ?? 0) + 1;
  db.loginFailures.set(phone, failures);
  if (failures >= MAX_LOGIN_FAILURES) {
    lockPhone(phone);
    return lockedError(phone);
  }
  return error(401, "unauthorized", BAD_CODE, { details: { attemptsLeft: MAX_LOGIN_FAILURES - failures } });
}

const TICKET_REASONS = ["recovery", "lockout", "other"] as const;
const OTP_CHANNELS = ["sms", "email"] as const;
const SIGNUP_TEXT_FIELDS = ["firstName", "lastName", "company", "country", "timezone"] as const;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

const DEVICE_ID = /^[\w-]{8,64}$/;
const MAX_DEVICES = 20;

/**
 * Anota el dispositivo con el que entró la cuenta. Si ya tenía otros y este es nuevo, queda un aviso de
 * seguridad para la propia cuenta («Entraste desde un dispositivo nuevo»): si no fue ella, cierra las demás
 * sesiones desde el aviso. El primer dispositivo no avisa (es el de siempre).
 */
function noteDevice(accountId: string, device: { id?: unknown; label?: unknown } | undefined): void {
  const id = typeof device?.id === "string" && DEVICE_ID.test(device.id) ? device.id : null;
  if (!id) return;
  const label = typeof device?.label === "string" ? device.label.slice(0, 60) : "";
  const now = new Date().toISOString();
  const known = db.security.devices[accountId] ?? [];
  const existing = known.find((item) => item.id === id);
  const devices = existing ? known.map((item) => (item.id === id ? { ...item, lastSeen: now, label: label || item.label } : item)) : [...known, { id, label, firstSeen: now, lastSeen: now }].slice(-MAX_DEVICES);
  const events = !existing && known.length > 0 ? [...db.security.events, { id: `sec_${Date.now().toString(36)}`, accountId, kind: "newDevice" as const, label, at: now }].slice(-100) : db.security.events;
  db.security = { devices: { ...db.security.devices, [accountId]: devices }, events };
}

function sessionFor(account: MockAccount): { accessToken: string; user: MockAccount["user"] } {
  const token = `mock-${account.id}-${Math.random().toString(36).slice(2)}`;
  db.sessions.set(token, account.id);
  db.persist();
  return { accessToken: token, user: liveUser(account) };
}

function openSession(account: MockAccount) {
  return HttpResponse.json(sessionFor(account));
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

/** Lo que sí se puede hacer mirando como otro rol: salir, marcar avisos leídos y mandar comentarios. */
const VIEW_AS_ALLOWED = ["/auth/logout", "/notifications/read", "/feedback", "/feedback/attachments"] as const;

export const handlers = [
  // «Ver como» es para mirar: con `X-View-As` el servidor no deja cambiar nada (docs/API_CONTRACT.md,
  // «Permisos en el servidor»). No sigue al resto de handlers solo si es un cambio fuera de la lista.
  http.all(`${BASE}/*`, ({ request }) => {
    if (request.method === "GET" || request.method === "HEAD" || !request.headers.get("x-view-as")) return undefined;
    const path = new URL(request.url).pathname;
    if (VIEW_AS_ALLOWED.some((allowed) => path.endsWith(allowed))) return undefined;
    return error(403, "view_as_read_only", "Estás viendo la plataforma como otro rol: es solo para mirar. Vuelve a tu perfil para hacer cambios.");
  }),

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
    if (isLocked(phone)) return lockedError(phone);
    const now = Date.now();
    const recent = (db.codeRequests.get(phone) ?? []).filter((at) => now - at < CODE_WINDOW_MS);
    if (recent.length >= CODE_LIMIT) return error(429, "rate_limited", "Pediste muchos códigos seguidos. Espera unos minutos e inténtalo otra vez.", { details: { reason: "too_many_codes" } });
    db.codeRequests.set(phone, [...recent, now]);
    return new HttpResponse(null, { status: 204 });
  }),

  // Cada fallo seguido suma; al cuarto el número queda bloqueado 15 minutos (429 con
  // `details.reason: "locked"` y `retryAfterSeconds`). Entrar lo pone en cero. Un número que no
  // es de ninguna barbería responde igual que un código malo: no se revela quién está registrado.
  http.post(`${BASE}/auth/otp/verify`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json().catch(() => ({}))) as { phone?: string; code?: string; device?: { id?: unknown; label?: unknown } };
    const phone = normalizePhone(body.phone);
    if (isLocked(phone)) return lockedError(phone);
    const account = allAccounts().find((item) => item.phone === phone);
    if (!account || body.code !== OTP_CODE) return registerFailure(phone);
    db.loginFailures.delete(phone);
    noteDevice(account.id, body.device);
    return openSession(account);
  }),

  // «No fui yo» (desde el aviso de dispositivo nuevo): cierra todas las sesiones de la cuenta menos esta.
  http.post(`${BASE}/auth/sessions/revoke-others`, async ({ request }) => {
    await delay(LATENCY_MS);
    const header = request.headers.get("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    const session = sessionOf(request);
    if (!session || !token) return error(401, "unauthorized", "Tu sesión expiró.");
    let closed = 0;
    for (const [other, accountId] of [...db.sessions.entries()]) {
      if (accountId === session.account.id && other !== token) {
        db.sessions.delete(other);
        closed += 1;
      }
    }
    db.persist();
    return HttpResponse.json({ closed });
  }),

  // Confirmar la identidad antes de algo sensible: un código nuevo al celular de la cuenta (mismos topes
  // y bloqueo que al entrar) da un token de 5 minutos que la app manda en `X-Step-Up`.
  http.post(`${BASE}/auth/step-up/request`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return error(401, "unauthorized", "Tu sesión expiró.");
    const phone = session.account.phone;
    if (isLocked(phone)) return lockedError(phone);
    const now = Date.now();
    const recent = (db.codeRequests.get(phone) ?? []).filter((at) => now - at < CODE_WINDOW_MS);
    if (recent.length >= CODE_LIMIT) return error(429, "rate_limited", "Pediste muchos códigos seguidos. Espera unos minutos e inténtalo otra vez.", { details: { reason: "too_many_codes" } });
    db.codeRequests.set(phone, [...recent, now]);
    return HttpResponse.json({ phoneHint: `•••• ${phone.slice(-4)}` });
  }),

  http.post(`${BASE}/auth/step-up/verify`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return error(401, "unauthorized", "Tu sesión expiró.");
    const phone = session.account.phone;
    if (isLocked(phone)) return lockedError(phone);
    const body = (await request.json().catch(() => ({}))) as { code?: string };
    if (body.code !== OTP_CODE) return registerFailure(phone);
    db.loginFailures.delete(phone);
    const token = `stp_${crypto.randomUUID()}`;
    const expiresAt = Date.now() + STEP_UP_MS;
    db.stepUps.set(token, { accountId: session.account.id, expiresAt });
    return HttpResponse.json({ token, expiresAt: new Date(expiresAt).toISOString() });
  }),

  // El código del registro: verifica que el celular es de quien se registra (mismos topes que al entrar).
  http.post(`${BASE}/auth/signup/code`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json().catch(() => ({}))) as { phone?: string };
    const phone = normalizePhone(body.phone);
    if (!PHONE_E164.test(phone)) return error(422, "validation_error", "Escribe un celular válido.", { fields: { phone: ["Escribe un celular válido."] } });
    if (isLocked(phone)) return lockedError(phone);
    const now = Date.now();
    const recent = (db.codeRequests.get(phone) ?? []).filter((at) => now - at < CODE_WINDOW_MS);
    if (recent.length >= CODE_LIMIT) return error(429, "rate_limited", "Pediste muchos códigos seguidos. Espera unos minutos e inténtalo otra vez.", { details: { reason: "too_many_codes" } });
    db.codeRequests.set(phone, [...recent, now]);
    return new HttpResponse(null, { status: 204 });
  }),

  // Crear cuenta: con el celular verificado y los términos aceptados, deja la barbería pendiente de activar y avisa por correo.
  http.post(`${BASE}/auth/signup`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const fields: Record<string, string[]> = {};
    for (const key of SIGNUP_TEXT_FIELDS) if (!text(body[key])) fields[key] = ["Este campo es obligatorio."];
    const email = text(body.email).toLowerCase();
    if (!EMAIL.test(email)) fields.email = ["Escribe un correo válido."];
    if (!PHONE_E164.test(normalizePhone(body.phone))) fields.phone = ["Escribe un celular válido."];
    const barbers = Number(body.barbers);
    if (!Number.isInteger(barbers) || barbers < 1) fields.barbers = ["Escribe cuántos barberos tiene tu equipo."];
    if (body.acceptTerms !== true) fields.acceptTerms = ["Acepta los términos y el tratamiento de datos para seguir."];
    // Se acepta la versión vigente de cada documento: el backend real la guarda con la fecha.
    else if (body.termsVersion !== legalVersion("terms") || body.privacyVersion !== legalVersion("privacy") || body.dpaVersion !== legalVersion("dpa")) fields.acceptTerms = ["Los términos cambiaron: recarga la página y vuelve a aceptarlos."];
    if (Object.keys(fields).length) return error(422, "validation_error", "Revisa los campos marcados.", { fields });
    // El celular se verifica en el mismo registro: sin el código que le llegó no hay cuenta.
    const phone = normalizePhone(body.phone);
    if (isLocked(phone)) return lockedError(phone);
    if (!text(body.code)) return error(422, "validation_error", "Escribe el código que te enviamos.", { fields: { code: ["Escribe el código que te enviamos."] } });
    if (text(body.code) !== OTP_CODE) return registerFailure(phone);
    db.loginFailures.delete(phone);
    // Con el celular ya verificado se puede decir si tiene cuenta: a quien no es su dueño no se le revela nada.
    if (phoneTaken(phone)) return error(409, "conflict", "Este celular ya tiene una cuenta.", { details: { reason: "phone_taken" }, fields: { phone: ["Este celular ya tiene una cuenta: entra con él."] } });
    if (emailTaken(email)) return error(409, "conflict", "Ese correo ya tiene una cuenta.", { details: { reason: "email_taken" }, fields: { email: ["Ya hay una cuenta con ese correo. Inicia sesión."] } });
    const { account, summary } = startBarbershop({ firstName: text(body.firstName), lastName: text(body.lastName), company: text(body.company), email, phone, country: text(body.country), timezone: text(body.timezone) });
    noteDevice(account.id, body.device as { id?: unknown; label?: unknown } | undefined);
    // La cuenta entra ya, con su sucursal hecha con el paquete del país.
    return HttpResponse.json({ ...sessionFor(account), setup: summary }, { status: 201 });
  }),

  // Desbloquear con el correo de respaldo: manda un código al correo de la cuenta del número bloqueado.
  // Responde 204 siempre: no revela si el número tiene cuenta, si está bloqueado ni si hay correo de respaldo.
  http.post(`${BASE}/auth/unlock/request`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json().catch(() => ({}))) as { phone?: string };
    const phone = normalizePhone(body.phone);
    if (!PHONE_E164.test(phone)) return error(422, "validation_error", "Escribe un celular válido.", { fields: { phone: ["Escribe un celular válido."] } });
    const account = allAccounts().find((item) => item.phone === phone);
    if (account && db.backupEmails[account.id] && isLocked(phone)) db.unlockRequests.set(phone, { expiresAt: Date.now() + UNLOCK_CODE_MS, failures: 0 });
    return new HttpResponse(null, { status: 204 });
  }),

  // El código del correo levanta el bloqueo y abre la sesión (con el aviso de dispositivo si toca).
  http.post(`${BASE}/auth/unlock/verify`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json().catch(() => ({}))) as { phone?: string; code?: string; device?: { id?: unknown; label?: unknown } };
    const phone = normalizePhone(body.phone);
    const pending = db.unlockRequests.get(phone);
    const account = allAccounts().find((item) => item.phone === phone);
    if (!pending || !account || pending.expiresAt < Date.now()) return error(401, "unauthorized", BAD_CODE);
    if (body.code !== OTP_CODE) {
      const failures = pending.failures + 1;
      if (failures >= MAX_UNLOCK_FAILURES) db.unlockRequests.delete(phone);
      else db.unlockRequests.set(phone, { ...pending, failures });
      return error(401, "unauthorized", BAD_CODE, { details: { attemptsLeft: Math.max(0, MAX_UNLOCK_FAILURES - failures) } });
    }
    db.unlockRequests.delete(phone);
    db.loginLocks.delete(phone);
    db.loginFailures.delete(phone);
    noteDevice(account.id, body.device);
    return openSession(account);
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
    const account = allAccounts().find((item) => item.providers.includes(provider));
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
    // El correo de respaldo sirve para recuperar la cuenta: cambiarlo pide confirmar que eres tú.
    if (!hasStepUp(request)) return stepUpRequired();
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
    return HttpResponse.json(liveUser(account));
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
      // Un barbero ve sus cifras: el barbero queda fijo en él aunque pida otro.
      const session = sessionOf(request);
      // «Todas las sucursales» es del dueño, y solo si todas cobran en la misma moneda (no se suman pesos con dólares).
      if (url.searchParams.get("branchId") === ALL_BRANCHES) {
        if (session?.teamRole !== "owner") return forbidden("«Todas las sucursales» es del dueño.");
        const currencies = new Set(branchesOf(ALL_BRANCHES).map((id) => db.settings.lists.branches.find((item) => item.id === id)?.currency ?? "USD"));
        if (currencies.size > 1) return error(409, "mixed_currency", "Las sucursales cobran en monedas distintas: mira cada una por separado.");
      }
      return HttpResponse.json(
        build({
          granularity: url.searchParams.get("granularity"),
          date: url.searchParams.get("date"),
          barberId: session && isBarber(session) ? session.memberId : url.searchParams.get("barberId"),
          branchId: url.searchParams.get("branchId"),
        })
      );
    })
  ),

  http.get(`${BASE}/metrics/insights`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!isManager(sessionOf(request)!)) return forbidden("Los avisos del negocio son del dueño y el administrador.");
    return HttpResponse.json(buildInsightsMetrics(new Date(), new URL(request.url).searchParams.get("branchId") ?? "ma"));
  }),

  // ---------- Users ----------
  http.get(`${BASE}/users`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const sort = url.searchParams.get("sort") ?? "name";
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Math.min(Number(url.searchParams.get("pageSize") ?? 20), 100);
    let items = db.users.filter(
      (user) =>
        (!status || user.status === status) &&
        (!search || matchesPerson(user, search) || matchesSearchText(user.area, search))
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
  ...depositHandlers,

  // ---------- Equipo ----------
  ...workforceHandlers,
  ...memberActionHandlers,
  ...scheduleHandlers,
  ...teamHandlers,

  // ---------- Clientes ----------
  ...loyaltyHandlers,
  ...campaignHandlers,
  ...couponHandlers,
  ...relationshipHandlers,
  ...customerImportHandlers,
  ...rhythmHandlers,
  ...incomeHandlers,
  ...weekHandlers,
  ...menuHandlers,
  ...reviewHandlers,
  ...ledgerHandlers,
  ...inventoryHandlers,
  ...notificationsHandlers,
  ...onboardingHandlers,
  ...customersHandlers,

  // ---------- Servicios ----------
  ...servicesHandlers,

  // ---------- Productos ----------
  ...productsHandlers,

  // ---------- Transacciones ----------
  ...transactionsHandlers,

  // ---------- Gastos ----------
  ...payableHandlers,
  ...supplierHandlers,
  ...goalHandlers,
  ...expensesHandlers,

  // ---------- Nómina ----------
  ...barberPayHandlers,
  ...barberHomeHandlers,
  ...timeClockHandlers,
  ...shiftHandlers,
  ...careerHandlers,
  ...payrollHandlers,
  ...registerHandlers,
  ...frontDeskHandlers,
  ...legalHandlers,
  ...privacyHandlers,
  ...messagesHandlers,

  // ---------- Configuración ----------
  ...settingsHandlers,
  // La reserva en línea: la cara pública de la barbería, sin sesión de la app.
  ...bookingHandlers,
];
