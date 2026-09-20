import * as React from "react";
import { EChart, getUbitsChartTheme, type EChartsOption, type UbitsChartTheme } from "@/components/charts";
import { defineEntry, definePlayground } from "../types";
import { ThemedChart } from "./themed";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const INSCRIPCIONES = [420, 465, 510, 480, 560, 610, 590, 640, 700, 730, 760, 810];
const COMPLETADOS = [180, 210, 260, 250, 300, 340, 330, 380, 420, 450, 480, 520];

const mixedOption: EChartsOption = {
  tooltip: { trigger: "axis" },
  legend: { top: 0 },
  xAxis: { type: "category", data: MESES },
  yAxis: { type: "value" },
  series: [
    { name: "Inscripciones", type: "bar", data: INSCRIPCIONES },
    { name: "Completados", type: "line", smooth: true, symbol: "circle", symbolSize: 4, data: COMPLETADOS },
  ],
};

const AREAS = ["Tecnología", "Ventas", "Operaciones", "Talento", "Finanzas", "Marketing", "Legal"];
const HORAS = [1240, 980, 1120, 640, 520, 710, 310];

const customPaletteOption: EChartsOption = {
  color: ["#0c5bef", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe", "#eff6ff"],
  tooltip: { trigger: "item" },
  series: [
    {
      type: "pie",
      radius: ["45%", "72%"],
      data: AREAS.map((name, index) => ({ name, value: HORAS[index] })),
      label: { formatter: "{b}", fontSize: 12 },
    },
  ],
};

const SERIES_LABELS = ["brand", "positive", "warning", "negative", "neutral"];

function Swatch({ label, color }: { label: string; color: string }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface px-2.5 py-2">
      <span className="size-5 shrink-0 rounded-md border border-black/10" style={{ backgroundColor: color }} />
      <span className="flex min-w-0 flex-col">
        <span className="text-xs font-medium text-text-primary">{label}</span>
        <span className="truncate font-mono text-[11px] text-text-muted">{color}</span>
      </span>
    </li>
  );
}

