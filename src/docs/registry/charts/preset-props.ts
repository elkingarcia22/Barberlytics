import type { DocProp } from "../types";

/**
 * Props que comparten todos los presets montados sobre ChartCard
 * (BarChart, LineChart, AreaChart, DonutChart, HeatmapChart).
 * Cada entrada antepone sus props específicas y luego extiende con estas.
 */
export const PRESET_HEADER_PROPS: readonly DocProp[] = [
  { name: "title", type: "string", description: "Título de la tarjeta. Obligatorio: también es la etiqueta accesible del gráfico." },
  { name: "description", type: "string", description: "Subtítulo bajo el título." },
  { name: "seriesName", type: "string", default: '"Value"', description: "Nombre de la serie; aparece en el tooltip y la leyenda." },
  { name: "height", type: "number | string", default: "300", description: "Alto del área del gráfico en px o como valor CSS." },
];

export const PRESET_STATE_PROPS: readonly DocProp[] = [
  { name: "loading", type: "boolean", default: "false", description: "Muestra un Skeleton sobre el lienzo mientras llegan los datos." },
  { name: "empty", type: "boolean", default: "false", description: "Muestra el estado vacío en lugar del gráfico." },
  { name: "error", type: "string | null", default: "null", description: "Mensaje de error; si existe, reemplaza el gráfico por el estado de error." },
  { name: "ariaLabel", type: "string", default: "title", description: "Etiqueta del region role=\"img\". Por defecto usa el título." },
  { name: "summary", type: "React.ReactNode", description: "Resumen solo para lectores de pantalla (p. ej. una lista con los valores)." },
  { name: "actions", type: "React.ReactNode", description: "Acciones alineadas a la derecha del encabezado." },
  { name: "filters", type: "React.ReactNode", description: "Controles debajo del encabezado (selects de periodo, segmentos)." },
  { name: "footer", type: "React.ReactNode", description: "Notas al pie: fuente, aclaraciones, fecha de corte." },
  { name: "className", type: "string", description: "Clases extra para la Card." },
  { name: "onChartReady", type: "(instance: EChartsInstance) => void", description: "Recibe la instancia de ECharts una vez inicializada y con datos." },
];
