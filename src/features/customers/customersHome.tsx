import { Link } from "react-router";
import { Cake, CalendarX, HeartPulse, Hourglass, type LucideIcon } from "lucide-react";
import type { AppMessageKey } from "@/app/i18n/types";
import type { AttentionTone } from "@/components/feedback";
import type { TableColumnCells, TableColumnSpec } from "@/components/data-display/table-config";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CustomerAvatar, SegmentBadge } from "./customersShared";
import { branchName, daysToBirthday, formatAgo, maskPhone } from "./customersUtils";
import { customerSegmentSchema, type Customer, type CustomerSegment } from "./types";

/**
 * Lo que la lista de clientes sabe hacer con sus filas, sin JSX de pantalla:
 * los segmentos de la fila de arriba, las columnas, los avisos y el pulso.
 * Todo se calcula sobre lo que devolvió `/customers`.
 */

type Translate = (key: AppMessageKey, params?: Readonly<Record<string, string | number>>) => string;

export const ALL_SEGMENTS = "todos";
export type SegmentFilter = CustomerSegment | typeof ALL_SEGMENTS;

export const parseSegment = (value: string | null): SegmentFilter => (customerSegmentSchema.safeParse(value).success ? (value as CustomerSegment) : ALL_SEGMENTS);

export const countBySegment = (rows: readonly Customer[]): Readonly<Record<CustomerSegment, number>> =>
  Object.fromEntries(customerSegmentSchema.options.map((segment) => [segment, rows.filter((row) => row.segment === segment).length])) as Record<CustomerSegment, number>;

/* ------------------------------------------------------------------ tabla */

const EMPTY = "—";

export function customerColumns(t: Translate): readonly TableColumnSpec[] {
  return [
    { id: "select", label: t("column.selection"), fixed: true },
    { id: "customer", label: t("customers.column.customer") },
    { id: "segment", label: t("customers.column.segment") },
    { id: "ltv", label: t("customers.column.ltv") },
    { id: "visits", label: t("customers.column.visits") },
    { id: "lastVisit", label: t("customers.column.lastVisit") },
    { id: "frequency", label: t("customers.column.frequency"), hiddenByDefault: true },
    { id: "barber", label: t("customers.column.barber"), hiddenByDefault: true },
    { id: "branch", label: t("customers.column.branch") },
    { id: "email", label: t("customers.column.email"), hiddenByDefault: true },
    { id: "since", label: t("customers.column.since"), hiddenByDefault: true },
  ];
}

export interface CustomerCellFormatters {
  formatCount: (value: number) => string;
  formatMoney: (value: number) => string;
  formatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit) => string;
}

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };

export function customerCells(t: Translate, { formatCount, formatMoney, formatDate, formatRelativeTime }: CustomerCellFormatters): TableColumnCells<Customer> {
  return {
    customer: {
      head: t("customers.column.customer"),
      cell: (row) => (
        <span className="flex items-center gap-3">
          <CustomerAvatar name={row.name} />
          <span className="flex min-w-0 flex-col">
            <span className="flex items-center gap-inline">
              <Link to={`/clientes/${row.id}`} className="truncate font-semibold text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                {row.name}
              </Link>
              {row.medicalNotes > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex text-status-warning" aria-label={t("customers.medicalFlag")}>
                      <HeartPulse className="size-3.5" strokeWidth={2.5} aria-hidden />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{t("customers.medicalFlag")}</TooltipContent>
                </Tooltip>
              )}
            </span>
            <span className="text-xs tabular-nums text-text-muted">{maskPhone(row.phone)}</span>
          </span>
        </span>
      ),
    },
    segment: { head: t("customers.column.segment"), cell: (row) => <SegmentBadge segment={row.segment} /> },
    ltv: {
      head: t("customers.column.ltv"),
      headClassName: "text-right",
      cell: (row) => (row.ltv === 0 ? <span className="text-text-muted">{EMPTY}</span> : formatMoney(row.ltv)),
      cellClassName: "text-right tabular-nums font-medium text-text-primary",
    },
    visits: {
      head: t("customers.column.visits"),
      headClassName: "text-right",
      cell: (row) => formatCount(row.visits),
      cellClassName: "text-right tabular-nums",
    },
    lastVisit: {
      head: t("customers.column.lastVisit"),
      cell: (row) =>
        row.lastVisitAt === null ? (
          <span className="text-text-muted">{t("customers.neverVisited")}</span>
        ) : (
          <span className={row.segment === "atRisk" || row.segment === "lost" ? "text-status-warning" : "text-text-secondary"}>{formatAgo(row.lastVisitAt, formatRelativeTime)}</span>
        ),
    },
    frequency: {
      head: t("customers.column.frequency"),
      cell: (row) => (row.visitEveryDays === null ? EMPTY : t("customers.everyDays", { count: row.visitEveryDays })),
      cellClassName: "text-text-secondary",
    },
    barber: { head: t("customers.column.barber"), cell: (row) => row.preferredBarber ?? t("customers.noPreference"), cellClassName: "text-text-secondary" },
    branch: { head: t("customers.column.branch"), cell: (row) => branchName(row.branchId), cellClassName: "text-text-secondary" },
    email: { head: t("customers.column.email"), cell: (row) => row.email, cellClassName: "text-text-secondary" },
    since: { head: t("customers.column.since"), cell: (row) => formatDate(new Date(row.createdAt), DATE_OPTIONS), cellClassName: "text-text-secondary tabular-nums" },
  };
}

