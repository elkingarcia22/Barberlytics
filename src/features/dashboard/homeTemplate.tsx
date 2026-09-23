import {
  CalendarClock,
  ChartLine,
  ClipboardList,
  Layers,
  Target,
  TrendingDown,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TemplateDefinition, TemplateGroup } from "@/components/templates";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import type { TableColumnCells, TableColumnSpec } from "@/components/data-display/table-config";
import type { AppMessageKey } from "@/app/i18n/types";

/**
 * Los datos de la plantilla del home.
 *
 * Deterministas y sin backend a propósito: esta pantalla es el molde que se
 * copia para construir un home de verdad, así que lo que se ve tiene que ser
 * lo mismo en cualquier máquina y en cualquier captura. Al conectarla, se
 * sustituye este módulo por la consulta correspondiente y nada más cambia.
 */

export type ProcessStatus = "active" | "pending" | "completed";

export interface ProcessRow {
  id: string;
  nameKey: AppMessageKey;
  nameSuffix: string;
  periodKey: AppMessageKey;
  /** Días desde hoy; se convierten a fecha al renderizar. */
  startOffset: number;
  endOffset: number;
  status: ProcessStatus;
  items: number;
  progress: number;
}

/**
 * Nombres y periodos como **claves**, no como texto. Estas filas son datos de
 * ejemplo que en producción llegarían del backend; lo que no puede quedarse
 * fijo es cómo se leen: el nombre y el periodo se traducen al pintarlos, igual
 * que el estado.
 */
const NAME_KEYS = [
  "process.quarterlyPlan",
  "process.monthlyCheckin",
  "process.halfYearReview",
  "process.annualProgram",
  "process.areaGoals",
  "process.keyIndicators",
] as const satisfies readonly AppMessageKey[];

const PERIOD_KEYS = [
  "period.quarter",
  "period.month",
  "period.semester",
  "period.year",
  "period.custom",
] as const satisfies readonly AppMessageKey[];
const STATUSES: readonly ProcessStatus[] = ["active", "active", "pending", "active", "completed"];

/** 30 filas, las mismas que la lista de la referencia. */
export const PROCESS_ROWS: readonly ProcessRow[] = Array.from({ length: 30 }, (_, index) => {
  const round = Math.floor(index / NAME_KEYS.length) + 1;
  return {
    id: `proceso-${index + 1}`,
    nameKey: NAME_KEYS[index % NAME_KEYS.length],
    /** El sufijo que distingue las repeticiones: el año no se traduce. */
    nameSuffix: round === 1 ? "2026" : `2026 (${round})`,
    periodKey: PERIOD_KEYS[(index * 3) % PERIOD_KEYS.length],
    startOffset: -((index * 11) % 90) - 5,
    endOffset: -((index * 11) % 90) - 5 + [30, 45, 92, 120, 365][(index * 3) % 5],
    status: STATUSES[(index * 7) % STATUSES.length],
    items: [3, 4, 6, 10, 12][(index * 3) % 5],
    progress: (index * 23 + 7) % 126,
  };
});

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", year: "numeric" };

export function offsetToDate(offset: number, today = new Date()): Date {
  const date = new Date(today);
  date.setDate(date.getDate() + offset);
  return date;
}

/** La fecha de una fila, con la convención del idioma que se le pase. */
export const formatRowDate = (offset: number, intlLocale: string): string =>
  new Intl.DateTimeFormat(intlLocale, DATE_OPTIONS).format(offsetToDate(offset));

export const STATUS_KEYS: Readonly<Record<ProcessStatus, AppMessageKey>> = {
  active: "status.active",
  pending: "status.pending",
  completed: "status.completed",
};

/** Traductor tipado con las claves de la aplicación. */
type Translate = (key: AppMessageKey, params?: Readonly<Record<string, string | number>>) => string;

