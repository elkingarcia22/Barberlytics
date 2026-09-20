import { Download } from "lucide-react";
import { BarChart } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";
import { PRESET_HEADER_PROPS, PRESET_STATE_PROPS } from "./preset-props";
import { AREAS, EQUIPOS, PRESET_STATES, dataSnippet, presetStateAttrs, presetStateProps, toSeries } from "./_shared";
import { ThemedChart } from "./themed";

const HORAS_POR_AREA = toSeries(AREAS, [1240, 980, 1120, 640, 520, 710]);
const CURSOS_POR_EQUIPO = toSeries(EQUIPOS, [42, 27, 51, 33, 19]).sort((a, b) => b.value - a.value);
const ERROR_MESSAGE = "No se pudo cargar el reporte de horas.";

const HORAS_SNIPPET = dataSnippet("horasPorArea", HORAS_POR_AREA);

export const barChartEntry = defineEntry({
  id: "bar-chart",
  name: "BarChart",
  group: "charts",
  description:
    "Preset de barras sobre ChartCard para comparar magnitudes entre categorías: áreas, equipos, cursos. Acepta orientación vertical u horizontal y hereda encabezado, estados y accesibilidad de la tarjeta; en esta docs se remonta al cambiar de tema para reflejar la paleta activa.",
  importPath: 'import { BarChart } from "@/components/charts"',
  sourcePath: "src/components/charts/BarChart.tsx",
  status: "stable",
  tags: ["echarts"],
  playground: definePlayground({
    controls: {
      horizontal: { type: "boolean", default: false },
      seriesName: { type: "text", default: "Horas" },
      height: { type: "number", label: "height (px)", default: 260, min: 160, max: 420, step: 20 },
      state: { type: "select", label: "Estado", options: PRESET_STATES, default: "datos" },
    },
    layout: "stretch",
    render: ({ horizontal, seriesName, height, state }) => (
      <ThemedChart>
        <BarChart
          title="Horas de aprendizaje por área"
          description="Total acumulado en el trimestre"
          data={HORAS_POR_AREA}
          seriesName={seriesName}
          height={height}
          horizontal={horizontal}
          {...presetStateProps(state, ERROR_MESSAGE)}
        />
      </ThemedChart>
    ),
    code: ({ horizontal, seriesName, height, state }) => `${HORAS_SNIPPET}

<BarChart
  title="Horas de aprendizaje por área"
  description="Total acumulado en el trimestre"
  data={horasPorArea}
  seriesName="${seriesName}"
  height={${height}}${horizontal ? "\n  horizontal" : ""}${presetStateAttrs(state, ERROR_MESSAGE)}
/>`,
  }),
  examples: [
    {
      id: "vertical",
      title: "Barras verticales",
      description: "La orientación por defecto. Las categorías van en el eje X y el tema pinta la serie con --color-brand.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `${HORAS_SNIPPET}

<BarChart
  title="Horas de aprendizaje por área"
  description="Total acumulado en el trimestre"
  data={horasPorArea}
  seriesName="Horas"
  height={260}
/>`,
      render: () => (
        <ThemedChart>
          <BarChart title="Horas de aprendizaje por área" description="Total acumulado en el trimestre" data={HORAS_POR_AREA} seriesName="Horas" height={260} />
        </ThemedChart>
      ),
    },
    {
      id: "horizontal",
      title: "Ranking horizontal",
      description: "Con `horizontal` los ejes se intercambian. Ordena los datos antes de pasarlos: el preset no los reordena.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `${dataSnippet("cursosPorEquipo", CURSOS_POR_EQUIPO)}

<BarChart
  title="Cursos completados por equipo"
  description="Ordenado de mayor a menor"
  data={cursosPorEquipo}
  seriesName="Cursos"
  height={260}
  horizontal
/>`,
      render: () => (
        <ThemedChart>
          <BarChart title="Cursos completados por equipo" description="Ordenado de mayor a menor" data={CURSOS_POR_EQUIPO} seriesName="Cursos" height={260} horizontal />
        </ThemedChart>
      ),
    },
    {
      id: "with-actions",
      title: "Con acciones, footer y resumen",
      description: "Los slots del ChartCard viajan tal cual. El summary es sr-only y da los valores a lectores de pantalla.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `<BarChart
  title="Horas de aprendizaje por área"
  data={horasPorArea}
  seriesName="Horas"
  height={240}
  actions={<Button variant="ghost" size="icon-sm" aria-label="Descargar"><Download /></Button>}
  footer="Fuente: módulo de aprendizaje · corte al 30 de septiembre"
  summary={
    <ul>
      {horasPorArea.map((item) => (
        <li key={item.label}>{item.label}: {item.value} horas</li>
      ))}
    </ul>
  }
/>`,
      render: () => (
        <ThemedChart>
          <BarChart
            title="Horas de aprendizaje por área"
            data={HORAS_POR_AREA}
            seriesName="Horas"
            height={240}
            actions={
              <Button variant="ghost" size="icon-sm" aria-label="Descargar">
                <Download />
              </Button>
            }
            footer="Fuente: módulo de aprendizaje · corte al 30 de septiembre"
            summary={
              <ul>
                {HORAS_POR_AREA.map((item) => (
                  <li key={item.label}>
                    {item.label}: {item.value} horas
                  </li>
                ))}
              </ul>
            }
          />
        </ThemedChart>
      ),
    },
    {
      id: "states",
      title: "Cargando y vacío",
      description: "El encabezado se mantiene en ambos estados para no perder el contexto de qué se está esperando.",
      layout: "stretch",
      code: `<BarChart title="Horas por área" data={horasPorArea} height={160} loading />
<BarChart title="Horas por área" data={[]} height={160} empty />`,
      render: () => (
        <div className="grid gap-4 md:grid-cols-2">
          <BarChart title="Horas por área" data={HORAS_POR_AREA} height={160} loading />
          <BarChart title="Horas por área" data={[]} height={160} empty />
        </div>
      ),
    },
  ],
  props: [
    { name: "data", type: "BarChartData[]", description: "Arreglo de `{ label, value }`. Con un arreglo vacío el gráfico no se pinta; combínalo con `empty`." },
    { name: "horizontal", type: "boolean", default: "false", description: "Intercambia los ejes: categorías en Y y valores en X. Útil para etiquetas largas o rankings." },
    { name: "stacked", type: "boolean", default: "false", description: "Marca la serie con `stack: \"total\"`. Solo tiene efecto visible al combinar varias series vía onChartReady." },
    ...PRESET_HEADER_PROPS,
    ...PRESET_STATE_PROPS,
  ],
  guidelines: {
    do: [
      "Usa barras para comparar categorías discretas; para evolución en el tiempo prefiere LineChart.",
      "Pasa `horizontal` cuando las etiquetas superan dos palabras o hay más de seis categorías.",
      "Ordena los datos por valor cuando el objetivo es un ranking.",
    ],
    dont: [
      "No mezcles unidades distintas en una misma serie; el eje de valores es único.",
      "No dependas del color para distinguir categorías: la etiqueta del eje es el identificador.",
    ],
  },
  related: ["line-chart", "donut-chart", "chart-card", "echart", "card"],
});
