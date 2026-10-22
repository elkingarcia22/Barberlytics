import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { rangesOf } from "@/features/team/shiftRanges";
import { holidaysFor } from "@/lib/holidays";
import { accountById, db } from "../db";
import { forbidden, isManager, sessionOf } from "../session";
import { appointmentsOn } from "../calendar/handlers";
import { parseClock } from "../calendar/seed";
import { branchCountry } from "../settings/branchRules";
import { actorOf, canEditHours, validateRange, weekDays } from "./handlers";
import { barbersOf, memberName, type MockScheduleOverride, type MockTeamMember, type MockWorkingRange } from "./seed";
import {
  addDaysKey,
  changeWeekdayFrom,
  clipToClosure,
  closureOn,
  insertPlan,
  logChange,
  MAX_CYCLE_WEEKS,
  patternRange,
  shiftRange,
  validCycle,
  weekdayOf,
  type MockClosure,
  type MockWeekPattern,
} from "./scheduleModel";

/**
 * El horario de trabajo más allá de un día suelto (docs/API_CONTRACT.md, «Equipo › Horario»;
 * investigación en docs/WORK_HOURS_RESEARCH.md):
 * - «este y los siguientes» (`/weekday`), horarios con vigencia y ciclo (`/plans`) y plantillas (`/templates`);
 * - festivos del país de la sede y cierres propios (`/closures`), que recortan a todo el equipo;
 * - antes de guardar, las citas que quedarían fuera (`/impact`, `/closures/impact`);
 * - copiar una semana, y el historial de cambios (`/log`), que además avisa al barbero.
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const CLOCK = /^\d{2}:\d{2}$/;
/** Cuántas semanas hacia delante se revisan al cambiar «este y los siguientes» o un horario. */
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
const branchParam = (request: Request) => new URL(request.url).searchParams.get("branchId") ?? "ma";
/** Gestiona la sede (plantillas, cierres, festivos): dueño o administrador. */
const managesBranch = (request: Request) => {
  const session = sessionOf(request);
  return !session || isManager(session);
};

/** El rango de la petición: `null` es «no trabaja»; algo inválido, `undefined`. */
function rangeOfInput(value: unknown): MockWorkingRange | null | undefined {
  if (value === null) return null;
  return validateRange(value) ?? undefined;
}

/** Una semana `"0".."6"` válida, o `null`. */
function weekOfInput(value: unknown): MockWeekPattern | null {
  if (!value || typeof value !== "object") return null;
  const week: MockWeekPattern = {};
  for (const day of ["0", "1", "2", "3", "4", "5", "6"]) {
    const range = rangeOfInput((value as Record<string, unknown>)[day] ?? null);
    if (range === undefined) return null;
    week[day] = range;
  }
  return week;
}

function weeksOfInput(value: unknown): MockWeekPattern[] | null {
  if (!validCycle(value)) return null;
  const weeks = value.map(weekOfInput);
  return weeks.every((week): week is MockWeekPattern => week !== null) ? weeks : null;
}

/** Si una cita cabe entera dentro de alguna franja (los descansos y los cierres no cuentan). */
function fits(ranges: readonly { start: string; end: string }[], start: number, end: number): boolean {
  return ranges.some((piece) => parseClock(piece.start) <= start && end <= parseClock(piece.end));
}

interface ImpactItem {
  id: string;
  date: string;
  start: string;
  durationMin: number;
  clientName: string;
  serviceName: string;
  barberName: string;
}

/** Las citas por atender de alguien en esas fechas que no caben en las franjas que da `rangesFor`. */
function affected(member: MockTeamMember, days: readonly string[], rangesFor: (day: string, branchId: string) => { start: string; end: string }[]): ImpactItem[] {
  const now = new Date();
  return days.flatMap((day) =>
    member.branchIds.flatMap((branchId) =>
      appointmentsOn(branchId, day)
        .filter((item) => item.barberId === member.id && ACTIVE.has(item.status) && new Date(item.start) >= now)
        .filter((item) => {
          const start = parseClock(item.start.slice(11, 16));
          return !fits(rangesFor(day, branchId), start, start + item.durationMin);
        })
        .map((item) => ({
          id: item.id,
          date: day,
          start: item.start,
          durationMin: item.durationMin,
          clientName: db.calendar.clients.find((client) => client.id === item.clientId)?.name ?? "—",
          serviceName: db.services.items.find((service) => service.id === item.serviceIds[0])?.name ?? "—",
          barberName: memberName(member),
        }))
    )
  );
}

