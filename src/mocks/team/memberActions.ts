import { delay, http, HttpResponse } from "msw";
import { db } from "../db";
import { forbidden, hasStepUp, sessionOf, stepUpRequired, unauthorized } from "../session";
import { branchNow } from "../settings/branchRules";
import { addMember, buildMember, validateProfile } from "./handlers";
import { managesMember } from "./memberAccess";
import { isBarberRole, memberName, type MockTeamRole } from "./seed";

/**
 * Lo que se hace con varias personas del equipo a la vez (docs/API_CONTRACT.md, «Equipo»): recordar la
 * invitación, desactivar y cargar una lista; y ver la cuenta bancaria completa de una ficha, con la
 * identidad confirmada. Todo lo hace quien gestiona a esas personas (el dueño a todos; el administrador,
 * de recepción para abajo).
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const HOUR_MS = 3_600_000;
/** No se le insiste a nadie más de una vez al día. */
const REMIND_EVERY_HOURS = 24;
const MAX_IMPORT = 100;
/** Los roles que se cargan en lista; dueño y administrador se dan uno a uno y con la identidad confirmada. */
const IMPORTABLE: readonly MockTeamRole[] = ["barbero-comision", "barbero-renta", "recepcion"];

const idsOf = (input: unknown): string[] => (Array.isArray(input) ? input.filter((id): id is string => typeof id === "string").slice(0, MAX_IMPORT) : []);
const readJson = async (request: Request): Promise<Record<string, unknown>> => {
  const body = (await request.json().catch(() => null)) as unknown;
  return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
};

/** Las citas por venir de un barbero: al desactivarlo hay que reasignarlas. */
const upcomingOf = (memberId: string): number =>
  db.calendar.appointments.filter((item) => item.barberId === memberId && item.status === "scheduled" && item.start >= branchNow(item.branchId)).length;

type Skip<R extends string> = { id: string; name: string; reason: R };

export const memberActionHandlers = [
  // Recordar la invitación a quien aún no entró. Hoy sale simulada (falta el correo y el SMS reales).
  http.post(`${BASE}/team/members/remind`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    const ids = idsOf((await readJson(request)).ids);
    const now = new Date();
    const sent: string[] = [];
    const skipped: Skip<"notInvited" | "recent" | "forbidden">[] = [];
    for (const id of ids) {
      const member = db.team.members.find((item) => item.id === id);
      if (!member) continue;
      const name = memberName(member);
      if (!managesMember(session, member.role)) skipped.push({ id, name, reason: "forbidden" });
      else if (member.status !== "invited") skipped.push({ id, name, reason: "notInvited" });
      else if (member.lastInviteAt && now.getTime() - Date.parse(member.lastInviteAt) < REMIND_EVERY_HOURS * HOUR_MS) skipped.push({ id, name, reason: "recent" });
      else sent.push(id);
    }
    if (sent.length > 0) {
      db.team.members = db.team.members.map((item) => (sent.includes(item.id) ? { ...item, lastInviteAt: now.toISOString() } : item));
      db.persist();
    }
    return HttpResponse.json({ sent: sent.length, simulated: true, skipped });
  }),

  // Desactivar: deja de salir en la agenda, la reserva y la fila; su historia y su nómina quedan.
  http.post(`${BASE}/team/members/deactivate`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    const ids = idsOf((await readJson(request)).ids);
    const now = new Date().toISOString();
    const done: { id: string; name: string; upcoming: number }[] = [];
    const skipped: Skip<"self" | "forbidden" | "inactive">[] = [];
    for (const id of ids) {
      const member = db.team.members.find((item) => item.id === id);
      if (!member) continue;
      const name = memberName(member);
      if (member.id === session.memberId) skipped.push({ id, name, reason: "self" });
      else if (!managesMember(session, member.role)) skipped.push({ id, name, reason: "forbidden" });
      else if (member.status === "inactive") skipped.push({ id, name, reason: "inactive" });
      else done.push({ id, name, upcoming: upcomingOf(id) });
    }
    if (done.length > 0) {
      const off = new Set(done.map((item) => item.id));
      db.team.members = db.team.members.map((item) => (off.has(item.id) ? { ...item, status: "inactive", deactivatedAt: now } : item));
      // Fuera de la fila sin cita y de «sin preferencia»: ya no recibe clientes nuevos.
      db.team.orders = db.team.orders.map((order) => ({
        ...order,
        walkIn: order.walkIn.map((entry) => (off.has(entry.memberId) ? { ...entry, enabled: false } : entry)),
        noPreference: order.noPreference.map((entry) => (off.has(entry.memberId) ? { ...entry, enabled: false } : entry)),
      }));
      db.persist();
    }
    return HttpResponse.json({ deactivated: done, skipped });
  }),

  // Cargar una lista (de un CSV o pegada): entran invitados; lo que no sirve vuelve con su motivo.
  http.post(`${BASE}/team/members/import`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    const input = await readJson(request);
    const branchId = typeof input.branchId === "string" && input.branchId ? input.branchId : "ma";
    const rows = Array.isArray(input.items) ? input.items.slice(0, MAX_IMPORT) : [];
    if (rows.length === 0) return HttpResponse.json({ code: "validation", message: "La lista está vacía.", fields: { items: ["required"] } }, { status: 422 });
    const defaultLevel = db.team.levels[0]?.id ?? null;
    const created: { id: string; name: string }[] = [];
    const rejected: { row: number; message: string }[] = [];
    rows.forEach((raw, index) => {
      const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
      const role = IMPORTABLE.find((item) => item === row.role);
      if (!role) return rejected.push({ row: index + 1, message: "Rol no válido: barbero por comisión, barbero de renta o recepción." });
      if (!managesMember(session, role)) return rejected.push({ row: index + 1, message: "Tu rol no puede dar de alta ese rol." });
      const { fields, values } = validateProfile({ ...row, levelId: isBarberRole(role) ? (row.levelId ?? defaultLevel) : null });
      const phone = values.phone.replace(/\D/g, "");
      if (!fields.phone && db.team.members.some((member) => member.phone.replace(/\D/g, "") === phone)) fields.phone = ["Ya hay alguien con ese celular."];
      const first = Object.values(fields)[0]?.[0];
      if (first) return rejected.push({ row: index + 1, message: first });
      const member = buildMember({}, role, values, branchId);
      addMember(member);
      created.push({ id: member.id, name: memberName(member) });
    });
    db.persist();
    return HttpResponse.json({ created, rejected }, { status: created.length > 0 ? 201 : 200 });
  }),

  // El número completo de la cuenta: quien gestiona o la propia persona, con la identidad confirmada.
  http.get(`${BASE}/team/members/:id/bank`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    const member = db.team.members.find((item) => item.id === params.id);
    if (!member) return HttpResponse.json({ code: "not_found", message: "Esa persona no existe." }, { status: 404 });
    if (member.id !== session.memberId && !managesMember(session, member.role)) return forbidden("La cuenta bancaria la ve quien gestiona al equipo o la propia persona.");
    if (!hasStepUp(request)) return stepUpRequired();
    return HttpResponse.json({ bankName: member.payments?.bankName ?? "", accountNumber: member.payments?.accountNumber ?? "" });
  }),
];
