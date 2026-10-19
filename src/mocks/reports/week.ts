import { delay, http, HttpResponse } from "msw";
import { db } from "../db";
import { appointmentAccount } from "../calendar/account";
import { appointmentsOn, hoursOn } from "../calendar/handlers";
import { dateKey, parseClock, type MockAppointment } from "../calendar/seed";
import { lifecycleOf } from "../customers/seed";
import { profileOf } from "../customers/handlers";
import { isManager, sessionOf, forbidden, unauthorized } from "../session";
import { barbersOf, memberName } from "../team/seed";

/**
 * Las cifras de «Cómo te fue» (docs/API_CONTRACT.md, «Reportes»): los últimos 7 días contra los 7
 * anteriores. Solo cifras calculadas aquí; la redacción la hace `/api/narrative` (o el resumen
 * automático de la app) sin poder cambiarlas.
 */

const BASE = "*/api";
const LATENCY_MS = 200;
const DAY_MS = 86_400_000;
const round = (value: number) => Math.round(value * 100) / 100;

const net = (item: MockAppointment) => {
  const account = appointmentAccount(item);
  return account.total - account.tax;
};

function window(branchId: string, end: Date) {
  const days = Array.from({ length: 7 }, (_, index) => dateKey(new Date(end.getTime() - index * DAY_MS)));
  const items = days.flatMap((day) => appointmentsOn(branchId, day));
  const paid = items.filter((item) => item.status === "paid" && item.payment);
  return { days, items, paid, revenue: round(paid.reduce((sum, item) => sum + net(item), 0)) };
}

export function weekFacts(branchId: string, now = new Date()) {
  const current = window(branchId, now);
  const previous = window(branchId, new Date(now.getTime() - 7 * DAY_MS));
  const barbers = barbersOf(db.team.members, db.team.orders, branchId);
  const byBarber = barbers.map((member) => ({ name: memberName(member), revenue: round(current.paid.filter((item) => item.barberId === member.id).reduce((sum, item) => sum + net(item), 0)) })).sort((a, b) => b.revenue - a.revenue);
  const byDay = current.days.map((day) => ({ day, revenue: round(current.paid.filter((item) => item.start.slice(0, 10) === day).reduce((sum, item) => sum + net(item), 0)) })).sort((a, b) => b.revenue - a.revenue);
  const scheduled = barbers.reduce((sum, member) => sum + current.days.reduce((total, day) => total + hoursOn(member, day).reduce((acc, range) => acc + parseClock(range.end) - parseClock(range.start), 0), 0), 0);
  const busy = current.items.filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + item.durationMin, 0);
  const clients = db.calendar.clients.filter((client) => profileOf(client).branchId === branchId);
  return {
    from: current.days[current.days.length - 1],
    to: current.days[0],
    revenue: current.revenue,
    revenuePrev: previous.revenue,
    services: current.paid.length,
    servicesPrev: previous.paid.length,
    occupancy: scheduled > 0 ? round((busy / scheduled) * 100) : 0,
    noShows: current.items.filter((item) => item.status === "no_show").length,
    products: current.paid.reduce((sum, item) => sum + item.products.reduce((total, row) => total + row.qty, 0), 0),
    topBarber: byBarber[0] && byBarber[0].revenue > 0 ? byBarber[0] : null,
    bestDay: byDay[0] && byDay[0].revenue > 0 ? byDay[0] : null,
    atRisk: clients.filter((client) => lifecycleOf(client, profileOf(client).blocked, now).segment === "atRisk").length,
  };
}

export const weekHandlers = [
  http.get(`${BASE}/reports/week`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("«Cómo te fue» es del dueño y el administrador.");
    return HttpResponse.json(weekFacts(new URL(request.url).searchParams.get("branchId") ?? "ma"));
  }),
];
