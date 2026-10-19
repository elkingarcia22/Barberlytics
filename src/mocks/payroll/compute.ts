import { db } from "../db";
import { appointmentAccount } from "../calendar/account";
import { barberServicePrice, productPriceIn } from "../catalogPrices";
import { appointmentsOn } from "../calendar/handlers";
import { dateKey, type MockAppointment } from "../calendar/seed";
import { taxInclusive } from "../settings/branchRules";
import { memberName, type MockCompensation, type MockTeamMember } from "../team/seed";
import type { MockPayrollAdjustment } from "./state";

/**
 * El cálculo de la nómina, sin HTTP. Cuadra con la caja:
 *
 * - La base de la comisión es lo cobrado de cada servicio, al precio del barbero que lo hizo (el
 *   mismo de la reserva y de la caja), menos lo que Configuración › Comisiones manda descontar:
 *   el descuento que se le hizo al cliente, el impuesto si va incluido en el precio y el costo.
 * - En escala, el tramo sale de lo vendido en el **ciclo de pago** (Configuración › Nómina), no del
 *   rango que se esté mirando: el mismo barbero cae en el mismo tramo en el día, la semana o el mes.
 * - Las deducciones de la renta son un porcentaje de la venta, como las pide su ficha.
 * - Con renta, importa quién tiene el dinero: lo que entró por la caja de la barbería (tarjeta,
 *   enlace, pago en línea) es del barbero y la barbería se lo guarda; lo que cobró él en efectivo ya
 *   lo tiene. Su neto es lo guardado menos la renta y las deducciones.
 * - Lo devuelto al cliente no comisiona: la base baja en la misma proporción.
 * - Los ajustes del periodo (bono, descuento, adelanto) entran en el neto.
 */

export type Rule = "walkIn" | "noPreference" | "newClient" | "recurring" | "basic";
export type Payout = "commission" | "rent" | "salary";

const DAY_MS = 86_400_000;
const round = (value: number) => Math.round(value * 100) / 100;

interface CommissionSettings {
  deductDiscounts: boolean;
  deductTaxes: boolean;
  deductServiceCost: boolean;
  deductProductCost: boolean;
}

interface CycleSettings {
  cycle: "weekly" | "biweekly" | "monthly";
  startDay: number;
}

const commissionSettings = (): CommissionSettings => db.settings.sections.commissions as unknown as CommissionSettings;
const cycleSettings = (): CycleSettings => db.settings.sections.payrollCycle as unknown as CycleSettings;

const payoutOf = (member: MockTeamMember): Payout => (member.role === "barbero-renta" ? "rent" : member.compensation?.type === "salary" ? "salary" : "commission");

/**
 * Quién trajo al cliente decide la regla; la más específica gana. Un cliente es nuevo una sola vez:
 * con la etiqueta «nuevo», solo su primera cita cobrada del periodo (`firstVisits`) paga como nueva.
 */
function ruleOf(appointment: MockAppointment, firstVisits: ReadonlySet<string>): Rule {
  if (appointment.walkIn) return "walkIn";
  if (appointment.requestedBarberId === null) return "noPreference";
  const client = db.calendar.clients.find((item) => item.id === appointment.clientId);
  if (client?.type === "new" && firstVisits.has(appointment.id)) return "newClient";
  if (client && client.type !== "walkin") return "recurring";
  return "basic";
}

/** El porcentaje de la regla; si no tiene uno propio, el básico. En escala, el del tramo alcanzado en el ciclo. */
function rateOf(compensation: MockCompensation, rule: Rule, cycleSales: number): number {
  if (compensation.type === "scale" && compensation.scale.length > 0) {
    const tier = [...compensation.scale].sort((a, b) => b.from - a.from).find((item) => cycleSales >= item.from);
    return tier?.percent ?? compensation.basic;
  }
  const own = rule === "basic" ? null : compensation[rule];
  return own ?? compensation.basic;
}

const localDay = (iso: string): Date => new Date(`${iso.slice(0, 10)}T00:00:00`);

/** Los días del ciclo de pago que contiene esa fecha: semanal o quincenal desde el día de la semana elegido, o mensual desde el día del mes. */
export function cycleWindow(day: Date, settings: CycleSettings = cycleSettings()): { from: Date; to: Date } {
  if (settings.cycle === "monthly") {
    const startDay = Math.min(Math.max(1, settings.startDay), 28);
    const from = new Date(day.getFullYear(), day.getMonth() - (day.getDate() < startDay ? 1 : 0), startDay);
    return { from, to: new Date(from.getFullYear(), from.getMonth() + 1, startDay - 1) };
  }
  const length = settings.cycle === "biweekly" ? 14 : 7;
  // La quincena cuenta desde un lunes fijo (5 de enero de 2026) movido al día de la semana elegido.
  const anchor = new Date(2026, 0, 5 + ((settings.startDay - 1 + 7) % 7));
  const offset = Math.floor((day.getTime() - anchor.getTime()) / DAY_MS);
  const from = new Date(anchor.getTime() + (offset - (((offset % length) + length) % length)) * DAY_MS);
  return { from, to: new Date(from.getTime() + (length - 1) * DAY_MS) };
}

