import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expensesApi } from "./api";
import type { ExpenseInput } from "./types";

export const expenseKeys = {
  all: ["expenses"] as const,
  list: (branchId: string) => [...expenseKeys.all, "list", branchId] as const,
};

export function useExpensesQuery(branchId: string) {
  return useQuery({ queryKey: expenseKeys.list(branchId), queryFn: ({ signal }) => expensesApi.list(branchId, signal) });
}

function useInvalidateExpenses() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: expenseKeys.all });
}

export function useCreateExpense(branchId: string) {
  const invalidate = useInvalidateExpenses();
  return useMutation({ mutationFn: (input: ExpenseInput) => expensesApi.create(input, branchId), onSuccess: invalidate });
}

export function useUpdateExpense() {
  const invalidate = useInvalidateExpenses();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: ExpenseInput }) => expensesApi.update(id, input), onSuccess: invalidate });
}

export function useRemoveExpense() {
  const invalidate = useInvalidateExpenses();
  return useMutation({ mutationFn: (id: string) => expensesApi.remove(id), onSuccess: invalidate });
}
