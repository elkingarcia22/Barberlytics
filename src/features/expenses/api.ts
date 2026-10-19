import { api } from "@/lib/api";
import { categoriesResponseSchema, customCategorySchema, expenseSchema, expensesResponseSchema, type Expense, type ExpenseInput, type ExpensesResponse } from "./types";

/** Contrato de gastos; ver docs/API_CONTRACT.md. */
export const expensesApi = {
  /** Sin `ownerMemberId`, los de la sucursal; con él, solo los de ese barbero. */
  list: (branchId: string, ownerMemberId: string | null = null, signal?: AbortSignal) =>
    api.get<ExpensesResponse>("/expenses", { query: { branchId, ownerMemberId }, schema: expensesResponseSchema, signal }),
  create: (input: ExpenseInput, branchId: string, ownerMemberId: string | null = null) => api.post<Expense>("/expenses", { ...input, branchId, ownerMemberId }, { schema: expenseSchema }),
  update: (id: string, input: ExpenseInput) => api.patch<Expense>(`/expenses/${id}`, input, { schema: expenseSchema }),
  remove: (id: string) => api.delete<void>(`/expenses/${id}`),
  /** Termina un fijo en esa fecha (hoy, por defecto); `null` lo reactiva. */
  end: (id: string, endDate: string | null) => api.post<Expense>(`/expenses/${id}/end`, { endDate }, { schema: expenseSchema }),
  /** Las categorías: las de siempre y las propias de la barbería. */
  categories: (signal?: AbortSignal) => api.get("/expenses/categories", { schema: categoriesResponseSchema, signal }),
  createCategory: (name: string) => api.post("/expenses/categories", { name }, { schema: customCategorySchema }),
  removeCategory: (id: string) => api.delete<void>(`/expenses/categories/${id}`),
};
