import { db } from "./db";
import { appointmentAccount } from "./calendar/account";
import { barberServicePrice, productPriceIn } from "./catalogPrices";
import { appointmentsOn, barbersIn } from "./calendar/handlers";
import { dateKey, type MockAppointment } from "./calendar/seed";
import { fromIsoDate, periodRange, previousPeriodRange, toIsoDate, type PeriodGranularity, type PeriodRange } from "@/components/date/periodRange";
import type { AppointmentStatus, BookingMethod, Daypart, IncomeLine, MetricsBusiness, PaymentMethod } from "@/features/metrics/types";

/**
 * Las métricas del negocio, leídas de lo que pasó en la sucursal.
 *
 * Cada día sale de la agenda (`appointmentsOn`), de las ventas de mostrador y de las devoluciones
 * de esa sucursal, al precio del barbero y con el impuesto registrado: las cifras de Métricas son
 * las mismas que Calendario y Transacciones para el mismo día. La agenda de la demo se siembra de
 * forma determinista, así que una captura o una prueba no cambian de un día para otro.
 */

const DAY_MS = 86_400_000;

/** Lo que el tablero sabe de un servicio o producto. */
export interface CatalogItem {
  id: string;
  name: string;
  price: number;
}

/** Los barberos de la sucursal, en su orden de la agenda. */
export const barbersOfBranch = (branchId: string): { id: string; name: string }[] => barbersIn(branchId).map((barber) => ({ id: barber.id, name: barber.name }));

/** El barbero que pide la consulta, si atiende en esa sucursal; `null` es «todo el equipo». */
export function resolveMetricsBarber(id: string | null | undefined, branchId: string): { id: string; name: string } | null {
  if (!id || id === "all") return null;
  return barbersOfBranch(branchId).find((barber) => barber.id === id) ?? null;
}

export const daysOf = ({ from, to }: PeriodRange): Date[] =>
  Array.from({ length: Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1 }, (_, index) => new Date(from.getTime() + index * DAY_MS));

export const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
export const round2 = (value: number) => Math.round(value * 100) / 100;

export interface Appointment {
  hour: number;
  status: AppointmentStatus;
  method: BookingMethod;
  /** El servicio de la cita (si son varios, juntos), al precio del barbero. */
  service: CatalogItem;
  tip: number;
  tax: number;
  payment: PaymentMethod;
  discount: number;
  clientId: string;
  barberId: string;
  /** El cliente pidió a ese barbero (no «sin preferencia»). */
  requested: boolean;
}

export interface DayRecord {
  date: Date;
  appointments: Appointment[];
  products: { product: CatalogItem; units: number }[];
  /** El impuesto de las ventas de mostrador del día. */
  salesTax: number;
  refunds: number;
}

const STATUS: Record<MockAppointment["status"], AppointmentStatus> = {
  paid: "completed",
  scheduled: "pendingCollection",
  arrived: "pendingCollection",
  seated: "pendingCollection",
  cancelled: "cancelled",
  no_show: "noShow",
};
const METHOD: Record<MockAppointment["source"], BookingMethod> = { internal: "internal", online: "online", walkin: "walkIn" };
const PAYMENT: Record<string, PaymentMethod> = { cash: "cash", card: "card", link: "transfer", mixed: "card" };

const productOf = (id: string, branchId: string): CatalogItem => ({ id, name: db.products.items.find((item) => item.id === id)?.name ?? id, price: productPriceIn(id, branchId) });

