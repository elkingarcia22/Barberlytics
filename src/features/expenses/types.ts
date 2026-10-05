import { z } from "zod";
import type { AppMessageKey } from "@/app/i18n/types";

/** Un gasto fijo se repite con una frecuencia; uno variable pasó una vez. */
export const expenseKindSchema = z.enum(["fixed", "variable"]);
export type ExpenseKind = z.infer<typeof expenseKindSchema>;

export const expenseFrequencySchema = z.enum(["weekly", "biweekly", "monthly", "quarterly", "semiannual", "annual"]);
export type ExpenseFrequency = z.infer<typeof expenseFrequencySchema>;

export const expenseSchema = z.object({
  id: z.string(),
  branchId: z.string(),
  /**
   * De quién es el gasto: `null` es de la sucursal (la barbería); con un id,
   * es de ese barbero de renta (lo que compra para su silla). Los gastos
   * guardados antes de este campo no lo traen: son de la sucursal.
   */
  ownerMemberId: z.string().nullable().default(null),
  kind: expenseKindSchema,
  name: z.string(),
  amount: z.number(),
  frequency: expenseFrequencySchema.nullable(),
  description: z.string(),
  /** Cuándo se registró; en un gasto variable es la fecha del gasto. */
  createdAt: z.string(),
});
export type Expense = z.infer<typeof expenseSchema>;

export const expensesResponseSchema = z.object({ items: z.array(expenseSchema) });
export type ExpensesResponse = z.infer<typeof expensesResponseSchema>;

/** Lo que captura el formulario. Los mensajes son claves del diccionario. */
export const expenseInputSchema = z
  .object({
    kind: expenseKindSchema,
    name: z.string().trim().min(2, "expenses.form.error.name"),
    amount: z.number({ error: "expenses.form.error.amount" }).positive("expenses.form.error.amount"),
    frequency: expenseFrequencySchema.nullable(),
    description: z.string().trim(),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "fixed" && value.frequency === null) ctx.addIssue({ code: "custom", path: ["frequency"], message: "expenses.form.error.frequency" });
  });
export type ExpenseInput = z.infer<typeof expenseInputSchema>;

export const emptyExpenseInput = (kind: ExpenseKind): ExpenseInput => ({ kind, name: "", amount: Number.NaN, frequency: kind === "fixed" ? "monthly" : null, description: "" });

export const inputFromExpense = (expense: Expense): ExpenseInput => ({ kind: expense.kind, name: expense.name, amount: expense.amount, frequency: expense.frequency, description: expense.description });

export const EXPENSE_KIND_KEYS: Readonly<Record<ExpenseKind, AppMessageKey>> = { fixed: "expenses.kind.fixed", variable: "expenses.kind.variable" };

export const FREQUENCY_KEYS: Readonly<Record<ExpenseFrequency, AppMessageKey>> = {
  weekly: "expenses.frequency.weekly",
  biweekly: "expenses.frequency.biweekly",
  monthly: "expenses.frequency.monthly",
  quarterly: "expenses.frequency.quarterly",
  semiannual: "expenses.frequency.semiannual",
  annual: "expenses.frequency.annual",
};
