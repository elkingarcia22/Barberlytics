import { z } from "zod";
import { api } from "@/lib/api";

/**
 * Los cupones de la barbería vistos desde la caja (docs/API_CONTRACT.md, «Configuración › Cupones»): el servidor dice
 * si un código vale para esta cuenta (fechas, topes, servicios, primera visita) y cuánto descuenta; al cobrar se anota
 * el uso. La lista se edita en Configuración › Cupones.
 */

export const couponSchema = z.object({
  code: z.string(),
  type: z.enum(["percent", "amount"]),
  value: z.number(),
  firstVisitOnly: z.boolean().optional(),
  minAppointments: z.number().optional(),
});
export type Coupon = z.infer<typeof couponSchema>;

export interface CouponCheckInput {
  code: string;
  clientId: string;
  branchId: string;
  serviceIds: readonly string[];
}

export const couponsApi = {
  check: (input: CouponCheckInput) => api.post<Coupon>("/coupons/check", input, { schema: couponSchema }),
};

/** Lo que descuenta un cupón sobre `base`; nunca más que la cuenta. */
export function couponDiscount(coupon: Coupon | null, base: number): number {
  if (!coupon || base <= 0) return 0;
  const amount = coupon.type === "percent" ? (base * coupon.value) / 100 : coupon.value;
  return Math.round(Math.min(base, amount) * 100) / 100;
}
