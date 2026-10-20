import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { db } from "../db";
import { forbidden, isManager, sessionOf, unauthorized, type MockSession } from "../session";
import { hoursOn } from "../calendar/handlers";
import { dateKey } from "../calendar/seed";
import { hashOf } from "../customers/seed";
import { memberName, type MockTeamMember, type MockTeamRole } from "./seed";
import type { MockTimeEntry } from "./operationsState";

/**
 * El fichaje (docs/API_CONTRACT.md, «Equipo › Fichaje»): quien es empleado —comisión, salario, recepción, administrador—
 * marca su entrada y su salida desde la app; quien gestiona ve la semana de cada uno contra su horario y las llegadas
 * tarde. El barbero de renta no ficha: decide su propio tiempo (y fichar podría leerse como relación laboral).
 */

const BASE = "*/api";
const LATENCY_MS = 150;
const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;
/** Minutos de gracia: llegar más tarde que esto después de su hora cuenta como tarde. */
export const LATE_GRACE_MINUTES = 10;
const MAX_RANGE_DAYS = 31;
const DEMO_DAYS = 14;
const CLOCKS: readonly MockTeamRole[] = ["admin", "recepcion", "barbero-comision"];
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

const asRecord = (body: DefaultBodyType): Record<string, unknown> => (body && typeof body === "object" ? (body as Record<string, unknown>) : {});
const error = (status: number, code: string, message: string) => HttpResponse.json({ code, message }, { status });
const minutesOf = (clock: string) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5));
const localIso = (day: string, minute: number) => new Date(`${day}T${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}:00`).toISOString();

export const clocks = (member: Pick<MockTeamMember, "role"> | undefined): boolean => Boolean(member && CLOCKS.includes(member.role));

/** Demo: dos semanas de fichajes de cada empleado, alrededor de su horario (alguna llegada tarde, alguna salida temprano). */
function seedEntries(now: Date): MockTimeEntry[] {
  const entries: MockTimeEntry[] = [];
  for (const member of db.team.members.filter((item) => clocks(item) && item.status === "active")) {
    for (let back = DEMO_DAYS; back >= 1; back -= 1) {
      const day = dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - back));
      const ranges = hoursOn(member, day);
      if (ranges.length === 0) continue;
      const h = hashOf(`${member.id}:${day}`, 3);
      const late = h % 7 === 0 ? 12 + (h % 20) : (h % 9) - 4;
      const start = minutesOf(ranges[0].start) + late;
      const end = minutesOf(ranges[ranges.length - 1].end) + ((h >>> 4) % 15) - 5;
      entries.push({ id: `clk_${member.id}_${day}`, branchId: member.homeBranchId, memberId: member.id, clockIn: localIso(day, start), clockOut: localIso(day, end), by: memberName(member) });
    }
  }
  return entries;
}

export function timeEntries(now = new Date()): MockTimeEntry[] {
  if (!db.team.timeEntries) {
    db.team = { ...db.team, timeEntries: seedEntries(now) };
    db.persist();
  }
  return db.team.timeEntries ?? [];
}

const openEntryOf = (memberId: string) => timeEntries().find((item) => item.memberId === memberId && item.clockOut === null) ?? null;

