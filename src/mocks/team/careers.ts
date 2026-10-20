import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { db } from "../db";
import { forbidden, isBarber, isManager, sessionOf, unauthorized } from "../session";
import { ratingOf } from "../booking/reviews";
import { memberName, isBarberRole, type MockCompensation, type MockLevel, type MockLevelCriteria, type MockPayments, type MockTeamMember, type MockTeamRole } from "./seed";
import { memberPerformance } from "./workforce";
import { applyDuePayoutChanges } from "./payoutSchedule";
import type { MockPayoutChange } from "./operationsState";

/**
 * La carrera de cada barbero (docs/API_CONTRACT.md, «Equipo › Niveles y forma de pago»): los niveles con su factor de
 * precio y lo que hace falta para llegar a cada uno, el avance de cada barbero hacia el siguiente, el ascenso (que puede
 * ajustar sus precios al nivel) y el cambio de forma de pago —comisión, salario o renta— con fecha efectiva.
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_MS = 30.44 * 86_400_000;
const DEFAULT_RENT: MockPayments = { rentBase: 320, walkInDeduction: 20, newClientDeduction: 20, noPreferenceDeduction: 15, bankName: "", accountNumber: "" };
const DEFAULT_COMMISSION: MockCompensation = { type: "commission", basic: 45, recurring: null, walkIn: null, noPreference: null, newClient: null, productPercent: 10, salary: null, scale: [] };

const asRecord = (body: DefaultBodyType): Record<string, unknown> => (body && typeof body === "object" ? (body as Record<string, unknown>) : {});
const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const error = (status: number, code: string, message: string, extra: Record<string, unknown> = {}) => HttpResponse.json({ code, message, ...extra }, { status });
const round = (value: number) => Math.round(value * 100) / 100;
const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const EMPTY_CRITERIA: MockLevelCriteria = { services90: null, rebookRate: null, rating: null, months: null };

/** Un número positivo, `null` si viene vacío, o `"bad"`. */
const positive = (value: unknown, max: number): number | null | "bad" => (value === null || value === undefined || value === "" ? null : Number(value) > 0 && Number(value) <= max ? round(Number(value)) : "bad");

/** Cómo va un barbero hacia el nivel que sigue: lo que lleva en 90 días frente a lo que pide ese nivel. */
export function levelProgress(member: MockTeamMember, branchId: string, now = new Date()) {
  const levels = db.team.levels;
  const index = levels.findIndex((level) => level.id === member.levelId);
  const next: MockLevel | null = levels[index + 1] ?? null;
  const performance = memberPerformance(member.id, branchId, now);
  const rating = ratingOf(member.id);
  const months = Math.floor((now.getTime() - new Date(member.createdAt).getTime()) / MONTH_MS);
  const have = { services90: performance.services, rebookRate: performance.rebookRate, rating: rating.reviews > 0 ? rating.rating : null, months };
  const criteria = next?.criteria ?? EMPTY_CRITERIA;
  const checks = (Object.keys(criteria) as (keyof MockLevelCriteria)[])
    .filter((key) => criteria[key] !== null)
    .map((key) => ({ id: key, need: criteria[key] as number, have: have[key], met: have[key] !== null && (have[key] as number) >= (criteria[key] as number) }));
  return {
    memberId: member.id,
    name: memberName(member),
    level: index >= 0 ? { id: levels[index].id, name: levels[index].name } : null,
    next: next ? { id: next.id, name: next.name, priceFactor: next.priceFactor ?? 1 } : null,
    have,
    checks,
    ready: next !== null && checks.length > 0 && checks.every((check) => check.met),
  };
}

/** Lo que se ve de un cambio de forma de pago. */
const changeView = (change: MockPayoutChange) => ({ id: change.id, memberId: change.memberId, effectiveDate: change.effectiveDate, from: change.from, to: change.to, status: change.status, note: change.note, createdBy: change.createdBy, createdAt: change.createdAt, after: change.after });

