import { SparklineChart } from "@/components/charts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { defineEntry, definePlayground } from "../types";
import { EQUIPOS, dataSnippet, toSeries } from "./_shared";
import { ThemedChart } from "./themed";

const TRENDS = ["neutral", "positive", "negative"] as const;

const DIAS_30 = Array.from({ length: 30 }, (_, index) => `Día ${index + 1}`);
const SESIONES_30 = [
  62, 58, 71, 69, 75, 80, 78, 84, 90, 88, 95, 92, 99, 104, 101, 108, 112, 110, 118, 121, 119, 126, 130, 128, 135, 139, 137, 144, 148, 152,
];
const SESIONES = toSeries(DIAS_30, SESIONES_30);

const PROGRESO_EQUIPOS = [
  { equipo: EQUIPOS[0], avance: 78, trend: "positive" as const, serie: [40, 46, 52, 55, 61, 68, 72, 78] },
  { equipo: EQUIPOS[1], avance: 64, trend: "positive" as const, serie: [30, 38, 41, 47, 50, 58, 60, 64] },
  { equipo: EQUIPOS[2], avance: 41, trend: "negative" as const, serie: [58, 55, 52, 50, 47, 45, 43, 41] },
  { equipo: EQUIPOS[3], avance: 55, trend: "neutral" as const, serie: [54, 56, 53, 55, 57, 54, 56, 55] },
  { equipo: EQUIPOS[4], avance: 69, trend: "positive" as const, serie: [42, 48, 51, 57, 60, 63, 66, 69] },
];

const SEMANAS = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8"];

const SESIONES_SNIPPET = `const sesiones = ultimos30Dias.map((dia, i) => ({ label: dia, value: sesionesPorDia[i] }));`;

const TREND_CLASS: Record<(typeof TRENDS)[number], string> = {
  positive: "text-status-positive",
  negative: "text-status-negative",
  neutral: "text-muted-foreground",
};

