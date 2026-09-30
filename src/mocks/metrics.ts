import { seededRandom } from "./db";
import { fromIsoDate, periodRange, previousPeriodRange, toIsoDate, type PeriodGranularity, type PeriodRange } from "@/components/date/periodRange";
import type { AppointmentStatus, BookingMethod, Daypart, IncomeLine, MetricsBusiness, PaymentMethod } from "@/features/metrics/types";

/**
 * Las métricas del negocio, simuladas.
 *
 * Deterministas por periodo y barbero: la misma semana devuelve siempre las
 * mismas cifras, así que una captura o una prueba no cambian de un día para
 * otro. El periodo anterior sale del mismo generador, con lo que las
 * variaciones son coherentes con lo que se ve al pulsar «anterior».
 */

export const BARBERS = [
  { id: "b4", name: "Andrés Beltrán" },
  { id: "b5", name: "Nicolás Duarte" },
  { id: "b6", name: "Valeria Marín" },
  { id: "b7", name: "Tomás Peña" },
  { id: "b8", name: "Daniela Osorio" },
] as const;

const SERVICES = [
  { id: "maintenance", name: "Corte de mantenimiento", price: 45, weight: 34 },
  { id: "cut-beard", name: "Corte + barba", price: 65, weight: 19 },
  { id: "kids", name: "Corte infantil", price: 32, weight: 5 },
  { id: "beard", name: "Arreglo de barba o afeitado", price: 30, weight: 2 },
  { id: "extended", name: "Corte extendido", price: 80, weight: 1 },
  { id: "first-visit", name: "Primera visita", price: 55, weight: 1 },
] as const;

const PRODUCTS = [
  { id: "pomade", name: "Pomada mate", price: 22, weight: 5 },
  { id: "beard-oil", name: "Aceite de barba", price: 18, weight: 3 },
  { id: "shampoo", name: "Champú", price: 15, weight: 2 },
] as const;

/** Peso de cada hora del día: la barbería abre de 8 a 20 con dos picos. */
const HOUR_WEIGHTS: readonly number[] = [0, 0, 0, 0, 0, 0, 0, 0, 3, 6, 8, 10, 7, 5, 6, 8, 9, 11, 9, 6, 3, 0, 0, 0];

const DAY_MS = 86_400_000;

function hashSeed(text: string): number {
  let hash = 2166136261;
  for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

export const daysOf = ({ from, to }: PeriodRange): Date[] =>
  Array.from({ length: Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1 }, (_, index) => new Date(from.getTime() + index * DAY_MS));

function pickWeighted<T extends { weight: number }>(items: readonly T[], roll: number): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = roll * total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) return item;
  }
  return items[items.length - 1];
}

/** La hora de una cita, tirada con el peso de cada franja. */
function pickHour(roll: number): number {
  const total = sum(HOUR_WEIGHTS);
  let cursor = roll * total;
  for (let hour = 0; hour < HOUR_WEIGHTS.length; hour += 1) {
    cursor -= HOUR_WEIGHTS[hour];
    if (cursor <= 0 && HOUR_WEIGHTS[hour] > 0) return hour;
  }
  return 12;
}

export const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
export const round2 = (value: number) => Math.round(value * 100) / 100;

export interface Appointment {
  hour: number;
  status: AppointmentStatus;
  method: BookingMethod;
  service: (typeof SERVICES)[number];
  tip: number;
  payment: PaymentMethod;
  discount: number;
}

export interface DayRecord {
  date: Date;
  appointments: Appointment[];
  products: { product: (typeof PRODUCTS)[number]; units: number }[];
  refunds: number;
}