const isPaid = (item: MockAppointment) => item.status === "paid" && item.payment !== null;

/**
 * La parte de una cita que es de servicios y la de productos, como base de comisión: lo cobrado al
 * precio del barbero menos lo que Configuración › Comisiones manda descontar.
 */
function basesOf(item: MockAppointment, settings: CommissionSettings): { service: number; product: number } {
  const serviceGross = item.serviceIds.reduce((sum, id) => sum + barberServicePrice(item.barberId, id, item.branchId), 0);
  const productGross = item.products.reduce((sum, row) => sum + productPriceIn(row.productId, item.branchId) * row.qty, 0);
  const gross = serviceGross + productGross;
  const account = appointmentAccount(item);
  const share = (part: number) => (gross > 0 ? part / gross : 0);
  const discount = settings.deductDiscounts ? account.discount : 0;
  // Con el impuesto encima del precio, la base ya no lo lleva; incluido, se le quita si así se pide.
  const tax = settings.deductTaxes && taxInclusive() ? (item.payment?.tax ?? account.tax) : 0;
  const serviceCost = settings.deductServiceCost ? item.serviceIds.reduce((sum, id) => sum + (db.services.items.find((service) => service.id === id)?.cost ?? 0), 0) : 0;
  // Lo devuelto no comisiona: la base baja en la misma proporción.
  const refunded = (item.refunds ?? []).reduce((sum, refund) => sum + refund.amount, 0);
  const charged = account.total + (item.payment?.tip ?? 0);
  const kept = charged > 0 ? Math.max(0, 1 - refunded / charged) : 1;
  const productCost = settings.deductProductCost ? item.products.reduce((sum, row) => sum + (db.products.items.find((product) => product.id === row.productId)?.cost ?? 0) * row.qty, 0) : 0;
  return {
    service: round(Math.max(0, (serviceGross - (discount + tax) * share(serviceGross) - serviceCost) * kept)),
    product: round(Math.max(0, (productGross - (discount + tax) * share(productGross) - productCost) * kept)),
  };
}

