import { HeatmapChart, type HeatmapDatum } from "@/components/charts";
import { defineEntry, definePlayground } from "../types";
import { PRESET_HEADER_PROPS, PRESET_STATE_PROPS } from "./preset-props";
import { DIAS, EQUIPOS, PRESET_STATES, presetStateAttrs, presetStateProps } from "./_shared";
import { ThemedChart } from "./themed";

const FRANJAS = ["06–09", "09–12", "12–15", "15–18", "18–21"];
const ACTIVIDAD: readonly number[][] = [
  // Lun  Mar  Mié  Jue  Vie  Sáb  Dom   (una fila por franja)
  [18, 22, 20, 24, 15, 4, 2],
  [64, 71, 68, 75, 58, 12, 6],
  [52, 58, 55, 61, 44, 9, 5],
  [70, 77, 74, 82, 49, 8, 4],
  [31, 35, 33, 38, 22, 6, 3],
];

const COMPETENCIAS = ["Liderazgo", "Comunicación", "Datos", "Ventas", "Idiomas"];
const NIVEL: readonly number[][] = [
  // Producto Diseño Backend Datos Soporte   (una fila por competencia)
  [72, 65, 58, 61, 54],
  [80, 84, 55, 62, 88],
  [68, 45, 76, 92, 40],
  [52, 38, 30, 44, 71],
  [61, 70, 49, 57, 66],
];

/** Convierte una matriz `[fila][columna]` al formato `{ x, y, value }` del preset. */
function toHeatmap(xLabels: readonly string[], yLabels: readonly string[], matrix: readonly number[][]): HeatmapDatum[] {
  return yLabels.flatMap((y, row) => xLabels.map((x, column) => ({ x, y, value: matrix[row]?.[column] ?? 0 })));
}

const ACTIVIDAD_DATA = toHeatmap(DIAS, FRANJAS, ACTIVIDAD);
const NIVEL_DATA = toHeatmap(EQUIPOS, COMPETENCIAS, NIVEL);
const ERROR_MESSAGE = "No se pudo agregar la actividad por franja.";

const ACTIVIDAD_SNIPPET = `const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const franjas = ["06–09", "09–12", "12–15", "15–18", "18–21"];
const actividad = franjas.flatMap((franja, fila) =>
  dias.map((dia, columna) => ({ x: dia, y: franja, value: sesiones[fila][columna] }))
);`;

