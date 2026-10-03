import { z } from "zod";
import type { AppMessageKey } from "@/app/i18n/types";
import { appointmentSourceSchema, appointmentStatusSchema, paymentMethodSchema } from "@/features/calendar/types";

/**
 * Una «cuenta» es lo que se le cobra a alguien: cada cita es una y cada
 * venta de mostrador es otra. `open` aún no se ha cobrado, `paid` sí,
 * `refunded` se cobró y se devolvió, y `void` es una cita cancelada o a la
 * que no se presentaron: no se factura.
 */
export const accountStatusSchema = z.enum(["open", "paid", "refunded", "void"]);
export type AccountStatus = z.infer<typeof accountStatusSchema>;

export const accountLineSchema = z.object({ kind: z.enum(["service", "product"]), name: z.string(), qty: z.number(), amount: z.number() });
export type AccountLine = z.infer<typeof accountLineSchema>;

export const accountSchema = z.object({
  id: z.string(),
  kind: z.enum(["appointment", "sale"]),
  /** Cuándo es la cita o cuándo se hizo la venta. */
  date: z.string(),
  invoice: z.string().nullable(),
  client: z.object({ id: z.string(), name: z.string(), phone: z.string() }).nullable(),
  barber: z.string().nullable(),
  openedBy: z.string().nullable(),
  chargedBy: z.string().nullable(),
  status: accountStatusSchema,
  appointmentStatus: appointmentStatusSchema.nullable(),
  source: appointmentSourceSchema.nullable(),
  lines: z.array(accountLineSchema),
  subtotal: z.number(),
  tax: z.number(),
  tip: z.number(),
  total: z.number(),
  collected: z.number(),
  refunded: z.number(),
  balance: z.number(),
  method: paymentMethodSchema.nullable(),
  paidAt: z.string().nullable(),
  reference: z.string(),
  appointmentId: z.string().nullable(),
  durationMin: z.number().nullable(),
});
export type Account = z.infer<typeof accountSchema>;

export const transactionsResponseSchema = z.object({ from: z.string(), to: z.string(), items: z.array(accountSchema) });
export type TransactionsResponse = z.infer<typeof transactionsResponseSchema>;

export interface TransactionsParams {
  branchId: string;
  from: string;
  to: string;
}

export const ACCOUNT_STATUS_KEYS: Readonly<Record<AccountStatus, AppMessageKey>> = {
  open: "transactions.status.open",
  paid: "transactions.status.paid",
  refunded: "transactions.status.refunded",
  void: "transactions.status.void",
};

export const ACCOUNT_STATUS_HINT_KEYS: Readonly<Record<AccountStatus, AppMessageKey>> = {
  open: "transactions.status.openHint",
  paid: "transactions.status.paidHint",
  refunded: "transactions.status.refundedHint",
  void: "transactions.status.voidHint",
};

export const METHOD_KEYS: Readonly<Record<NonNullable<Account["method"]>, AppMessageKey>> = {
  cash: "transactions.method.cash",
  card: "transactions.method.card",
  link: "transactions.method.link",
  mixed: "transactions.method.mixed",
};
