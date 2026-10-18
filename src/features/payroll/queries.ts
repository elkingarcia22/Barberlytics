import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { describeError } from "@/lib/api";
import { payrollApi } from "./api";
import type { AdjustmentInput, PayrollParams } from "./types";

export const payrollKeys = {
  all: ["payroll"] as const,
  period: (params: PayrollParams) => [...payrollKeys.all, params] as const,
};

export function usePayrollQuery(params: PayrollParams) {
  return useQuery({
    queryKey: payrollKeys.period(params),
    queryFn: ({ signal }) => payrollApi.get(params, signal),
    /* Al cambiar de periodo se conserva el anterior en pantalla mientras llega el nuevo. */
    placeholderData: keepPreviousData,
  });
}

/**
 * Lo que cambia la nómina —ajustar, aprobar, pagar, reabrir— la vuelve a pedir entera: también
 * «Lo que llevo» del barbero, que lee la misma. Los errores se dicen en un aviso.
 */
function usePayrollMutation<T>(fn: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: payrollKeys.all }),
    onError: (error) => {
      const { title, description } = describeError(error);
      toast.error(title, { description });
    },
  });
}

export const useAddAdjustment = () => usePayrollMutation((input: AdjustmentInput) => payrollApi.addAdjustment(input));
export const useRemoveAdjustment = () => usePayrollMutation((id: string) => payrollApi.removeAdjustment(id));
export const useApprovePayroll = () => usePayrollMutation((period: Pick<PayrollParams, "branchId" | "from" | "to">) => payrollApi.approve(period));
export const usePayPayroll = () => usePayrollMutation(({ id, method, reference }: { id: string; method: string; reference?: string }) => payrollApi.pay(id, { method, reference }));
export const useReopenPayroll = () => usePayrollMutation(({ id, reason }: { id: string; reason: string }) => payrollApi.reopen(id, reason));
