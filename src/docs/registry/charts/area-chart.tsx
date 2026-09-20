import { AreaChart, LineChart } from "@/components/charts";
import { defineEntry, definePlayground } from "../types";
import { PRESET_HEADER_PROPS, PRESET_STATE_PROPS } from "./preset-props";
import { MESES, PRESET_STATES, dataSnippet, presetStateAttrs, presetStateProps, toSeries } from "./_shared";
import { ThemedChart } from "./themed";

const COMPLETADOS_ACUMULADOS = toSeries(MESES, [180, 390, 650, 900, 1200, 1540, 1870, 2250, 2670, 3120, 3600, 4120]);
const MINUTOS_SEMANA = toSeries(["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"], [38, 44, 41, 52, 36, 12, 8]);
const ERROR_MESSAGE = "No hay conexión con el almacén de datos.";

const COMPLETADOS_SNIPPET = dataSnippet("completadosAcumulados", COMPLETADOS_ACUMULADOS);

export const areaChartEntry = defineEntry({
  id: "area-chart",
  name: "AreaChart",
  group: "charts",
  description:
    "Preset de área sobre ChartCard para tendencias donde importa el volumen acumulado: cursos completados en el año, minutos de aprendizaje por semana. Es un LineChart con relleno al 15 % de opacidad, sin degradados; se remonta al cambiar de tema en esta docs.",
  importPath: 'import { AreaChart } from "@/components/charts"',
  sourcePath: "src/components/charts/AreaChart.tsx",
  status: "stable",
  tags: ["echarts"],
  playground: definePlayground({
    controls: {
      smooth: { type: "boolean", default: true },
      seriesName: { type: "text", default: "Completados" },
      height: { type: "number", label: "height (px)", default: 260, min: 160, max: 420, step: 20 },
      state: { type: "select", label: "Estado", options: PRESET_STATES, default: "datos" },
    },
    layout: "stretch",
    render: ({ smooth, seriesName, height, state }) => (
      <ThemedChart>
        <AreaChart
          title="Cursos completados acumulados"
          description="Suma progresiva a lo largo del año"
          data={COMPLETADOS_ACUMULADOS}
          seriesName={seriesName}
          height={height}
          smooth={smooth}
          {...presetStateProps(state, ERROR_MESSAGE)}
        />
      </ThemedChart>
    ),
    code: ({ smooth, seriesName, height, state }) => `${COMPLETADOS_SNIPPET}

<AreaChart
  title="Cursos completados acumulados"
  description="Suma progresiva a lo largo del año"
  data={completadosAcumulados}
  seriesName="${seriesName}"
  height={${height}}${smooth ? "" : "\n  smooth={false}"}${presetStateAttrs(state, ERROR_MESSAGE)}
/>`,
  }),
  examples: [
    {
      id: "cumulative",
      title: "Acumulado anual",
      description: "El caso típico: una serie que solo crece. El área refuerza la idea de volumen alcanzado.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `${COMPLETADOS_SNIPPET}

<AreaChart
  title="Cursos completados acumulados"
  description="Suma progresiva a lo largo del año"
  data={completadosAcumulados}
  seriesName="Completados"
  height={260}
/>`,
      render: () => (
        <ThemedChart>
          <AreaChart title="Cursos completados acumulados" description="Suma progresiva a lo largo del año" data={COMPLETADOS_ACUMULADOS} seriesName="Completados" height={260} />
        </ThemedChart>
      ),
    },
    {
      id: "weekly",
      title: "Volumen semanal sin suavizar",
      description: "Siete mediciones discretas con `smooth={false}`: el área sigue mostrando el volumen, pero los picos quedan donde ocurrieron.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `${dataSnippet("minutosSemana", MINUTOS_SEMANA)}

<AreaChart
  title="Minutos de aprendizaje por día"
  description="Promedio por colaborador, última semana"
  data={minutosSemana}
  seriesName="Minutos"
  height={240}
  smooth={false}
/>`,
      render: () => (
        <ThemedChart>
          <AreaChart title="Minutos de aprendizaje por día" description="Promedio por colaborador, última semana" data={MINUTOS_SEMANA} seriesName="Minutos" height={240} smooth={false} />
        </ThemedChart>
      ),
    },
    {
      id: "vs-line",
      title: "Área frente a línea",
      description: "Mismos datos en ambos presets. Elige área cuando quieras subrayar cuánto se acumuló; línea cuando importa la forma del cambio.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `<div className="grid gap-4 md:grid-cols-2">
  <AreaChart title="Como área" data={completadosAcumulados} seriesName="Completados" height={200} />
  <LineChart title="Como línea" data={completadosAcumulados} seriesName="Completados" height={200} />
</div>`,
      render: () => (
        <ThemedChart>
          <div className="grid gap-4 md:grid-cols-2">
            <AreaChart title="Como área" data={COMPLETADOS_ACUMULADOS} seriesName="Completados" height={200} />
            <LineChart title="Como línea" data={COMPLETADOS_ACUMULADOS} seriesName="Completados" height={200} />
          </div>
        </ThemedChart>
      ),
    },
  ],
  props: [
    { name: "data", type: "AreaChartData[]", description: "Arreglo de `{ label, value }` en orden cronológico." },
    { name: "smooth", type: "boolean", default: "true", description: "Suaviza la curva. El relleno bajo la línea se mantiene en ambos casos." },
    ...PRESET_HEADER_PROPS,
    ...PRESET_STATE_PROPS,
  ],
  guidelines: {
    do: [
      "Úsalo para series acumulativas o de volumen (totales, minutos, ingresos).",
      "Empieza el eje de valores en cero: el área pierde sentido si se recorta.",
      "Mantén una sola serie; con varias, las áreas se tapan entre sí.",
    ],
    dont: [
      "No lo uses para porcentajes o tasas que no se acumulan; ahí una línea es más honesta.",
      "No cambies la opacidad del relleno por option: el 15 % es el estándar del sistema.",
    ],
  },
  related: ["line-chart", "sparkline-chart", "chart-card", "card"],
});
