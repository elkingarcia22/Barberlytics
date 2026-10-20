import type { AppMessageKey } from "@/app/i18n/types";
import type { TableColumnCells, TableColumnSpec } from "@/components/data-display/table-config";
import { ExpenseGlyph, ExpenseKindBadge } from "./expensesShared";
import { monthlyEquivalent } from "./expensesUtils";
import { Badge } from "@/components/ui/badge";
import { FREQUENCY_KEYS, PAYMENT_METHOD_KEYS, categoryLabel, expenseDateOf, expenseKindSchema, isEnded, type CustomCategory, type Expense, type ExpenseKind } from "./types";

/** Lo que la lista de gastos sabe hacer con sus filas, sin JSX de pantalla: el filtro de la URL y las columnas. */

type Translate = (key: AppMessageKey, params?: Readonly<Record<string, string | number>>) => string;

export const ALL = "todos";
export type KindFilter = ExpenseKind | typeof ALL;

export const parseKind = (value: string | null): KindFilter => (expenseKindSchema.safeParse(value).success ? (value as ExpenseKind) : ALL);

/** La categoría de la URL (de siempre o propia); la pantalla la compara con la lista. */
export const parseCategory = (value: string | null): string | null => (value && /^[\w-]{1,40}$/.test(value) ? value : null);

/** Las filas del periodo para el contador: números sin formato y la fecha en AAAA-MM-DD. */
export function expensesCsvRows(t: Translate, rows: readonly Expense[], custom: readonly CustomCategory[] = []): { header: string[]; rows: (string | number)[][] } {
  return {
    header: [t("expenses.column.date"), t("expenses.column.expense"), t("expenses.column.kind"), t("expenses.column.category"), t("expenses.column.supplier"), t("expenses.form.paymentMethod"), t("expenses.column.frequency"), t("expenses.column.amount"), t("expenses.column.monthly"), t("expenses.column.endDate"), t("expenses.form.description")],
    rows: rows.map((row) => [
      expenseDateOf(row),
      row.name,
      t(row.kind === "fixed" ? "expenses.kind.fixed" : "expenses.kind.variable"),
      categoryLabel(t, row.categoryId, custom),
      row.supplier ?? "",
      row.paymentMethod ? t(PAYMENT_METHOD_KEYS[row.paymentMethod]) : "",
      row.frequency ? t(FREQUENCY_KEYS[row.frequency]) : "",
      row.amount,
      monthlyEquivalent(row) ?? "",
      row.endDate ?? "",
      row.description,
    ]),
  };
}

const EMPTY = "—";

export function expenseColumns(t: Translate): readonly TableColumnSpec[] {
  return [
    { id: "select", label: t("column.selection"), fixed: true },
    { id: "expense", label: t("expenses.column.expense") },
    { id: "kind", label: t("expenses.column.kind") },
    { id: "category", label: t("expenses.column.category") },
    { id: "supplier", label: t("expenses.column.supplier"), hiddenByDefault: true },
    { id: "frequency", label: t("expenses.column.frequency") },
    { id: "amount", label: t("expenses.column.amount") },
    { id: "monthly", label: t("expenses.column.monthly") },
    { id: "date", label: t("expenses.column.date") },
  ];
}

export interface ExpenseCellContext {
  formatMoney: (value: number) => string;
  formatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) => string;
  /** Abre el gasto para verlo o editarlo. */
  onOpen: (expense: Expense) => void;
  /** Las categorías propias, para su nombre. */
  customCategories?: readonly CustomCategory[];
}

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };

export function expenseCells(t: Translate, { formatMoney, formatDate, onOpen, customCategories = [] }: ExpenseCellContext): TableColumnCells<Expense> {
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
    kind: {
      head: t("expenses.column.kind"),
      cell: (row) => (
        <span className="flex items-center gap-1.5">
          <ExpenseKindBadge kind={row.kind} />
          {isEnded(row) && <Badge variant="neutral">{t("expenses.ended")}</Badge>}
          {row.movementId && <Badge variant="neutral">{t("expenses.pettyCash")}</Badge>}
        </span>
      ),
    },
    category: { head: t("expenses.column.category"), cell: (row) => categoryLabel(t, row.categoryId, customCategories), cellClassName: "text-text-secondary" },
    supplier: { head: t("expenses.column.supplier"), cell: (row) => row.supplier || muted, cellClassName: "text-text-secondary" },
    frequency: {
      head: t("expenses.column.frequency"),
      // Un fijo dice también qué día se paga.
      cell: (row) => (row.frequency ? `${t(FREQUENCY_KEYS[row.frequency])}${row.dueDay ? ` · ${t("expenses.dueDay", { day: row.dueDay })}` : ""}` : muted),
      cellClassName: "text-text-secondary",
    },
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
    date: { head: t("expenses.column.date"), cell: (row) => formatDate(new Date(`${expenseDateOf(row)}T12:00:00`), DATE_OPTIONS), cellClassName: "whitespace-nowrap tabular-nums text-text-secondary" },
  };
}
