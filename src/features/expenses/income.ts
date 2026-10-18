import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";

/**
 * El estado de resultados del mes de una sucursal y su punto de equilibrio. Contrato en
 * docs/API_CONTRACT.md («Reportes»).
 */

export const incomeStatementSchema = z.object({
  month: z.string(),
  days: z.number(),
  elapsedDays: z.number(),
  revenue: z.object({ services: z.number(), products: z.number(), rent: z.number(), refunds: z.number(), total: z.number() }),
  costs: z.object({ products: z.number(), commissions: z.number(), salaries: z.number(), adjustments: z.number(), expensesFixed: z.number(), expensesVariable: z.number() }),
  contribution: z.number(),
  fixedCosts: z.number(),
  net: z.number(),
  marginPercent: z.number(),
  breakEven: z.object({ revenue: z.number(), perDay: z.number(), servicesPerDay: z.number(), actualPerDay: z.number(), avgTicket: z.number(), openDays: z.number(), contributionPercent: z.number() }).nullable(),
  previous: z.object({ month: z.string(), elapsedDays: z.number(), revenue: z.number(), net: z.number() }),
});

export type IncomeStatement = z.infer<typeof incomeStatementSchema>;

/** «2026-10» del día dado. */
export const monthKey = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

/** El mes anterior o siguiente de «AAAA-MM». */
export function shiftMonth(month: string, delta: number): string {
  const [year, index] = month.split("-").map(Number);
  return monthKey(new Date(year, index - 1 + delta, 1));
}

/** Cuánto cambió frente al mes anterior, en %; `null` si el anterior fue cero. */
export const changePercent = (current: number, previous: number): number | null => (previous === 0 ? null : Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10);

export function useIncomeStatement(branchId: string, month: string) {
  return useQuery({
    queryKey: ["reports", "income", branchId, month],
    queryFn: ({ signal }) => api.get<IncomeStatement>(`/reports/income?branchId=${encodeURIComponent(branchId)}&month=${month}`, { schema: incomeStatementSchema, signal }),
    enabled: branchId !== "",
  });
}
