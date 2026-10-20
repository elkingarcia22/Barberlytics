import { z } from "zod";
import type { AppMessageKey } from "@/app/i18n/types";

/** Cómo se le paga a cada barbero: comisión por servicio, renta de su puesto o salario. */
export const payoutSchema = z.enum(["commission", "rent", "salary"]);
export type Payout = z.infer<typeof payoutSchema>;

/** Qué regla de comisión se aplicó a un servicio, según quién trajo al cliente. */
export const ruleSchema = z.enum(["walkIn", "noPreference", "newClient", "recurring", "basic"]);
export type CommissionRule = z.infer<typeof ruleSchema>;

export const payrollLineSchema = z.object({
  appointmentId: z.string(),
  date: z.string(),
  client: z.string(),
  service: z.string(),
  rule: ruleSchema,
  /** Porcentaje aplicado; `null` si no cobra por comisión. */
  rate: z.number().nullable(),
  sale: z.number(),
  commission: z.number(),
  tip: z.number(),
  deduction: z.number(),
  /** Con renta: si el dinero entró por la caja de la barbería o lo cobró el barbero. */
  collectedBy: z.enum(["shop", "barber"]).nullable().optional(),
  /** Con renta: lo que la barbería le guarda de esa cita. */
  held: z.number().optional(),
});
export type PayrollLine = z.infer<typeof payrollLineSchema>;

export const commissionRulesSchema = z.object({
  type: z.enum(["commission", "scale", "salary"]),
  basic: z.number(),
  recurring: z.number().nullable(),
  walkIn: z.number().nullable(),
  noPreference: z.number().nullable(),
  newClient: z.number().nullable(),
  productPercent: z.number().nullable(),
  scale: z.array(z.object({ from: z.number(), percent: z.number() })),
});
export type CommissionRules = z.infer<typeof commissionRulesSchema>;

/**
 * Un ajuste del periodo: lo que no sale de las citas. El bono suma; el descuento, el adelanto y el faltante de
 * caja restan. La cuota de un préstamo (`loan`) la pone el sistema en cada ciclo y no se borra a mano.
 */
export const adjustmentKindSchema = z.enum(["bonus", "deduction", "advance", "shortage"]);
export type AdjustmentKind = z.infer<typeof adjustmentKindSchema>;
export const adjustmentSchema = z.object({
  id: z.string(),
  kind: z.enum(["bonus", "deduction", "advance", "shortage", "loan"]),
  amount: z.number(),
  note: z.string(),
  createdAt: z.string(),
  createdBy: z.string(),
  closureId: z.string().nullable().optional(),
  loanId: z.string().nullable().optional(),
});

export const loanSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  amount: z.number(),
  installments: z.number(),
  startDate: z.string(),
  note: z.string(),
  createdAt: z.string(),
  createdBy: z.string(),
  cancelledAt: z.string().nullable().optional(),
});
export type PayrollLoan = z.infer<typeof loanSchema>;
export interface LoanInput {
  branchId: string;
  memberId: string;
  amount: number;
  installments: number;
  startDate: string;
  note: string;
}
export type PayrollAdjustment = z.infer<typeof adjustmentSchema>;

export const payrollMemberSchema = z.object({
  memberId: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  payout: payoutSchema,
  rules: commissionRulesSchema.nullable(),
  /** Renta por semana; solo en renta. */
  rentBase: z.number().nullable(),
  /** Salario por semana; solo en salario. */
  salaryBase: z.number().nullable(),
  services: z.number(),
  serviceSales: z.number(),
  productSales: z.number(),
  serviceCommission: z.number(),
  productCommission: z.number(),
  tips: z.number(),
  salary: z.number(),
  rent: z.number(),
  deductions: z.number(),
  /** Con renta: lo que entró por la caja de la barbería y es del barbero. */
  held: z.number().optional(),
  /** Con renta: lo que pagó de renta en el periodo, cómo queda y los pagos. */
  rentPaid: z.number().optional(),
  balance: z.number().optional(),
  rentPayments: z.array(z.object({ id: z.string(), amount: z.number(), method: z.string(), date: z.string(), note: z.string(), by: z.string() })).optional(),
  adjustments: z.array(adjustmentSchema).optional(),
  /** Ventas de mostrador que hizo (comisionan como producto). */
  counterSales: z.number().optional(),
  /** Lo que suman los ajustes: los bonos menos descuentos y adelantos. */
  adjustmentsTotal: z.number().optional(),
  /** Positivo: la barbería le paga. Negativo: el barbero le debe a la barbería. */
  net: z.number(),
  lines: z.array(payrollLineSchema),
});
export type PayrollMember = z.infer<typeof payrollMemberSchema>;