export function processColumns(t: Translate): readonly TableColumnSpec[] {
  return [
    { id: "select", label: t("column.selection"), fixed: true },
    { id: "name", label: t("column.name") },
    { id: "period", label: t("column.period") },
    { id: "start", label: t("column.start") },
    { id: "end", label: t("column.end") },
    { id: "status", label: t("column.status") },
    { id: "items", label: t("column.items") },
    { id: "progress", label: t("column.progress") },
  ];
}

export function processCells(t: Translate, intlLocale: string, formatCount: (value: number) => string): TableColumnCells<ProcessRow> {
  return {
    name: {
      head: t("column.name"),
      cell: (row) => `${t(row.nameKey)} ${row.nameSuffix}`,
      cellClassName: "font-semibold text-text-primary",
    },
    period: { head: t("column.period"), cell: (row) => t(row.periodKey), cellClassName: "text-text-secondary" },
    start: { head: t("column.start"), cell: (row) => formatRowDate(row.startOffset, intlLocale), cellClassName: "text-text-secondary tabular-nums" },
    end: { head: t("column.end"), cell: (row) => formatRowDate(row.endOffset, intlLocale), cellClassName: "text-text-secondary tabular-nums" },
    status: { head: t("column.status"), cell: (row) => <StatusBadge status={row.status} label={t(STATUS_KEYS[row.status])} /> },
    items: { head: t("column.items"), headClassName: "text-right", cell: (row) => formatCount(row.items), cellClassName: "text-right tabular-nums" },
    progress: {
      head: t("column.progress"),
      headClassName: "text-right",
      cell: (row) => (
        <span className="flex items-center justify-end gap-inline">
          <Progress value={Math.min(100, row.progress)} className="h-1.5 w-24" />
          <span className="w-12 text-right tabular-nums">{row.progress}%</span>
        </span>
      ),
    },
  };
}

/**
 * El catálogo de plantillas del home, en el contrato del sistema
 * (`TemplateDefinition`): cada una trae sus líneas con su peso, que es lo que
 * dibuja la miniatura de la ficha.
 */
export function buildTemplates(t: Translate): readonly TemplateDefinition[] {
  const meta = (count: number, period: AppMessageKey) =>
    t("tpl.meta", { count, period: t(period) });

  return [
    {
      id: "comercial",
      label: t("tpl.commercial"),
      name: t("tpl.commercialName"),
      description: t("tpl.commercialHint"),
      meta: meta(3, "period.quarter"),
      icon: TrendingDown,
      tone: "brand",
      featured: true,
      items: [
        { label: t("tpl.commercial1"), weight: 50, hint: t("tpl.commercial1Hint") },
        { label: t("tpl.commercial2"), weight: 30 },
        { label: t("tpl.commercial3"), weight: 20 },
      ],
    },
    {
      id: "servicio",
      label: t("tpl.service"),
      name: t("tpl.serviceName"),
      description: t("tpl.serviceHint"),
      meta: meta(3, "period.quarter"),
      icon: Users,
      tone: "positive",
      items: [
        { label: t("tpl.service1"), weight: 40 },
        { label: t("tpl.service2"), weight: 35 },
        { label: t("tpl.service3"), weight: 25 },
      ],
    },
    {
      id: "operaciones",
      label: t("tpl.ops"),
      name: t("tpl.opsName"),
      description: t("tpl.opsHint"),
      meta: meta(3, "period.semester"),
      icon: Layers,
      tone: "warning",
      items: [
        { label: t("tpl.ops1"), weight: 45 },
        { label: t("tpl.ops2"), weight: 35 },
        { label: t("tpl.ops3"), weight: 20 },
      ],
    },
    {
      id: "gente",
      label: t("tpl.people"),
      name: t("tpl.peopleName"),
      description: t("tpl.peopleHint"),
      meta: meta(3, "period.year"),
      icon: Target,
      tone: "ai",
      items: [
        { label: t("tpl.people1"), weight: 40 },
        { label: t("tpl.people2"), weight: 30 },
        { label: t("tpl.people3"), weight: 30 },
      ],
    },
    {
      id: "marketing",
      label: t("tpl.marketing"),
      name: t("tpl.marketingName"),
      description: t("tpl.marketingHint"),
      meta: meta(3, "period.quarter"),
      icon: ChartLine,
      tone: "brand",
      items: [
        { label: t("tpl.marketing1"), weight: 45 },
        { label: t("tpl.marketing2"), weight: 35 },
        { label: t("tpl.marketing3"), weight: 20 },
      ],
    },
    {
      id: "finanzas",
      label: t("tpl.finance"),
      name: t("tpl.financeName"),
      description: t("tpl.financeHint"),
      meta: meta(4, "period.quarter"),
      icon: ClipboardList,
      tone: "neutral",
      items: [
        { label: t("tpl.finance1"), weight: 35 },
        { label: t("tpl.finance2"), weight: 30 },
        { label: t("tpl.finance3"), weight: 20 },
        { label: t("tpl.finance4"), weight: 15 },
      ],
    },
  ];
}

