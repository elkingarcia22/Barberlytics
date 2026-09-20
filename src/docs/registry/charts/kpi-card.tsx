import { MoreHorizontal } from "lucide-react";
import { KpiCard } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";
import { dataSnippet, toSeries } from "./_shared";
import { ThemedChart } from "./themed";

const TRENDS = ["positive", "negative", "neutral"] as const;

const SEMANAS = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8"];
const ACTIVOS_SEMANA = toSeries(SEMANAS, [1420, 1465, 1510, 1490, 1580, 1640, 1690, 1740]);
const HORAS_SEMANA = toSeries(SEMANAS, [3.9, 4.1, 4.4, 4.2, 4.6, 4.5, 4.8, 5.1]);
const ROTACION_SEMANA = toSeries(SEMANAS, [3.1, 3.4, 3.2, 3.6, 3.9, 4.1, 4.4, 4.8]);
const CUMPLIMIENTO_SEMANA = toSeries(SEMANAS, [71, 72, 70, 73, 72, 72, 71, 72]);

const ACTIVOS_SNIPPET = dataSnippet("activosPorSemana", ACTIVOS_SEMANA);

export const kpiCardEntry = defineEntry({
  id: "kpi-card",
  name: "KpiCard",
  group: "charts",
  description:
    "Tarjeta de indicador para dashboards: título, valor grande siempre en texto, delta coloreado por tendencia y un sparkline opcional como contexto visual. El valor nunca depende del canvas, así que la tarjeta es legible aunque el gráfico no cargue; el sparkline se remonta al cambiar de tema en esta docs.",
  importPath: 'import { KpiCard } from "@/components/charts"',
  sourcePath: "src/components/charts/KpiCard.tsx",
  status: "stable",
  tags: ["echarts", "card"],
  playground: definePlayground({
    controls: {
      title: { type: "text", default: "Colaboradores activos" },
      value: { type: "text", default: "1.740" },
      delta: { type: "text", default: "+8,5 %" },
      trend: { type: "select", options: TRENDS, default: "positive" },
      description: { type: "text", default: "Frente a la semana anterior" },
      withSparkline: { type: "boolean", label: "Con sparkline", default: true },
    },
    layout: "center",
    render: ({ title, value, delta, trend, description, withSparkline }) => (
      <ThemedChart>
        <KpiCard
          className="w-full max-w-xs"
          title={title}
          value={value}
          delta={delta || undefined}
          trend={trend as (typeof TRENDS)[number]}
          description={description || undefined}
          sparklineData={withSparkline ? ACTIVOS_SEMANA : undefined}
        />
      </ThemedChart>
    ),
    code: ({ title, value, delta, trend, description, withSparkline }) =>
      `${withSparkline ? `${ACTIVOS_SNIPPET}\n\n` : ""}<KpiCard
  title="${title}"
  value="${value}"${delta ? `\n  delta="${delta}"` : ""}
  trend="${trend}"${description ? `\n  description="${description}"` : ""}${withSparkline ? "\n  sparklineData={activosPorSemana}" : ""}
/>`,
  }),
  examples: [
    {
      id: "dashboard-row",
      title: "Fila de indicadores",
      description: "Tres o cuatro KpiCard en una cuadrícula abren casi todo dashboard. La tendencia colorea solo el delta.",
      layout: "stretch",
      frameClassName: "min-h-[220px]",
      code: `<div className="grid gap-4 md:grid-cols-3">
  <KpiCard title="Colaboradores activos" value="1.740" delta="+8,5 %" trend="positive" description="Frente a la semana anterior" sparklineData={activosPorSemana} />
  <KpiCard title="Horas por colaborador" value="5,1 h" delta="+0,3 h" trend="positive" description="Promedio semanal" sparklineData={horasPorSemana} />
  <KpiCard title="Rotación voluntaria" value="4,8 %" delta="+1,7 pp" trend="negative" description="Acumulado del trimestre" sparklineData={rotacionPorSemana} />
</div>`,
      render: () => (
        <ThemedChart>
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard title="Colaboradores activos" value="1.740" delta="+8,5 %" trend="positive" description="Frente a la semana anterior" sparklineData={ACTIVOS_SEMANA} />
            <KpiCard title="Horas por colaborador" value="5,1 h" delta="+0,3 h" trend="positive" description="Promedio semanal" sparklineData={HORAS_SEMANA} />
            <KpiCard title="Rotación voluntaria" value="4,8 %" delta="+1,7 pp" trend="negative" description="Acumulado del trimestre" sparklineData={ROTACION_SEMANA} />
          </div>
        </ThemedChart>
      ),
    },
    {
      id: "plain",
      title: "Sin sparkline",
      description: "Cuando no hay serie histórica la tarjeta sigue funcionando: valor, delta y descripción bastan.",
      layout: "stretch",
      frameClassName: "min-h-[160px]",
      code: `<div className="grid gap-4 md:grid-cols-2">
  <KpiCard title="Objetivos activos" value={214} description="En 5 equipos" />
  <KpiCard title="Cumplimiento" value="72 %" delta="±0 pp" trend="neutral" description="Sin cambios frente al mes anterior" />
</div>`,
      render: () => (
        <div className="grid gap-4 md:grid-cols-2">
          <KpiCard title="Objetivos activos" value={214} description="En 5 equipos" />
          <KpiCard title="Cumplimiento" value="72 %" delta="±0 pp" trend="neutral" description="Sin cambios frente al mes anterior" />
        </div>
      ),
    },
    {
      id: "with-actions",
      title: "Con acciones y footer",
      description: "Las acciones van a la derecha del título; el footer, separado por una línea, sirve para la fecha de corte o un enlace al detalle.",
      layout: "center",
      frameClassName: "min-h-[260px]",
      code: `<KpiCard
  className="max-w-xs"
  title="Cumplimiento de objetivos"
  value="72 %"
  delta="+1 pp"
  trend="positive"
  description="Objetivos cerrados sobre el total"
  sparklineData={cumplimientoPorSemana}
  actions={<Button variant="ghost" size="icon-xs" aria-label="Más opciones"><MoreHorizontal /></Button>}
  footer="Corte al 30 de septiembre · ver detalle"
/>`,
      render: () => (
        <ThemedChart>
          <KpiCard
            className="w-full max-w-xs"
            title="Cumplimiento de objetivos"
            value="72 %"
            delta="+1 pp"
            trend="positive"
            description="Objetivos cerrados sobre el total"
            sparklineData={CUMPLIMIENTO_SEMANA}
            actions={
              <Button variant="ghost" size="icon-xs" aria-label="Más opciones">
                <MoreHorizontal />
              </Button>
            }
            footer="Corte al 30 de septiembre · ver detalle"
          />
        </ThemedChart>
      ),
    },
  ],
  props: [
    { name: "title", type: "string", description: "Título en texto secundario. Obligatorio; es también el ariaLabel por defecto del valor." },
    { name: "value", type: "string | number", description: "El valor principal, ya formateado (separadores, unidad, símbolo). Siempre visible como texto." },
    { name: "delta", type: "string", description: "Variación frente al periodo anterior, p. ej. «+8,5 %». Se colorea según `trend`." },
    { name: "trend", type: '"positive" | "negative" | "neutral"', default: '"neutral"', description: "Color del delta (status-positive, status-negative o muted) y opacidad del sparkline." },
    { name: "description", type: "string", description: "Aclaración corta bajo el valor: contra qué se compara o qué periodo cubre." },
    { name: "sparklineData", type: "SparklineDatum[]", description: "Serie para el sparkline de 40 px con tooltip. Si falta o está vacía no se renderiza." },
    { name: "actions", type: "React.ReactNode", description: "Acciones a la derecha del título (menú, enlace)." },
    { name: "footer", type: "React.ReactNode", description: "Contenido bajo una línea divisoria: fecha de corte, enlace al detalle." },
    { name: "ariaLabel", type: "string", default: "title", description: "Etiqueta accesible del valor principal." },
    { name: "className", type: "string", description: "Clases para la Card." },
  ],
  guidelines: {
    do: [
      "Formatea el valor antes de pasarlo: «1.740», «5,1 h», «72 %». La tarjeta no formatea.",
      "Elige `trend` por lo que significa el cambio, no por su signo: una rotación que sube es negativa.",
      "Mantén la misma altura en una fila pasando o no `sparklineData` a todas las tarjetas.",
    ],
    dont: [
      "No pongas el dato clave solo en el sparkline; el valor en texto es la información, la línea es contexto.",
      "No uses más de cuatro o cinco KpiCard seguidas; a partir de ahí el ojo deja de priorizar.",
    ],
  },
  related: ["sparkline-chart", "chart-card", "card"],
});
