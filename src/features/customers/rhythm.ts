import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";

/** El ritmo del cliente: cuándo le toca volver y la reactivación aprobada. Contrato en docs/API_CONTRACT.md. */

const suggestionSchema = z.object({
  everyDays: z.number(),
  lastVisitAt: z.string(),
  dueDate: z.string(),
  isOverdue: z.boolean(),
  usualTime: z.string(),
  branchId: z.string(),
  options: z.array(z.object({ start: z.string(), barberId: z.string(), barberName: z.string(), sameBarber: z.boolean() })),
});
export type NextVisit = z.infer<typeof suggestionSchema>;

const candidateSchema = z.object({
  clientId: z.string(),
  name: z.string(),
  segment: z.string(),
  everyDays: z.number().nullable(),
  daysSince: z.number().nullable(),
  consent: z.boolean(),
  hasPhone: z.boolean(),
  recentlyContacted: z.boolean(),
  offer: z.object({ start: z.string(), barberId: z.string(), barberName: z.string(), branchId: z.string() }).nullable(),
});
export type ReactivationCandidate = z.infer<typeof candidateSchema>;
export const skipReasonSchema = z.enum(["noConsent", "recent", "noPhone", "noSlot"]);
export type SkipReason = z.infer<typeof skipReasonSchema>;

/** Se le puede escribir: aceptó promociones, no se le escribió hace poco, tiene celular y hay hueco que ofrecer. */
export const canReactivate = (item: ReactivationCandidate): boolean => item.consent && !item.recentlyContacted && item.hasPhone && item.offer !== null;

export function useNextVisit(customerId: string) {
  return useQuery({ queryKey: ["customers", "next-visit", customerId], queryFn: ({ signal }) => api.get(`/customers/${customerId}/next-visit`, { schema: z.object({ suggestion: suggestionSchema.nullable() }), signal }) });
}

export function useReactivationCandidates(branchId: string, enabled: boolean) {
  return useQuery({ queryKey: ["customers", "reactivation", branchId], queryFn: ({ signal }) => api.get("/customers/reactivation", { query: { branchId }, schema: z.object({ items: z.array(candidateSchema) }), signal }), enabled });
}

export function useApproveReactivation(branchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientIds: readonly string[]) => api.post("/customers/reactivation", { branchId, clientIds }, { schema: z.object({ queued: z.number(), skipped: z.array(z.object({ clientId: z.string(), reason: skipReasonSchema })) }) }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
}