/* ----------------------------------------------------------------- avisos */

export type CustomerAlertId = "atRisk" | "birthday" | "unreliable";

export interface CustomerAlertPreset {
  id: CustomerAlertId;
  icon: LucideIcon;
  labelKey: AppMessageKey;
  hintKey: AppMessageKey;
  tone: AttentionTone;
  matches: (customer: Customer) => boolean;
}

/** Con cuántos días de antelación avisa un cumpleaños. */
export const BIRTHDAY_WINDOW_DAYS = 7;
/** Entre cancelaciones y faltas, a partir de cuántas se considera que falla seguido. */
export const UNRELIABLE_MISSES = 3;

const isActive = (customer: Customer) => customer.segment !== "blocked" && customer.segment !== "lost";

/**
 * Tres motivos para hacer algo hoy con un cliente, en el orden en que duele
 * no hacerlo: se está yendo, cumple años esta semana, o falla tanto que
 * conviene pedirle pago por adelantado.
 */
export const CUSTOMER_ALERTS: readonly CustomerAlertPreset[] = [
  { id: "atRisk", icon: Hourglass, labelKey: "customers.alert.atRisk", hintKey: "customers.alert.atRiskHint", tone: "warning", matches: (customer) => customer.segment === "atRisk" },
  {
    id: "birthday",
    icon: Cake,
    labelKey: "customers.alert.birthday",
    hintKey: "customers.alert.birthdayHint",
    tone: "brand",
    matches: (customer) => {
      const days = daysToBirthday(customer.birthDate);
      return isActive(customer) && days !== null && days <= BIRTHDAY_WINDOW_DAYS;
    },
  },
  { id: "unreliable", icon: CalendarX, labelKey: "customers.alert.unreliable", hintKey: "customers.alert.unreliableHint", tone: "negative", matches: (customer) => isActive(customer) && customer.cancellations + customer.noShows >= UNRELIABLE_MISSES },
];

/* ------------------------------------------------------------------ pulso */

export interface CustomerPulse {
  /** De quienes ya vinieron, qué parte volvió una segunda vez. */
  returningRate: number;
  /** Lo que ha dejado, en promedio, cada cliente que ha comprado. */
  avgLtv: number;
  totalLtv: number;
  /** En riesgo o perdidos, sobre el total. */
  driftingRate: number;
  drifting: number;
  visited: number;
}

const share = (part: number, total: number) => (total === 0 ? 0 : Math.round((part / total) * 1000) / 10);

export function customerPulse(rows: readonly Customer[]): CustomerPulse {
  const visited = rows.filter((row) => row.visits > 0);
  const totalLtv = rows.reduce((sum, row) => sum + row.ltv, 0);
  const drifting = rows.filter((row) => row.segment === "atRisk" || row.segment === "lost").length;
  return {
    returningRate: share(visited.filter((row) => row.visits >= 2).length, visited.length),
    avgLtv: visited.length === 0 ? 0 : Math.round(totalLtv / visited.length),
    totalLtv,
    driftingRate: share(drifting, rows.length),
    drifting,
    visited: visited.length,
  };
}
