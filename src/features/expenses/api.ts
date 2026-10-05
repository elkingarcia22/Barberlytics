import { api } from "@/lib/api";
import { expenseSchema, expensesResponseSchema, type Expense, type ExpenseInput, type ExpensesResponse } from "./types";

/** Contrato de gastos; ver docs/API_CONTRACT.md. */
export const expensesApi = {
  /** Sin `ownerMemberId`, los de la sucursal; con él, solo los de ese barbero. */
  list: (branchId: string, ownerMemberId: string | null = null, signal?: AbortSignal) =>
    api.get<ExpensesResponse>("/expenses", { query: { branchId, ownerMemberId }, schema: expensesResponseSchema, signal }),
  create: (input: ExpenseInput, branchId: string, ownerMemberId: string | null = null) => api.post<Expense>("/expenses", { ...input, branchId, ownerMemberId }, { schema: expenseSchema }),
  update: (id: string, input: ExpenseInput) => api.patch<Expense>(`/expenses/${id}`, input, { schema: expenseSchema }),
  remove: (id: string) => api.delete<void>(`/expenses/${id}`),
};
