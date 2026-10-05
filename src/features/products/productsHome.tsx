import { Link } from "react-router";
import { Barcode, ReceiptText, Wrench, type LucideIcon } from "lucide-react";
import type { AppMessageKey } from "@/app/i18n/types";
import type { AttentionTone } from "@/components/feedback";
import type { TableColumnCells, TableColumnSpec } from "@/components/data-display/table-config";
import { marginOf } from "@/features/services/servicesUtils";
import { ProductActiveBadge, ProductGlyph, ProductVisibilityBadge, SellableBadge } from "./productsShared";
import type { CatalogProduct, ProductCategory } from "./types";

/**
 * Lo que la lista de productos sabe hacer con sus filas, sin JSX de
 * pantalla: el filtro de la URL, las columnas, los avisos y el pulso. Todo
 * se calcula sobre lo que devolvió `/products`.
 */

type Translate = (key: AppMessageKey, params?: Readonly<Record<string, string | number>>) => string;

export const ALL = "todos";

/** La categoría de la URL, si existe; si no, todas. */
export const parseCategory = (value: string | null, categories: readonly ProductCategory[]): string => (categories.some((category) => category.id === value) ? (value as string) : ALL);

export const categoryName = (categories: readonly ProductCategory[], id: string): string => categories.find((category) => category.id === id)?.name ?? "—";

/** Lo que deja cada unidad vendida; `null` sin precio de compra. */
export const profitOf = (product: Pick<CatalogProduct, "price" | "cost">): number | null => (product.cost === null ? null : Math.round((product.price - product.cost) * 100) / 100);

/* ------------------------------------------------------------------ tabla */

const EMPTY = "—";

/**
 * Precio de compra y margen son cifras de negocio: recepción vende al precio de
 * venta y no ve lo que cuesta (sin `money` no se ofrecen ni en el panel de columnas).
 */
export function productColumns(t: Translate, { money = true }: { money?: boolean } = {}): readonly TableColumnSpec[] {
  const columns: TableColumnSpec[] = [
    { id: "select", label: t("column.selection"), fixed: true },
    { id: "product", label: t("products.column.product") },
    { id: "category", label: t("products.column.category") },
    { id: "sku", label: t("products.column.sku"), hiddenByDefault: true },
    { id: "price", label: t("products.column.price") },
    { id: "cost", label: t("products.column.cost") },
    { id: "margin", label: t("products.column.margin") },
    { id: "distributor", label: t("products.column.distributor"), hiddenByDefault: true },
    { id: "sale", label: t("products.column.sale") },
    { id: "booking", label: t("products.column.booking"), hiddenByDefault: true },
    { id: "status", label: t("products.column.status") },
  ];
  return money ? columns : columns.filter((column) => column.id !== "cost" && column.id !== "margin");
}

export interface ProductCellContext {
  categories: readonly ProductCategory[];
  formatMoney: (value: number) => string;
  formatPercent: (value: number) => string;
}

export function productCells(t: Translate, { categories, formatMoney, formatPercent }: ProductCellContext): TableColumnCells<CatalogProduct> {
  const muted = <span className="text-text-muted">{EMPTY}</span>;
  return {
    product: {
      head: t("products.column.product"),
      cell: (row) => (
        <span className="flex items-center gap-3">
          <ProductGlyph imageUrl={row.imageUrl} />
          <span className="flex min-w-0 flex-col">
            <Link to={`/productos/${row.id}`} className="truncate font-semibold text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              {row.name}
            </Link>
            {row.brand && <span className="truncate text-xs text-text-muted">{row.brand}</span>}
          </span>
        </span>
      ),
    },
    category: { head: t("products.column.category"), cell: (row) => categoryName(categories, row.categoryId), cellClassName: "text-text-secondary" },
    sku: { head: t("products.column.sku"), cell: (row) => row.sku ?? muted, cellClassName: "font-mono text-xs text-text-secondary" },
    price: { head: t("products.column.price"), headClassName: "text-right", cell: (row) => formatMoney(row.price), cellClassName: "text-right tabular-nums font-medium text-text-primary" },
    cost: { head: t("products.column.cost"), headClassName: "text-right", cell: (row) => (row.cost === null ? muted : formatMoney(row.cost)), cellClassName: "text-right tabular-nums text-text-secondary" },
    margin: {
      head: t("products.column.margin"),
      headClassName: "text-right",
      cell: (row) => {
        const margin = marginOf(row);
        return margin === null ? muted : formatPercent(margin);
      },
      cellClassName: "text-right tabular-nums text-text-secondary",
    },
    distributor: { head: t("products.column.distributor"), cell: (row) => row.distributor ?? muted, cellClassName: "text-text-secondary" },
    sale: { head: t("products.column.sale"), cell: (row) => <SellableBadge sellable={row.sellable} /> },
    booking: { head: t("products.column.booking"), cell: (row) => <ProductVisibilityBadge visibility={row.visibility} /> },
    status: { head: t("products.column.status"), cell: (row) => <ProductActiveBadge active={row.active} /> },
  };
}

/* ----------------------------------------------------------------- avisos */

export type ProductAlertId = "noCost" | "noSku" | "internal";

export interface ProductAlertPreset {
  id: ProductAlertId;
  icon: LucideIcon;
  labelKey: AppMessageKey;
  hintKey: AppMessageKey;
  tone: AttentionTone;
  matches: (product: CatalogProduct) => boolean;
}

/**
 * Lo que un catálogo de productos esconde hasta que cuesta dinero: sin
 * precio de compra no se sabe qué deja cada venta; sin SKU no se puede
 * cuadrar con el distribuidor; y uno activo que el equipo no puede vender
 * conviene saber que es a propósito. Solo miran los activos.
 */
export const PRODUCT_ALERTS: readonly ProductAlertPreset[] = [
  { id: "noCost", icon: ReceiptText, labelKey: "products.alert.noCost", hintKey: "products.alert.noCostHint", tone: "warning", matches: (product) => product.active && product.sellable && product.cost === null },
  { id: "noSku", icon: Barcode, labelKey: "products.alert.noSku", hintKey: "products.alert.noSkuHint", tone: "neutral", matches: (product) => product.active && product.sellable && product.sku === null },
  { id: "internal", icon: Wrench, labelKey: "products.alert.internal", hintKey: "products.alert.internalHint", tone: "neutral", matches: (product) => product.active && !product.sellable },
];

/* ------------------------------------------------------------------ pulso */

export interface ProductsPulse {
  total: number;
  /** Activos en la sucursal y a la venta. */
  onSale: number;
  onSaleRate: number;
  avgPrice: number;
  /** Margen medio de los que están a la venta y tienen precio de compra; `null` si ninguno lo tiene. */
  avgMargin: number | null;
  withCost: number;
}

const average = (values: readonly number[]) => (values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length);

export function productsPulse(rows: readonly CatalogProduct[]): ProductsPulse {
  const onSale = rows.filter((row) => row.active && row.sellable);
  const margins = onSale.map(marginOf).filter((margin): margin is number => margin !== null);
  return {
    total: rows.length,
    onSale: onSale.length,
    onSaleRate: rows.length === 0 ? 0 : Math.round((onSale.length / rows.length) * 1000) / 10,
    avgPrice: Math.round(average(onSale.map((row) => row.price)) * 100) / 100,
    avgMargin: margins.length === 0 ? null : Math.round(average(margins) * 10) / 10,
    withCost: margins.length,
  };
}
