import { LineChart } from "@/components/charts";
import { defineEntry, definePlayground } from "../types";
import { PRESET_HEADER_PROPS, PRESET_STATE_PROPS } from "./preset-props";
import { MESES, PRESET_STATES, dataSnippet, presetStateAttrs, presetStateProps, toSeries } from "./_shared";
import { ThemedChart } from "./themed";

const USUARIOS_ACTIVOS = toSeries(MESES, [1180, 1240, 1310, 1290, 1420, 1510, 1470, 1590, 1680, 1740, 1810, 1920]);
const NPS_SEMANAL = toSeries(
  ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8"],
  [42, 45, 41, 48, 52, 50, 55, 58]
);
const ERROR_MESSAGE = "El servicio de analítica no respondió a tiempo.";

const USUARIOS_SNIPPET = dataSnippet("usuariosActivos", USUARIOS_ACTIVOS);

export const lineChartEntry = defineEntry({
  id: "line-chart",
  name: "LineChart",
  group: "charts",
  description:
    "Preset de línea sobre ChartCard para series temporales y tendencias: usuarios activos por mes, NPS por semana, avance de un indicador. Suaviza la curva por defecto y marca cada punto con un círculo pequeño; los ejemplos se remontan al cambiar de tema en esta docs.",
  importPath: 'import { LineChart } from "@/components/charts"',
  sourcePath: "src/components/charts/LineChart.tsx",
  status: "stable",
  tags: ["echarts"],
  playground: definePlayground({
    controls: {
      smooth: { type: "boolean", default: true },
      seriesName: { type: "text", default: "Usuarios activos" },
      height: { type: "number", label: "height (px)", default: 260, min: 160, max: 420, step: 20 },
      state: { type: "select", label: "Estado", options: PRESET_STATES, default: "datos" },
    },
    layout: "stretch",
    render: ({ smooth, seriesName, height, state }) => (
      <ThemedChart>
        <LineChart
          title="Usuarios activos mensuales"
          description="Colaboradores con al menos una sesión en el mes"
          data={USUARIOS_ACTIVOS}
          seriesName={seriesName}
          height={height}
          smooth={smooth}
          {...presetStateProps(state, ERROR_MESSAGE)}
        />
      </ThemedChart>
    ),
    code: ({ smooth, seriesName, height, state }) => `${USUARIOS_SNIPPET}

<LineChart
  title="Usuarios activos mensuales"
  description="Colaboradores con al menos una sesión en el mes"
  data={usuariosActivos}
  seriesName="${seriesName}"
  height={${height}}${smooth ? "" : "\n  smooth={false}"}${presetStateAttrs(state, ERROR_MESSAGE)}
/>`,
  }),
  examples: [
    {
      id: "trend",
      title: "Tendencia mensual",
      description: "Doce puntos, curva suavizada. El tooltip y los ejes salen del tema sin configuración.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `${USUARIOS_SNIPPET}

<LineChart
  title="Usuarios activos mensuales"
  description="Colaboradores con al menos una sesión en el mes"
  data={usuariosActivos}
  seriesName="Usuarios activos"
  height={260}
/>`,
      render: () => (
        <ThemedChart>
          <LineChart
            title="Usuarios activos mensuales"
            description="Colaboradores con al menos una sesión en el mes"
            data={USUARIOS_ACTIVOS}
            seriesName="Usuarios activos"
            height={260}
          />
        </ThemedChart>
      ),
    },
    {
      id: "straight",
      title: "Sin suavizado",
      description: "Con `smooth={false}` los segmentos son rectos: mejor cuando cada punto es una medición discreta y no una curva continua.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `${dataSnippet("npsSemanal", NPS_SEMANAL)}

<LineChart
  title="NPS semanal"
  description="Encuesta de satisfacción al cierre de cada semana"
  data={npsSemanal}
  seriesName="NPS"
  height={240}
  smooth={false}
/>`,
      render: () => (
        <ThemedChart>
          <LineChart title="NPS semanal" description="Encuesta de satisfacción al cierre de cada semana" data={NPS_SEMANAL} seriesName="NPS" height={240} smooth={false} />
        </ThemedChart>
      ),
    },
    {
      id: "with-summary",
      title: "Con resumen accesible y footer",
      description: "El summary describe la tendencia en una frase; el footer indica la fuente y la fecha de corte.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `<LineChart
  title="Usuarios activos mensuales"
  data={usuariosActivos}
  seriesName="Usuarios activos"
  height={240}
  summary="Los usuarios activos crecieron de 1.180 en enero a 1.920 en diciembre, un 63 % más."
  footer="Fuente: analítica de plataforma · actualizado cada 24 horas"
/>`,
      render: () => (
        <ThemedChart>
          <LineChart
            title="Usuarios activos mensuales"
            data={USUARIOS_ACTIVOS}
            seriesName="Usuarios activos"
            height={240}
            summary="Los usuarios activos crecieron de 1.180 en enero a 1.920 en diciembre, un 63 % más."
            footer="Fuente: analítica de plataforma · actualizado cada 24 horas"
          />
        </ThemedChart>
      ),
    },
    {
      id: "error",
      title: "Estado de error",
      description: "Si `error` tiene valor gana sobre `loading` y `empty`.",
      layout: "stretch",
      code: `<LineChart
  title="Usuarios activos mensuales"
  data={usuariosActivos}
  height={180}
  error="El servicio de analítica no respondió a tiempo."
/>`,
      render: () => <LineChart title="Usuarios activos mensuales" data={USUARIOS_ACTIVOS} height={180} error={ERROR_MESSAGE} />,
    },
  ],
  props: [
    { name: "data", type: "LineChartData[]", description: "Arreglo de `{ label, value }`, normalmente con etiquetas temporales ordenadas." },
    { name: "smooth", type: "boolean", default: "true", description: "Suaviza la curva entre puntos. Desactívalo para mediciones discretas." },
    ...PRESET_HEADER_PROPS,
    ...PRESET_STATE_PROPS,
  ],
  guidelines: {
    do: [
      "Usa líneas para mostrar cómo cambia un valor a lo largo del tiempo.",
      "Mantén las etiquetas del eje X en orden cronológico y con un formato corto (Ene, Sem 1).",
      "Describe la tendencia en el summary: es lo que un lector de pantalla necesita saber.",
    ],
    dont: [
      "No uses una línea para categorías sin orden natural; ahí va BarChart.",
      "No suavices datos de conteo exacto si la curva puede sugerir valores intermedios que no existen.",
    ],
  },
  related: ["area-chart", "bar-chart", "sparkline-chart", "chart-card", "card"],
});