export const sparklineChartEntry = defineEntry({
  id: "sparkline-chart",
  name: "SparklineChart",
  group: "charts",
  description:
    "Línea ultracompacta sin ejes, leyenda ni cuadrícula, pensada para acompañar un número: dentro de un KpiCard, en una celda de tabla o al lado de un texto. Nunca es la única fuente de información y, en esta docs, se remonta al cambiar de tema para tomar el color de --color-brand.",
  importPath: 'import { SparklineChart } from "@/components/charts"',
  sourcePath: "src/components/charts/SparklineChart.tsx",
  status: "stable",
  tags: ["echarts", "inline"],
  playground: definePlayground({
    controls: {
      height: { type: "number", label: "height (px)", default: 40, min: 16, max: 96, step: 4 },
      trend: { type: "select", options: TRENDS, default: "neutral" },
      showTooltip: { type: "boolean", default: false },
      loading: { type: "boolean", default: false },
    },
    layout: "stretch",
    render: ({ height, trend, showTooltip, loading }) => (
      <ThemedChart>
        <div className="mx-auto w-full max-w-sm rounded-xl border border-border/60 bg-surface p-4">
          <p className="text-xs text-muted-foreground">Sesiones · últimos 30 días</p>
          <p className="mb-2 text-2xl font-bold tabular-nums text-text-primary">152</p>
          <SparklineChart data={SESIONES} height={height} trend={trend as (typeof TRENDS)[number]} showTooltip={showTooltip} loading={loading} ariaLabel="Sesiones diarias, últimos 30 días" />
        </div>
      </ThemedChart>
    ),
    code: ({ height, trend, showTooltip, loading }) => `${SESIONES_SNIPPET}

<SparklineChart
  data={sesiones}
  height={${height}}
  trend="${trend}"${showTooltip ? "\n  showTooltip" : ""}${loading ? "\n  loading" : ""}
  ariaLabel="Sesiones diarias, últimos 30 días"
/>`,
  }),
  examples: [
    {
      id: "inline",
      title: "Junto a un valor",
      description: "El patrón base: número grande, etiqueta y la línea como contexto. El área bajo la curva sube al 15 % de opacidad cuando hay `trend`.",
      layout: "stretch",
      frameClassName: "min-h-[140px]",
      code: `<div className="flex items-center gap-6">
  <div>
    <p className="text-xs text-muted-foreground">Sesiones · últimos 30 días</p>
    <p className="text-2xl font-bold tabular-nums">152 <span className="text-sm font-medium text-status-positive">+18 %</span></p>
  </div>
  <div className="w-40">
    <SparklineChart data={sesiones} height={32} trend="positive" ariaLabel="Sesiones diarias" />
  </div>
</div>`,
      render: () => (
        <ThemedChart>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Sesiones · últimos 30 días</p>
              <p className="text-2xl font-bold tabular-nums text-text-primary">
                152 <span className="text-sm font-medium text-status-positive">+18 %</span>
              </p>
            </div>
            <div className="w-40">
              <SparklineChart data={SESIONES} height={32} trend="positive" ariaLabel="Sesiones diarias" />
            </div>
          </div>
        </ThemedChart>
      ),
    },
    {
      id: "table",
      title: "En filas de tabla",
      description: "Una columna de tendencia por equipo. Fija el ancho de la celda: el sparkline ocupa el 100 % del contenedor.",
      layout: "stretch",
      frameClassName: "min-h-[240px]",
      code: `<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Equipo</TableHead>
      <TableHead className="text-right">Avance</TableHead>
      <TableHead className="w-36">Últimas 8 semanas</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {progresoEquipos.map((row) => (
      <TableRow key={row.equipo}>
        <TableCell>{row.equipo}</TableCell>
        <TableCell className="text-right tabular-nums">{row.avance} %</TableCell>
        <TableCell>
          <SparklineChart data={row.serie} height={24} trend={row.trend} ariaLabel={\`Tendencia de \${row.equipo}\`} />
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`,
      render: () => (
        <ThemedChart>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipo</TableHead>
                <TableHead className="text-right">Avance</TableHead>
                <TableHead className="w-36">Últimas 8 semanas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PROGRESO_EQUIPOS.map((row) => (
                <TableRow key={row.equipo}>
                  <TableCell>{row.equipo}</TableCell>
                  <TableCell className={cn("text-right font-medium tabular-nums", TREND_CLASS[row.trend])}>{row.avance} %</TableCell>
                  <TableCell>
                    <SparklineChart data={toSeries(SEMANAS, row.serie)} height={24} trend={row.trend} ariaLabel={`Tendencia de ${row.equipo}`} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ThemedChart>
      ),
    },
    {
      id: "tooltip",
      title: "Con tooltip",
      description: "`showTooltip` activa el tooltip de eje: útil cuando el sparkline es más alto y hay espacio para leer valores.",
      layout: "stretch",
      frameClassName: "min-h-[140px]",
      code: `${dataSnippet("serie", toSeries(SEMANAS, PROGRESO_EQUIPOS[0].serie))}

<SparklineChart data={serie} height={64} trend="positive" showTooltip ariaLabel="Avance semanal de Producto" />`,
      render: () => (
        <ThemedChart>
          <SparklineChart data={toSeries(SEMANAS, PROGRESO_EQUIPOS[0].serie)} height={64} trend="positive" showTooltip ariaLabel="Avance semanal de Producto" />
        </ThemedChart>
      ),
    },
  ],
  props: [
    { name: "data", type: "SparklineDatum[]", description: "Arreglo de `{ label, value }`. Las etiquetas solo se ven en el tooltip." },
    { name: "height", type: "number | string", default: "32", description: "Alto del lienzo. El ancho siempre es el 100 % del contenedor." },
    { name: "trend", type: '"positive" | "negative" | "neutral"', description: "Intención semántica. Sube la opacidad del área a 0.15; el color de la línea sigue saliendo del tema." },
    { name: "showTooltip", type: "boolean", default: "false", description: "Activa el tooltip de eje al pasar el cursor." },
    { name: "loading", type: "boolean", default: "false", description: "Overlay con Skeleton." },
    { name: "empty", type: "boolean", default: "false", description: "Overlay con estado vacío. A alturas pequeñas queda recortado: prefiere ocultar el sparkline." },
    { name: "ariaLabel", type: "string", default: '"Sparkline chart"', description: "Etiqueta del region role=\"img\". Escríbela en español y con contexto." },
    { name: "summary", type: "React.ReactNode", description: "Resumen sr-only con los valores." },
    { name: "className", type: "string", description: "Clases para el contenedor flex externo." },
  ],
  guidelines: {
    do: [
      "Acompáñalo siempre de un número o etiqueta visible: la línea sola no informa.",
      "Dale un contenedor con ancho definido (una celda, un `w-40`); si no, no hay nada que medir.",
      "Usa entre 8 y 60 puntos; con menos parece un garabato y con más el detalle se pierde.",
    ],
    dont: [
      "No pongas `empty` a 24 px de alto: el EmptyState no cabe. Oculta el componente en su lugar.",
      "No lo uses como gráfico principal de una tarjeta; para eso está LineChart.",
    ],
  },
  related: ["kpi-card", "line-chart", "area-chart", "echart"],
});
