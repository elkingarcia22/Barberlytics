import { api } from "@/lib/api";
import { expenseSchema, expensesResponseSchema, type Expense, type ExpenseInput, type ExpensesResponse } from "./types";

/** Contrato de gastos; ver docs/API_CONTRACT.md. */
export const expensesApi = {
  list: (branchId: string, signal?: AbortSignal) => api.get<ExpensesResponse>("/expenses", { query: { branchId }, schema: expensesResponseSchema, signal }),
  create: (input: ExpenseInput, branchId: string) => api.post<Expense>("/expenses", { ...input, branchId }, { schema: expenseSchema }),
  update: (id: string, input: ExpenseInput) => api.patch<Expense>(`/expenses/${id}`, input, { schema: expenseSchema }),
  remove: (id: string) => api.delete<void>(`/expenses/${id}`),
};
