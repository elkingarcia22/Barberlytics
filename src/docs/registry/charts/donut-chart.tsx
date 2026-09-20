import { Download } from "lucide-react";
import { DonutChart } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";
import { PRESET_HEADER_PROPS, PRESET_STATE_PROPS } from "./preset-props";
import { PRESET_STATES, dataSnippet, presetStateAttrs, presetStateProps, toSeries } from "./_shared";
import { ThemedChart } from "./themed";

const VARIANTS = ["donut", "pie"] as const;

const ESTADO_OBJETIVOS = toSeries(["Cumplidos", "En progreso", "En riesgo", "Sin iniciar"], [46, 31, 12, 11]);
const MODALIDAD = toSeries(["Virtual", "Presencial", "Híbrido"], [58, 24, 18]);
const ERROR_MESSAGE = "No se pudo calcular la distribución.";

const OBJETIVOS_SNIPPET = dataSnippet("estadoObjetivos", ESTADO_OBJETIVOS);

export const donutChartEntry = defineEntry({
  id: "donut-chart",
  name: "DonutChart",
  group: "charts",
  description:
    "Preset de dona o pastel sobre ChartCard para composiciones parte-todo: estado de los objetivos, modalidad de los cursos, distribución por sede. Funciona mejor con dos a ocho categorías y usa la paleta semántica del tema; se remonta al cambiar de tema en esta docs.",
  importPath: 'import { DonutChart } from "@/components/charts"',
  sourcePath: "src/components/charts/DonutChart.tsx",
  status: "stable",
  tags: ["echarts"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", options: VARIANTS, default: "donut" },
      seriesName: { type: "text", default: "Objetivos" },
      height: { type: "number", label: "height (px)", default: 280, min: 200, max: 420, step: 20 },
      state: { type: "select", label: "Estado", options: PRESET_STATES, default: "datos" },
    },
    layout: "stretch",
    render: ({ variant, seriesName, height, state }) => (
      <ThemedChart>
        <DonutChart
          title="Estado de los objetivos"
          description="Ciclo de desempeño Q3 2026"
          data={ESTADO_OBJETIVOS}
          seriesName={seriesName}
          height={height}
          variant={variant as (typeof VARIANTS)[number]}
          {...presetStateProps(state, ERROR_MESSAGE)}
        />
      </ThemedChart>
    ),
    code: ({ variant, seriesName, height, state }) => `${OBJETIVOS_SNIPPET}

<DonutChart
  title="Estado de los objetivos"
  description="Ciclo de desempeño Q3 2026"
  data={estadoObjetivos}
  seriesName="${seriesName}"
  height={${height}}${variant !== "donut" ? `\n  variant="${variant}"` : ""}${presetStateAttrs(state, ERROR_MESSAGE)}
/>`,
  }),
  examples: [
    {
      id: "donut",
      title: "Dona",
      description: "La variante por defecto. Cuatro categorías toman los cuatro primeros colores del tema: brand, positive, warning y negative.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `${OBJETIVOS_SNIPPET}

<DonutChart
  title="Estado de los objetivos"
  description="Ciclo de desempeño Q3 2026"
  data={estadoObjetivos}
  seriesName="Objetivos"
  height={280}
/>`,
      render: () => (
        <ThemedChart>
          <DonutChart title="Estado de los objetivos" description="Ciclo de desempeño Q3 2026" data={ESTADO_OBJETIVOS} seriesName="Objetivos" height={280} />
        </ThemedChart>
      ),
    },
    {
      id: "pie",
      title: "Pastel",
      description: "Con `variant=\"pie\"` el radio interior es cero. Reserva esta forma para muy pocas categorías.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `${dataSnippet("modalidad", MODALIDAD)}

<DonutChart
  title="Cursos por modalidad"
  data={modalidad}
  seriesName="Cursos"
  height={260}
  variant="pie"
/>`,
      render: () => (
        <ThemedChart>
          <DonutChart title="Cursos por modalidad" data={MODALIDAD} seriesName="Cursos" height={260} variant="pie" />
        </ThemedChart>
      ),
    },
    {
      id: "with-actions",
      title: "Con acciones y resumen",
      description: "El summary enumera los porcentajes para que la composición sea legible sin ver el lienzo.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `<DonutChart
  title="Estado de los objetivos"
  data={estadoObjetivos}
  seriesName="Objetivos"
  height={260}
  actions={<Button variant="ghost" size="icon-sm" aria-label="Descargar"><Download /></Button>}
  summary="Cumplidos 46 %, en progreso 31 %, en riesgo 12 %, sin iniciar 11 %."
  footer="Porcentaje sobre 214 objetivos activos"
/>`,
      render: () => (
        <ThemedChart>
          <DonutChart
            title="Estado de los objetivos"
            data={ESTADO_OBJETIVOS}
            seriesName="Objetivos"
            height={260}
            actions={
              <Button variant="ghost" size="icon-sm" aria-label="Descargar">
                <Download />
              </Button>
            }
            summary="Cumplidos 46 %, en progreso 31 %, en riesgo 12 %, sin iniciar 11 %."
            footer="Porcentaje sobre 214 objetivos activos"
          />
        </ThemedChart>
      ),
    },
  ],
  props: [
    { name: "data", type: "DonutChartData[]", description: "Arreglo de `{ label, value }`. Cada entrada es un sector; ECharts calcula el porcentaje." },
    { name: "variant", type: '"donut" | "pie"', default: '"donut"', description: "Dona con radio 40–70 % o pastel completo." },
    ...PRESET_HEADER_PROPS,
    ...PRESET_STATE_PROPS,
  ],
  guidelines: {
    do: [
      "Limita la composición a ocho categorías; agrupa el resto en «Otros».",
      "Ordena los sectores de mayor a menor para que la lectura sea inmediata.",
      "Incluye los porcentajes en el summary o el footer: la dona no los muestra por defecto.",
    ],
    dont: [
      "No compares dos donas entre sí para ver cambios en el tiempo; usa barras o líneas.",
      "No lo uses cuando los valores son muy parecidos: los sectores se vuelven indistinguibles.",
    ],
  },
  related: ["bar-chart", "chart-card", "echart", "card"],
});