/** Un día de la sucursal tal como pasó: sus citas (de un barbero o de todos), sus ventas y sus devoluciones. */
export function dayRecord(date: Date, barberId: string, branchId: string): DayRecord {
  const key = dateKey(date);
  const mine = appointmentsOn(branchId, key).filter((item) => barberId === "all" || item.barberId === barberId);
  const appointments = mine.map((item): Appointment => {
    const account = appointmentAccount(item);
    const names = item.serviceIds.map((id) => db.services.items.find((service) => service.id === id)?.name ?? id);
    const servicePrice = item.serviceIds.reduce((total, id) => total + barberServicePrice(item.barberId, id, branchId), 0);
    return {
      hour: Number(item.start.slice(11, 13)),
      status: STATUS[item.status],
      method: METHOD[item.source],
      service: { id: item.serviceIds.join("+"), name: names.join(" + "), price: servicePrice },
      tip: item.payment?.tip ?? 0,
      tax: item.status === "paid" ? account.tax : 0,
      payment: item.payment ? (PAYMENT[item.payment.method] ?? "card") : item.online ? "card" : "cash",
      discount: account.discount,
      clientId: item.clientId,
      barberId: item.barberId,
      requested: item.requestedBarberId !== null,
    };
  });
  // Los productos que se llevaron en las citas cobradas y, para todo el equipo, los de mostrador.
  const sales = barberId === "all" ? db.calendar.sales.filter((sale) => sale.branchId === branchId && dateKey(new Date(sale.paidAt)) === key) : [];
  const products = [
    ...mine.filter((item) => item.status === "paid").flatMap((item) => item.products.map((row) => ({ product: productOf(row.productId, branchId), units: row.qty }))),
    ...sales.flatMap((sale) => sale.items.map((row) => ({ product: productOf(row.productId, branchId), units: row.qty }))),
  ];
  const refunds = sum(mine.flatMap((item) => (item.refunds ?? []).map((refund) => refund.amount)));
  return { date, appointments, products, salesTax: sum(sales.map((sale) => sale.tax ?? 0)), refunds };
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
  // La agenda no cobra inasistencias todavía: sin cargo inventado.
  const noShowFees = 0;
  const discounts = sum(completed.map((item) => item.discount));
  const gross = services + products + noShowFees - discounts;
  // La tarifa de la pasarela, estimada sobre lo que se pagó con tarjeta; no entra en ventas.
  const fees = round2(sum(completed.filter((item) => item.payment === "card").map((item) => item.service.price - item.discount + item.tip)) * 0.029);
  const taxes = round2(sum(completed.map((item) => item.tax)) + sum(days.map((day) => day.salesTax)));
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

/** Lo vendido por artículo, de lo que más deja a lo que menos. */
function catalogOf(rows: readonly { item: CatalogItem; units: number }[]) {
  const byId = new Map<string, { id: string; name: string; count: number; amount: number }>();
  for (const { item, units } of rows) {
    const current = byId.get(item.id) ?? { id: item.id, name: item.name, count: 0, amount: 0 };
    byId.set(item.id, { ...current, count: current.count + units, amount: round2(current.amount + item.price * units) });
  }
  return [...byId.values()].sort((a, b) => b.amount - a.amount);
}

export interface MetricsQuery {
  granularity?: string | null;
  date?: string | null;
  barberId?: string | null;
  branchId?: string | null;
}

export interface SimulatedPeriod {
  granularity: PeriodGranularity;
  anchor: Date;
  barberId: string;
  branchId: string;
  range: PeriodRange;
  previous: PeriodRange;
  days: DayRecord[];
  previousDays: DayRecord[];
}

/** El periodo pedido y el anterior, ya simulados: lo que comparten las cinco pestañas. */
export function simulatePeriod(query: MetricsQuery): SimulatedPeriod {
  const granularity: PeriodGranularity = query.granularity === "day" || query.granularity === "week" ? query.granularity : "month";
  const anchor = fromIsoDate(query.date) ?? new Date();
  const branchId = query.branchId || "ma";
  const barberId = resolveMetricsBarber(query.barberId, branchId)?.id ?? "all";
  const range = periodRange(anchor, granularity);
  const previous = previousPeriodRange(anchor, granularity);
  return {
    granularity,
    anchor,
    barberId,
    branchId,
    range,
    previous,
    days: daysOf(range).map((date) => dayRecord(date, barberId, branchId)),
    previousDays: daysOf(previous).map((date) => dayRecord(date, barberId, branchId)),
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

  /*
   * El origen del ingreso suma exactamente «Ventas»: servicios (ya con su descuento), productos,
   * cargos por inasistencia, impuestos y propinas. La tarifa de la pasarela (`fees`) es un costo,
   * no un ingreso: no va aquí (y llamarla «comisiones» se confundía con la del barbero).
   */
  const income: { id: IncomeLine; amount: number }[] = [
    { id: "services", amount: round2(now.services - now.discounts) },
    { id: "products", amount: now.products },
    { id: "noShow", amount: now.noShowFees },
    { id: "taxes", amount: now.taxes },
    { id: "tips", amount: now.tips },
  ];

  /*
   * Cómo se pagaron las ventas: el reparto entre métodos sale de las citas cobradas y se aplica a
   * todas las ventas (productos e impuestos incluidos), así la dona suma lo mismo que «Ventas».
   */
  const paymentIds: readonly PaymentMethod[] = ["card", "cash", "transfer", "giftCard"];
  const paidBy = paymentIds.map((id) => ({ id, amount: sum(completed.filter((item) => item.payment === id).map((item) => item.service.price - item.discount + item.tip)) }));
  const paidTotal = sum(paidBy.map((row) => row.amount));
  const payments = paidBy.map((row) => ({ id: row.id, amount: paidTotal ? round2((now.sales * row.amount) / paidTotal) : 0 })).filter((row) => row.amount > 0);

  return {
    period: periodOf(sim),
    previous: previousOf(sim),
    barbers: barbersOfBranch(sim.branchId),
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
      clients: new Set(appointments.map((item) => item.clientId)).size,
      byStatus: countBy<AppointmentStatus>(["completed", "pendingCollection", "cancelled", "noShow"], appointments.map((item) => ({ key: item.status }))),
      byMethod: countBy<BookingMethod>(["internal", "online", "walkIn"], appointments.map((item) => ({ key: item.method }))),
      byDaypart: countBy<Daypart>(["morning", "afternoon", "evening"], appointments.map((item) => ({ key: daypartOf(item.hour) }))),
      byHour: Array.from({ length: 15 }, (_, index) => index + 7).map((hour) => ({ hour, count: appointments.filter((item) => item.hour === hour).length })),
    },
    payments,
    services: catalogOf(completed.map((item) => ({ item: item.service, units: 1 }))),
    products: catalogOf(days.flatMap((day) => day.products.map((row) => ({ item: row.product, units: row.units })))),
  };
}