/** El catálogo por estantes, para el panel de «ver más plantillas». */
export function buildTemplateGroups(t: Translate): readonly TemplateGroup[] {
  const templates = buildTemplates(t);
  return [
    {
      id: "negocio",
      label: t("tplGroup.business"),
      description: t("tplGroup.businessHint"),
      templates: templates.filter((template) => ["comercial", "marketing", "finanzas"].includes(template.id)),
    },
    {
      id: "operacion",
      label: t("tplGroup.operation"),
      description: t("tplGroup.operationHint"),
      templates: templates.filter((template) => ["operaciones", "servicio", "gente"].includes(template.id)),
    },
  ];
}

/** Las tres métricas de cabecera, con su serie para el gráfico. */
export interface PulseMetric {
  id: string;
  labelKey: AppMessageKey;
  hintKey: AppMessageKey;
  value: number;
  previous: number;
  series: readonly { label: string; value: number }[];
}

const series = (values: readonly number[]) => values.map((value, index) => ({ label: `S${index + 1}`, value }));

export const PULSE_METRICS: readonly PulseMetric[] = [
  {
    id: "avance",
    labelKey: "metric.progress",
    hintKey: "metric.progressHint",
    value: 39.5,
    previous: 56,

    series: series([52, 48, 46, 44, 41, 40, 39.5]),
  },
  {
    id: "cumplimiento",
    labelKey: "metric.completion",
    hintKey: "metric.completionHint",
    value: 19.4,
    previous: 29.7,

    series: series([28, 27, 25, 24, 22, 20, 19.4]),
  },
  {
    id: "participacion",
    labelKey: "metric.participation",
    hintKey: "metric.participationHint",
    value: 96.7,
    previous: 98,

    series: series([98, 97.8, 97.5, 97.2, 97, 96.8, 96.7]),
  },
];

/**
 * Las alertas son atajos a los filtros de la tabla, así que su número y las
 * filas que revela su clic salen del mismo predicado. Si divergen, la alerta
 * miente.
 */
export type AlertId = "closing" | "low";

export interface AlertPreset {
  id: AlertId;
  labelKey: AppMessageKey;
  hintKey: AppMessageKey;
  icon: LucideIcon;
  tone: "warning" | "negative";
  matches: (row: ProcessRow) => boolean;
}

export const CLOSING_SOON_DAYS = 7;

export const ALERT_PRESETS: readonly AlertPreset[] = [
  {
    id: "closing",
    labelKey: "alert.closing",
    hintKey: "alert.closingHint",
    icon: CalendarClock,
    tone: "warning",
    matches: (row) => row.status === "active" && row.endOffset >= 0 && row.endOffset <= CLOSING_SOON_DAYS,
  },
  {
    id: "low",
    labelKey: "alert.low",
    hintKey: "alert.lowHint",
    icon: TrendingDown,
    tone: "negative",
    matches: (row) => row.status === "active" && row.progress < 50,
  },
];