/** Lo vendido en servicios por cada barbero en el ciclo de cada fecha: la cifra que elige el tramo de la escala. */
function cycleSalesFor(branchId: string, settings: CommissionSettings) {
  const cache = new Map<string, number>();
  return (memberId: string, date: string): number => {
    const window = cycleWindow(localDay(date));
    const key = `${memberId}:${dateKey(window.from)}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const days = Math.round((window.to.getTime() - window.from.getTime()) / DAY_MS) + 1;
    const total = Array.from({ length: days }, (_, index) => appointmentsOn(branchId, dateKey(new Date(window.from.getTime() + index * DAY_MS))))
      .flat()
      .filter((item) => item.barberId === memberId && isPaid(item))
      .reduce((sum, item) => sum + basesOf(item, settings).service, 0);
    cache.set(key, total);
    return total;
  };
}

/**
 * Qué parte de lo cobrado de una cita entró por la caja de la barbería (0 a 1): todo con tarjeta o
 * enlace; en efectivo, solo lo pagado en línea; en mixto, la parte de tarjeta.
 */
function shopShareOf(item: MockAppointment, total: number): number {
  const prepaid = item.payment?.prepaid ?? 0;
  const method = item.payment?.method;
  if (method === "mixed" && item.payment?.split) {
    const { cash, card } = item.payment.split;
    return Math.min(1, (card + prepaid) / Math.max(0.01, cash + card + prepaid));
  }
  if (method === "cash") return total > 0 ? Math.min(1, prepaid / total) : 0;
  return 1;
}

/** La primera cita cobrada de cada cliente en estas citas: la única que puede contar como «cliente nuevo». */
function firstVisitsOf(appointments: readonly MockAppointment[]): Set<string> {
  const firstByClient = new Map<string, MockAppointment>();
  for (const item of appointments) {
    if (!isPaid(item)) continue;
    const current = firstByClient.get(item.clientId);
    if (!current || item.start < current.start) firstByClient.set(item.clientId, item);
  }
  return new Set([...firstByClient.values()].map((item) => item.id));
}

const ADJUSTMENT_SIGN: Record<MockPayrollAdjustment["kind"], 1 | -1> = { bonus: 1, deduction: -1, advance: -1 };

export function payrollOf(member: MockTeamMember, appointments: readonly MockAppointment[], weeks: number, branchId: string, adjustments: readonly MockPayrollAdjustment[]) {
  const settings = commissionSettings();
  const cycleSales = cycleSalesFor(branchId, settings);
  const payout = payoutOf(member);
  const mine = appointments.filter((item) => item.barberId === member.id && isPaid(item));
  const firstVisits = firstVisitsOf(appointments);
  const compensation = member.compensation;
  const payments = member.payments;

  const entries = mine
    .map((item) => {
      const rule = ruleOf(item, firstVisits);
      const bases = basesOf(item, settings);
      const sale = bases.service;
      const rate = payout === "commission" && compensation ? rateOf(compensation, rule, cycleSales(member.id, item.start)) : null;
      const percent = payout === "rent" && payments ? (rule === "walkIn" ? payments.walkInDeduction : rule === "noPreference" ? payments.noPreferenceDeduction : rule === "newClient" ? payments.newClientDeduction : 0) : 0;
      const client = db.calendar.clients.find((entry) => entry.id === item.clientId);
      const service = item.serviceIds.map((id) => db.services.items.find((entry) => entry.id === id)?.name ?? id).join(" + ");
      // Con renta: cuánto de lo que pagó el cliente (con propina) entró por la caja de la barbería.
      const charged = appointmentAccount(item).total + (item.payment?.tip ?? 0);
      const held = payout === "rent" ? round(charged * shopShareOf(item, charged)) : 0;
      const line = {
        appointmentId: item.id,
        date: item.start,
        client: client?.name ?? "—",
        service,
        rule,
        rate,
        sale,
        commission: rate === null ? 0 : round((sale * rate) / 100),
        tip: item.payment?.tip ?? 0,
        deduction: round((sale * percent) / 100),
        collectedBy: payout === "rent" ? (held > 0 ? ("shop" as const) : ("barber" as const)) : null,
        held,
      };
      return { line, productSale: bases.product };
    })
    .sort((a, b) => b.line.date.localeCompare(a.line.date));
  const lines = entries.map((entry) => entry.line);

  const serviceSales = round(lines.reduce((sum, line) => sum + line.sale, 0));
  const productSales = round(entries.reduce((sum, entry) => sum + entry.productSale, 0));
  const productPercent = compensation?.productPercent ?? 0;
  const serviceCommission = round(lines.reduce((sum, line) => sum + line.commission, 0));
  const productCommission = payout === "rent" ? 0 : round((productSales * productPercent) / 100);
  const tips = round(lines.reduce((sum, line) => sum + line.tip, 0));
  const salary = payout === "salary" ? round((compensation?.salary ?? 0) * weeks) : 0;
  const rent = payout === "rent" ? round((payments?.rentBase ?? 0) * weeks) : 0;
  const deductions = round(lines.reduce((sum, line) => sum + line.deduction, 0));
  const mineAdjustments = adjustments.filter((item) => item.memberId === member.id);
  const adjustmentsTotal = round(mineAdjustments.reduce((sum, item) => sum + ADJUSTMENT_SIGN[item.kind] * item.amount, 0));
  const held = round(lines.reduce((sum, line) => sum + line.held, 0));
  /*
   * Positivo: la barbería le paga. Negativo: el barbero le debe a la barbería. Con renta, el neto es
   * lo que la barbería le guarda (lo que entró por su caja) menos la renta y las deducciones; las
   * propinas que cobró él en efectivo ya las tiene.
   */
  const net = payout === "rent" ? round(held - rent - deductions + adjustmentsTotal) : round(serviceCommission + productCommission + tips + salary - rent - deductions + adjustmentsTotal);

  return {
    memberId: member.id,
    name: memberName(member),
    avatarUrl: member.avatarUrl,
    payout,
    rules:
      payout === "commission" && compensation
        ? { type: compensation.type, basic: compensation.basic, recurring: compensation.recurring, walkIn: compensation.walkIn, noPreference: compensation.noPreference, newClient: compensation.newClient, productPercent: compensation.productPercent, scale: compensation.scale }
        : null,
    rentBase: payout === "rent" ? (payments?.rentBase ?? 0) : null,
    salaryBase: payout === "salary" ? (compensation?.salary ?? 0) : null,
    services: lines.length,
    serviceSales,
    productSales,
    serviceCommission,
    productCommission,
    tips,
    salary,
    rent,
    deductions,
    held,
    adjustments: mineAdjustments.map(({ id, kind, amount, note, createdAt, createdBy }) => ({ id, kind, amount, note, createdAt, createdBy })),
    adjustmentsTotal,
    net,
    lines,
  };
}