/** La hoja de horas de un rango: por persona, días, minutos fichados contra los de su horario y llegadas tarde. */
export function timesheet(branchId: string, from: string, to: string, now = new Date()) {
  const today = dateKey(now);
  const last = to < today ? to : today;
  const days: string[] = [];
  for (let cursor = new Date(`${from}T12:00:00`); dateKey(cursor) <= last; cursor = new Date(cursor.getTime() + DAY_MS)) days.push(dateKey(cursor));
  const entries = timeEntries(now).filter((item) => item.branchId === branchId && dateKey(new Date(item.clockIn)) >= from && dateKey(new Date(item.clockIn)) <= last);
  const rows = db.team.members
    .filter((member) => clocks(member) && member.branchIds.includes(branchId) && member.status !== "inactive")
    .map((member) => {
      const mine = entries.filter((item) => item.memberId === member.id).sort((a, b) => a.clockIn.localeCompare(b.clockIn));
      const worked = Math.round(mine.reduce((sum, item) => sum + ((item.clockOut ? new Date(item.clockOut) : now).getTime() - new Date(item.clockIn).getTime()) / MINUTE_MS, 0));
      // Lo de su horario hasta ayer; hoy solo si ya fichó (el turno de hoy aún no termina).
      const clockedToday = mine.some((item) => dateKey(new Date(item.clockIn)) === today);
      const scheduled = days.filter((day) => day < today || (day === today && clockedToday)).reduce((sum, day) => sum + hoursOn(member, day).reduce((total, range) => total + minutesOf(range.end) - minutesOf(range.start), 0), 0);
      const lateDays = days.filter((day) => {
        const first = mine.find((item) => dateKey(new Date(item.clockIn)) === day);
        const range = hoursOn(member, day)[0];
        if (!first || !range) return false;
        const clockMinute = new Date(first.clockIn).getHours() * 60 + new Date(first.clockIn).getMinutes();
        return clockMinute > minutesOf(range.start) + LATE_GRACE_MINUTES;
      });
      const absentDays = days.filter((day) => day < today && hoursOn(member, day).length > 0 && !mine.some((item) => dateKey(new Date(item.clockIn)) === day));
      return {
        memberId: member.id,
        name: memberName(member),
        role: member.role,
        workedMinutes: worked,
        scheduledMinutes: scheduled,
        daysWorked: new Set(mine.map((item) => dateKey(new Date(item.clockIn)))).size,
        lateDays,
        absentDays,
        open: mine.find((item) => item.clockOut === null) ?? null,
        entries: mine,
      };
    });
  return { from, to, rows };
}

function clockStatus(session: MockSession, branchId: string) {
  const member = db.team.members.find((item) => item.id === session.memberId);
  const open = member ? openEntryOf(member.id) : null;
  const today = dateKey(new Date());
  const range = member ? hoursOn(member, today) : [];
  return { canClock: clocks(member), branchId, open, today: timeEntries().filter((item) => item.memberId === session.memberId && dateKey(new Date(item.clockIn)) === today), shift: range.length > 0 ? { start: range[0].start, end: range[range.length - 1].end } : null };
}

export const timeClockHandlers = [
  http.get(`${BASE}/team/clock/me`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    return HttpResponse.json(clockStatus(session, new URL(request.url).searchParams.get("branchId") ?? "ma"));
  }),

  // Marcar entrada o salida: la propia persona, si ficha.
  http.post(`${BASE}/team/clock`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    const member = db.team.members.find((item) => item.id === session.memberId);
    if (!clocks(member)) return forbidden("Tu rol no ficha: el barbero de renta y el dueño manejan su propio tiempo.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = typeof input.branchId === "string" && input.branchId ? input.branchId : member!.homeBranchId;
    const open = openEntryOf(member!.id);
    const now = new Date().toISOString();
    if (input.action === "in") {
      if (open) return error(409, "conflict", "Ya marcaste la entrada.");
      db.team = { ...db.team, timeEntries: [...timeEntries(), { id: `clk_${Date.now().toString(36)}`, branchId, memberId: member!.id, clockIn: now, clockOut: null, by: session.account.user.name }] };
    } else if (input.action === "out") {
      if (!open) return error(409, "conflict", "No tienes una entrada abierta.");
      db.team = { ...db.team, timeEntries: timeEntries().map((item) => (item.id === open.id ? { ...item, clockOut: now } : item)) };
    } else return error(422, "validation", "Di si es entrada o salida.");
    db.persist();
    return HttpResponse.json(clockStatus(session, branchId));
  }),

  http.get(`${BASE}/team/timesheet`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("Los fichajes del equipo los ve el dueño o el administrador.");
    const params = new URL(request.url).searchParams;
    const branchId = params.get("branchId") ?? "";
    const from = params.get("from") ?? "";
    const to = params.get("to") ?? "";
    if (!branchId || !DAY_KEY.test(from) || !DAY_KEY.test(to) || to < from) return error(422, "validation", "El rango de fechas no es válido.");
    if ((new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime()) / DAY_MS >= MAX_RANGE_DAYS) return error(422, "validation", "Elige hasta un mes.");
    return HttpResponse.json(timesheet(branchId, from, to));
  }),
];
