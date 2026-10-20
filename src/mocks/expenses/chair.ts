import { db } from "../db";
import { PAYMENTS_PER_YEAR } from "../reports/income";
import { expenseDate, fixedActiveIn } from "./seed";

/**
 * Los gastos de la silla de un barbero de renta en un rango (lo que compra por su cuenta: herramientas, productos…):
 * los variables de esas fechas y los fijos llevados a los días del rango (lo que cuestan al año ÷ 365 × días). Con
 * ellos «Mi negocio» resta y dice lo que le queda.
 */

const DAY_MS = 86_400_000;
const DAYS_PER_YEAR = 365;
const round = (value: number) => Math.round(value * 100) / 100;

export function chairExpensesIn(branchId: string, memberId: string, from: string, to: string): { fixed: number; variable: number; total: number } {
  const days = Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / DAY_MS) + 1;
  const mine = db.expenses.filter((expense) => expense.branchId === branchId && expense.ownerMemberId === memberId);
  const variable = round(mine.filter((expense) => expense.kind === "variable" && expenseDate(expense) >= from && expenseDate(expense) <= to).reduce((sum, expense) => sum + expense.amount, 0));
  const fixed = round(
    mine
      .filter((expense) => expense.kind === "fixed" && expense.frequency && fixedActiveIn(expense, from, to))
      .reduce((sum, expense) => sum + (expense.amount * PAYMENTS_PER_YEAR[expense.frequency!] * days) / DAYS_PER_YEAR, 0)
  );
  return { fixed, variable, total: round(fixed + variable) };
}
