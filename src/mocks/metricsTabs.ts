import { db, seededRandom } from "./db";
import { WALK_IN_CLIENT } from "./calendar/seed";
import { profileOf } from "./customers/handlers";
import { lifecycleOf } from "./customers/seed";
import { isOverdue } from "@/features/customers/overdue";
import {
  BARBERS,
  daysOf,
  periodOf,
  previousOf,
  resolveMetricsBarber,
  round2,
  simulateDay,
  simulatePeriod,
  sum,
  totalsOf,
  type Appointment,
  type DayRecord,
  type MetricsQuery,
  type SimulatedPeriod,
} from "./metrics";
import { periodRange, toIsoDate } from "@/components/date/periodRange";
import type { ClientType, MetricsBarbers, MetricsCustomers, MetricsInsights, MetricsMarketing, VisitFrequency } from "@/features/metrics/types";

/**
 * Las otras cuatro pestañas de Métricas, derivadas de la misma simulación que
 * Negocio: clientes, barberos y marketing leen el periodo pedido; el
 * diagnóstico de IA mira los últimos tres meses y no lleva periodo.
 */

const seedOf = (sim: SimulatedPeriod, salt: string) => seededRandom(hashText(`${toIsoDate(sim.range.from)}|${sim.granularity}|${sim.barberId}|${salt}`));