/** Lee el tema tal como lo haría EChart al montar y muestra los valores resueltos. */
function ResolvedTheme() {
  const theme = React.useMemo<UbitsChartTheme>(() => getUbitsChartTheme(), []);
  const ui = [
    { label: "textStyle.color (--foreground)", color: theme.textStyle.color },
    { label: "axisLabel.color (--muted-foreground)", color: theme.valueAxis.axisLabel.color },
    { label: "splitLine.color (--border)", color: theme.valueAxis.splitLine.lineStyle.color },
    { label: "tooltip.backgroundColor (--background)", color: theme.tooltip.backgroundColor },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">theme.color (series)</p>
        <ul className="grid gap-2">
          {theme.color.map((color, index) => (
            <Swatch key={SERIES_LABELS[index]} label={`--color-${SERIES_LABELS[index] === "neutral" ? "text-secondary" : SERIES_LABELS[index]}`} color={color} />
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Colores de interfaz (hsl)</p>
        <ul className="grid gap-2">
          {ui.map((item) => (
            <Swatch key={item.label} label={item.label} color={item.color} />
          ))}
        </ul>
      </div>
    </div>
  );
}

export const echartEntry = defineEntry({
  id: "echart",
  name: "EChart",
  group: "charts",
  description:
    "El wrapper base de Apache ECharts: inicializa la instancia una sola vez, la redimensiona con ResizeObserver y la destruye al desmontar. Al montar resuelve el tema con getUbitsChartTheme(), que lee los tokens del <html> con getComputedStyle porque el canvas no entiende var(--token); en esta docs los ejemplos se remontan al cambiar de tema para reflejar los colores actuales.",
  importPath: 'import { EChart, getUbitsChartTheme } from "@/components/charts"',
  sourcePath: "src/components/charts/EChart.tsx",
  status: "stable",
  tags: ["echarts", "canvas", "theme-tokens"],
  playground: definePlayground({
    controls: {
      height: { type: "number", label: "height (px)", default: 300, min: 160, max: 480, step: 20 },
      loading: { type: "boolean", default: false },
      empty: { type: "boolean", default: false },
    },
    layout: "stretch",
    render: ({ height, loading, empty }) => (
      <ThemedChart>
        <EChart option={mixedOption} height={height} loading={loading} empty={empty} />
      </ThemedChart>
    ),
    code: ({ height, loading, empty }) => {
      const attrs = [`height={${height}}`, loading ? "loading" : "", empty ? "empty" : ""].filter(Boolean).join(" ");
      return `const option = {
  tooltip: { trigger: "axis" },
  legend: { top: 0 },
  xAxis: { type: "category", data: meses },
  yAxis: { type: "value" },
  series: [
    { name: "Inscripciones", type: "bar", data: inscripciones },
    { name: "Completados", type: "line", smooth: true, data: completados },
  ],
};

<EChart option={option} ${attrs} />`;
    },
  }),
  examples: [
    {
      id: "theme-resolution",
      title: "Cómo se resuelve el tema",
      description:
        "getUbitsChartTheme() se ejecuta en el momento del init. Las series usan los HEX de --color-brand, positive, warning, negative y text-secondary; los ejes, la leyenda y el tooltip envuelven los canales HSL de shadcn (--foreground, --muted-foreground, --border, --background) en hsl(). Cambia el tema arriba: estos valores se recalculan.",
      layout: "stretch",
      code: `import { getUbitsChartTheme } from "@/components/charts";

// Se llama al montar el gráfico. Lee <html> con getComputedStyle, así que
// el resultado depende del preset y del modo activos en ese instante.
const theme = getUbitsChartTheme();

theme.color;
// → ["#0c5bef", "#059669", "#ff7b0d", "#e9343c", "#5c646f"]
//    brand      positive   warning    negative   neutral

theme.textStyle.color;
// → "hsl(214, 19%, 23%)"  ← "214 19% 23%" de --foreground, con comas para zrender

// EChart lo pasa como tema de init:
echarts.init(el, theme);`,
      render: () => (
        <ThemedChart>
          <ResolvedTheme />
        </ThemedChart>
      ),
    },
    {
      id: "raw-option",
      title: "Option libre",
      description: "Cualquier option de ECharts. Los ejes, la leyenda y el tooltip heredan el tema sin configurarlos.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `<EChart
  option={{
    tooltip: { trigger: "axis" },
    legend: { top: 0 },
    xAxis: { type: "category", data: meses },
    yAxis: { type: "value" },
    series: [
      { name: "Inscripciones", type: "bar", data: inscripciones },
      { name: "Completados", type: "line", smooth: true, data: completados },
    ],
  }}
  height={280}
/>`,
      render: () => (
        <ThemedChart>
          <EChart option={mixedOption} height={280} />
        </ThemedChart>
      ),
    },
    {
      id: "custom-palette",
      title: "Paleta propia",
      description: "El tema trae cinco colores semánticos. Si necesitas más series, declara option.color y el tema deja de aplicar su paleta (los ejes y el tooltip siguen tematizados).",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `<EChart
  option={{
    color: ["#0c5bef", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe", "#eff6ff"],
    tooltip: { trigger: "item" },
    series: [{ type: "pie", radius: ["45%", "72%"], data: areas }],
  }}
  height={280}
/>`,
      render: () => (
        <ThemedChart>
          <EChart option={customPaletteOption} height={280} />
        </ThemedChart>
      ),
    },
    {
      id: "states",
      title: "Cargando y vacío",
      description: "Ambos estados son overlays: el div del canvas sigue en el DOM con visibility hidden, así el ResizeObserver conserva las medidas.",
      layout: "stretch",
      frameClassName: "min-h-[240px]",
      code: `<EChart option={option} height={180} loading />
<EChart option={option} height={180} empty />`,
      render: () => (
        <div className="grid gap-4 md:grid-cols-2">
          <EChart option={mixedOption} height={180} loading />
          <EChart option={mixedOption} height={180} empty />
        </div>
      ),
    },
  ],
  props: [
    { name: "option", type: "EChartsOption", description: "El objeto de configuración de ECharts. Se aplica con notMerge en cada cambio." },
    { name: "height", type: "number | string", default: "300", description: "Alto del contenedor en px o valor CSS. El ancho siempre es 100%." },
    { name: "loading", type: "boolean", default: "false", description: "Overlay con Skeleton mientras se cargan los datos." },
    { name: "empty", type: "boolean", default: "false", description: "Overlay con EmptyState cuando no hay datos." },
    { name: "className", type: "string", description: "Clases para el contenedor externo." },
    { name: "style", type: "React.CSSProperties", description: "Estilos inline del contenedor; height se sobreescribe con la prop." },
    { name: "onChartReady", type: "(instance: EChartsInstance) => void", description: "Se llama tras el primer setOption con la instancia lista." },
  ],
  guidelines: {
    do: [
      "Usa los presets (BarChart, LineChart…) para lo habitual y reserva EChart para options que no cubren.",
      "Deja que el tema pinte ejes, leyenda y tooltip: no repitas colores que ya salen de los tokens.",
      "Registra en registerECharts.ts cualquier serie o componente nuevo antes de usarlo en una option.",
    ],
    dont: [
      "No pases var(--token) dentro de la option: el canvas no lo resuelve y se pinta negro.",
      "No fijes el alto por CSS externo; usa la prop height para que ResizeObserver mida bien.",
    ],
  },
  related: ["chart-shell", "chart-card", "bar-chart", "line-chart"],
});