/** Un día de trabajo: cerrado los domingos, más flojo el lunes, lleno el sábado. */
export function simulateDay(date: Date, barberId: string): DayRecord {
  const rand = seededRandom(hashSeed(`${toIsoDate(date)}|${barberId}`));
  const weekday = date.getDay();
  const share = barberId === "all" ? 1 : 0.22;
  const base = weekday === 0 ? 0 : weekday === 6 ? 16 : weekday === 1 ? 8 : 12;
  const count = Math.round((base + rand() * 4) * share);

  const appointments = Array.from({ length: count }, (): Appointment => {
    const hour = pickHour(rand());
    const roll = rand();
    const status: AppointmentStatus = roll < 0.68 ? "completed" : roll < 0.74 ? "pendingCollection" : roll < 0.95 ? "cancelled" : "noShow";
    const methodRoll = rand();
    const method: BookingMethod = methodRoll < 0.86 ? "internal" : methodRoll < 0.97 ? "online" : "walkIn";
    const paymentRoll = rand();
    const payment: PaymentMethod = paymentRoll < 0.78 ? "card" : paymentRoll < 0.94 ? "cash" : paymentRoll < 0.99 ? "transfer" : "giftCard";
    const service = pickWeighted(SERVICES, rand());
    return {
      hour,
      status,
      method,
      service,
      tip: status === "completed" ? Math.round(service.price * (0.12 + rand() * 0.16)) : 0,
      payment,
      discount: rand() < 0.08 ? 5 : 0,
    };
  });

  const products = PRODUCTS.filter(() => rand() < 0.35 * share).map((product) => ({ product, units: 1 + Math.floor(rand() * 2) }));
  const refunds = rand() < 0.06 ? 45 : 0;
  return { date, appointments, products, refunds };
}

export interface PeriodTotals {
  sales: number;
  services: number;
  products: number;
  tips: number;
  fees: number;
  taxes: number;
  noShowFees: number;
  transactions: number;
  cancellationRate: number;
  tipsRate: number;
  refunds: number;
  discounts: number;
}

export function totalsOf(days: readonly DayRecord[]): PeriodTotals {
  const appointments = days.flatMap((day) => day.appointments);
  const completed = appointments.filter((item) => item.status === "completed");
  const services = sum(completed.map((item) => item.service.price));
  const products = sum(days.flatMap((day) => day.products.map((row) => row.product.price * row.units)));
  const tips = sum(completed.map((item) => item.tip));
  const noShowFees = appointments.filter((item) => item.status === "noShow").length * 15;
  const discounts = sum(completed.map((item) => item.discount));
  const gross = services + products + noShowFees - discounts;
  const fees = round2(gross * 0.029);
  const taxes = round2(products * 0.07);
  const sales = round2(gross + tips + taxes);
  const lost = appointments.filter((item) => item.status === "cancelled" || item.status === "noShow").length;
  const transactions = completed.length + days.reduce((count, day) => count + day.products.length, 0);
  return {
    sales,
    services,
    products,
    tips,
    fees,
    taxes,
    noShowFees,
    transactions,
    cancellationRate: appointments.length ? round2((lost / appointments.length) * 100) : 0,
    tipsRate: services ? round2((tips / services) * 100) : 0,
    refunds: sum(days.map((day) => day.refunds)),
    discounts,
  };
}

export const countBy = <K extends string>(keys: readonly K[], items: readonly { key: K }[]) =>
  keys.map((id) => ({ id, count: items.filter((item) => item.key === id).length }));

