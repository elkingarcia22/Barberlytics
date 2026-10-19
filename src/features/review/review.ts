import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import type { AppMessageKey } from "@/app/i18n";

/**
 * Revisión antes de cerrar: lo raro de una nómina o de una caja frente al historial y a las reglas,
 * para mirarlo antes de aprobar o cerrar. Ver docs/API_CONTRACT.md («Revisión antes de cerrar»).
 */

export const findingSchema = z.object({
  id: z.string(),
  severity: z.enum(["high", "medium", "info"]),
  kind: z.string(),
  params: z.record(z.string(), z.union([z.string(), z.number()])),
  appointmentId: z.string().optional(),
  date: z.string().optional(),
  memberId: z.string().optional(),
});
const reviewSchema = z.object({ items: z.array(findingSchema) });

export type Finding = z.infer<typeof findingSchema>;
export type Severity = Finding["severity"];

export const reviewApi = {
  payroll: (period: { branchId: string; from: string; to: string }, signal?: AbortSignal) => api.get<z.infer<typeof reviewSchema>>(`/payroll/review?${new URLSearchParams(period)}`, { schema: reviewSchema, signal }),
  register: (branchId: string, date: string, signal?: AbortSignal) => api.get<z.infer<typeof reviewSchema>>(`/register/review?${new URLSearchParams({ branchId, date })}`, { schema: reviewSchema, signal }),
};

export function usePayrollReview(period: { branchId: string; from: string; to: string }, enabled: boolean) {
  return useQuery({ queryKey: ["review", "payroll", period], queryFn: ({ signal }) => reviewApi.payroll(period, signal), enabled, staleTime: 0 });
}

export function useRegisterReview(branchId: string, date: string, enabled: boolean) {
  return useQuery({ queryKey: ["review", "register", branchId, date], queryFn: ({ signal }) => reviewApi.register(branchId, date, signal), enabled, staleTime: 0 });
}

/** Lo grave hay que marcarlo como revisado antes de aprobar o cerrar; lo demás se puede pasar. */
export const needsAcknowledge = (items: readonly Finding[]): boolean => items.some((item) => item.severity === "high");

export const SEVERITY_KEYS = { high: "review.severity.high", medium: "review.severity.medium", info: "review.severity.info" } as const satisfies Record<Severity, AppMessageKey>;

export const KIND_KEYS = {
  netChange: "review.kind.netChange",
  salaryNoServices: "review.kind.salaryNoServices",
  rentOwed: "review.kind.rentOwed",
  tipOutlier: "review.kind.tipOutlier",
  zeroSale: "review.kind.zeroSale",
  newClientRepeat: "review.kind.newClientRepeat",
  bigAdjustment: "review.kind.bigAdjustment",
  duplicateAdjustment: "review.kind.duplicateAdjustment",
  duplicateCharge: "review.kind.duplicateCharge",
  duplicateSale: "review.kind.duplicateSale",
  bigDiscount: "review.kind.bigDiscount",
  bigRefund: "review.kind.bigRefund",
  selfRefund: "review.kind.selfRefund",
  openAccounts: "review.kind.openAccounts",
} as const satisfies Record<string, AppMessageKey>;

/** Los parámetros que son dinero se escriben con la moneda de la sucursal. */
export const MONEY_PARAMS: ReadonlySet<string> = new Set(["net", "average", "salary", "amount", "tip", "sale", "total", "discount"]);

export const ADJUSTMENT_KIND_KEYS = { bonus: "payroll.adjustment.bonus", deduction: "payroll.adjustment.deduction", advance: "payroll.adjustment.advance" } as const satisfies Record<string, AppMessageKey>;
