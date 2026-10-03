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
  /** Positivo: la barbería le paga. Negativo: el barbero le debe a la barbería. */
  net: z.number(),
  lines: z.array(payrollLineSchema),
});
export type PayrollMember = z.infer<typeof payrollMemberSchema>;

export const payrollResponseSchema = z.object({ from: z.string(), to: z.string(), weeks: z.number(), members: z.array(payrollMemberSchema) });
export type PayrollResponse = z.infer<typeof payrollResponseSchema>;

export interface PayrollParams {
  branchId: string;
  from: string;
  to: string;
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
