import type { AppMessageKey } from "@/app/i18n/types";
import type { TableColumnCells, TableColumnSpec } from "@/components/data-display/table-config";
import { RULE_KEYS, type Payout, type PayrollLine } from "./types";

/**
 * Las columnas de la lista de «Lo que llevo» / «Mi negocio»: sus servicios
 * cobrados del periodo, cita por cita. Al de comisión se le muestra lo que
 * ganó en cada uno; al de renta, lo que le descuenta la barbería.
 */

type Translate = (key: AppMessageKey, params?: Readonly<Record<string, string | number>>) => string;

const DATE_TIME: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" };

export function myPayColumns(t: Translate, payout: Payout): readonly TableColumnSpec[] {
  return [
    { id: "date", label: t("payroll.line.date") },
    { id: "client", label: t("payroll.line.client") },
    { id: "service", label: t("payroll.line.service") },
    { id: "rule", label: t("payroll.line.rule") },
    { id: "sale", label: t("payroll.line.sale") },
    { id: "earned", label: t(payout === "rent" ? "payroll.column.deductions" : "payroll.line.commission") },
    { id: "tip", label: t("payroll.column.tips") },
  ];
}

export interface MyPayCellContext {
  formatMoney: (value: number) => string;
  formatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) => string;
}

export function myPayCells(t: Translate, payout: Payout, { formatMoney, formatDate }: MyPayCellContext): TableColumnCells<PayrollLine> {
  const muted = <span className="text-text-muted">—</span>;
  const money = "text-right tabular-nums whitespace-nowrap";
  return {
    date: { head: t("payroll.line.date"), cell: (row) => formatDate(new Date(row.date), DATE_TIME), cellClassName: "whitespace-nowrap tabular-nums text-text-secondary" },
    client: { head: t("payroll.line.client"), cell: (row) => row.client, cellClassName: "font-medium text-text-primary" },
    service: { head: t("payroll.line.service"), cell: (row) => row.service, cellClassName: "text-text-secondary" },
    rule: {
      head: t("payroll.line.rule"),
      cell: (row) => (
        <>
          {t(RULE_KEYS[row.rule])}
          {row.rate !== null && <span className="text-text-muted"> · {row.rate}%</span>}
        </>
      ),
      cellClassName: "whitespace-nowrap text-text-secondary",
    },
    sale: { head: t("payroll.line.sale"), headClassName: "text-right", cell: (row) => formatMoney(row.sale), cellClassName: money },
    earned: {
      head: t(payout === "rent" ? "payroll.column.deductions" : "payroll.line.commission"),
      headClassName: "text-right",
      cell: (row) => {
        if (payout !== "rent") return formatMoney(row.commission);
        return row.deduction > 0 ? <span className="text-status-warning">−{formatMoney(row.deduction)}</span> : muted;
      },
      cellClassName: money,
    },
    tip: { head: t("payroll.column.tips"), headClassName: "text-right", cell: (row) => (row.tip > 0 ? formatMoney(row.tip) : muted), cellClassName: money },
  };
}
