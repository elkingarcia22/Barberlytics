import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";

/** Lo que la barbería aceptó (el acuerdo de encargo) frente a las versiones vigentes. Ver docs/API_CONTRACT.md («Legal»). */

const acceptanceSchema = z.object({ version: z.string(), at: z.string(), by: z.string() });
export const acceptancesSchema = z.object({
  current: z.object({ terms: z.string(), privacy: z.string(), dpa: z.string() }),
  dpa: acceptanceSchema.nullable(),
  terms: acceptanceSchema.nullable(),
});
export type LegalAcceptances = z.infer<typeof acceptancesSchema>;

const key = ["legal", "acceptances"] as const;

export function useLegalAcceptances(enabled = true) {
  return useQuery({ queryKey: key, queryFn: ({ signal }) => api.get<LegalAcceptances>("/legal/acceptances", { schema: acceptancesSchema, signal }), enabled });
}

export function useAcceptDpa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (version: string) => api.post<LegalAcceptances>("/legal/dpa/accept", { version }, { schema: acceptancesSchema }),
    onSuccess: (data) => queryClient.setQueryData(key, data),
  });
}
