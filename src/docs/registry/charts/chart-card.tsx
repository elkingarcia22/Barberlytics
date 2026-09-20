import { Download, MoreHorizontal } from "lucide-react";
import { ChartCard, type EChartsOption } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defineEntry, definePlayground } from "../types";
import { ThemedChart } from "./themed";

const AREAS = ["Tecnología", "Ventas", "Operaciones", "Talento", "Finanzas", "Marketing"];
const ACTIVOS = [312, 248, 401, 96, 74, 133];

const activosOption: EChartsOption = {
  tooltip: { trigger: "axis" },
  xAxis: { type: "category", data: AREAS },
  yAxis: { type: "value" },
  series: [{ name: "Colaboradores activos", type: "bar", data: ACTIVOS, barMaxWidth: 40 }],
};

const STATES = ["datos", "cargando", "vacío", "error"] as const;
const ERROR_MESSAGE = "El reporte tardó demasiado en responder.";

function PeriodSelect() {
  return (
    <Select defaultValue="q3">
      <SelectTrigger size="sm" className="w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="q2">Q2 2026</SelectItem>
        <SelectItem value="q3">Q3 2026</SelectItem>
        <SelectItem value="ytd">Año en curso</SelectItem>
      </SelectContent>
    </Select>
  );
}

const PERIOD_SELECT_CODE = `<Select defaultValue="q3">
      <SelectTrigger size="sm" className="w-[160px]"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="q2">Q2 2026</SelectItem>
        <SelectItem value="q3">Q3 2026</SelectItem>
        <SelectItem value="ytd">Año en curso</SelectItem>
      </SelectContent>
    </Select>`;

const DOWNLOAD_ACTION_CODE = `<Button variant="ghost" size="icon-sm" aria-label="Descargar"><Download /></Button>`;

function stateAttrs(state: string): string {
  if (state === "cargando") return "\n  loading";
  if (state === "vacío") return "\n  empty";
  if (state === "error") return `\n  error="${ERROR_MESSAGE}"`;
  return "";
}

