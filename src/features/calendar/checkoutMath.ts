import { cartTotals } from "@/features/branches/tax";
import type { CalendarCatalog, OnlineSettlement, PaymentMethod, ProductLine } from "./types";

/**
 * Las cuentas del cobro, sin interfaz: cuánto es una propina sugerida, cuánto
 * recarga la tarjeta y cuánto se devuelve cuando el cliente paga en efectivo.
 * Las propinas y el recargo salen de Configuración; aquí solo se aplican.
 */

export interface TipChoice {
  id: string;
  type: "percent" | "amount";
  value: number;
}

export interface CardSurcharge {
  enabled: boolean;
  name: string;
  rate: number;
  type: "percent" | "amount";
}

/** Las propinas que se ofrecen mientras Configuración no responde. */
export const FALLBACK_TIPS: readonly TipChoice[] = [
  { id: "fallback_10", type: "percent", value: 10 },
  { id: "fallback_15", type: "percent", value: 15 },
  { id: "fallback_20", type: "percent", value: 20 },
];

const cents = (value: number): number => Math.round(value * 100) / 100;

export const tipAmount = (choice: TipChoice, subtotal: number): number => cents(choice.type === "percent" ? subtotal * (choice.value / 100) : choice.value);

/** El recargo solo aplica al pagar con tarjeta y si está encendido en Configuración. */
export function surchargeAmount(fee: CardSurcharge | undefined, method: PaymentMethod, base: number): number {
  if (!fee?.enabled || method !== "card" || base <= 0) return 0;
  return cents(fee.type === "percent" ? base * (fee.rate / 100) : fee.rate);
}

/** Lo que se devuelve; negativo es lo que todavía falta. `null` si no se escribió cuánto entregó. */
export const changeDue = (received: number | null, total: number): number | null => (received === null ? null : cents(received - total));

export interface AppointmentBill {
  /** Servicios y productos a precio de lista. */
  subtotal: number;
  /** Lo descontado al reservar en línea. */
  discount: number;
  tax: number;
  /** Lo que vale la cuenta, con el impuesto de la sucursal. */
  total: number;
  /** Lo que ya se pagó al reservar en línea (sin la propina). */
  prepaid: number;
  /** Lo que queda por cobrar en caja, sin propina ni recargo. */
  due: number;
}

/**
 * La cuenta de una cita en la caja, igual que la calcula el servidor: cada
 * línea con la tasa de la sucursal (o la suya), menos lo ya resuelto en la
 * reserva en línea. Una reserva pagada no se vuelve a cobrar.
 */
export function appointmentBill(catalog: Pick<CalendarCatalog, "barbers" | "services" | "products" | "taxInclusive">, serviceIds: readonly string[], products: readonly ProductLine[], online?: OnlineSettlement | null, barberId?: string): AppointmentBill {
  const lines = [
    ...serviceIds.flatMap((id) => {
      const service = catalog.services.find((item) => item.id === id);
      // Cada servicio al precio del barbero que lo hace, como en la reserva en línea.
      const price = service && (barberId ? catalog.barbers.find((barber) => barber.id === barberId)?.prices?.[service.id] : undefined);
      return service ? [{ amount: price ?? service.price, percent: service.taxPercent ?? 0 }] : [];
    }),
    ...products.flatMap((line) => {
      const product = catalog.products.find((item) => item.id === line.productId);
      return product ? [{ amount: product.price * line.qty, percent: product.taxPercent ?? 0 }] : [];
    }),
  ];
  const { subtotal, discount, tax, total } = cartTotals(lines, online?.discount ?? 0, catalog.taxInclusive === true);
  const prepaid = cents(Math.min(total, online?.paid ?? 0));
  return { subtotal, discount, tax, total, prepaid, due: cents(total - prepaid) };
}

/** Suma las cuentas de varias citas cobradas juntas (una visita). */
export const sumBills = (bills: readonly AppointmentBill[]): AppointmentBill =>
  bills.reduce<AppointmentBill>(
    (sum, bill) => ({ subtotal: cents(sum.subtotal + bill.subtotal), discount: cents(sum.discount + bill.discount), tax: cents(sum.tax + bill.tax), total: cents(sum.total + bill.total), prepaid: cents(sum.prepaid + bill.prepaid), due: cents(sum.due + bill.due) }),
    { subtotal: 0, discount: 0, tax: 0, total: 0, prepaid: 0, due: 0 }
  );

/**
 * Un pago mixto repartido entre las citas que se cobran juntas: el efectivo cubre primero la cita
 * abierta y luego las demás; el resto de cada una va con tarjeta. Cada cita cuadra por separado.
 */
export function splitAcross(cash: number, dues: readonly number[]): { cash: number; card: number }[] {
  let left = Math.max(0, cash);
  return dues.map((due) => {
    const part = cents(Math.min(left, due));
    left = cents(left - part);
    return { cash: part, card: cents(due - part) };
  });
}
