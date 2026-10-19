import { expenseDateOf, isEnded, type Expense, type ExpenseFrequency } from "./types";

/** Las ayudas sin JSX del módulo de gastos: llevar todo a «por mes» y resumir. */

const MONTHS_PER_YEAR = 12;

/** Cuántas veces al año se paga cada frecuencia. */
export const PAYMENTS_PER_YEAR: Readonly<Record<ExpenseFrequency, number>> = { weekly: 52, biweekly: 26, monthly: 12, quarterly: 4, semiannual: 2, annual: 1 };

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Lo que un gasto fijo pesa en un mes, sea cual sea su frecuencia: 120 a la
 * semana son 520 al mes y 1.800 al año son 150. Es lo que permite sumar una
 * renta mensual con un seguro anual. Un gasto variable no tiene: devuelve `null`.
 */
export function monthlyEquivalent(expense: Pick<Expense, "kind" | "amount" | "frequency">): number | null {
  if (expense.kind !== "fixed" || expense.frequency === null) return null;
  return round((expense.amount * PAYMENTS_PER_YEAR[expense.frequency]) / MONTHS_PER_YEAR);
}

/** «AAAA-MM-DD» cae en el mes de `reference`. */
const sameMonth = (day: string, reference: Date): boolean => day.slice(0, 7) === `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, "0")}`;

export interface ExpensesSummary {
  /** Lo que suman los fijos llevados a un mes. */
  fixedMonthly: number;
  fixedYearly: number;
  fixedCount: number;
  /** Los variables registrados en el mes de `now`. */
  variableThisMonth: number;
  variableThisMonthCount: number;
  variableLastMonth: number;
  /** Fijos del mes más variables del mes: lo que hay que cubrir para no perder. */
  monthTotal: number;
  /** De ese total, qué parte es fija. */
  fixedShare: number;
}

/** ¿Estuvo vivo en el mes «AAAA-MM»? Un variable, si se gastó en él; un fijo, si corría algún día del mes. */
export function activeInMonth(expense: Pick<Expense, "kind" | "date" | "createdAt" | "endDate">, month: string): boolean {
  const from = `${month}-01`;
  const to = `${month}-31`;
  const start = expenseDateOf(expense);
  if (expense.kind === "variable") return start >= from && start <= to;
  return start <= to && (!expense.endDate || expense.endDate >= from);
}

/** `now`: un día del mes que se resume; `today`: desde cuándo un fijo terminado deja de pesar. */
export function summarizeExpenses(expenses: readonly Expense[], now = new Date(), today?: string): ExpensesSummary {
  /* Un fijo terminado ya no pesa en el mes que viene. */
  const fixed = expenses.filter((expense) => expense.kind === "fixed" && !isEnded(expense, today));
  const variable = expenses.filter((expense) => expense.kind === "variable");
  const fixedMonthly = round(fixed.reduce((sum, expense) => sum + (monthlyEquivalent(expense) ?? 0), 0));
  const thisMonth = variable.filter((expense) => sameMonth(expenseDateOf(expense), now));
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const variableThisMonth = round(thisMonth.reduce((sum, expense) => sum + expense.amount, 0));
  const monthTotal = round(fixedMonthly + variableThisMonth);
  return {
    fixedMonthly,
    fixedYearly: round(fixedMonthly * MONTHS_PER_YEAR),
    fixedCount: fixed.length,
    variableThisMonth,
    variableThisMonthCount: thisMonth.length,
    variableLastMonth: round(variable.filter((expense) => sameMonth(expenseDateOf(expense), lastMonthDate)).reduce((sum, expense) => sum + expense.amount, 0)),
    monthTotal,
    fixedShare: monthTotal === 0 ? 0 : Math.round((fixedMonthly / monthTotal) * 1000) / 10,
  };
}
