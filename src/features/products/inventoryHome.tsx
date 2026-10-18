import type { AppMessageKey } from "@/app/i18n/types";
import type { TableColumnCells, TableColumnSpec } from "@/components/data-display/table-config";
import { cn } from "@/lib/utils";
import { ProductGlyph } from "./productsShared";
import { StockBadge } from "./StockBadge";
import { STOCK_STATUS_KEYS, type StockItem } from "./inventory";

/** Las columnas y celdas de la lista de existencias, sin JSX de pantalla. */

type Translate = (key: AppMessageKey, params?: Readonly<Record<string, string | number>>) => string;

export function inventoryColumns(t: Translate): readonly TableColumnSpec[] {
  return [
    { id: "select", label: t("column.selection"), fixed: true },
    { id: "product", label: t("products.column.product") },
    { id: "onHand", label: t("inventory.column.onHand") },
    { id: "min", label: t("inventory.column.min") },
    { id: "status", label: t("inventory.column.status") },
    { id: "sold30", label: t("inventory.column.sold30") },
    { id: "daysLeft", label: t("inventory.column.daysLeft") },
    { id: "sku", label: t("products.column.sku"), hiddenByDefault: true },
  ];
}

export function inventoryCells(t: Translate, { formatAgo }: { formatAgo: (iso: string) => string }): TableColumnCells<StockItem> {
  const muted = <span className="text-text-muted">—</span>;
  const number = "text-right tabular-nums";
  return {
    product: {
      head: t("products.column.product"),
      cell: (row) => (
        <span className="flex items-center gap-3">
          <ProductGlyph imageUrl={row.imageUrl} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-semibold text-text-primary">{row.name}</span>
            <span className="truncate text-xs text-text-muted">
              {row.lastMovementAt
                ? t("inventory.lastMovement", {
                    when: formatAgo(row.lastMovementAt),
                  })
                : t("inventory.noMovements")}
            </span>
          </span>
        </span>
      ),
    },
    onHand: {
      head: t("inventory.column.onHand"),
      headClassName: "text-right",
      cell: (row) => <span className={cn("font-semibold", row.onHand < 0 && "text-status-negative")}>{row.onHand}</span>,
      cellClassName: number,
    },
    min: {
      head: t("inventory.column.min"),
      headClassName: "text-right",
      cell: (row) => row.min,
      cellClassName: `${number} text-text-secondary`,
    },
    status: {
      head: t("inventory.column.status"),
      cell: (row) => <StockBadge status={row.status} label={t(STOCK_STATUS_KEYS[row.status])} />,
    },
    sold30: {
      head: t("inventory.column.sold30"),
      headClassName: "text-right",
      cell: (row) => row.sold30,
      cellClassName: `${number} text-text-secondary`,
    },
    daysLeft: {
      head: t("inventory.column.daysLeft"),
      headClassName: "text-right",
      cell: (row) => (row.daysLeft === null ? muted : t("inventory.days", { count: row.daysLeft })),
      cellClassName: `${number} text-text-secondary`,
    },
    sku: {
      head: t("products.column.sku"),
      cell: (row) => row.sku ?? muted,
      cellClassName: "font-mono text-xs text-text-secondary",
    },
  };
}
