import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { describeError } from "@/lib/api";
import { transactionsApi, type RefundInput } from "./api";
import type { TransactionsParams } from "./types";

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (params: TransactionsParams) => [...transactionKeys.all, "list", params] as const,
};

export function useTransactionsQuery(params: TransactionsParams) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: ({ signal }) => transactionsApi.list(params, signal),
    /* Al cambiar de periodo se conserva el anterior en pantalla mientras llega el nuevo. */
    placeholderData: keepPreviousData,
  });
}

/** Las cuentas de días anteriores que nadie cobró: el aviso de Transacciones. */
export function useUnpaidAccounts(branchId: string) {
  return useQuery({ queryKey: [...transactionKeys.all, "unpaid", branchId], queryFn: ({ signal }) => transactionsApi.unpaid(branchId, signal) });
}

/** Devolver: vuelve a pedir las cuentas, la agenda y la nómina, que cuentan lo devuelto. */
export function useRefundAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, input }: { appointmentId: string; input: RefundInput }) => transactionsApi.refund(appointmentId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["payroll"] });
      void queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
    onError: (error) => {
      const { title, description } = describeError(error);
      toast.error(title, { description });
    },
  });
}
