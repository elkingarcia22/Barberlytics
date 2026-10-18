import { z } from "zod";
import type { AppMessageKey } from "@/app/i18n/types";

/** Un gasto fijo se repite con una frecuencia; uno variable pasó una vez. */
export const expenseKindSchema = z.enum(["fixed", "variable"]);
export type ExpenseKind = z.infer<typeof expenseKindSchema>;

export const expenseFrequencySchema = z.enum(["weekly", "biweekly", "monthly", "quarterly", "semiannual", "annual"]);
export type ExpenseFrequency = z.infer<typeof expenseFrequencySchema>;

/** Categorías por defecto (las mismas del backend): base del estado de resultados. */
export const expenseCategorySchema = z.enum(["rent", "utilities", "internet", "supplies", "resale", "cleaning", "maintenance", "advertising", "software", "taxes", "other"]);
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;

export const expensePaymentMethodSchema = z.enum(["cash", "bank", "card", "wallet"]);
export type ExpensePaymentMethod = z.infer<typeof expensePaymentMethodSchema>;

export const expenseAttachmentSchema = z.object({ id: z.string(), name: z.string(), type: z.string(), dataUrl: z.string() });
export type ExpenseAttachment = z.infer<typeof expenseAttachmentSchema>;
export const MAX_EXPENSE_ATTACHMENTS = 3;

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
  /** Cuándo se registró. */
  createdAt: z.string(),
  /** AAAA-MM-DD: en un variable, cuándo se gastó; en un fijo, desde cuándo corre. */
  date: z.string().optional(),
  /** Un fijo terminado deja de contar desde el día siguiente. */
  endDate: z.string().nullable().optional(),
  categoryId: expenseCategorySchema.optional(),
  paymentMethod: expensePaymentMethodSchema.nullable().optional(),
  supplier: z.string().optional(),
  attachments: z.array(expenseAttachmentSchema).optional(),
  createdBy: z.string().nullable().optional(),
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
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expenses.form.error.date"),
    categoryId: expenseCategorySchema,
    paymentMethod: expensePaymentMethodSchema.nullable(),
    supplier: z.string().trim(),
    attachments: z.array(expenseAttachmentSchema).max(MAX_EXPENSE_ATTACHMENTS),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "fixed" && value.frequency === null) ctx.addIssue({ code: "custom", path: ["frequency"], message: "expenses.form.error.frequency" });
  });
export type ExpenseInput = z.infer<typeof expenseInputSchema>;

const todayKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

/** La fecha del gasto: la suya o, en los guardados antes del campo, el día en que se registró. */
export const expenseDateOf = (expense: Pick<Expense, "date" | "createdAt">): string => {
  if (expense.date) return expense.date;
  const created = new Date(expense.createdAt);
  return `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")}`;
};

/** Un fijo que ya se terminó (su fin es anterior a hoy) no cuenta para lo que viene. */
export const isEnded = (expense: Pick<Expense, "endDate">, today = todayKey()): boolean => Boolean(expense.endDate && expense.endDate < today);

export const emptyExpenseInput = (kind: ExpenseKind): ExpenseInput => ({ kind, name: "", amount: Number.NaN, frequency: kind === "fixed" ? "monthly" : null, description: "", date: todayKey(), categoryId: kind === "fixed" ? "rent" : "supplies", paymentMethod: null, supplier: "", attachments: [] });

export const inputFromExpense = (expense: Expense): ExpenseInput => ({
  kind: expense.kind,
  name: expense.name,
  amount: expense.amount,
  frequency: expense.frequency,
  description: expense.description,
  date: expenseDateOf(expense),
  categoryId: expense.categoryId ?? "other",
  paymentMethod: expense.paymentMethod ?? null,
  supplier: expense.supplier ?? "",
  attachments: expense.attachments ?? [],
});

export const CATEGORY_KEYS: Readonly<Record<ExpenseCategory, AppMessageKey>> = {
  rent: "expenses.category.rent",
  utilities: "expenses.category.utilities",
  internet: "expenses.category.internet",
  supplies: "expenses.category.supplies",
  resale: "expenses.category.resale",
  cleaning: "expenses.category.cleaning",
  maintenance: "expenses.category.maintenance",
  advertising: "expenses.category.advertising",
  software: "expenses.category.software",
  taxes: "expenses.category.taxes",
  other: "expenses.category.other",
};

export const PAYMENT_METHOD_KEYS: Readonly<Record<ExpensePaymentMethod, AppMessageKey>> = { cash: "expenses.method.cash", bank: "expenses.method.bank", card: "expenses.method.card", wallet: "expenses.method.wallet" };

export const EXPENSE_KIND_KEYS: Readonly<Record<ExpenseKind, AppMessageKey>> = { fixed: "expenses.kind.fixed", variable: "expenses.kind.variable" };

export const FREQUENCY_KEYS: Readonly<Record<ExpenseFrequency, AppMessageKey>> = {
  weekly: "expenses.frequency.weekly",
  biweekly: "expenses.frequency.biweekly",
  monthly: "expenses.frequency.monthly",
  quarterly: "expenses.frequency.quarterly",
  semiannual: "expenses.frequency.semiannual",
  annual: "expenses.frequency.annual",
};
