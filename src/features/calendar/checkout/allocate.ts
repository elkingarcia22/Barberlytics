import type { PaymentMethod, PaymentPart } from "../types";

/**
 * Cuando se cobran varias citas juntas, cada una se cierra con lo suyo: el
 * pago dividido en partes se reparte entre ellas en orden (la primera parte
 * llena la primera cita, lo que sobra pasa a la siguiente). Así cada cita
 * queda con las partes que la pagaron y el servidor puede cuadrar cada una.
 */

const cents = (value: number): number => Math.round(value * 100) / 100;

export interface AllocatedPayment {
  method: PaymentMethod;
  /** Dos o más partes: viajan como `parts`. */
  parts?: PaymentPart[];
  /** Una sola parte con tarjeta: su datáfono. */
  deviceId?: string;
}

/** Reparte `parts` entre cuentas de `dues` (lo que cobra cada cita). Las partes tienen que sumar lo mismo. */
export function allocateParts(parts: readonly PaymentPart[], dues: readonly number[]): PaymentPart[][] {
  const queue = parts.map((part) => ({ ...part }));
  return dues.map((due) => {
    let left = cents(due);
    const taken: PaymentPart[] = [];
    while (left > 0.004 && queue.length > 0) {
      const part = queue[0];
      const amount = cents(Math.min(part.amount, left));
      taken.push({ ...part, amount });
      left = cents(left - amount);
      part.amount = cents(part.amount - amount);
      if (part.amount <= 0.004) queue.shift();
    }
    return taken;
  });
}

/** Cómo se cierra una cita con las partes que le tocaron: una sola es su método; varias, partes (mixto si se mezclan). */
export function paymentOf(parts: readonly PaymentPart[]): AllocatedPayment {
  if (parts.length === 0) return { method: "cash" };
  if (parts.length === 1) return { method: parts[0].method, ...(parts[0].deviceId ? { deviceId: parts[0].deviceId } : {}) };
  const methods = new Set(parts.map((part) => part.method));
  return { method: methods.size === 1 ? parts[0].method : "mixed", parts: [...parts] };
}
