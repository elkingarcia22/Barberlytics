import type { AppMessageKey } from "@/app/i18n/types";
import type { TableColumnCells, TableColumnSpec } from "@/components/data-display/table-config";
import { STATUS_KEYS } from "@/features/calendar/types";
import { maskPhone } from "@/features/customers/customersUtils";
import { AccountStatusBadge } from "./transactionsShared";
import { METHOD_KEYS, accountStatusSchema, type Account, type AccountStatus } from "./types";

/**
 * Lo que la lista de transacciones sabe hacer con sus cuentas, sin JSX de
 * pantalla: el resumen y las columnas. El resumen
 * se calcula sobre las cuentas del periodo, no sobre las filtradas: las
 * cifras de arriba no cambian al mirar solo las cobradas.
 */

type Translate = (key: AppMessageKey, params?: Readonly<Record<string, string | number>>) => string;
/* ---------------------------------------------------------------- resumen */

export interface TransactionsSummary {
  /** Lo que suman las cuentas que cuentan: todo menos lo anulado. */
  billed: number;
  billedCount: number;
  collected: number;
  collectedCount: number;
  /** De lo facturado, qué parte ya entró. */
  collectedRate: number;
  receivable: number;
  openCount: number;
  tips: number;
  refunded: number;
  refundedCount: number;
}

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

export function summarize(accounts: readonly Account[]): TransactionsSummary {
  const counted = accounts.filter((account) => account.status !== "void");
  const billed = sum(counted.map((account) => account.total));
  // Lo pagado al reservar en línea ya entró aunque la cita siga abierta: cuenta como cobrado, no como por cobrar.
  const withMoney = accounts.filter((account) => account.status !== "void" && account.collected > 0);
  const collected = sum(withMoney.map((account) => account.collected));
  const open = accounts.filter((account) => account.status === "open" && account.balance > 0);
  const refunded = accounts.filter((account) => account.status === "refunded");
  return {
    billed,
    billedCount: counted.length,
    collected,
    collectedCount: withMoney.length,
    collectedRate: billed === 0 ? 0 : Math.round((collected / billed) * 1000) / 10,
    receivable: sum(open.map((account) => account.balance)),
    openCount: open.length,
    tips: sum(accounts.map((account) => account.tip)),
    refunded: sum(refunded.map((account) => account.refunded)),
    refundedCount: refunded.length,
  };
}

export const countByStatus = (accounts: readonly Account[]): Readonly<Record<AccountStatus, number>> =>
  Object.fromEntries(accountStatusSchema.options.map((status) => [status, accounts.filter((account) => account.status === status).length])) as Record<AccountStatus, number>;

/* ------------------------------------------------------------------ tabla */

const EMPTY = "—";

export function transactionColumns(t: Translate): readonly TableColumnSpec[] {
  return [
    { id: "date", label: t("transactions.column.date") },
    { id: "invoice", label: t("transactions.column.invoice") },
    { id: "client", label: t("transactions.column.client") },
    { id: "attended", label: t("transactions.column.attended") },
    { id: "status", label: t("transactions.column.status") },
    { id: "appointment", label: t("transactions.column.appointment"), hiddenByDefault: true },
    { id: "total", label: t("transactions.column.total") },
    { id: "collected", label: t("transactions.column.collected") },
    { id: "tip", label: t("transactions.column.tip"), hiddenByDefault: true },
    { id: "method", label: t("transactions.column.method") },
  ];
}

export interface TransactionCellContext {
  formatMoney: (value: number) => string;
  formatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) => string;
  /** Abre el detalle de la cuenta. */
  onOpen: (account: Account) => void;
}

const DATE_TIME: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" };

/** Qué se cobró, en una línea: «2 servicios · 1 producto». */
export function describeLines(account: Account, t: Translate): string {
  const services = account.lines.filter((line) => line.kind === "service").length;
  const products = account.lines.filter((line) => line.kind === "product").reduce((total, line) => total + line.qty, 0);
  return [services > 0 ? t("transactions.services", { count: services }) : null, products > 0 ? t("transactions.products", { count: products }) : null].filter(Boolean).join(" · ");
}

export function transactionCells(t: Translate, { formatMoney, formatDate, onOpen }: TransactionCellContext): TableColumnCells<Account> {
  const muted = <span className="text-text-muted">{EMPTY}</span>;
  return {
    date: {
      head: t("transactions.column.date"),
      cell: (row) => (
        <button type="button" onClick={() => onOpen(row)} className="whitespace-nowrap rounded-sm text-left font-semibold tabular-nums text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" aria-label={t("transactions.openAria", { date: formatDate(new Date(row.date), DATE_TIME) })}>
          {formatDate(new Date(row.date), DATE_TIME)}
        </button>
      ),
    },
    invoice: { head: t("transactions.column.invoice"), cell: (row) => row.invoice ?? muted, cellClassName: "font-mono text-xs text-text-secondary" },
    client: {
      head: t("transactions.column.client"),
      cell: (row) =>
        row.client ? (
          <span className="flex flex-col">
            <span className="font-medium text-text-primary">{row.client.name}</span>
            <span className="text-xs tabular-nums text-text-muted">{maskPhone(row.client.phone)}</span>
          </span>
        ) : (
          <span className="text-text-secondary">{t("transactions.counterSale")}</span>
        ),
    },
    attended: {
      head: t("transactions.column.attended"),
      cell: (row) => (
        <span className="flex flex-col">
          <span className="text-text-secondary">{row.barber ?? EMPTY}</span>
          <span className="text-xs text-text-muted">{describeLines(row, t)}</span>
        </span>
      ),
    },
    status: { head: t("transactions.column.status"), cell: (row) => <AccountStatusBadge status={row.status} /> },
    appointment: { head: t("transactions.column.appointment"), cell: (row) => (row.appointmentStatus ? t(STATUS_KEYS[row.appointmentStatus]) : muted), cellClassName: "text-text-secondary" },
    total: {
      head: t("transactions.column.total"),
      headClassName: "text-right",
      cell: (row) => <span className={row.status === "void" ? "text-text-muted line-through" : "font-medium text-text-primary"}>{formatMoney(row.total)}</span>,
      cellClassName: "text-right tabular-nums",
    },
    collected: { head: t("transactions.column.collected"), headClassName: "text-right", cell: (row) => (row.collected > 0 ? formatMoney(row.collected) : muted), cellClassName: "text-right tabular-nums text-text-secondary" },
    tip: { head: t("transactions.column.tip"), headClassName: "text-right", cell: (row) => (row.tip > 0 ? formatMoney(row.tip) : muted), cellClassName: "text-right tabular-nums text-text-secondary" },
    method: { head: t("transactions.column.method"), cell: (row) => (row.method ? t(METHOD_KEYS[row.method]) : muted), cellClassName: "text-text-secondary" },
  };
}
