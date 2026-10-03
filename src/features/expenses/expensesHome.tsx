import type { AppMessageKey } from "@/app/i18n/types";
import type { TableColumnCells, TableColumnSpec } from "@/components/data-display/table-config";
import { ExpenseGlyph, ExpenseKindBadge } from "./expensesShared";
import { monthlyEquivalent } from "./expensesUtils";
import { FREQUENCY_KEYS, expenseKindSchema, type Expense, type ExpenseKind } from "./types";

/** Lo que la lista de gastos sabe hacer con sus filas, sin JSX de pantalla: el filtro de la URL y las columnas. */

type Translate = (key: AppMessageKey, params?: Readonly<Record<string, string | number>>) => string;

export const ALL = "todos";
export type KindFilter = ExpenseKind | typeof ALL;

export const parseKind = (value: string | null): KindFilter => (expenseKindSchema.safeParse(value).success ? (value as ExpenseKind) : ALL);

const EMPTY = "—";

export function expenseColumns(t: Translate): readonly TableColumnSpec[] {
  return [
    { id: "select", label: t("column.selection"), fixed: true },
    { id: "expense", label: t("expenses.column.expense") },
    { id: "kind", label: t("expenses.column.kind") },
    { id: "frequency", label: t("expenses.column.frequency") },
    { id: "amount", label: t("expenses.column.amount") },
    { id: "monthly", label: t("expenses.column.monthly") },
    { id: "createdAt", label: t("expenses.column.createdAt") },
  ];
}

export interface ExpenseCellContext {
  formatMoney: (value: number) => string;
  formatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) => string;
  /** Abre el gasto para verlo o editarlo. */
  onOpen: (expense: Expense) => void;
}

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };

export function expenseCells(t: Translate, { formatMoney, formatDate, onOpen }: ExpenseCellContext): TableColumnCells<Expense> {
  const muted = <span className="text-text-muted">{EMPTY}</span>;
  return {
    expense: {
      head: t("expenses.column.expense"),
      cell: (row) => (
        <span className="flex items-center gap-3">
          <ExpenseGlyph kind={row.kind} />
          <span className="flex min-w-0 flex-col">
            <button type="button" onClick={() => onOpen(row)} className="truncate rounded-sm text-left font-semibold text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              {row.name}
            </button>
            {row.description && <span className="max-w-xs truncate text-xs text-text-muted">{row.description}</span>}
          </span>
        </span>
      ),
    },
    kind: { head: t("expenses.column.kind"), cell: (row) => <ExpenseKindBadge kind={row.kind} /> },
    frequency: { head: t("expenses.column.frequency"), cell: (row) => (row.frequency ? t(FREQUENCY_KEYS[row.frequency]) : muted), cellClassName: "text-text-secondary" },
    amount: { head: t("expenses.column.amount"), headClassName: "text-right", cell: (row) => formatMoney(row.amount), cellClassName: "text-right tabular-nums font-medium text-text-primary" },
    monthly: {
      head: t("expenses.column.monthly"),
      headClassName: "text-right",
      cell: (row) => {
        const monthly = monthlyEquivalent(row);
        return monthly === null ? muted : formatMoney(monthly);
      },
      cellClassName: "text-right tabular-nums text-text-secondary",
    },
    createdAt: { head: t("expenses.column.createdAt"), cell: (row) => formatDate(new Date(row.createdAt), DATE_OPTIONS), cellClassName: "whitespace-nowrap tabular-nums text-text-secondary" },
  };
}