export const heatmapChartEntry = defineEntry({
  id: "heatmap-chart",
  name: "HeatmapChart",
  group: "charts",
  description:
    "Preset de mapa de calor sobre ChartCard para cruzar dos dimensiones: día por franja horaria, equipo por competencia. La escala de cinco niveles va de --color-positive a --color-negative y se resuelve de los tokens al construir la option, por lo que en esta docs se remonta al cambiar de tema.",
  importPath: 'import { HeatmapChart } from "@/components/charts"',
  sourcePath: "src/components/charts/HeatmapChart.tsx",
  status: "stable",
  tags: ["echarts", "visual-map"],
  playground: definePlayground({
    controls: {
      height: { type: "number", label: "height (px)", default: 320, min: 240, max: 480, step: 20 },
      fixedScale: { type: "boolean", label: "Escala fija 0–100", default: false },
      state: { type: "select", label: "Estado", options: PRESET_STATES, default: "datos" },
    },
    layout: "stretch",
    render: ({ height, fixedScale, state }) => (
      <ThemedChart>
        <HeatmapChart
          title="Actividad por día y franja horaria"
          description="Sesiones iniciadas, promedio de las últimas 4 semanas"
          xLabels={[...DIAS]}
          yLabels={FRANJAS}
          data={ACTIVIDAD_DATA}
          seriesName="Sesiones"
          height={height}
          min={fixedScale ? 0 : undefined}
          max={fixedScale ? 100 : undefined}
          {...presetStateProps(state, ERROR_MESSAGE)}
        />
      </ThemedChart>
    ),
    code: ({ height, fixedScale, state }) => `${ACTIVIDAD_SNIPPET}

<HeatmapChart
  title="Actividad por día y franja horaria"
  description="Sesiones iniciadas, promedio de las últimas 4 semanas"
  xLabels={dias}
  yLabels={franjas}
  data={actividad}
  seriesName="Sesiones"
  height={${height}}${fixedScale ? "\n  min={0}\n  max={100}" : ""}${presetStateAttrs(state, ERROR_MESSAGE)}
/>`,
  }),
  examples: [
    {
      id: "activity",
      title: "Actividad por día y franja",
      description: "Siete columnas por cinco filas. Sin `min` ni `max` la escala se ajusta al rango de los datos.",
      layout: "stretch",
      frameClassName: "min-h-[360px]",
      code: `${ACTIVIDAD_SNIPPET}

<HeatmapChart
  title="Actividad por día y franja horaria"
  description="Sesiones iniciadas, promedio de las últimas 4 semanas"
  xLabels={dias}
  yLabels={franjas}
  data={actividad}
  seriesName="Sesiones"
  height={320}
/>`,
      render: () => (
        <ThemedChart>
          <HeatmapChart
            title="Actividad por día y franja horaria"
            description="Sesiones iniciadas, promedio de las últimas 4 semanas"
            xLabels={[...DIAS]}
            yLabels={FRANJAS}
            data={ACTIVIDAD_DATA}
            seriesName="Sesiones"
            height={320}
          />
        </ThemedChart>
      ),
    },
    {
      id: "fixed-scale",
      title: "Escala fija por competencia",
      description: "Con `min={0}` y `max={100}` dos mapas de distintos periodos se comparan con la misma leyenda de color.",
      layout: "stretch",
      frameClassName: "min-h-[360px]",
      code: `const equipos = ["Producto", "Diseño", "Backend", "Datos", "Soporte"];
const competencias = ["Liderazgo", "Comunicación", "Datos", "Ventas", "Idiomas"];

<HeatmapChart
  title="Nivel promedio por competencia"
  description="Resultado de la última evaluación, escala 0–100"
  xLabels={equipos}
  yLabels={competencias}
  data={nivelPorCompetencia}
  seriesName="Nivel"
  min={0}
  max={100}
  height={320}
/>`,
      render: () => (
        <ThemedChart>
          <HeatmapChart
            title="Nivel promedio por competencia"
            description="Resultado de la última evaluación, escala 0–100"
            xLabels={[...EQUIPOS]}
            yLabels={COMPETENCIAS}
            data={NIVEL_DATA}
            seriesName="Nivel"
            min={0}
            max={100}
            height={320}
          />
        </ThemedChart>
      ),
    },
    {
      id: "with-summary",
      title: "Con resumen y footer",
      description: "Un mapa de calor es difícil de verbalizar: el summary debe nombrar los extremos, no todas las celdas.",
      layout: "stretch",
      frameClassName: "min-h-[360px]",
      code: `<HeatmapChart
  title="Actividad por día y franja horaria"
  xLabels={dias}
  yLabels={franjas}
  data={actividad}
  seriesName="Sesiones"
  height={300}
  summary="El pico es jueves de 15 a 18 con 82 sesiones; el mínimo, domingo de 06 a 09 con 2."
  footer="Verde = baja actividad, rojo = alta. Promedio de las últimas 4 semanas."
/>`,
      render: () => (
        <ThemedChart>
          <HeatmapChart
            title="Actividad por día y franja horaria"
            xLabels={[...DIAS]}
            yLabels={FRANJAS}
            data={ACTIVIDAD_DATA}
            seriesName="Sesiones"
            height={300}
            summary="El pico es jueves de 15 a 18 con 82 sesiones; el mínimo, domingo de 06 a 09 con 2."
            footer="Verde = baja actividad, rojo = alta. Promedio de las últimas 4 semanas."
          />
        </ThemedChart>
      ),
    },
  ],
  props: [
    { name: "xLabels", type: "string[]", description: "Categorías del eje X, en orden. Cada `data[].x` debe existir aquí." },
    { name: "yLabels", type: "string[]", description: "Categorías del eje Y, en orden. Cada `data[].y` debe existir aquí." },
    { name: "data", type: "HeatmapDatum[]", description: "Arreglo de `{ x, y, value }`. Las celdas sin dato quedan vacías." },
    { name: "min", type: "number", description: "Límite inferior de la escala de color. Si falta, se toma el mínimo de los datos." },
    { name: "max", type: "number", description: "Límite superior de la escala de color. Si falta, se toma el máximo de los datos." },
    ...PRESET_HEADER_PROPS,
    ...PRESET_STATE_PROPS,
  ],
  guidelines: {
    do: [
      "Fija `min` y `max` cuando el mapa se compara con otro o se actualiza en el tiempo.",
      "Dale al menos 280 px de alto: el grid reserva 100 px a cada lado para etiquetas y leyenda.",
      "Explica en el footer qué significa cada extremo del color; verde–rojo no siempre es «bueno–malo».",
    ],
    dont: [
      "No superes unas 12 × 12 celdas; por debajo de 24 px por celda las etiquetas se pisan.",
      "No lo uses con una sola dimensión: para eso está BarChart.",
    ],
  },
  related: ["bar-chart", "chart-card", "echart", "card"],
});