/**
 * El estado del periodo. Sin `run` está abierto: se calcula sobre las citas y admite ajustes.
 * Aprobado, la nómina queda fija; pagado, además se sabe con qué y quién lo pagó.
 */
export const runStatusSchema = z.enum(["approved", "paid"]);
export type RunStatus = z.infer<typeof runStatusSchema>;
export const payrollRunSchema = z.object({
  id: z.string(),
  status: runStatusSchema,
  approvedAt: z.string(),
  approvedBy: z.string(),
  paidAt: z.string().nullable(),
  paidBy: z.string().nullable(),
  method: z.string().nullable(),
  reference: z.string().nullable(),
});
export type PayrollRun = z.infer<typeof payrollRunSchema>;
export const payrollHistorySchema = z.object({ at: z.string(), actor: z.string(), event: z.enum(["approved", "paid", "reopened"]), reason: z.string().nullable() });

export const payrollResponseSchema = z.object({
  from: z.string(),
  to: z.string(),
  weeks: z.number(),
  run: payrollRunSchema.nullable().optional(),
  history: z.array(payrollHistorySchema).optional(),
  members: z.array(payrollMemberSchema),
});
export type PayrollResponse = z.infer<typeof payrollResponseSchema>;

export interface PayrollParams {
  branchId: string;
  from: string;
  to: string;
  /** Solo la nómina de esta persona (el pago del propio barbero). */
  memberId?: string;
}

export const PAYOUT_KEYS: Readonly<Record<Payout, AppMessageKey>> = { commission: "payroll.payout.commission", rent: "payroll.payout.rent", salary: "payroll.payout.salary" };
export const PAYOUT_HINT_KEYS: Readonly<Record<Payout, AppMessageKey>> = { commission: "payroll.payout.commissionHint", rent: "payroll.payout.rentHint", salary: "payroll.payout.salaryHint" };

export const RULE_KEYS: Readonly<Record<CommissionRule, AppMessageKey>> = {
  basic: "payroll.rule.basic",
  recurring: "payroll.rule.recurring",
  newClient: "payroll.rule.newClient",
  walkIn: "payroll.rule.walkIn",
  noPreference: "payroll.rule.noPreference",
};

export interface AdjustmentInput {
  branchId: string;
  from: string;
  to: string;
  memberId: string;
  kind: AdjustmentKind;
  amount: number;
  note: string;
}

export const ADJUSTMENT_KEYS: Readonly<Record<AdjustmentKind, AppMessageKey>> = {
  bonus: "payroll.adjustment.bonus",
  deduction: "payroll.adjustment.deduction",
  advance: "payroll.adjustment.advance",
  shortage: "payroll.adjustment.shortage",
};

/** Todos los ajustes que se ven, con la cuota de préstamo que pone el sistema. */
export const ADJUSTMENT_VIEW_KEYS: Readonly<Record<PayrollAdjustment["kind"], AppMessageKey>> = { ...ADJUSTMENT_KEYS, loan: "payroll.adjustment.loan" };

/** Con qué se paga la nómina. */
export const PAY_METHODS = ["cash", "transfer", "nequi", "breb"] as const;
export type PayMethod = (typeof PAY_METHODS)[number];
export const PAY_METHOD_KEYS: Readonly<Record<PayMethod, AppMessageKey>> = {
  cash: "payroll.payMethod.cash",
  transfer: "payroll.payMethod.transfer",
  nequi: "payroll.payMethod.nequi",
  breb: "payroll.payMethod.breb",
};

export interface RentPaymentInput {
  branchId: string;
  memberId: string;
  amount: number;
  method: string;
  date?: string;
  note?: string;
}
