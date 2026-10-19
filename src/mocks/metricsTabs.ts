import { db, seededRandom } from "./db";
import { WALK_IN_CLIENT, dateKey } from "./calendar/seed";
import { appointmentsOn } from "./calendar/handlers";
import { payrollOf } from "./payroll/compute";
import { profileOf } from "./customers/handlers";
import { lifecycleOf } from "./customers/seed";
import { sessionsBySource } from "./booking/funnel";
import { isOverdue } from "@/features/customers/overdue";
import {
  barbersOfBranch,
  dayRecord,
  daysOf,
  periodOf,
  previousOf,
  resolveMetricsBarber,
  round2,
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
 * Las otras cuatro pestañas de Métricas, sobre los mismos días reales que
 * Negocio (la agenda de la sucursal): clientes, barberos y marketing leen el
 * periodo pedido; el diagnóstico mira los últimos tres meses. Marketing lee
 * el origen que guarda cada cita en línea (`utm`). Lo que la agenda no
 * registra (el tipo de cliente a lo largo del tiempo) se reparte sobre los
 * totales reales y está marcado así.
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

function customersOf(days: readonly DayRecord[]) {
  const appointments = appointmentsOf(days);
  const completed = completedOf(days);
  // Los clientes distintos del periodo; vuelve quien ya tenía más de una visita.
  const ids = [...new Set(appointments.map((item) => item.clientId))];
  const clients = ids.length;
  const returning = ids.filter((id) => (db.calendar.clients.find((client) => client.id === id)?.visits ?? 0) > 1).length;
  const income = sum(completed.map((item) => item.service.price + item.tip));
  return {
    clients,
    returning,
    retentionRate: pct(returning, clients),
    avgIncomePerClient: clients ? round2(income / clients) : 0,
    onlineBookings: pct(appointments.filter((item) => item.method === "online").length, appointments.length),
    walkInRate: pct(appointments.filter((item) => item.method === "walkIn").length, appointments.length),
    withPreference: new Set(appointments.filter((item) => item.requested).map((item) => item.clientId)).size,
  };
}

export function buildCustomersMetrics(query: MetricsQuery): MetricsCustomers {
  const sim = simulatePeriod(query);
  const now = customersOf(sim.days);
  const before = customersOf(sim.previousDays);
  const rand = seedOf(sim, "customers-split");
  const newClients = now.clients - now.returning;
  const [retainedNew, repeat, recovered] = split(now.returning, [2, 6, 1].map((weight) => weight + rand() * 0.5));
  const types: { id: ClientType; count: number }[] = [
    { id: "new", count: newClients },
    { id: "retainedNew", count: retainedNew },
    { id: "repeat", count: repeat },
    { id: "recovered", count: recovered },
  ];
  const withPreference = now.withPreference;
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

const CHAIR_SLOTS_PER_DAY = 10;
const DAYS_PER_WEEK = 7;

/**
 * El neto del barbero en el periodo, con el mismo cálculo que Nómina y «Lo que llevo» (reglas,
 * productos, escala, salario o renta y ajustes): el barbero no debe ver dos cifras distintas.
 */
function payrollNet(id: string, sim: SimulatedPeriod): number {
  const member = db.team.members.find((item) => item.id === id);
  if (!member) return 0;
  const days = daysOf(sim.range);
  const appointments = days.flatMap((date) => appointmentsOn(sim.branchId, dateKey(date)));
  const from = dateKey(days[0] ?? new Date());
  const to = dateKey(days[days.length - 1] ?? new Date());
  const adjustments = db.payroll.adjustments.filter((item) => item.branchId === sim.branchId && item.from >= from && item.to <= to);
  return payrollOf(member, appointments, round2(days.length / DAYS_PER_WEEK), sim.branchId, adjustments).net;
}

function barberOf(id: string, name: string, sim: SimulatedPeriod) {
  const days = daysOf(sim.range).map((date) => dayRecord(date, id, sim.branchId));
  const appointments = appointmentsOf(days);
  const completed = completedOf(days);
  const services = sum(completed.map((item) => item.service.price));
  const tips = sum(completed.map((item) => item.tip));
  const openDays = days.filter((day) => day.date.getDay() !== 0).length;
  const lost = appointments.filter((item) => item.status === "cancelled" || item.status === "noShow").length;
  return {
    id,
    name,
    net: payrollNet(id, sim),
    services: completed.length,
    occupancy: openDays ? Math.min(100, round2((appointments.length / (openDays * CHAIR_SLOTS_PER_DAY)) * 100)) : 0,
    cancellationRate: pct(lost, appointments.length),
    tipsRate: pct(tips, services),
  };
}

export function buildBarbersMetrics(query: MetricsQuery): MetricsBarbers {
  const sim = simulatePeriod(query);
  const one = resolveMetricsBarber(sim.barberId, sim.branchId);
  const wanted = sim.barberId === "all" || !one ? barbersOfBranch(sim.branchId) : [one];
  const rows = wanted.map((barber) => barberOf(barber.id, barber.name, sim));
  const previousRows = wanted.map((barber) => barberOf(barber.id, barber.name, { ...sim, range: sim.previous }));
  const avg = (values: readonly number[]) => (values.length ? round2(sum(values) / values.length) : 0);
  const ticket = (days: readonly DayRecord[]) => {
    const totals = totalsOf(days);
    return totals.transactions ? round2(totals.sales / totals.transactions) : 0;
  };
  // Fidelidad: de las citas atendidas, cuántas fueron de clientes que pidieron a ese barbero.
  const loyaltyOf = (range: SimulatedPeriod["range"]) => {
    const completed = wanted.flatMap((barber) => completedOf(daysOf(range).map((date) => dayRecord(date, barber.id, sim.branchId))));
    return pct(completed.filter((item) => item.requested).length, completed.length);
  };
  const loyalty = loyaltyOf(sim.range);
  const previousLoyalty = loyaltyOf(sim.previous);

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

// ── Marketing ──────────────────────────────────────────────────────────────

/**
 * Marketing sale de lo que guarda cada cita en línea: los `utm_*` del enlace con que se reservó
 * (`appointment.utm`). Sin `utm_source` cuenta como «Directo». La conversión por canal sale del embudo:
 * sesiones que empezaron la reserva desde ese origen y cuántas reservaron (las dos del mismo embudo);
 * sin sesiones medidas, la demo usa las de ejemplo y lo dice (`visitsSample`).
 */
const SOURCE_ALIASES: Readonly<Record<string, string>> = { ig: "instagram", fb: "facebook", wa: "whatsapp", direct: "directo", "(direct)": "directo", "": "directo" };
const SOURCE_NAMES: Readonly<Record<string, string>> = { instagram: "Instagram", google: "Google", facebook: "Facebook", whatsapp: "WhatsApp", tiktok: "TikTok", email: "Correo", directo: "Directo" };

const channelOf = (source: string | undefined): string => {
  const key = (source ?? "").trim().toLowerCase();
  return SOURCE_ALIASES[key] ?? key;
};
const channelName = (id: string): string => SOURCE_NAMES[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
/** «martes-2x1-barba» → «Martes 2x1 barba»: la campaña como se escribió en el enlace, legible. */
const campaignName = (slug: string): string => {
  const words = slug.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

function marketingOf(days: readonly DayRecord[]) {
  const appointments = appointmentsOf(days);
  const online = appointments.filter((item) => item.method === "online");
  const from = days[0]?.date ?? new Date();
  const lastDay = days.at(-1)?.date ?? from;
  const to = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59);
  const { bySource: visits, sample: visitsSample } = sessionsBySource(from, to);

  const byChannel = new Map<string, number>();
  for (const item of online) byChannel.set(channelOf(item.utm?.source), (byChannel.get(channelOf(item.utm?.source)) ?? 0) + 1);
  const channels = [...byChannel.entries()]
    .map(([id, bookings]) => {
      const funnel = visits.get(id);
      return { id, name: channelName(id), bookings, visits: funnel ? funnel.sessions : null, funnelBookings: funnel ? funnel.bookings : null };
    })
    .sort((a, b) => b.bookings - a.bookings);

  const byCampaign = new Map<string, { bookings: number; revenue: number }>();
  for (const item of online.filter((entry) => entry.utm?.campaign)) {
    const slug = (item.utm?.campaign ?? "").toLowerCase();
    const row = byCampaign.get(slug) ?? { bookings: 0, revenue: 0 };
    // El ingreso es lo cobrado: una cita que aún no llega no ha traído plata.
    byCampaign.set(slug, { bookings: row.bookings + 1, revenue: row.revenue + (item.status === "completed" ? item.service.price : 0) });
  }
  const campaigns = [...byCampaign.entries()].map(([id, row]) => ({ id, name: campaignName(id), bookings: row.bookings, revenue: round2(row.revenue) })).sort((a, b) => b.bookings - a.bookings);
  return { onlineBookings: pct(online.length, appointments.length), channels, campaignBookings: sum(campaigns.map((campaign) => campaign.bookings)), campaigns, visitsSample };
}

export function buildMarketingMetrics(query: MetricsQuery): MetricsMarketing {
  const sim = simulatePeriod(query);
  const now = marketingOf(sim.days);
  const before = marketingOf(sim.previousDays);
  // El mejor canal es el que más trae de los que se pueden medir: «Directo» no es un canal de marketing.
  const best = now.channels.find((channel) => channel.id !== "directo" && channel.bookings > 0);
  return {
    period: periodOf(sim),
    previous: previousOf(sim),
    kpis: {
      onlineBookings: { value: now.onlineBookings, previous: before.onlineBookings },
      bestChannel: best ? best.name : null,
      campaignBookings: { value: now.campaignBookings, previous: before.campaignBookings },
    },
    channels: now.channels,
    campaigns: now.campaigns,
    visitsSample: now.visitsSample,
  };
}

// ── IA ──────────────────────────────────────────────────────────────────────

const CAPACITY_HOURS = Array.from({ length: 13 }, (_, index) => index + 8);
/** Sillas abiertas de media en una franja: la sucursal tiene seis, pero no todas atienden a la vez. */
const CHAIRS = 3;
const WEEKDAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export function buildInsightsMetrics(today = new Date(), branchId = "ma"): MetricsInsights {
  const end = periodRange(today, "month").to;
  const start = new Date(end.getFullYear(), end.getMonth() - 2, 1);
  const days = daysOf({ from: start, to: end }).map((date) => dayRecord(date, "all", branchId));
  const appointments = appointmentsOf(days);
  const completed = completedOf(days);
  const totals = totalsOf(days);

  const completionRate = pct(completed.length, appointments.length);
  const noShowRate = pct(appointments.filter((item) => item.status === "noShow").length, appointments.length);
  // Retención: de los clientes atendidos en la ventana, cuántos volvieron al menos una vez en ella.
  const visitsByClient = completed.reduce((acc, item) => acc.set(item.clientId, (acc.get(item.clientId) ?? 0) + 1), new Map<string, number>());
  const retentionRate = pct([...visitsByClient.values()].filter((count) => count >= 2).length, visitsByClient.size);
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
  // Los riesgos son los clientes de verdad, con las mismas reglas que Clientes: la cifra lleva a su lista.
  const { churned, atRisk, overdue, neverBooked, rhythmDays } = clientRisks();
  const peakHour = CAPACITY_HOURS[rows.flatMap((row) => row.values).reduce<{ index: number; value: number }>((top, value, index) => (value > top.value ? { index: index % CAPACITY_HOURS.length, value } : top), { index: 0, value: -1 }).index];

  return {
    window: { from: toIsoDate(start), to: toIsoDate(end) },
    health: { score, completionRate, retentionRate, noShowRate, avgTicket },
    risks: { churned, atRisk, overdue },
    capacity: { hours: CAPACITY_HOURS, rows },
    suggestions: [
      ...(neverBooked > 0
        ? [
            {
              id: "never-booked",
              group: "clients" as const,
              type: "risk" as const,
              tag: "Retención",
              title: `${neverBooked} clientes registrados nunca han venido`,
              description: "Tienen ficha en la barbería pero ninguna visita. Son ingreso potencial que ya conoce la barbería.",
              action: "Enviar una oferta de bienvenida para su primera visita",
              evidence: `${neverBooked} fichas sin ninguna visita`,
            },
          ]
        : []),
      {
        id: "overdue",
        group: "clients",
        type: "recommendation",
        tag: "Frecuencia",
        title: `${overdue} clientes habituales llevan más de 6 semanas sin venir`,
        description: "Venían cada 3–4 semanas y se han pasado de su ritmo. Un recordatorio a tiempo suele recuperarlos antes de que se vayan.",
        action: "Programar un recordatorio con su barbero de preferencia",
        evidence: rhythmDays ? `Ritmo medio de ${rhythmDays} días entre visitas` : undefined,
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
        description: "Es la franja con más citas por silla de los últimos tres meses. Abrir una silla más o mover un descanso amplía la caja sin captar clientes nuevos.",
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
              description: "Por encima del 20 % la agenda pierde huecos que ya nadie ocupa. Un recordatorio 24 h antes y pedir confirmación suelen bajarla.",
              action: "Activar el recordatorio automático 24 h antes",
              evidence: `${appointments.filter((item) => item.status !== "completed" && item.status !== "pendingCollection").length} citas perdidas en 3 meses`,
            },
          ]
        : []),
    ],
  };
}

/** Perdidos, en riesgo y a los que ya les tocaba volver, entre los clientes de la barbería. */
function clientRisks(): { churned: number; atRisk: number; overdue: number; neverBooked: number; rhythmDays: number | null } {
  const clients = db.calendar.clients.filter((client) => client.id !== WALK_IN_CLIENT.id && !profileOf(client).deleted);
  const facts = clients.map((client) => ({ ...lifecycleOf(client, profileOf(client).blocked), visitEveryDays: client.visitEveryDays ?? null }));
  const rhythms = facts.flatMap((item) => (item.visitEveryDays ? [item.visitEveryDays] : []));
  return {
    churned: facts.filter((item) => item.segment === "lost").length,
    atRisk: facts.filter((item) => item.segment === "atRisk").length,
    overdue: facts.filter((item) => isOverdue(item)).length,
    neverBooked: clients.filter((client) => client.visits === 0).length,
    rhythmDays: rhythms.length > 0 ? Math.round(rhythms.reduce((sum, days) => sum + days, 0) / rhythms.length) : null,
  };
}
