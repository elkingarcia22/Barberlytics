import type { PaymentMethod, PaymentPart } from "../types";

/**
 * Cómo se reparte un cobro entre formas de pago, sin interfaz. «Mixto» son dos
 * líneas (la segunda se lleva lo que falta) y «en partes» son varias; cada
 * línea tiene su forma de pago: efectivo, tarjeta (con su datáfono), link de
 * pago, transferencia o la tarjeta de regalo del cliente. Las líneas suman lo de la cuenta
 * entera; al cobrar, la tarjeta de regalo viaja aparte (`giftCode`) y el resto
 * como método, mixto o partes, que es lo que entiende el servidor.
 */

export type PayMode = "cash" | "card" | "link" | "transfer" | "gift" | "mixed" | "parts";
export type LineMethod = "cash" | "card" | "link" | "transfer" | "gift";

export interface PayLine {
  method: LineMethod;
  amount: number;
  /** Con tarjeta: el datáfono. */
  deviceId?: string;
  /** Con link: ya se le mandó. */
  sent?: boolean;
}

export const cents = (value: number): number => Math.round(value * 100) / 100;

/** `count` líneas iguales que suman `total` (lo que sobra de redondear va en la última). */
export function equalLines(total: number, count: number, template: (index: number) => Omit<PayLine, "amount">): PayLine[] {
  const base = Math.floor((total / count) * 100) / 100;
  return Array.from({ length: count }, (_, index) => ({ ...template(index), amount: index === count - 1 ? cents(total - base * (count - 1)) : base }));
}

export const linesTotal = (lines: readonly PayLine[]): number => cents(lines.reduce((sum, line) => sum + line.amount, 0));
export const giftOf = (lines: readonly PayLine[]): number => cents(lines.filter((line) => line.method === "gift").reduce((sum, line) => sum + line.amount, 0));

/** Mixto: la segunda línea se lleva lo que falta de la primera. */
export function mixedLines(lines: readonly PayLine[], total: number): PayLine[] {
  const [first, second] = lines;
  const head = Math.min(Math.max(0, first?.amount ?? 0), total);
  return [
    { ...(first ?? { method: "cash" }), amount: cents(head) },
    { ...(second ?? { method: "card" }), amount: cents(total - head) },
  ];
}

/** Lo que el servidor recibe por las líneas que no son tarjeta de regalo. */
export interface LinesPayment {
  method: PaymentMethod;
  deviceId?: string;
  split?: { cash: number; card: number };
  parts?: PaymentPart[];
}

/** Las líneas sin la tarjeta de regalo, como las entiende el servidor: una sola, su método; efectivo y tarjeta, mixto; varias, partes. */
export function paymentOfLines(lines: readonly PayLine[], surcharge = 0): LinesPayment {
  const paid = lines.filter((line) => line.method !== "gift" && line.amount > 0.004) as (PayLine & { method: "cash" | "card" | "link" | "transfer" })[];
  if (paid.length === 0) return { method: "cash" };
  if (paid.length === 1) return { method: paid[0].method, ...(paid[0].method === "card" && paid[0].deviceId ? { deviceId: paid[0].deviceId } : {}) };
  const methods = new Set(paid.map((line) => line.method));
  if (paid.length === 2 && methods.size === 2 && methods.has("cash") && methods.has("card")) {
    const cash = paid.find((line) => line.method === "cash")!.amount;
    const card = paid.find((line) => line.method === "card")!;
    return { method: "mixed", split: { cash, card: cents(card.amount + surcharge) }, ...(card.deviceId ? { deviceId: card.deviceId } : {}) };
  }
  return { method: methods.size === 1 ? paid[0].method : "mixed", parts: paid.map(({ method, amount, deviceId }) => ({ method, amount, ...(method === "card" && deviceId ? { deviceId } : {}) })) };
}
