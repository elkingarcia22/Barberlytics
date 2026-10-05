import { Link } from "react-router";
import { EyeOff, ReceiptText, UserX, type LucideIcon } from "lucide-react";
import type { AppMessageKey } from "@/app/i18n/types";
import type { AttentionTone } from "@/components/feedback";
import type { TableColumnCells, TableColumnSpec } from "@/components/data-display/table-config";
import { Badge } from "@/components/ui/badge";
import { ActiveBadge, ServiceGlyph, VisibilityBadge } from "./servicesShared";
import { categoryName, formatDuration, marginOf } from "./servicesUtils";
import { serviceKindSchema, type CatalogService, type ServiceCategory, type ServiceKind } from "./types";

/**
 * Lo que la lista de servicios sabe hacer con sus filas, sin JSX de
 * pantalla: los filtros de la URL, las columnas, los avisos y el pulso.
 * Todo se calcula sobre lo que devolvió `/services`.
 */

type Translate = (key: AppMessageKey, params?: Readonly<Record<string, string | number>>) => string;

export const ALL = "todos";
export type KindFilter = ServiceKind | typeof ALL;

export const parseKind = (value: string | null): KindFilter => (serviceKindSchema.safeParse(value).success ? (value as ServiceKind) : ALL);

/** La categoría de la URL, si existe; si no, todas. */
export const parseCategory = (value: string | null, categories: readonly ServiceCategory[]): string => (categories.some((category) => category.id === value) ? (value as string) : ALL);

/* ------------------------------------------------------------------ tabla */

const EMPTY = "—";

/** Costo y margen son cifras de negocio: sin `money` no se ofrecen ni en el panel de columnas. */
export function serviceColumns(t: Translate, { money = true }: { money?: boolean } = {}): readonly TableColumnSpec[] {
  const columns: TableColumnSpec[] = [
    { id: "select", label: t("column.selection"), fixed: true },
    { id: "service", label: t("services.column.service") },
    { id: "category", label: t("services.column.category") },
    { id: "duration", label: t("services.column.duration") },
    { id: "price", label: t("services.column.price") },
    { id: "cost", label: t("services.column.cost"), hiddenByDefault: true },
    { id: "margin", label: t("services.column.margin"), hiddenByDefault: true },
    { id: "team", label: t("services.column.team") },
    { id: "booking", label: t("services.column.booking") },
    { id: "status", label: t("services.column.status") },
  ];
  return money ? columns : columns.filter((column) => column.id !== "cost" && column.id !== "margin");
}

export interface ServiceCellContext {
  categories: readonly ServiceCategory[];
  formatMoney: (value: number) => string;
  formatPercent: (value: number) => string;
}

export function serviceCells(t: Translate, { categories, formatMoney, formatPercent }: ServiceCellContext): TableColumnCells<CatalogService> {
  return {
    service: {
      head: t("services.column.service"),
      cell: (row) => (
        <span className="flex items-center gap-3">
          <ServiceGlyph kind={row.kind} imageUrl={row.imageUrl} />
          <span className="flex min-w-0 flex-col">
            <span className="flex items-center gap-inline">
              <Link to={`/servicios/${row.id}`} className="truncate font-semibold text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                {row.name}
              </Link>
              {row.kind === "combo" && <Badge variant="outline">{t("services.comboOf", { count: row.includes.length })}</Badge>}
            </span>
            {row.description && <span className="max-w-xs truncate text-xs text-text-muted">{row.description}</span>}
          </span>
        </span>
      ),
    },
    category: { head: t("services.column.category"), cell: (row) => categoryName(categories, row.categoryId), cellClassName: "text-text-secondary" },
    duration: { head: t("services.column.duration"), cell: (row) => formatDuration(row.durationMin), cellClassName: "tabular-nums text-text-secondary whitespace-nowrap" },
    price: { head: t("services.column.price"), headClassName: "text-right", cell: (row) => formatMoney(row.price), cellClassName: "text-right tabular-nums font-medium text-text-primary" },
    cost: {
      head: t("services.column.cost"),
      headClassName: "text-right",
      cell: (row) => (row.cost === null ? <span className="text-text-muted">{EMPTY}</span> : formatMoney(row.cost)),
      cellClassName: "text-right tabular-nums text-text-secondary",
    },
    margin: {
      head: t("services.column.margin"),
      headClassName: "text-right",
      cell: (row) => {
        const margin = marginOf(row);
        return margin === null ? <span className="text-text-muted">{EMPTY}</span> : formatPercent(margin);
      },
      cellClassName: "text-right tabular-nums text-text-secondary",
    },
    team: {
      head: t("services.column.team"),
      cell: (row) => <span className={row.offeredBy === 0 ? "text-status-warning" : "text-text-secondary"}>{row.offeredBy === 0 ? t("services.team.nobody") : t("services.team.count", { count: row.offeredBy, total: row.teamSize })}</span>,
      cellClassName: "whitespace-nowrap",
    },
    booking: { head: t("services.column.booking"), cell: (row) => <VisibilityBadge visibility={row.visibility} /> },
    status: { head: t("services.column.status"), cell: (row) => <ActiveBadge active={row.active} /> },
  };
}

/* ----------------------------------------------------------------- avisos */

export type ServiceAlertId = "nobody" | "noCost" | "hidden";

export interface ServiceAlertPreset {
  id: ServiceAlertId;
  icon: LucideIcon;
  labelKey: AppMessageKey;
  hintKey: AppMessageKey;
  tone: AttentionTone;
  matches: (service: CatalogService) => boolean;
}

/**
 * Tres cosas que un catálogo esconde hasta que cuestan dinero: un servicio
 * activo que nadie ofrece no se puede agendar; sin costo no se sabe si deja
 * algo; y uno activo pero privado no aparece en la reserva en línea. Solo
 * miran los activos: lo apagado ya no está a la venta.
 */
export const SERVICE_ALERTS: readonly ServiceAlertPreset[] = [
  { id: "nobody", icon: UserX, labelKey: "services.alert.nobody", hintKey: "services.alert.nobodyHint", tone: "negative", matches: (service) => service.active && service.offeredBy === 0 },
  { id: "noCost", icon: ReceiptText, labelKey: "services.alert.noCost", hintKey: "services.alert.noCostHint", tone: "warning", matches: (service) => service.active && service.cost === null },
  { id: "hidden", icon: EyeOff, labelKey: "services.alert.hidden", hintKey: "services.alert.hiddenHint", tone: "neutral", matches: (service) => service.active && service.visibility === "private" },
];

/* ------------------------------------------------------------------ pulso */

export interface ServicesPulse {
  total: number;
  active: number;
  activeRate: number;
  avgPrice: number;
  avgDurationMin: number;
  /** Margen medio de los activos con costo registrado; `null` si ninguno lo tiene. */
  avgMargin: number | null;
  withCost: number;
}

const average = (values: readonly number[]) => (values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length);

export function servicesPulse(rows: readonly CatalogService[]): ServicesPulse {
  const active = rows.filter((row) => row.active);
  const margins = active.map(marginOf).filter((margin): margin is number => margin !== null);
  return {
    total: rows.length,
    active: active.length,
    activeRate: rows.length === 0 ? 0 : Math.round((active.length / rows.length) * 1000) / 10,
    avgPrice: Math.round(average(active.map((row) => row.price))),
    avgDurationMin: Math.round(average(active.map((row) => row.durationMin))),
    avgMargin: margins.length === 0 ? null : Math.round(average(margins) * 10) / 10,
    withCost: margins.length,
  };
}
