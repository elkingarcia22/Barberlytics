import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { customerKeys } from "./queries";
import type { ImportRow } from "./importColumns";

/** Importar clientes por CSV y deshacer una tanda. Contrato en docs/API_CONTRACT.md («Clientes»). */

const reasonSchema = z.enum(["name", "phone", "email", "birthDate", "duplicate"]);
export type ImportReason = z.infer<typeof reasonSchema>;
const resultSchema = z.object({ batchId: z.string().nullable(), created: z.number(), rejected: z.array(z.object({ row: z.number(), name: z.string(), reason: reasonSchema })) });
export type ImportResult = z.infer<typeof resultSchema>;

export function useImportCustomers(branchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rows, dryRun }: { rows: readonly ImportRow[]; dryRun: boolean }) => api.post<ImportResult>("/customers/import", { branchId, rows, dryRun }, { schema: resultSchema }),
    onSuccess: (_result, { dryRun }) => {
      if (!dryRun) void queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}

export function useUndoImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) => api.delete<{ removed: number; kept: number }>(`/customers/import/${batchId}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  });
}