export const daypartOf = (hour: number): Daypart => (hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening");

function trendOf(days: readonly DayRecord[], granularity: PeriodGranularity, locale = "es-CO") {
  if (granularity === "day") {
    const day = days[0];
    return Array.from({ length: 13 }, (_, index) => index + 8).map((hour) => {
      const slot = day.appointments.filter((item) => item.hour === hour && item.status === "completed");
      return { label: `${String(hour).padStart(2, "0")}:00`, sales: sum(slot.map((item) => item.service.price + item.tip)), appointments: slot.length };
    });
  }
  const formatter = new Intl.DateTimeFormat(locale, granularity === "week" ? { weekday: "short" } : { day: "numeric" });
  return days.map((day) => ({ label: formatter.format(day.date), sales: totalsOf([day]).sales, appointments: day.appointments.length }));
}

function catalogOf<T extends { id: string; name: string; price: number }>(rows: readonly { item: T; units: number }[], catalog: readonly T[]) {
  return catalog
    .map((entry) => {
      const matching = rows.filter((row) => row.item.id === entry.id);
      return { id: entry.id, name: entry.name, count: sum(matching.map((row) => row.units)), amount: sum(matching.map((row) => row.item.price * row.units)) };
    })
    .filter((row) => row.count > 0);
}

export interface MetricsQuery {
  granularity?: string | null;
  date?: string | null;
  barberId?: string | null;
}

export interface SimulatedPeriod {
  granularity: PeriodGranularity;
  anchor: Date;
  barberId: string;
  range: PeriodRange;
  previous: PeriodRange;
  days: DayRecord[];
  previousDays: DayRecord[];
}

/** El periodo pedido y el anterior, ya simulados: lo que comparten las cinco pestañas. */
export function simulatePeriod(query: MetricsQuery): SimulatedPeriod {
  const granularity: PeriodGranularity = query.granularity === "day" || query.granularity === "week" ? query.granularity : "month";
  const anchor = fromIsoDate(query.date) ?? new Date();
  const barberId = BARBERS.some((barber) => barber.id === query.barberId) ? String(query.barberId) : "all";
  const range = periodRange(anchor, granularity);
  const previous = previousPeriodRange(anchor, granularity);
  return {
    granularity,
    anchor,
    barberId,
    range,
    previous,
    days: daysOf(range).map((date) => simulateDay(date, barberId)),
    previousDays: daysOf(previous).map((date) => simulateDay(date, barberId)),
  };
}

export const periodOf = ({ granularity, range }: SimulatedPeriod) => ({ granularity, from: toIsoDate(range.from), to: toIsoDate(range.to) });
export const previousOf = ({ previous }: SimulatedPeriod) => ({ from: toIsoDate(previous.from), to: toIsoDate(previous.to) });

export function buildBusinessMetrics(query: MetricsQuery): MetricsBusiness {
  const sim = simulatePeriod(query);
  const { granularity, days, previousDays } = sim;
  const now = totalsOf(days);
  const before = totalsOf(previousDays);

  const appointments = days.flatMap((day) => day.appointments);
  const completed = appointments.filter((item) => item.status === "completed");
  const ticket = (totals: PeriodTotals) => (totals.transactions ? round2(totals.sales / totals.transactions) : 0);

  const income: { id: IncomeLine; amount: number }[] = [
    { id: "services", amount: now.services },
    { id: "products", amount: now.products },
    { id: "taxes", amount: now.taxes },
    { id: "tips", amount: now.tips },
    { id: "fees", amount: now.fees },
    { id: "noShow", amount: now.noShowFees },
  ];

  const paymentIds: readonly PaymentMethod[] = ["card", "cash", "transfer", "giftCard"];
  const payments = paymentIds
    .map((id) => ({ id, amount: sum(completed.filter((item) => item.payment === id).map((item) => item.service.price + item.tip)) }))
    .filter((row) => row.amount > 0);

  return {
    period: periodOf(sim),
    previous: previousOf(sim),
    barbers: BARBERS.map((barber) => ({ ...barber })),
    kpis: {
      sales: { value: now.sales, previous: before.sales },
      averageTicket: { value: ticket(now), previous: ticket(before) },
      transactions: { value: now.transactions, previous: before.transactions },
      tipsRate: { value: now.tipsRate, previous: before.tipsRate },
      tipsAmount: now.tips,
      cancellationRate: { value: now.cancellationRate, previous: before.cancellationRate },
      refunds: { amount: now.refunds, rate: now.sales ? round2((now.refunds / now.sales) * 100) : 0 },
      discounts: { amount: now.discounts, rate: now.sales ? round2((now.discounts / now.sales) * 100) : 0 },
    },
    trend: trendOf(days, granularity),
    income,
    appointments: {
      total: appointments.length,
      clients: Math.round(appointments.length * 0.82),
      byStatus: countBy<AppointmentStatus>(["completed", "pendingCollection", "cancelled", "noShow"], appointments.map((item) => ({ key: item.status }))),
      byMethod: countBy<BookingMethod>(["internal", "online", "walkIn"], appointments.map((item) => ({ key: item.method }))),
      byDaypart: countBy<Daypart>(["morning", "afternoon", "evening"], appointments.map((item) => ({ key: daypartOf(item.hour) }))),
      byHour: HOUR_WEIGHTS.map((_, hour) => ({ hour, count: appointments.filter((item) => item.hour === hour).length })).filter((row) => row.hour >= 7 && row.hour <= 21),
    },
    payments,
    services: catalogOf(completed.map((item) => ({ item: item.service, units: 1 })), SERVICES),
    products: catalogOf(days.flatMap((day) => day.products.map((row) => ({ item: row.product, units: row.units }))), PRODUCTS),
  };
}
