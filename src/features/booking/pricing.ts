/**
 * Las cuentas de una reserva en línea, sin interfaz: cuánto suman las citas y
 * los productos, qué descuenta un cupón, cuánto es la propina, el impuesto y
 * qué se devuelve al cancelar. Las usan la pantalla (para enseñar el total
 * antes de pagar) y el backend simulado (que es quien cobra): así el número
 * que ve el cliente es el mismo que se le cobra.
 */

export type TipKind = "percent" | "amount";

export interface TipOption {
  id: string;
  type: TipKind;
  value: number;
}

export interface Promo {
  code: string;
  /** Porcentaje (0–100) o monto fijo. */
  type: TipKind;
  value: number;
  /** Solo para quien reserva por primera vez. */
  firstVisitOnly?: boolean;
  /** Pide al menos este número de citas en la misma reserva. */
  minAppointments?: number;
}

/** Los cupones que acepta la demo. En producción los define la barbería. */
export const PROMOS: readonly Promo[] = [
  { code: "BIENVENIDO10", type: "percent", value: 10, firstVisitOnly: true },
  { code: "FAMILIA15", type: "percent", value: 15, minAppointments: 2 },
  { code: "BARBER5", type: "amount", value: 5 },
];

export type PromoProblem = "unknown" | "firstVisitOnly" | "minAppointments";

export interface PromoContext {
  isNewClient: boolean;
  appointments: number;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

/** El cupón por su código (sin importar mayúsculas), o por qué no aplica. */
export function findPromo(code: string, context: PromoContext): { promo: Promo } | { problem: PromoProblem } {
  const promo = PROMOS.find((item) => item.code === code.trim().toUpperCase());
  if (!promo) return { problem: "unknown" };
  if (promo.firstVisitOnly && !context.isNewClient) return { problem: "firstVisitOnly" };
  if (promo.minAppointments && context.appointments < promo.minAppointments) return { problem: "minAppointments" };
  return { promo };
}

/** Lo que descuenta un cupón sobre lo que se compra; nunca más que el total. */
export function promoDiscount(promo: Promo | null, base: number): number {
  if (!promo || base <= 0) return 0;
  const amount = promo.type === "percent" ? (base * promo.value) / 100 : promo.value;
  return round2(Math.min(base, amount));
}

/** La propina de una opción sobre los servicios (no se deja propina por un producto). */
export function tipAmount(option: TipOption | null, servicesTotal: number): number {
  if (!option) return 0;
  return round2(option.type === "percent" ? (servicesTotal * option.value) / 100 : option.value);
}

export interface TotalsInput {
  services: number;
  products: number;
  discount: number;
  taxPercent: number;
  tip: number;
}

export interface Totals {
  services: number;
  products: number;
  discount: number;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
}

/** El impuesto va sobre lo comprado ya con el descuento; la propina va aparte, sin impuesto. */
export function computeTotals(input: TotalsInput): Totals {
  const subtotal = round2(Math.max(0, input.services + input.products - input.discount));
  const tax = round2((subtotal * input.taxPercent) / 100);
  const tip = round2(Math.max(0, input.tip));
  return { services: round2(input.services), products: round2(input.products), discount: round2(input.discount), subtotal, tax, tip, total: round2(subtotal + tax + tip) };
}

export interface CancellationInput {
  start: Date;
  now: Date;
  /** Hasta cuántas horas antes se cancela gratis. */
  cancelHours: number;
  /** El porcentaje del servicio que se cobra al cancelar tarde. */
  lateFeePercent: number;
  /** Lo que vale la cita. */
  price: number;
  /** Lo que el cliente ya pagó por ella (0 si paga en la barbería). */
  paid: number;
}

export interface CancellationTerms {
  /** Todavía se cancela sin cargo. */
  isFree: boolean;
  /** Ya empezó o pasó: no se cancela en línea. */
  isPast: boolean;
  /** Hasta cuándo es gratis. */
  deadline: Date;
  fee: number;
  /** Lo que se devuelve de lo pagado, ya restado el cargo. */
  refund: number;
  /** El cargo que queda pendiente si no había nada pagado. */
  owed: number;
}

/** Qué pasa si se cancela ahora, según la política de la barbería. */
export function cancellationTerms(input: CancellationInput): CancellationTerms {
  const deadline = new Date(input.start.getTime() - input.cancelHours * 3_600_000);
  const isPast = input.now.getTime() >= input.start.getTime();
  const isFree = input.now.getTime() <= deadline.getTime();
  const fee = isFree ? 0 : round2((input.price * input.lateFeePercent) / 100);
  const refund = round2(Math.max(0, input.paid - fee));
  const owed = round2(Math.max(0, fee - input.paid));
  return { isFree, isPast, deadline, fee, refund, owed };
}

/** La política de la barbería con sus valores puestos, tal como la redactó en Configuración. */
export function renderPolicy(template: string, values: { cancelHours: number; lateFeePercent: number; maxCancellations: number }): string {
  return template
    .replaceAll("<<time_for_cancel>>", `${values.cancelHours} h`)
    .replaceAll("<<fee_cancellation>>", String(values.lateFeePercent))
    .replaceAll("<<max_cancellations>>", String(values.maxCancellations));
}