function hashText(text: string): number {
  let hash = 2166136261;
  for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

const appointmentsOf = (days: readonly DayRecord[]): Appointment[] => days.flatMap((day) => day.appointments);
const completedOf = (days: readonly DayRecord[]) => appointmentsOf(days).filter((item) => item.status === "completed");
const pct = (part: number, whole: number) => (whole ? round2((part / whole) * 100) : 0);

/** Reparte `total` en partes con pesos, redondeando sin perder unidades. */
function split(total: number, weights: readonly number[]): number[] {
  const sumWeights = sum(weights);
  const raw = weights.map((weight) => (total * weight) / sumWeights);
  const floored = raw.map(Math.floor);
  let rest = total - sum(floored);
  const order = raw.map((value, index) => ({ index, frac: value - Math.floor(value) })).sort((a, b) => b.frac - a.frac);
  for (const { index } of order) {
    if (rest <= 0) break;
    floored[index] += 1;
    rest -= 1;
  }
  return floored;
}

// ── Clientes ────────────────────────────────────────────────────────────────

function customersOf(days: readonly DayRecord[], rand: () => number) {
  const appointments = appointmentsOf(days);
  const completed = completedOf(days);
  const clients = Math.round(appointments.length * (0.78 + rand() * 0.08));
  const returning = Math.round(clients * (0.52 + rand() * 0.14));
  const income = sum(completed.map((item) => item.service.price + item.tip));
  return {
    clients,
    returning,
    retentionRate: pct(returning, clients),
    avgIncomePerClient: clients ? round2(income / clients) : 0,
    onlineBookings: pct(appointments.filter((item) => item.method === "online").length, appointments.length),
    walkInRate: pct(appointments.filter((item) => item.method === "walkIn").length, appointments.length),
  };
}

export function buildCustomersMetrics(query: MetricsQuery): MetricsCustomers {
  const sim = simulatePeriod(query);
  const now = customersOf(sim.days, seedOf(sim, "customers"));
  const before = customersOf(sim.previousDays, seedOf({ ...sim, range: sim.previous }, "customers"));
  const rand = seedOf(sim, "customers-split");
  const newClients = now.clients - now.returning;
  const [retainedNew, repeat, recovered] = split(now.returning, [2, 6, 1].map((weight) => weight + rand() * 0.5));
  const types: { id: ClientType; count: number }[] = [
    { id: "new", count: newClients },
    { id: "retainedNew", count: retainedNew },
    { id: "repeat", count: repeat },
    { id: "recovered", count: recovered },
  ];
  const withPreference = Math.round(now.clients * (0.55 + rand() * 0.2));
  const frequencies: VisitFrequency[] = ["weekly", "biweekly", "monthly", "occasional"];
  const frequency = split(now.returning, [1, 3, 4, 2]).map((count, index) => ({ id: frequencies[index], count }));

  return {
    period: periodOf(sim),
    previous: previousOf(sim),
    clients: now.clients,
    kpis: {
      retentionRate: { value: now.retentionRate, previous: before.retentionRate },
      avgIncomePerClient: { value: now.avgIncomePerClient, previous: before.avgIncomePerClient },
      onlineBookings: { value: now.onlineBookings, previous: before.onlineBookings },
      walkInRate: { value: now.walkInRate, previous: before.walkInRate },
    },
    byClientType: types,
    newVsReturning: { new: newClients, returning: now.returning },
    barberPreference: { withPreference, noPreference: now.clients - withPreference },
    visitFrequency: frequency,
  };
}

// ── Barberos ────────────────────────────────────────────────────────────────

const COMMISSION = 0.4;
const CHAIR_SLOTS_PER_DAY = 10;

function barberOf(id: string, name: string, sim: SimulatedPeriod) {
  const days = daysOf(sim.range).map((date) => simulateDay(date, id));
  const appointments = appointmentsOf(days);
  const completed = completedOf(days);
  const services = sum(completed.map((item) => item.service.price));
  const tips = sum(completed.map((item) => item.tip));
  const openDays = days.filter((day) => day.date.getDay() !== 0).length;
  const lost = appointments.filter((item) => item.status === "cancelled" || item.status === "noShow").length;
  return {
    id,
    name,
    net: round2(services * COMMISSION + tips),
    services: completed.length,
    occupancy: openDays ? Math.min(100, round2((appointments.length / (openDays * CHAIR_SLOTS_PER_DAY)) * 100)) : 0,
    cancellationRate: pct(lost, appointments.length),
    tipsRate: pct(tips, services),
  };
}

export function buildBarbersMetrics(query: MetricsQuery): MetricsBarbers {
  const sim = simulatePeriod(query);
  const one = resolveMetricsBarber(sim.barberId);
  const wanted = sim.barberId === "all" || !one ? BARBERS : [one];
  const rows = wanted.map((barber) => barberOf(barber.id, barber.name, sim));
  const previousRows = wanted.map((barber) => barberOf(barber.id, barber.name, { ...sim, range: sim.previous }));
  const avg = (values: readonly number[]) => (values.length ? round2(sum(values) / values.length) : 0);
  const ticket = (days: readonly DayRecord[]) => {
    const totals = totalsOf(days);
    return totals.transactions ? round2(totals.sales / totals.transactions) : 0;
  };
  const rand = seedOf(sim, "loyalty");
  const loyalty = round2(58 + rand() * 24);
  const previousLoyalty = round2(loyalty - 4 + rand() * 8);

  return {
    period: periodOf(sim),
    previous: previousOf(sim),
    kpis: {
      totalNet: { value: round2(sum(rows.map((row) => row.net))), previous: round2(sum(previousRows.map((row) => row.net))) },
      loyalty: { value: loyalty, previous: previousLoyalty },
      avgOccupancy: { value: avg(rows.map((row) => row.occupancy)), previous: avg(previousRows.map((row) => row.occupancy)) },
      avgTicket: { value: ticket(sim.days), previous: ticket(sim.previousDays) },
    },
    barbers: rows,
  };
}

// ── Marketing ───────────────────────────────────────────────────────────────

const CHANNELS = [
  { id: "instagram", name: "Instagram", weight: 5, visitsPerBooking: 14 },
  { id: "google", name: "Google", weight: 4, visitsPerBooking: 6 },
  { id: "website", name: "Sitio web", weight: 2, visitsPerBooking: 9 },
  { id: "whatsapp", name: "WhatsApp", weight: 3, visitsPerBooking: 3 },
] as const;

const CAMPAIGNS = [
  { id: "tuesday", name: "Martes 2×1 en barba", weight: 3 },
  { id: "welcome", name: "Bienvenida primera visita", weight: 2 },
  { id: "referral", name: "Trae a un amigo", weight: 1 },
] as const;

function marketingOf(days: readonly DayRecord[], rand: () => number) {
  const appointments = appointmentsOf(days);
  const online = appointments.filter((item) => item.method === "online").length;
  const channels = split(online, CHANNELS.map((channel) => channel.weight + rand())).map((bookings, index) => ({
    id: CHANNELS[index].id,
    name: CHANNELS[index].name,
    bookings,
    visits: Math.round(bookings * CHANNELS[index].visitsPerBooking * (0.8 + rand() * 0.4)),
  }));
  const campaignBookings = Math.round(appointments.length * (0.06 + rand() * 0.05));
  const campaigns = split(campaignBookings, CAMPAIGNS.map((campaign) => campaign.weight + rand() * 0.5)).map((bookings, index) => ({
    id: CAMPAIGNS[index].id,
    name: CAMPAIGNS[index].name,
    bookings,
    revenue: round2(bookings * (48 + rand() * 18)),
  }));
  return { onlineBookings: pct(online, appointments.length), channels, campaignBookings, campaigns };
}

export function buildMarketingMetrics(query: MetricsQuery): MetricsMarketing {
  const sim = simulatePeriod(query);
  const now = marketingOf(sim.days, seedOf(sim, "marketing"));
  const before = marketingOf(sim.previousDays, seedOf({ ...sim, range: sim.previous }, "marketing"));
  const best = [...now.channels].sort((a, b) => b.bookings - a.bookings)[0];
  return {
    period: periodOf(sim),
    previous: previousOf(sim),
    kpis: {
      onlineBookings: { value: now.onlineBookings, previous: before.onlineBookings },
      bestChannel: best && best.bookings > 0 ? best.name : null,
      campaignBookings: { value: now.campaignBookings, previous: before.campaignBookings },
    },
    channels: now.channels.filter((channel) => channel.bookings > 0),
    campaigns: now.campaigns.filter((campaign) => campaign.bookings > 0),
  };
}

// ── IA ──────────────────────────────────────────────────────────────────────

const CAPACITY_HOURS = Array.from({ length: 13 }, (_, index) => index + 8);
/** Sillas abiertas de media en una franja: la sucursal tiene seis, pero no todas atienden a la vez. */
const CHAIRS = 3;
const WEEKDAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export function buildInsightsMetrics(today = new Date()): MetricsInsights {
  const end = periodRange(today, "month").to;
  const start = new Date(end.getFullYear(), end.getMonth() - 2, 1);
  const days = daysOf({ from: start, to: end }).map((date) => simulateDay(date, "all"));
  const appointments = appointmentsOf(days);
  const completed = completedOf(days);
  const totals = totalsOf(days);
  const rand = seededRandom(hashText(`insights|${toIsoDate(start)}`));

  const completionRate = pct(completed.length, appointments.length);
  const noShowRate = pct(appointments.filter((item) => item.status === "noShow").length, appointments.length);
  const retentionRate = round2(54 + rand() * 16);
  const avgTicket = totals.transactions ? round2(totals.sales / totals.transactions) : 0;
  const score = Math.round(completionRate * 0.4 + Math.max(0, 100 - noShowRate * 8) * 0.2 + retentionRate * 0.25 + Math.min(1, avgTicket / 75) * 100 * 0.15);

  /* Ocupación media por día de la semana y hora, sobre las sillas abiertas. */
  const weeksOf = (weekday: number) => days.filter((day) => (day.date.getDay() + 6) % 7 === weekday).length;
  const rows = Array.from({ length: 7 }, (_, weekday) => ({
    day: weekday,
    values: CAPACITY_HOURS.map((hour) => {
      const count = days
        .filter((day) => (day.date.getDay() + 6) % 7 === weekday)
        .reduce((acc, day) => acc + day.appointments.filter((item) => item.hour === hour).length, 0);
      const weeks = weeksOf(weekday);
      return weeks ? Math.min(100, Math.round((count / weeks / CHAIRS) * 100)) : 0;
    }),
  }));

  /* Sugerencias que salen de los datos, no de una lista fija. */
  const byWeekday = rows.map(({ day: weekday }) => ({ weekday, total: days.filter((day) => (day.date.getDay() + 6) % 7 === weekday).reduce((acc, day) => acc + day.appointments.length, 0) }));
  const open = byWeekday.filter((row) => row.weekday !== 6);
  const best = open.reduce((top, row) => (row.total > top.total ? row : top), open[0]);
  const worst = open.reduce((low, row) => (row.total < low.total ? row : low), open[0]);
  const gap = best.total ? Math.round(((best.total - worst.total) / best.total) * 100) : 0;
  const neverBooked = 180 + Math.round(rand() * 120);
  // Los riesgos son los clientes de verdad, con las mismas reglas que Clientes: la cifra lleva a su lista.
  const { churned, atRisk, overdue } = clientRisks();
  const peakHour = CAPACITY_HOURS[rows.flatMap((row) => row.values).reduce<{ index: number; value: number }>((top, value, index) => (value > top.value ? { index: index % CAPACITY_HOURS.length, value } : top), { index: 0, value: -1 }).index];

  return {
    window: { from: toIsoDate(start), to: toIsoDate(end) },
    health: { score, completionRate, retentionRate, noShowRate, avgTicket },
    risks: { churned, atRisk, overdue },
    capacity: { hours: CAPACITY_HOURS, rows },
    suggestions: [
      {
        id: "never-booked",
        group: "clients",
        type: "risk",
        tag: "Retención",
        title: `${neverBooked} clientes registrados nunca han reservado`,
        description: "Se crearon en el sistema pero no agendaron ninguna cita. Son ingreso potencial que ya conoce la barbería.",
        action: "Enviar una oferta de bienvenida para su primera visita",
        evidence: `${neverBooked} fichas sin cita en los últimos 3 meses`,
      },
      {
        id: "overdue",
        group: "clients",
        type: "recommendation",
        tag: "Frecuencia",
        title: `${overdue} clientes habituales llevan más de 6 semanas sin venir`,
        description: "Venían cada 3–4 semanas y se han pasado de su ritmo. Un recordatorio a tiempo suele recuperarlos antes de que se vayan.",
        action: "Programar un recordatorio con su barbero de preferencia",
        evidence: `Ritmo medio de 25 días entre visitas`,
      },
      {
        id: "weekday-gap",
        group: "growth",
        type: "opportunity",
        tag: "Marketing",
        title: `El ${WEEKDAY_NAMES[worst.weekday]} tiene un ${gap} % menos de citas que el ${WEEKDAY_NAMES[best.weekday]}`,
        description: "Ese día rinde por debajo de forma sistemática. Una promoción específica del día suele mover tráfico sin tocar el resto de la semana.",
        action: `Lanzar una campaña «${WEEKDAY_NAMES[worst.weekday]} especial» con oferta exclusiva`,
        evidence: `${worst.total} citas frente a ${best.total} en los últimos 3 meses`,
      },
      {
        id: "peak-hour",
        group: "operations",
        type: "insight",
        tag: "Capacidad",
        title: `Las ${String(peakHour).padStart(2, "0")}:00 se llenan antes que cualquier otra hora`,
        description: "Es la franja con más demanda y donde más citas se quedan sin hueco. Abrir una silla más o mover un descanso amplía la caja sin captar clientes nuevos.",
        action: "Revisar los turnos de esa franja en el calendario",
      },
      ...(totals.cancellationRate > 20
        ? [
            {
              id: "cancellations",
              group: "operations" as const,
              type: "risk" as const,
              tag: "Cancelaciones",
              title: `El ${totals.cancellationRate.toLocaleString("es-CO", { maximumFractionDigits: 1 })} % de las citas se cancelan o no llegan`,
              description: "Por encima del 20 % la agenda pierde huecos que ya nadie ocupa. Un recordatorio 24 h antes y una política de confirmación bajan la tasa a la mitad.",
              action: "Activar el recordatorio automático 24 h antes",
              evidence: `${appointments.filter((item) => item.status !== "completed" && item.status !== "pendingCollection").length} citas perdidas en 3 meses`,
            },
          ]
        : []),
    ],
  };
}

/** Perdidos, en riesgo y a los que ya les tocaba volver, entre los clientes de la barbería. */
function clientRisks(): { churned: number; atRisk: number; overdue: number } {
  const facts = db.calendar.clients
    .filter((client) => client.id !== WALK_IN_CLIENT.id && !profileOf(client).deleted)
    .map((client) => ({ ...lifecycleOf(client, profileOf(client).blocked), visitEveryDays: client.visitEveryDays ?? null }));
  return {
    churned: facts.filter((item) => item.segment === "lost").length,
    atRisk: facts.filter((item) => item.segment === "atRisk").length,
    overdue: facts.filter((item) => isOverdue(item)).length,
  };
}
