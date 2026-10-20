import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { packCountryOf, type PackCountry } from "@/features/settings/countryPack";
import { accountById, db } from "../db";
import type { MockClient } from "../calendar/seed";
import { profileOf, saveProfile } from "./handlers";

/**
 * Importar clientes desde otro software (docs/API_CONTRACT.md, «Clientes»). Cada fila se valida, el
 * celular se lleva a E.164 con el indicativo del país de la sucursal, los repetidos (contra la base o
 * dentro del archivo) no se crean y lo rechazado vuelve con su motivo. `dryRun` revisa sin crear. Una
 * tanda se puede deshacer mientras sus clientes no tengan citas.
 */

const BASE = "*/api";
const LATENCY_MS = 300;
const MAX_ROWS = 2_000;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MIN_DIGITS = 10;
const MAX_DIGITS = 15;

type Reason = "name" | "phone" | "email" | "birthDate" | "duplicate";

function requireAuth(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const accountId = token ? db.sessions.get(token) : undefined;
  return accountById(accountId) ?? null;
}

const asRecord = (body: DefaultBodyType): Record<string, unknown> => (body && typeof body === "object" ? (body as Record<string, unknown>) : {});
const text = (value: unknown): string => (typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "");

const DIAL_CODES: Readonly<Record<PackCountry, string>> = { CO: "57", MX: "52", US: "1" };

/** El indicativo de la sucursal según su país (código o nombre); por defecto +1. */
function dialCodeOf(branchId: string): string {
  const branch = (db.settings.lists.branches as { id: string; country?: string }[]).find((item) => item.id === branchId);
  const country = packCountryOf(branch?.country);
  return country ? DIAL_CODES[country] : "1";
}

/** «300 123 4567», «(617) 555-0100», «+57 300…» → E.164; `null` si no parece un celular. */
export function toE164(raw: string, dialCode: string): string | null {
  const plus = raw.trim().startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (plus) return digits.length >= MIN_DIGITS && digits.length <= MAX_DIGITS ? `+${digits}` : null;
  if (digits.length === MIN_DIGITS) return `+${dialCode}${digits}`;
  if (digits.length > MIN_DIGITS && digits.length <= MAX_DIGITS && digits.startsWith(dialCode)) return `+${digits}`;
  return null;
}

const phoneKey = (phone: string) => phone.replace(/\D/g, "");

export const customerImportHandlers = [
  http.post(`${BASE}/customers/import`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return HttpResponse.json({ code: "unauthorized", message: "Tu sesión expiró." }, { status: 401 });
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = text(input.branchId) || "ma";
    const rows = Array.isArray(input.rows) ? input.rows.map((row) => asRecord(row as DefaultBodyType)) : [];
    if (rows.length === 0 || rows.length > MAX_ROWS) return HttpResponse.json({ code: "validation", message: `Sube entre 1 y ${MAX_ROWS} filas.`, fields: { rows: [`Sube entre 1 y ${MAX_ROWS} filas.`] } }, { status: 422 });
    const dialCode = dialCodeOf(branchId);
    const known = new Set(db.calendar.clients.filter((client) => !profileOf(client).deleted).map((client) => phoneKey(client.phone)));
    const seen = new Set<string>();
    const rejected: { row: number; name: string; reason: Reason }[] = [];
    const accepted: { name: string; phone: string; email: string; birthDate: string | null; note: string }[] = [];
    rows.forEach((row, index) => {
      const name = text(row.name).replace(/\s+/g, " ");
      const phone = toE164(text(row.phone), dialCode);
      const email = text(row.email).toLowerCase();
      const birthDate = text(row.birthDate);
      const line = index + 1;
      const reject = (reason: Reason) => rejected.push({ row: line, name, reason });
      if (name.length < 2) return reject("name");
      if (!phone) return reject("phone");
      if (email && !EMAIL.test(email)) return reject("email");
      if (birthDate && (!DAY_KEY.test(birthDate) || birthDate > new Date().toISOString().slice(0, 10))) return reject("birthDate");
      if (known.has(phoneKey(phone)) || seen.has(phoneKey(phone))) return reject("duplicate");
      seen.add(phoneKey(phone));
      accepted.push({ name, phone, email, birthDate: birthDate || null, note: text(row.note).slice(0, 500) });
    });
    if (input.dryRun === true) return HttpResponse.json({ batchId: null, created: accepted.length, rejected });

    const batchId = `imp_${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const clients: MockClient[] = accepted.map((row, index) => ({
      id: `cli_${batchId}_${index}`,
      name: row.name,
      phone: row.phone,
      type: "new",
      visits: 0,
      cancellations: 0,
      noShows: 0,
      lastVisitAt: null,
      preferredBarberId: null,
      visitEveryDays: null,
      notes: row.note ? [{ id: `note_${batchId}_${index}`, kind: "note", text: row.note, createdAt: now }] : [],
      avatarUrl: null,
    }));
    db.calendar.clients = [...db.calendar.clients, ...clients];
    clients.forEach((client, index) =>
      saveProfile(client.id, { email: accepted[index].email, branchId, country: "", state: "", city: "", address: "", zipcode: "", birthDate: accepted[index].birthDate, onlineOnly: false, blocked: false, createdAt: now, guests: [], importBatch: batchId })
    );
    db.persist();
    return HttpResponse.json({ batchId, created: clients.length, rejected }, { status: 201 });
  }),

  /** Deshacer una tanda: borra sus clientes que aún no tienen citas; los que ya tienen, se quedan. */
  http.delete(`${BASE}/customers/import/:batchId`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return HttpResponse.json({ code: "unauthorized", message: "Tu sesión expiró." }, { status: 401 });
    const batch = db.calendar.clients.filter((client) => profileOf(client).importBatch === params.batchId);
    if (batch.length === 0) return HttpResponse.json({ code: "not_found", message: "Esa importación no existe." }, { status: 404 });
    const withAppointments = new Set(db.calendar.appointments.map((item) => item.clientId));
    const removable = new Set(batch.filter((client) => !withAppointments.has(client.id)).map((client) => client.id));
    db.calendar.clients = db.calendar.clients.filter((client) => !removable.has(client.id));
    db.customers = { profiles: Object.fromEntries(Object.entries(db.customers.profiles).filter(([id]) => !removable.has(id))) };
    db.persist();
    return HttpResponse.json({ removed: removable.size, kept: batch.length - removable.size });
  }),
];