export const chartCardEntry = defineEntry({
  id: "chart-card",
  name: "ChartCard",
  group: "charts",
  description:
    "La Card pensada para alojar un gráfico: encabezado con eyebrow, título, descripción, acciones y un slot de filtros, y debajo un ChartShell que hereda todos los estados. Es la base de los presets BarChart, LineChart, AreaChart, DonutChart y HeatmapChart; los ejemplos se remontan al cambiar de tema en esta docs.",
  importPath: 'import { ChartCard } from "@/components/charts"',
  sourcePath: "src/components/charts/ChartCard.tsx",
  status: "stable",
  tags: ["echarts", "card"],
  playground: definePlayground({
    controls: {
      title: { type: "text", default: "Colaboradores activos por área" },
      description: { type: "text", default: "Usuarios con al menos una sesión en el periodo" },
      meta: { type: "text", label: "meta (eyebrow)", default: "Adopción" },
      withActions: { type: "boolean", label: "Con acciones", default: true },
      withFilters: { type: "boolean", label: "Con filtros", default: false },
      state: { type: "select", label: "Estado", options: STATES, default: "datos" },
    },
    layout: "stretch",
    render: ({ title, description, meta, withActions, withFilters, state }) => (
      <ThemedChart>
        <ChartCard
          title={title}
          description={description || undefined}
          meta={meta || undefined}
          option={activosOption}
          height={240}
          loading={state === "cargando"}
          empty={state === "vacío"}
          error={state === "error" ? ERROR_MESSAGE : null}
          actions={
            withActions ? (
              <Button variant="ghost" size="icon-sm" aria-label="Descargar">
                <Download />
              </Button>
            ) : undefined
          }
          filters={withFilters ? <PeriodSelect /> : undefined}
        />
      </ThemedChart>
    ),
    code: ({ title, description, meta, withActions, withFilters, state }) => `<ChartCard
  title="${title}"${description ? `\n  description="${description}"` : ""}${meta ? `\n  meta="${meta}"` : ""}
  option={option}
  height={240}${stateAttrs(state)}${withActions ? `\n  actions={${DOWNLOAD_ACTION_CODE}}` : ""}${withFilters ? `\n  filters={\n    ${PERIOD_SELECT_CODE}\n  }` : ""}
/>`,
  }),
  examples: [
    {
      id: "full-header",
      title: "Encabezado completo",
      description: "Eyebrow, título, descripción, acciones, filtros y footer. El title también es el ariaLabel del gráfico.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `<ChartCard
  meta="Adopción"
  title="Colaboradores activos por área"
  description="Usuarios con al menos una sesión en el periodo"
  option={option}
  height={240}
  actions={
    <>
      <Button variant="ghost" size="icon-sm" aria-label="Descargar"><Download /></Button>
      <Button variant="ghost" size="icon-sm" aria-label="Más opciones"><MoreHorizontal /></Button>
    </>
  }
  filters={
    ${PERIOD_SELECT_CODE}
  }
  footer="Fuente: analítica de plataforma · actualizado hace 2 horas"
/>`,
      render: () => (
        <ThemedChart>
          <ChartCard
            meta="Adopción"
            title="Colaboradores activos por área"
            description="Usuarios con al menos una sesión en el periodo"
            option={activosOption}
            height={240}
            actions={
              <>
                <Button variant="ghost" size="icon-sm" aria-label="Descargar">
                  <Download />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Más opciones">
                  <MoreHorizontal />
                </Button>
              </>
            }
            filters={<PeriodSelect />}
            footer="Fuente: analítica de plataforma · actualizado hace 2 horas"
          />
        </ThemedChart>
      ),
    },
    {
      id: "states",
      title: "Estados",
      description: "Cargando, vacío y error se delegan a ChartShell; el encabezado se mantiene para no perder contexto.",
      layout: "stretch",
      code: `<ChartCard title="Cargando" option={option} height={160} loading />
<ChartCard title="Sin datos" option={option} height={160} empty />
<ChartCard title="Con error" option={option} height={160} error="El reporte tardó demasiado en responder." />`,
      render: () => (
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Cargando" option={activosOption} height={160} loading />
          <ChartCard title="Sin datos" option={activosOption} height={160} empty />
          <ChartCard title="Con error" option={activosOption} height={160} error={ERROR_MESSAGE} />
        </div>
      ),
    },
    {
      id: "custom-children",
      title: "Contenido propio",
      description: "Los hijos reemplazan al EChart, así puedes reutilizar el encabezado para una tabla o una lista de ranking.",
      layout: "stretch",
      code: `<ChartCard title="Ranking por área" description="Colaboradores activos" height="auto">
  <ol className="flex flex-col gap-2 text-sm">
    {ranking.map((item, i) => (
      <li key={item.area} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
        <span><span className="mr-2 text-muted-foreground">{i + 1}.</span>{item.area}</span>
        <span className="font-medium tabular-nums">{item.activos}</span>
      </li>
    ))}
  </ol>
</ChartCard>`,
      render: () => {
        const ranking = AREAS.map((area, index) => ({ area, activos: ACTIVOS[index] })).sort((a, b) => b.activos - a.activos);
        return (
          <ChartCard title="Ranking por área" description="Colaboradores activos" height="auto">
            <ol className="flex flex-col gap-2 text-sm">
              {ranking.map((item, index) => (
                <li key={item.area} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span>
                    <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                    {item.area}
                  </span>
                  <span className="font-medium tabular-nums">{item.activos}</span>
                </li>
              ))}
            </ol>
          </ChartCard>
        );
      },
    },
  ],
  props: [
    { name: "title", type: "string", description: "Título visible de la tarjeta. Obligatorio; por defecto es también el ariaLabel." },
    { name: "description", type: "string", description: "Subtítulo bajo el título." },
    { name: "meta", type: "string", description: "Eyebrow en mayúsculas sobre el título (sección, rango de fechas)." },
    { name: "actions", type: "React.ReactNode", description: "Acciones alineadas a la derecha del título." },
    { name: "filters", type: "React.ReactNode", description: "Slot bajo el encabezado para selects o segmentos." },
    { name: "footer", type: "React.ReactNode", description: "Notas al pie del gráfico." },
    { name: "summary", type: "React.ReactNode", description: "Resumen sr-only delegado a ChartShell." },
    { name: "option", type: "EChartsOption", description: "Option del gráfico. Se ignora si hay hijos." },
    { name: "height", type: "number | string", default: "300", description: "Alto del área del gráfico." },
    { name: "loading", type: "boolean", default: "false", description: "Estado de carga." },
    { name: "empty", type: "boolean", default: "false", description: "Estado vacío." },
    { name: "error", type: "string | null", default: "null", description: "Mensaje de error." },
    { name: "ariaLabel", type: "string", default: "title", description: "Etiqueta accesible del region del gráfico." },
    { name: "children", type: "React.ReactNode", description: "Sustituye al EChart por contenido propio." },
    { name: "className", type: "string", description: "Clases para la Card." },
    { name: "onChartReady", type: "(instance: EChartsInstance) => void", description: "Se reenvía hasta el EChart." },
  ],
  guidelines: {
    do: [
      "Escribe títulos que digan qué se mide y en qué unidad: «Horas de aprendizaje por área».",
      "Reserva actions para exportar o abrir el detalle; los filtros van en el slot filters.",
      "Mantén el mismo height entre tarjetas de una misma fila del dashboard.",
    ],
    dont: [
      "No pongas otra Card dentro como hijo: los bordes se duplican.",
      "No uses meta para texto largo; es un eyebrow de una o dos palabras.",
    ],
  },
  related: ["chart-shell", "bar-chart", "line-chart", "donut-chart", "card"],
});
