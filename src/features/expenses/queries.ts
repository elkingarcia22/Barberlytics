import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expensesApi } from "./api";
import type { ExpenseInput } from "./types";

export const expenseKeys = {
  all: ["expenses"] as const,
  list: (branchId: string, ownerMemberId: string | null) => [...expenseKeys.all, "list", branchId, ownerMemberId] as const,
};

/** `ownerMemberId`: los gastos de ese barbero de renta; `null`, los de la sucursal. */
export function useExpensesQuery(branchId: string, ownerMemberId: string | null = null) {
  return useQuery({ queryKey: expenseKeys.list(branchId, ownerMemberId), queryFn: ({ signal }) => expensesApi.list(branchId, ownerMemberId, signal) });
}

function useInvalidateExpenses() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: expenseKeys.all });
}

export function useCreateExpense(branchId: string, ownerMemberId: string | null = null) {
  const invalidate = useInvalidateExpenses();
  return useMutation({ mutationFn: (input: ExpenseInput) => expensesApi.create(input, branchId, ownerMemberId), onSuccess: invalidate });
}

export function useUpdateExpense() {
  const invalidate = useInvalidateExpenses();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: ExpenseInput }) => expensesApi.update(id, input), onSuccess: invalidate });
}

export function useRemoveExpense() {
  const invalidate = useInvalidateExpenses();
  return useMutation({ mutationFn: (id: string) => expensesApi.remove(id), onSuccess: invalidate });
}
