import type { DocEntry } from "../types";
import { echartEntry } from "./echart";
import { chartShellEntry } from "./chart-shell";
import { chartCardEntry } from "./chart-card";
import { barChartEntry } from "./bar-chart";
import { lineChartEntry } from "./line-chart";
import { areaChartEntry } from "./area-chart";
import { donutChartEntry } from "./donut-chart";
import { sparklineChartEntry } from "./sparkline-chart";
import { kpiCardEntry } from "./kpi-card";
import { metricCardEntry } from "./metric-card";
import { heatmapChartEntry } from "./heatmap-chart";
import { heatmapMatrixEntry } from "./heatmap-matrix";

/** Entradas del grupo "charts". Cada componente vive en su propio archivo de esta carpeta. */
export const chartsEntries: readonly DocEntry[] = [
  echartEntry,
  chartShellEntry,
  chartCardEntry,
  barChartEntry,
  lineChartEntry,
  areaChartEntry,
  donutChartEntry,
  sparklineChartEntry,
  kpiCardEntry,
  metricCardEntry,
  heatmapChartEntry,
  heatmapMatrixEntry,
];