const byStart = (a: ImpactItem, b: ImpactItem) => a.start.localeCompare(b.start);
const rangesOrEmpty = (range: MockWorkingRange | null) => (range ? rangesOf(range) : []);

export const scheduleHandlers = [
  /* ------------------------------------------------- «este y los siguientes» */
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
    // Un horario nuevo desde esa fecha: lo de antes queda como estaba (las semanas pasadas no cambian).
    changeWeekdayFrom(member, from, range);
    // La fecha desde la que rige deja de ser excepción; las de después se conservan (son decisiones aparte).
    db.team.overrides = db.team.overrides.filter((item) => !(item.memberId === member.id && item.date === from));
    logChange({ memberId: member.id, branchId: member.branchIds[0] ?? "ma", by: actorOf(request), kind: "following", date: from, notify: input.notify !== false });
    db.persist();
    return HttpResponse.json({ memberId: member.id, weekday: weekdayOf(from), range });
  }),

  /* ------------------------------------------------- citas que quedarían fuera */
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
    const items = affected(member, days, (day, branchId) => clipToClosure(rangesOrEmpty(range), closureOn(branchId, day)));
    return HttpResponse.json({ items: items.sort(byStart) });
  }),

  /* ------------------------------------------------- copiar la semana */
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
      let touched = 0;
      source.forEach((day, index) => {
        const range = shiftRange(member, day).range;
        const date = target[index];
        // Igual al horario fijo: no hace falta excepción.
        if (JSON.stringify(range) === JSON.stringify(patternRange(member, date))) return;
        next.push({ id: `ovr_${member.id}_${date}`, memberId: member.id, date, range });
        touched += 1;
      });
      if (touched > 0) logChange({ memberId: member.id, branchId, by: actorOf(request), kind: "copy", date: to, notify: input.notify !== false });
      changed += touched;
    }
    db.team.overrides = next;
    db.persist();
    return HttpResponse.json({ changed, members: members.map(memberName) });
  }),

  /* ------------------------------------------------- horarios con vigencia y ciclo */
  http.get(`${BASE}/team/schedule/plans`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const branchId = branchParam(request);
    const ids = new Set(barbersOf(db.team.members, db.team.orders, branchId).map((member) => member.id));
    const items = (db.team.plans ?? []).filter((plan) => ids.has(plan.memberId)).sort((a, b) => a.from.localeCompare(b.from));
    return HttpResponse.json({ items });
  }),

  http.post(`${BASE}/team/schedule/plans`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const memberIds = Array.isArray(input.memberIds) ? input.memberIds.map(text).filter(Boolean) : [];
    const members = memberIds.map(findMember).filter((member): member is MockTeamMember => Boolean(member));
    if (members.length === 0) return error(422, "validation", "Elige al menos a una persona.", { fields: { memberIds: ["Elige al menos a una persona."] } });
    if (members.some((member) => !canEditHours(request, member, "pattern"))) return forbidden("Tu rol no cambia el horario fijo de esta persona.");
    const from = text(input.from);
    const to = input.to === null || input.to === undefined || input.to === "" ? null : text(input.to);
    const fields: Record<string, string[]> = {};
    if (!DAY_KEY.test(from)) fields.from = ["Fecha inválida."];
    if (to !== null && (!DAY_KEY.test(to) || to < from)) fields.to = ["El fin va después del inicio."];
    const weeks = weeksOfInput(input.weeks);
    if (!weeks) fields.weeks = [`Entre 1 y ${MAX_CYCLE_WEEKS} semanas; cada día con salida después de la entrada y descansos dentro.`];
    if (Object.keys(fields).length > 0 || !weeks) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const templateName = text(input.templateName) || null;
    for (const member of members) {
      insertPlan({ id: `plan_${member.id}_${from}_${Date.now().toString(36)}`, memberId: member.id, from, to, cycleWeeks: weeks.length, weeks, templateName });
      logChange({ memberId: member.id, branchId: member.branchIds[0] ?? "ma", by: actorOf(request), kind: templateName ? "template" : "plan", date: from, notify: input.notify !== false });
    }
    // «Guardar también como plantilla».
    const saveAs = text(input.saveAsTemplate);
    if (saveAs) db.team.templates = [...(db.team.templates ?? []), { id: `tpl_${Date.now().toString(36)}`, branchId: text(input.branchId) || members[0].branchIds[0] || "ma", name: saveAs, cycleWeeks: weeks.length, weeks }];
    db.persist();
    return HttpResponse.json({ created: members.length }, { status: 201 });
  }),

  http.delete(`${BASE}/team/schedule/plans/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const plan = (db.team.plans ?? []).find((item) => item.id === params.id);
    if (!plan) return error(404, "not_found", "Ese horario no existe.");
    const member = findMember(plan.memberId);
    if (member && !canEditHours(request, member, "pattern")) return forbidden("Tu rol no cambia el horario fijo de esta persona.");
    // Solo se quita uno que aún no empieza: lo ya trabajado no se reescribe.
    const today = new Date().toISOString().slice(0, 10);
    if (plan.from <= today) return error(409, "conflict", "Ese horario ya empezó: ponle fecha de fin o crea uno nuevo desde mañana.");
    db.team.plans = (db.team.plans ?? []).filter((item) => item.id !== plan.id);
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),

  /* ------------------------------------------------- plantillas */
  http.get(`${BASE}/team/schedule/templates`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const branchId = branchParam(request);
    return HttpResponse.json({ items: (db.team.templates ?? []).filter((item) => item.branchId === branchId) });
  }),

  http.post(`${BASE}/team/schedule/templates`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!managesBranch(request)) return forbidden("Las plantillas son del dueño o el administrador.");
    const input = asRecord(await request.json().catch(() => ({})));
    const name = text(input.name);
    const weeks = weeksOfInput(input.weeks);
    if (name.length < 2 || !weeks) return error(422, "validation", "Ponle nombre y revisa las semanas.", { fields: { name: name.length < 2 ? ["Ponle un nombre."] : [] } });
    const template = { id: `tpl_${Date.now().toString(36)}`, branchId: text(input.branchId) || "ma", name, cycleWeeks: weeks.length, weeks };
    db.team.templates = [...(db.team.templates ?? []), template];
    db.persist();
    return HttpResponse.json(template, { status: 201 });
  }),

  http.delete(`${BASE}/team/schedule/templates/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!managesBranch(request)) return forbidden("Las plantillas son del dueño o el administrador.");
    db.team.templates = (db.team.templates ?? []).filter((item) => item.id !== params.id);
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),

  /* ------------------------------------------------- festivos y cierres */
  http.get(`${BASE}/team/schedule/closures`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const branchId = branchParam(request);
    const year = Number(new URL(request.url).searchParams.get("year")) || new Date().getFullYear();
    const country = branchCountry(branchId) || "Colombia";
    const holidays = holidaysFor(country, year).map((holiday) => ({ ...holiday, closed: (db.team.holidaysClosed ?? []).some((item) => item.branchId === branchId && item.date === holiday.date) }));
    const closures = (db.team.closures ?? []).filter((item) => item.branchId === branchId && item.date.startsWith(String(year))).sort((a, b) => a.date.localeCompare(b.date));
    return HttpResponse.json({ country, year, holidays, closures });
  }),

  http.put(`${BASE}/team/schedule/holidays`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!managesBranch(request)) return forbidden("Los festivos y cierres son del dueño o el administrador.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = text(input.branchId) || "ma";
    const date = text(input.date);
    if (!DAY_KEY.test(date)) return error(422, "validation", "Fecha inválida.");
    const rest = (db.team.holidaysClosed ?? []).filter((item) => !(item.branchId === branchId && item.date === date));
    db.team.holidaysClosed = input.closed === true ? [...rest, { branchId, date }] : rest;
    notifyBranch(request, branchId, date, input.notify !== false);
    db.persist();
    return HttpResponse.json({ date, closed: input.closed === true });
  }),

  http.post(`${BASE}/team/schedule/closures`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!managesBranch(request)) return forbidden("Los festivos y cierres son del dueño o el administrador.");
    const input = asRecord(await request.json().catch(() => ({})));
    const closure = closureOfInput(input);
    if ("error" in closure) return error(422, "validation", closure.error);
    db.team.closures = [...(db.team.closures ?? []).filter((item) => !(item.branchId === closure.value.branchId && item.date === closure.value.date)), closure.value];
    notifyBranch(request, closure.value.branchId, closure.value.date, input.notify !== false);
    db.persist();
    return HttpResponse.json(closure.value, { status: 201 });
  }),

  http.delete(`${BASE}/team/schedule/closures/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    if (!managesBranch(request)) return forbidden("Los festivos y cierres son del dueño o el administrador.");
    const closure = (db.team.closures ?? []).find((item) => item.id === params.id);
    db.team.closures = (db.team.closures ?? []).filter((item) => item.id !== params.id);
    if (closure) notifyBranch(request, closure.branchId, closure.date, new URL(request.url).searchParams.get("notify") !== "false");
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),

  /** Antes de cerrar: las citas de la sede que quedarían fuera (de todo el equipo). */
  http.post(`${BASE}/team/schedule/closures/impact`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const input = asRecord(await request.json().catch(() => ({})));
    const closure = closureOfInput(input);
    if ("error" in closure) return error(422, "validation", closure.error);
    const { branchId, date, open } = closure.value;
    const preview = { kind: "closure" as const, name: closure.value.name, closed: open === null, open, id: null };
    const items = barbersOf(db.team.members, db.team.orders, branchId).flatMap((member) => affected(member, [date], () => clipToClosure(rangesOrEmpty(shiftRange(member, date).range), preview)));
    return HttpResponse.json({ items: items.sort(byStart) });
  }),

  /* ------------------------------------------------- historial */
  http.get(`${BASE}/team/schedule/log`, async ({ request }) => {
    await delay(LATENCY_MS);
    if (!requireAuth(request)) return error(401, "unauthorized", "Tu sesión expiró.");
    const branchId = branchParam(request);
    const session = sessionOf(request);
    const own = session && (session.teamRole === "barbero-comision" || session.teamRole === "barbero-renta") ? session.memberId : null;
    const items = (db.team.scheduleLog ?? [])
      .filter((item) => item.branchId === branchId && (!own || item.memberId === own))
      .slice(0, 50)
      .map((item) => ({ ...item, memberName: findMember(item.memberId) ? memberName(findMember(item.memberId)!) : "—" }));
    return HttpResponse.json({ items });
  }),
];

/** Un cierre de la petición: fecha, nombre y, con horario reducido, de qué hora a qué hora abre. */
function closureOfInput(input: Record<string, unknown>): { value: MockClosure } | { error: string } {
  const date = text(input.date);
  const name = text(input.name) || "Cierre";
  if (!DAY_KEY.test(date)) return { error: "Elige el día." };
  let open: MockClosure["open"] = null;
  if (input.open && typeof input.open === "object") {
    const value = input.open as Record<string, unknown>;
    if (!CLOCK.test(text(value.start)) || !CLOCK.test(text(value.end)) || text(value.end) <= text(value.start)) return { error: "La hora de cierre va después de la de apertura." };
    open = { start: text(value.start), end: text(value.end) };
  }
  return { value: { id: text(input.id) || `cls_${Date.now().toString(36)}`, branchId: text(input.branchId) || "ma", date, name, open } };
}

/** Un cierre o un festivo cambia el día de todo el equipo de la sede: queda en el historial de cada uno. */
function notifyBranch(request: Request, branchId: string, date: string, notify: boolean) {
  for (const member of barbersOf(db.team.members, db.team.orders, branchId)) {
    logChange({ memberId: member.id, branchId, by: actorOf(request), kind: "closure", date, notify });
  }
}
