import type { PaymentMethod } from "./types";

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
