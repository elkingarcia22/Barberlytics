import type { AppMessageKey } from "@/app/i18n/types";
import type { TableColumnCells, TableColumnSpec } from "@/components/data-display/table-config";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsOf } from "@/components/scheduling";
import type { Payout, PayrollMember } from "./types";

/**
 * Las columnas de la nómina. Cambian con la forma de pago —a un barbero de
 * renta no se le liquida comisión y a uno por salario no se le cuenta la
 * venta de servicios—, así que cada pestaña declara las suyas.
 */

type Translate = (key: AppMessageKey, params?: Readonly<Record<string, string | number>>) => string;

const COLUMN_IDS: Readonly<Record<Payout, readonly string[]>> = {
  commission: ["member", "services", "serviceSales", "productSales", "serviceCommission", "productCommission", "tips", "net"],
  rent: ["member", "services", "serviceSales", "tips", "rent", "deductions", "net"],
  salary: ["member", "services", "productSales", "productCommission", "tips", "salary", "net"],
};

const COLUMN_KEYS: Readonly<Record<string, AppMessageKey>> = {
  member: "payroll.column.member",
  services: "payroll.column.services",
  serviceSales: "payroll.column.serviceSales",
  productSales: "payroll.column.productSales",
  serviceCommission: "payroll.column.serviceCommission",
  productCommission: "payroll.column.productCommission",
  tips: "payroll.column.tips",
  salary: "payroll.column.salary",
  rent: "payroll.column.rent",
  deductions: "payroll.column.deductions",
  net: "payroll.column.net",
};

export const columnIdsFor = (payout: Payout): readonly string[] => COLUMN_IDS[payout];
export const columnLabel = (t: Translate, id: string): string => t(COLUMN_KEYS[id]);

export function payrollColumns(t: Translate, payout: Payout): readonly TableColumnSpec[] {
  return COLUMN_IDS[payout].map((id) => ({ id, label: t(COLUMN_KEYS[id]) }));
}

/** El valor numérico de una columna, para la tabla y para exportar. */
export function columnValue(member: PayrollMember, id: string): number {
  switch (id) {
    case "services":
      return member.services;
    case "serviceSales":
      return member.serviceSales;
    case "productSales":
      return member.productSales;
    case "serviceCommission":
      return member.serviceCommission;
    case "productCommission":
      return member.productCommission;
    case "tips":
      return member.tips;
    case "salary":
      return member.salary;
    case "rent":
      return member.rent;
    case "deductions":
      return member.deductions;
    default:
      return member.net;
  }
}

export interface PayrollCellContext {
  formatMoney: (value: number) => string;
  formatNumber: (value: number) => string;
  onOpen: (member: PayrollMember) => void;
}

export function payrollCells(t: Translate, payout: Payout, { formatMoney, formatNumber, onOpen }: PayrollCellContext): TableColumnCells<PayrollMember> {
  const cells: TableColumnCells<PayrollMember> = {
    member: {
      head: t("payroll.column.member"),
      cell: (row) => (
        <span className="flex items-center gap-3">
          <Avatar>
            {row.avatarUrl && <AvatarImage src={row.avatarUrl} alt="" />}
            <AvatarFallback>{initialsOf(row.name)}</AvatarFallback>
          </Avatar>
          <button type="button" onClick={() => onOpen(row)} className="truncate rounded-sm text-left font-semibold text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            {row.name}
          </button>
        </span>
      ),
    },
  };
  for (const id of COLUMN_IDS[payout]) {
    if (id === "member") continue;
    const isMoney = id !== "services";
    cells[id] = {
      head: t(COLUMN_KEYS[id]),
      headClassName: "text-right",
      cell: (row) => {
        const value = columnValue(row, id);
        if (id === "net") {
          return <span className={value < 0 ? "font-semibold text-status-warning" : "font-semibold text-text-primary"}>{value < 0 ? t("payroll.owes", { amount: formatMoney(-value) }) : formatMoney(value)}</span>;
        }
        if (value === 0) return <span className="text-text-muted">{isMoney ? formatMoney(0) : "0"}</span>;
        if (id === "rent" || id === "deductions") return <span className="text-status-warning">−{formatMoney(value)}</span>;
        return isMoney ? formatMoney(value) : formatNumber(value);
      },
      cellClassName: "text-right tabular-nums whitespace-nowrap",
    };
  }
  return cells;
}
