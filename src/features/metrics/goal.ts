import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";

/**
 * La meta de ingresos del mes de una sede y cómo va (docs/API_CONTRACT.md, «Reportes › Meta del mes»). El ingreso es el
 * del estado de resultados; la proyección lleva el ritmo de lo que va del mes a sus días.
 */

export const monthGoalSchema = z.object({
  month: z.string(),
  goal: z.object({ branchId: z.string(), month: z.string(), revenue: z.number(), setBy: z.string(), setAt: z.string() }).nullable(),
  revenue: z.number(),
  days: z.number(),
  elapsedDays: z.number(),
  projected: z.number(),
  progress: z.number().nullable(),
  neededPerDay: z.number().nullable(),
  onTrack: z.boolean().nullable(),
});

export type MonthGoal = z.infer<typeof monthGoalSchema>;

const goalKey = (branchId: string, month: string) => ["reports", "goal", branchId, month] as const;

export function useMonthGoal(branchId: string, month: string) {
  return useQuery({
    queryKey: goalKey(branchId, month),
    queryFn: ({ signal }) => api.get<MonthGoal>(`/reports/goal?branchId=${encodeURIComponent(branchId)}&month=${month}`, { schema: monthGoalSchema, signal }),
    enabled: branchId !== "",
  });
}

/** Poner, cambiar o quitar (`null`) la meta del mes. */
export function useSetMonthGoal(branchId: string, month: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (revenue: number | null) => api.put<MonthGoal>("/reports/goal", { branchId, month, revenue }, { schema: monthGoalSchema }),
    onSuccess: (data) => queryClient.setQueryData(goalKey(branchId, month), data),
  });
}
