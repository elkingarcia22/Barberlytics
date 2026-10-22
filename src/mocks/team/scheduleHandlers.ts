import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { rangesOf } from "@/features/team/shiftRanges";
import { accountById, db } from "../db";
import { forbidden } from "../session";
import { appointmentsOn } from "../calendar/handlers";
import { dateKey, parseClock } from "../calendar/seed";
import { canEditHours, validateRange, weekDays } from "./handlers";
import { barbersOf, memberName, type MockScheduleOverride, type MockTeamMember, type MockWorkingRange } from "./seed";

/**
 * El horario de trabajo más allá de un día suelto (docs/API_CONTRACT.md, «Equipo › Horario»;
 * investigación en docs/WORK_HOURS_RESEARCH.md):
 * - `PUT /team/schedule/weekday`: «este y los siguientes» — cambia el horario fijo de un día de la semana
 *   desde una fecha; las excepciones de fechas posteriores se conservan.
 * - `POST /team/schedule/impact`: antes de guardar, las citas por atender que quedarían fuera del horario nuevo.
 * - `POST /team/schedule/copy-week`: copia los turnos de una semana a otra (como excepciones de cada día).
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
/** Cuántas semanas hacia delante se revisan al cambiar «este y los siguientes». */
const IMPACT_WEEKS = 8;
const ACTIVE = new Set(["scheduled", "arrived", "seated"]);

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
const findMember = (id: string) => db.team.members.find((item) => item.id === id);
const weekdayOf = (day: string): string => String(new Date(`${day}T00:00:00`).getDay());
const addDaysKey = (day: string, days: number): string => {
  const date = new Date(`${day}T00:00:00`);
  date.setDate(date.getDate() + days);
  return dateKey(date);
};

/** El turno que rige ese día: la excepción de la fecha o el horario fijo. */
function effectiveRange(member: MockTeamMember, day: string): MockWorkingRange | null {
  const override = db.team.overrides.find((item) => item.memberId === member.id && item.date === day);
  return override ? override.range : (member.schedule[weekdayOf(day)] ?? null);
}

/** El rango de la petición: `null` es «no trabaja»; algo inválido, `undefined`. */
function rangeOfInput(value: unknown): MockWorkingRange | null | undefined {
  if (value === null) return null;
  return validateRange(value) ?? undefined;
}

/** Si una cita cabe entera dentro de alguna franja del turno (los descansos no cuentan). */
function fits(range: MockWorkingRange | null, start: number, end: number): boolean {
  if (!range) return false;
  return rangesOf(range).some((piece) => parseClock(piece.start) <= start && end <= parseClock(piece.end));
}

export const scheduleHandlers = [
  http.put(`${BASE}/team/schedule/weekday`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const member = findMember(text(input.memberId));
    if (!member) return error(404, "not_found", "Esa persona no existe.");
    if (!canEditHours(request, member, "pattern")) return forbidden("Tu rol solo cambia el turno de un día; el horario fijo es del dueño o el administrador.");
    const from = text(input.from);
    if (!DAY_KEY.test(from)) return error(422, "validation", "Fecha inválida.", { fields: { from: ["Fecha inválida."] } });
    const range = rangeOfInput(input.range);
    if (range === undefined) return error(422, "validation", "La hora fin debe ser posterior a la de inicio y los descansos van dentro, sin pisarse.", { fields: { end: ["La hora fin debe ser posterior a la de inicio."] } });
    const weekday = weekdayOf(from);
    const updated: MockTeamMember = { ...member, schedule: { ...member.schedule, [weekday]: range } };
    db.team.members = db.team.members.map((item) => (item.id === member.id ? updated : item));
    // La fecha desde la que rige deja de ser excepción; las de después se conservan (son decisiones aparte).
    db.team.overrides = db.team.overrides.filter((item) => !(item.memberId === member.id && item.date === from));
    db.persist();
    return HttpResponse.json({ memberId: member.id, weekday, range });
  }),

  http.post(`${BASE}/team/schedule/impact`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const member = findMember(text(input.memberId));
    if (!member) return error(404, "not_found", "Esa persona no existe.");
    const date = text(input.date);
    if (!DAY_KEY.test(date)) return error(422, "validation", "Fecha inválida.", { fields: { date: ["Fecha inválida."] } });
    const range = rangeOfInput(input.range);
    if (range === undefined) return error(422, "validation", "Horario inválido.");
    const following = input.scope === "following";
    // «Este y los siguientes»: el mismo día de la semana, las próximas semanas, menos las fechas con su propia excepción.
    const days = following
      ? Array.from({ length: IMPACT_WEEKS }, (_, index) => addDaysKey(date, index * 7)).filter((day) => day === date || !db.team.overrides.some((item) => item.memberId === member.id && item.date === day))
      : [date];
    const now = new Date();
    const items = days.flatMap((day) =>
      member.branchIds.flatMap((branchId) =>
        appointmentsOn(branchId, day)
          .filter((item) => item.barberId === member.id && ACTIVE.has(item.status) && new Date(item.start) >= now)
          .filter((item) => {
            const start = parseClock(item.start.slice(11, 16));
            return !fits(range, start, start + item.durationMin);
          })
          .map((item) => ({
            id: item.id,
            date: day,
            start: item.start,
            durationMin: item.durationMin,
            clientName: db.calendar.clients.find((client) => client.id === item.clientId)?.name ?? "—",
            serviceName: db.services.items.find((service) => service.id === item.serviceIds[0])?.name ?? "—",
          }))
      )
    );
    return HttpResponse.json({ items: items.sort((a, b) => a.start.localeCompare(b.start)) });
  }),

  http.post(`${BASE}/team/schedule/copy-week`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = text(input.branchId) || "ma";
    const from = text(input.from);
    const to = text(input.to);
    if (!DAY_KEY.test(from) || !DAY_KEY.test(to) || from === to) return error(422, "validation", "Elige dos semanas distintas (lunes AAAA-MM-DD).");
    const source = weekDays(from);
    const target = weekDays(to);
    const members = barbersOf(db.team.members, db.team.orders, branchId).filter((member) => canEditHours(request, member, "day"));
    let changed = 0;
    const next: MockScheduleOverride[] = db.team.overrides.filter((item) => !(members.some((member) => member.id === item.memberId) && target.includes(item.date)));
    for (const member of members) {
      source.forEach((day, index) => {
        const range = effectiveRange(member, day);
        const date = target[index];
        const fixed = member.schedule[weekdayOf(date)] ?? null;
        // Igual al horario fijo: no hace falta excepción.
        if (JSON.stringify(range) === JSON.stringify(fixed)) return;
        next.push({ id: `ovr_${member.id}_${date}`, memberId: member.id, date, range });
        changed += 1;
      });
    }
    db.team.overrides = next;
    db.persist();
    return HttpResponse.json({ changed, members: members.map(memberName) });
  }),
];