export const careerHandlers = [
  // El factor de precio y los criterios de un nivel. Dueño o administrador.
  http.put(`${BASE}/team/levels/:id/rules`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("Los niveles los define el dueño o el administrador.");
    const level = db.team.levels.find((item) => item.id === params.id);
    if (!level) return error(404, "not_found", "Ese nivel no existe.");
    const input = asRecord(await request.json().catch(() => ({})));
    const raw = asRecord(input.criteria as DefaultBodyType);
    const factor = Number(input.priceFactor);
    const criteria = { services90: positive(raw.services90, 5000), rebookRate: positive(raw.rebookRate, 100), rating: positive(raw.rating, 5), months: positive(raw.months, 600) };
    const fields: Record<string, string[]> = {};
    if (!(factor >= 0.5 && factor <= 3)) fields.priceFactor = ["El factor va de 0,5 a 3 (1 = el precio de la carta)."];
    for (const [key, value] of Object.entries(criteria)) if (value === "bad") fields[key] = ["Revisa este valor."];
    if (Object.keys(fields).length > 0) return error(422, "validation", "Revisa los campos marcados.", { fields });
    const updated: MockLevel = { ...level, priceFactor: round(factor), criteria: criteria as MockLevelCriteria };
    db.team = { ...db.team, levels: db.team.levels.map((item) => (item.id === level.id ? updated : item)) };
    db.persist();
    return HttpResponse.json(updated);
  }),

  // Cómo va cada barbero hacia su siguiente nivel: el barbero, el suyo; gerencia, los de la sede.
  http.get(`${BASE}/team/levels/progress`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    const branchId = new URL(request.url).searchParams.get("branchId") ?? "ma";
    const members = db.team.members.filter((member) => member.branchIds.includes(branchId) && member.status === "active" && (isBarberRole(member.role) || member.isAlsoBarber));
    if (isBarber(session)) {
      const mine = members.find((member) => member.id === session.memberId);
      return HttpResponse.json({ items: mine ? [levelProgress(mine, branchId)] : [] });
    }
    if (!isManager(session)) return forbidden("El avance lo ven el dueño, el administrador y cada barbero (el suyo).");
    return HttpResponse.json({ items: members.map((member) => levelProgress(member, branchId)) });
  }),

  // Ascender (o cambiar de nivel): con `reprice`, sus precios pasan a los de la carta por el factor del nivel.
  http.post(`${BASE}/team/members/:id/promote`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("Asciende el dueño o el administrador.");
    const member = db.team.members.find((item) => item.id === params.id);
    if (!member) return error(404, "not_found", "Esa persona no existe.");
    const input = asRecord(await request.json().catch(() => ({})));
    const level = db.team.levels.find((item) => item.id === text(input.levelId));
    if (!level) return error(422, "validation", "Elige el nivel.", { fields: { levelId: ["Elige el nivel."] } });
    const factor = level.priceFactor ?? 1;
    const services = input.reprice === true ? member.services.map((row) => { const base = db.services.items.find((item) => item.id === row.serviceId)?.price; return base === undefined ? row : { ...row, price: Math.max(1, Math.round(base * factor)) }; }) : member.services;
    const updated = { ...member, levelId: level.id, services };
    db.team = { ...db.team, members: db.team.members.map((item) => (item.id === member.id ? updated : item)) };
    db.persist();
    return HttpResponse.json({ memberId: member.id, levelId: level.id, repriced: input.reprice === true });
  }),

  http.get(`${BASE}/team/members/:id/payout-changes`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session) && session.memberId !== params.id) return forbidden("Esto lo ve quien gestiona el equipo o la propia persona.");
    applyDuePayoutChanges();
    const items = (db.team.payoutChanges ?? []).filter((change) => change.memberId === params.id).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate)).map(changeView);
    return HttpResponse.json({ items });
  }),

  // Cambiar la forma de pago desde una fecha: hoy o antes se aplica ya; más adelante queda programado.
  http.post(`${BASE}/team/members/:id/payout-change`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("La forma de pago la cambia el dueño o el administrador.");
    const member = db.team.members.find((item) => item.id === params.id);
    if (!member || !isBarberRole(member.role)) return error(404, "not_found", "Esa persona no es barbero.");
    const input = asRecord(await request.json().catch(() => ({})));
    const target = text(input.to);
    const effectiveDate = text(input.effectiveDate);
    const today = dayKey(new Date());
    if (!["commission", "salary", "rent"].includes(target)) return error(422, "validation", "Elige la nueva forma de pago.", { fields: { to: ["Elige la nueva forma de pago."] } });
    if (!DAY_KEY.test(effectiveDate)) return error(422, "validation", "Elige desde cuándo.", { fields: { effectiveDate: ["Elige desde cuándo."] } });
    const current = member.role === "barbero-renta" ? "rent" : member.compensation?.type === "salary" ? "salary" : "commission";
    if (current === target) return error(409, "conflict", "Ya tiene esa forma de pago.");
    if ((db.team.payoutChanges ?? []).some((change) => change.memberId === member.id && change.status === "scheduled")) return error(409, "conflict", "Ya hay un cambio programado: cancélalo primero.");
    const amount = Number(input.amount);
    const to: MockTeamRole = target === "rent" ? "barbero-renta" : "barbero-comision";
    const after =
      target === "rent"
        ? { compensation: null, payments: { ...(member.payments ?? DEFAULT_RENT), rentBase: amount > 0 ? round(amount) : (member.payments?.rentBase ?? DEFAULT_RENT.rentBase) } }
        : { compensation: target === "salary" ? { ...(member.compensation ?? DEFAULT_COMMISSION), type: "salary" as const, salary: amount > 0 ? round(amount) : (member.compensation?.salary ?? 650) } : { ...(member.compensation ?? DEFAULT_COMMISSION), type: "commission" as const, basic: amount > 0 && amount <= 100 ? round(amount) : (member.compensation?.basic ?? DEFAULT_COMMISSION.basic) }, payments: member.payments };
    const change: MockPayoutChange = {
      id: `pch_${Date.now().toString(36)}`,
      memberId: member.id,
      effectiveDate,
      from: member.role,
      to,
      before: { role: member.role, compensation: member.compensation, payments: member.payments },
      after,
      status: "scheduled",
      note: text(input.note).slice(0, 200),
      createdBy: session.account.user.name,
      createdAt: new Date().toISOString(),
    };
    db.team = { ...db.team, payoutChanges: [change, ...(db.team.payoutChanges ?? [])] };
    if (effectiveDate <= today) applyDuePayoutChanges();
    else db.persist();
    const saved = (db.team.payoutChanges ?? []).find((item) => item.id === change.id)!;
    return HttpResponse.json(changeView(saved), { status: 201 });
  }),

  http.delete(`${BASE}/team/payout-changes/:id`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("Lo cancela el dueño o el administrador.");
    const change = (db.team.payoutChanges ?? []).find((item) => item.id === params.id);
    if (!change) return error(404, "not_found", "Ese cambio no existe.");
    if (change.status !== "scheduled") return error(409, "conflict", "Ese cambio ya se aplicó: haz otro cambio con fecha.");
    db.team = { ...db.team, payoutChanges: (db.team.payoutChanges ?? []).map((item) => (item.id === change.id ? { ...item, status: "cancelled" as const } : item)) };
    db.persist();
    return new HttpResponse(null, { status: 204 });
  }),
];
