import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { db, type MockGoal } from "../db";
import { forbidden, isManager, sessionOf, unauthorized } from "../session";
import { incomeStatement } from "./income";

/**
 * La meta del mes de una sede (docs/API_CONTRACT.md, «Reportes › Meta del mes»): cuánto quiere ingresar el dueño y cómo
 * va. El ingreso es el mismo del estado de resultados (servicios, productos y renta, sin impuesto ni propina, menos lo
 * devuelto); el ritmo proyecta lo llevado a los días del mes, y dice cuánto falta por día para llegar.
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const MONTH = /^\d{4}-\d{2}$/;
const round2 = (value: number) => Math.round(value * 100) / 100;
const asRecord = (body: DefaultBodyType): Record<string, unknown> => (body && typeof body === "object" ? (body as Record<string, unknown>) : {});
const error = (status: number, code: string, message: string, extra: Record<string, unknown> = {}) => HttpResponse.json({ code, message, ...extra }, { status });

/** Cómo va la meta: lo ingresado, la proyección al ritmo actual y lo que falta por día. */
export function goalProgress(branchId: string, month: string, now = new Date()) {
  const goal = db.goals.find((item) => item.branchId === branchId && item.month === month) ?? null;
  const statement = incomeStatement(branchId, month, now);
  const revenue = statement.revenue.total;
  const elapsed = Math.max(1, statement.elapsedDays);
  const remainingDays = Math.max(0, statement.days - statement.elapsedDays);
  const projected = round2((revenue / elapsed) * statement.days);
  const target = goal?.revenue ?? null;
  return {
    month,
    goal,
    revenue: round2(revenue),
    days: statement.days,
    elapsedDays: statement.elapsedDays,
    projected,
    /** Qué parte de la meta ya se ingresó (0–100+). */
    progress: target ? round2((revenue / target) * 100) : null,
    /** Lo que hay que ingresar por día en lo que queda del mes; 0 si ya se llegó. */
    neededPerDay: target ? round2(Math.max(0, target - revenue) / Math.max(1, remainingDays)) : null,
    onTrack: target ? projected >= target : null,
  };
}

export const goalHandlers = [
  http.get(`${BASE}/reports/goal`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("La meta del mes la ve el dueño o el administrador.");
    const params = new URL(request.url).searchParams;
    const branchId = params.get("branchId") ?? "";
    const month = params.get("month") ?? "";
    if (!branchId || !MONTH.test(month)) return error(422, "validation", "Falta la sucursal o el mes (AAAA-MM).");
    return HttpResponse.json(goalProgress(branchId, month));
  }),

  // Poner o cambiar la meta (o quitarla con `revenue: null`). Dueño o administrador.
  http.put(`${BASE}/reports/goal`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("La meta del mes la pone el dueño o el administrador.");
    const input = asRecord(await request.json().catch(() => ({})));
    const branchId = typeof input.branchId === "string" ? input.branchId : "";
    const month = typeof input.month === "string" ? input.month : "";
    if (!branchId || !MONTH.test(month)) return error(422, "validation", "Falta la sucursal o el mes (AAAA-MM).");
    const others = db.goals.filter((item) => !(item.branchId === branchId && item.month === month));
    if (input.revenue === null) {
      db.goals = others;
    } else {
      const revenue = Number(input.revenue);
      if (!(revenue > 0) || revenue > 1_000_000_000) return error(422, "validation", "Escribe una meta mayor que 0.", { fields: { revenue: ["Escribe una meta mayor que 0."] } });
      const goal: MockGoal = { branchId, month, revenue: round2(revenue), setBy: session.account.user.name, setAt: new Date().toISOString() };
      db.goals = [...others, goal];
    }
    db.persist();
    return HttpResponse.json(goalProgress(branchId, month));
  }),
];
