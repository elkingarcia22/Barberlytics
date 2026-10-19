import { delay, http, HttpResponse } from "msw";
import { db } from "../db";
import { appointmentsOn } from "../calendar/handlers";
import { dateKey } from "../calendar/seed";
import { barberServicePrice } from "../catalogPrices";
import { payrollOf } from "../payroll/compute";
import { forbidden, isManager, sessionOf, unauthorized } from "../session";
import { barbersOf } from "../team/seed";

/**
 * Margen por hora de silla y matriz del catálogo (docs/API_CONTRACT.md, «Reportes»). En una barbería
 * lo escaso es el minuto de silla, no el producto: un servicio rinde por lo que deja en cada hora que
 * ocupa. Margen = precio cobrado − costo de insumos − comisión del barbero; horas = (duración +
 * preparación) × veces vendido. Con eso, cada servicio cae en un cuadrante de la matriz de Kasavana y
 * Smith (1982): popular o no (regla del 70 % del promedio) y rentable o no (por encima del margen por
 * hora medio, ponderado por horas).
 */

const BASE = "*/api";
const LATENCY_MS = 250;
const DEFAULT_DAYS = 90;
const MAX_DAYS = 180;
const POPULARITY_RULE = 0.7;
const DAYS_PER_WEEK = 7;
const DAY_MS = 86_400_000;

export type Quadrant = "star" | "plowhorse" | "puzzle" | "dog";

const round = (value: number) => Math.round(value * 100) / 100;

export function menuEngineering(branchId: string, days = DEFAULT_DAYS, now = new Date()) {
  const keys = Array.from({ length: days }, (_, index) => dateKey(new Date(now.getTime() - index * DAY_MS)));
  const appointments = keys.flatMap((day) => appointmentsOn(branchId, day));
  const members = barbersOf(db.team.members, db.team.orders, branchId);
  const renters = new Set(members.filter((member) => member.role === "barbero-renta").map((member) => member.id));
  // La comisión real de cada cita, con las reglas de Nómina (regla, escala, descuentos de Configuración).
  const commissionOf = new Map<string, number>();
  for (const member of members) {
    if (renters.has(member.id)) continue;
    for (const line of payrollOf(member, appointments, days / DAYS_PER_WEEK, branchId, []).lines) commissionOf.set(line.appointmentId, line.commission);
  }

  const totals = new Map<string, { units: number; revenue: number; cost: number; commission: number; minutes: number }>();
  // Lo que cobra un barbero de renta es suyo: no cuenta para la rentabilidad de la barbería.
  for (const item of appointments.filter((entry) => entry.status === "paid" && entry.payment && !renters.has(entry.barberId))) {
    const prices = item.serviceIds.map((id) => barberServicePrice(item.barberId, id, branchId));
    const sum = prices.reduce((total, price) => total + price, 0);
    item.serviceIds.forEach((id, index) => {
      const service = db.services.items.find((entry) => entry.id === id);
      if (!service) return;
      const row = totals.get(id) ?? { units: 0, revenue: 0, cost: 0, commission: 0, minutes: 0 };
      const share = sum > 0 ? prices[index] / sum : 0;
      totals.set(id, {
        units: row.units + 1,
        revenue: row.revenue + prices[index],
        cost: row.cost + (service.cost ?? 0),
        commission: row.commission + (commissionOf.get(item.id) ?? 0) * share,
        minutes: row.minutes + service.durationMin + (service.prep?.enabled ? service.prep.minutes : 0),
      });
    });
  }

  const rows = [...totals.entries()].map(([id, row]) => {
    const service = db.services.items.find((entry) => entry.id === id)!;
    const margin = row.revenue - row.cost - row.commission;
    const hours = row.minutes / 60;
    return {
      serviceId: id,
      name: service.name,
      units: row.units,
      avgPrice: round(row.revenue / row.units),
      unitCost: round(row.cost / row.units),
      unitCommission: round(row.commission / row.units),
      unitMargin: round(margin / row.units),
      minutesPerUnit: Math.round(row.minutes / row.units),
      hours: round(hours),
      marginPerHour: hours > 0 ? round(margin / hours) : 0,
      hasCost: service.cost !== null,
      commissionShare: row.revenue > 0 ? row.commission / row.revenue : 0,
    };
  });

  const totalUnits = rows.reduce((sum, row) => sum + row.units, 0);
  const totalHours = rows.reduce((sum, row) => sum + row.hours, 0);
  const totalMargin = rows.reduce((sum, row) => sum + row.unitMargin * row.units, 0);
  const avgMarginPerHour = totalHours > 0 ? round(totalMargin / totalHours) : 0;
  const popularityBar = rows.length > 0 ? (totalUnits / rows.length) * POPULARITY_RULE : 0;

  const items = rows
    .map(({ commissionShare, ...row }) => {
      const popular = row.units >= popularityBar;
      const profitable = row.marginPerHour >= avgMarginPerHour;
      const quadrant: Quadrant = popular ? (profitable ? "star" : "plowhorse") : profitable ? "puzzle" : "dog";
      // El precio con el que llegaría al margen por hora medio, con la misma comisión y el mismo costo.
      const target = !profitable && commissionShare < 1 ? round((avgMarginPerHour * (row.minutesPerUnit / 60) + row.unitCost) / (1 - commissionShare)) : null;
      return { ...row, popularity: totalUnits > 0 ? round((row.units / totalUnits) * 100) : 0, quadrant, targetPrice: target && target > row.avgPrice ? Math.ceil(target) : null };
    })
    .sort((a, b) => b.marginPerHour - a.marginPerHour);

  return {
    days,
    avgMarginPerHour,
    chairHours: round(totalHours),
    margin: round(totalMargin),
    units: totalUnits,
    costCoverage: { withCost: items.filter((item) => item.hasCost).length, total: items.length },
    items,
  };
}

export const menuHandlers = [
  http.get(`${BASE}/reports/menu`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    // Costos, comisiones y márgenes son cifras del dueño.
    if (!isManager(session)) return forbidden("La rentabilidad del catálogo es del dueño y el administrador.");
    const params = new URL(request.url).searchParams;
    const days = Math.min(MAX_DAYS, Math.max(DAYS_PER_WEEK, Number(params.get("days")) || DEFAULT_DAYS));
    return HttpResponse.json(menuEngineering(params.get("branchId") ?? "ma", days));
  }),
];
