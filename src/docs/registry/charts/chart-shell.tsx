import { ChartShell, type EChartsOption } from "@/components/charts";
import { Progress } from "@/components/ui/progress";
import { defineEntry, definePlayground } from "../types";
import { ThemedChart } from "./themed";

const EQUIPOS = ["Producto", "Diseño", "Backend", "Datos", "Soporte"];
const CUMPLIDOS = [18, 14, 22, 11, 16];
const TOTALES = [24, 20, 26, 18, 20];

const shellOption: EChartsOption = {
  tooltip: { trigger: "axis" },
  xAxis: { type: "category", data: EQUIPOS },
  yAxis: { type: "value" },
  series: [{ name: "Objetivos cumplidos", type: "bar", data: CUMPLIDOS, barMaxWidth: 40 }],
};

const STATES = ["datos", "cargando", "vacío", "error"] as const;
const ERROR_MESSAGE = "No se pudo conectar con el servicio de reportes.";

function stateAttrs(state: string): string {
  if (state === "cargando") return " loading";
  if (state === "vacío") return " empty";
  if (state === "error") return `\n  error="${ERROR_MESSAGE}"`;
  return "";
}

export const chartShellEntry = defineEntry({
  id: "chart-shell",
  name: "ChartShell",
  group: "charts",
  description:
    "El contenedor estructural de todo gráfico: gestiona los cuatro estados (datos, cargando, vacío y error), anuncia el lienzo como region role=\"img\" y expone un resumen solo para lectores de pantalla. Renderiza EChart por defecto o cualquier contenido que pases como hijos, y en esta docs se remonta al cambiar de tema.",
  importPath: 'import { ChartShell } from "@/components/charts"',
  sourcePath: "src/components/charts/ChartShell.tsx",
  status: "stable",
  tags: ["echarts", "a11y"],
  playground: definePlayground({
    controls: {
      state: { type: "select", label: "Estado", options: STATES, default: "datos" },
      height: { type: "number", label: "height (px)", default: 260, min: 160, max: 420, step: 20 },
      withFooter: { type: "boolean", label: "Con footer", default: true },
    },
    layout: "stretch",
    render: ({ state, height, withFooter }) => (
      <ThemedChart>
        <ChartShell
          option={shellOption}
          height={height}
          loading={state === "cargando"}
          empty={state === "vacío"}
          error={state === "error" ? ERROR_MESSAGE : null}
          ariaLabel="Objetivos cumplidos por equipo"
          footer={withFooter ? "Fuente: módulo de desempeño · corte al 30 de septiembre" : undefined}
        />
      </ThemedChart>
    ),
    code: ({ state, height, withFooter }) => `<ChartShell
  option={option}
  height={${height}}${stateAttrs(state)}
  ariaLabel="Objetivos cumplidos por equipo"${withFooter ? '\n  footer="Fuente: módulo de desempeño · corte al 30 de septiembre"' : ""}
/>`,
  }),
  examples: [
    {
      id: "with-summary",
      title: "Con resumen accesible",
      description: "El summary se renderiza sr-only: un lector de pantalla obtiene los valores sin depender del canvas.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `<ChartShell
  option={option}
  height={260}
  ariaLabel="Objetivos cumplidos por equipo"
  summary={
    <ul>
      {equipos.map((equipo, i) => (
        <li key={equipo}>{equipo}: {cumplidos[i]} objetivos cumplidos</li>
      ))}
    </ul>
  }
/>`,
      render: () => (
        <ThemedChart>
          <ChartShell
            option={shellOption}
            height={260}
            ariaLabel="Objetivos cumplidos por equipo"
            summary={
              <ul>
                {EQUIPOS.map((equipo, index) => (
                  <li key={equipo}>
                    {equipo}: {CUMPLIDOS[index]} objetivos cumplidos
                  </li>
                ))}
              </ul>
            }
          />
        </ThemedChart>
      ),
    },
    {
      id: "error",
      title: "Estado de error",
      description: "Si error tiene valor gana sobre loading y empty. Es un bloque inline, no una Card, para no anidar bordes dentro de ChartCard.",
      layout: "stretch",
      code: `<ChartShell
  option={option}
  height={200}
  error="No se pudo conectar con el servicio de reportes."
/>`,
      render: () => <ChartShell option={shellOption} height={200} error={ERROR_MESSAGE} />,
    },
    {
      id: "custom-children",
      title: "Contenido propio",
      description: "Con hijos, ChartShell ignora option y solo aporta la estructura, la altura y el footer. Útil para visualizaciones en HTML puro.",
      layout: "stretch",
      code: `<ChartShell
  height="auto"
  ariaLabel="Avance de objetivos por equipo"
  footer="Porcentaje de objetivos cumplidos sobre el total del trimestre"
>
  <ul className="flex flex-col gap-3">
    {equipos.map((equipo, i) => (
      <li key={equipo} className="grid grid-cols-[96px_1fr_40px] items-center gap-3 text-sm">
        <span>{equipo}</span>
        <Progress value={(cumplidos[i] / totales[i]) * 100} />
        <span className="text-right text-muted-foreground">{Math.round((cumplidos[i] / totales[i]) * 100)}%</span>
      </li>
    ))}
  </ul>
</ChartShell>`,
      render: () => (
        <ChartShell height="auto" ariaLabel="Avance de objetivos por equipo" footer="Porcentaje de objetivos cumplidos sobre el total del trimestre">
          <ul className="flex flex-col gap-3">
            {EQUIPOS.map((equipo, index) => {
              const percent = Math.round((CUMPLIDOS[index] / TOTALES[index]) * 100);
              return (
                <li key={equipo} className="grid grid-cols-[96px_1fr_40px] items-center gap-3 text-sm">
                  <span>{equipo}</span>
                  <Progress value={percent} />
                  <span className="text-right text-muted-foreground">{percent}%</span>
                </li>
              );
            })}
          </ul>
        </ChartShell>
      ),
    },
  ],
  props: [
    { name: "option", type: "EChartsOption", description: "Option para el EChart interno. Se ignora si hay hijos." },
    { name: "height", type: "number | string", default: "300", description: "Alto del área del gráfico; se aplica al region y al EChart." },
    { name: "loading", type: "boolean", default: "false", description: "Overlay de Skeleton." },
    { name: "empty", type: "boolean", default: "false", description: "Overlay de estado vacío." },
    { name: "error", type: "string | null", default: "null", description: "Mensaje de error; reemplaza el gráfico y tiene prioridad sobre loading y empty." },
    { name: "ariaLabel", type: "string", default: '"Gráfico"', description: "Etiqueta del region role=\"img\" y del section." },
    { name: "summary", type: "React.ReactNode", description: "Resumen sr-only con los datos del gráfico." },
    { name: "footer", type: "React.ReactNode", description: "Contenido bajo el gráfico, en texto secundario." },
    { name: "children", type: "React.ReactNode", description: "Sustituye al EChart por contenido propio." },
    { name: "className", type: "string", description: "Clases para el section raíz." },
    { name: "onChartReady", type: "(instance: EChartsInstance) => void", description: "Se reenvía al EChart interno." },
  ],
  guidelines: {
    do: [
      "Pasa siempre un ariaLabel descriptivo: es lo único que lee un lector de pantalla del canvas.",
      "Aporta summary cuando los valores importan para tomar una decisión.",
      "Usa el footer para la fuente y la fecha de corte de los datos.",
    ],
    dont: [
      "No lo uses suelto en una pantalla: envuélvelo con ChartCard o una Card para darle título visible.",
      "No dupliques el estado de error con un toast; el shell ya lo muestra en contexto.",
    ],
  },
  related: ["echart", "chart-card", "card"],
});
