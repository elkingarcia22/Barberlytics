import { HeatmapMatrix, type HeatmapColumn, type HeatmapRow } from "@/components/charts";
import { defineEntry, definePlayground } from "../types";

const AREAS: readonly HeatmapColumn[] = [
  { id: "ventas", label: "Ventas" },
  { id: "marketing", label: "Marketing" },
  { id: "producto", label: "Producto" },
  { id: "operaciones", label: "Operaciones" },
  { id: "soporte", label: "Soporte" },
];

const OBJETIVOS: readonly HeatmapRow[] = [
  {
    id: "crecer",
    label: "Crecer en cuentas grandes",
    caption: "Objetivo de empresa",
    values: { ventas: 82, marketing: 71, producto: 64, operaciones: 45, soporte: 93 },
    children: [
      {
        id: "crecer-pipeline",
        label: "Duplicar el pipeline enterprise",
        values: { ventas: 96, marketing: 88, producto: null, operaciones: null, soporte: null },
      },
      {
        id: "crecer-onboarding",
        label: "Onboarding en menos de 14 días",
        values: { ventas: 61, marketing: null, producto: 58, operaciones: 45, soporte: 90 },
      },
    ],
  },
  {
    id: "retener",
    label: "Retener la base actual",
    caption: "Objetivo de empresa",
    values: { ventas: 48, marketing: 22, producto: 77, operaciones: 81, soporte: 95 },
    children: [
      {
        id: "retener-churn",
        label: "Bajar el churn a un dígito",
        values: { ventas: 48, marketing: 22, producto: 70, operaciones: 81, soporte: 97 },
      },
      {
        id: "retener-nps",
        label: "Subir el NPS a 45",
        values: { ventas: null, marketing: null, producto: 84, operaciones: null, soporte: 92 },
      },
    ],
  },
];

const DATA_SNIPPET = `const areas = [
  { id: "ventas", label: "Ventas" },
  { id: "marketing", label: "Marketing" },
  // …
];

const objetivos = [
  {
    id: "crecer",
    label: "Crecer en cuentas grandes",
    caption: "Objetivo de empresa",
    values: { ventas: 82, marketing: 71, producto: 64 },
    children: [
      { id: "crecer-pipeline", label: "Duplicar el pipeline enterprise",
        values: { ventas: 96, marketing: 88, producto: null } },
    ],
  },
];`;

export const heatmapMatrixEntry = defineEntry({
  id: "heatmap-matrix",
  name: "HeatmapMatrix",
  group: "charts",
  description:
    "Matriz de calor en tabla: filas jerárquicas y desplegables contra columnas, con la primera columna fija al hacer scroll horizontal. Cada celda se pinta con la banda de la escala de favorabilidad (tokens --fav-*, definidos para claro y oscuro), y las celdas sin dato quedan fuera de escala en gris. Es una tabla semántica, no una imagen: un lector de pantalla la recorre por filas y columnas.",
  importPath: 'import { HeatmapMatrix } from "@/components/charts"',
  sourcePath: "src/components/charts/HeatmapMatrix.tsx",
  status: "stable",
  tags: ["tabla", "escala", "favorabilidad"],
  playground: definePlayground({
    controls: {
      legend: { type: "boolean", label: "Leyenda", default: true },
      interactive: { type: "boolean", label: "Celdas accionables", default: false },
      rowHeaderLabel: { type: "text", label: "Cabecera de fila", default: "Objetivo" },
    },
    layout: "stretch",
    render: ({ legend, interactive, rowHeaderLabel }) => (
      <HeatmapMatrix
        columns={AREAS}
        rows={OBJETIVOS}
        rowHeaderLabel={rowHeaderLabel}
        legend={legend}
        caption="Avance de cada objetivo por área"
        onCellClick={interactive ? () => undefined : undefined}
      />
    ),
    code: ({ legend, interactive, rowHeaderLabel }) => `${DATA_SNIPPET}

<HeatmapMatrix
  columns={areas}
  rows={objetivos}
  rowHeaderLabel="${rowHeaderLabel}"${legend ? "" : "\n  legend={false}"}${interactive ? "\n  onCellClick={(fila, columna) => abrirDetalle(fila.id, columna.id)}" : ""}
  caption="Avance de cada objetivo por área"
/>`,
  }),
  examples: [
    {
      id: "hierarchy",
      title: "Objetivos por área",
      description:
        "Las filas con `children` traen un botón de desplegar. Al montar se abren todas; con `defaultExpanded` se elige cuáles.",
      layout: "stretch",
      code: `${DATA_SNIPPET}

<HeatmapMatrix columns={areas} rows={objetivos} rowHeaderLabel="Objetivo" />`,
      render: () => <HeatmapMatrix columns={AREAS} rows={OBJETIVOS} rowHeaderLabel="Objetivo" />,
    },
    {
      id: "collapsed",
      title: "Solo el primer nivel",
      description:
        "Con `defaultExpanded={[]}` la matriz arranca cerrada: se lee el resumen por objetivo de empresa y se abre lo que interese.",
      layout: "stretch",
      code: `<HeatmapMatrix
  columns={areas}
  rows={objetivos}
  rowHeaderLabel="Objetivo"
  defaultExpanded={[]}
/>`,
      render: () => (
        <HeatmapMatrix columns={AREAS} rows={OBJETIVOS} rowHeaderLabel="Objetivo" defaultExpanded={[]} />
      ),
    },
    {
      id: "no-data",
      title: "Celdas sin dato",
      description:
        "Un `null` en `values` no es un cero: la celda sale gris y fuera de escala, con un guion. Distinguirlas evita leer «no aplica» como «va mal».",
      layout: "stretch",
      code: `const objetivos = [{
  id: "crecer-pipeline",
  label: "Duplicar el pipeline enterprise",
  values: { ventas: 96, marketing: 88, producto: null, operaciones: null },
}];`,
      render: () => (
        <HeatmapMatrix
          columns={AREAS}
          rows={[OBJETIVOS[0]!.children![0]!, OBJETIVOS[1]!.children![1]!]}
          rowHeaderLabel="Resultado clave"
          legend={false}
        />
      ),
    },
  ],
  props: [
    { name: "columns", type: "HeatmapColumn[]", description: "Columnas de la matriz: `{ id, label }`. El `id` es la clave que se busca en `row.values`." },
    { name: "rows", type: "HeatmapRow[]", description: "Filas: `{ id, label, caption?, children?, values }`. Anidar por `children` crea la jerarquía desplegable." },
    { name: "bands", type: "HeatBand[]", default: "FAVORABILITY_BANDS", description: "Bandas de color, ascendentes por `min`. Se cambia para escalas que no van de 0 a 100." },
    { name: "defaultExpanded", type: "string[]", default: "todas", description: "Ids de las filas abiertas al montar. `[]` arranca todo cerrado." },
    { name: "rowHeaderLabel", type: "string", description: "Cabecera de la primera columna. Nombra qué es cada fila." },
    { name: "formatValue", type: "(value: number) => string", default: "v => `${Math.round(v)} %`", description: "Cómo se escribe el valor dentro de la celda y en el tooltip." },
    { name: "legend", type: "boolean", default: "true", description: "Muestra las bandas con su rango bajo la tabla." },
    { name: "onCellClick", type: "(row, column, value) => void", description: "Hace la celda accionable: pasa a ser un `<button>` enfocable. Las celdas sin dato nunca lo son." },
    { name: "caption", type: "string", description: "Resumen de la tabla para lectores de pantalla. Se renderiza como `<caption>` oculto." },
  ],
  guidelines: {
    do: [
      "Nombra la primera columna con `rowHeaderLabel`: sin ella nadie sabe qué es cada fila.",
      "Usa `null` para lo que no aplica y reserva el 0 para lo que de verdad vale cero.",
      "Deja la leyenda visible mientras la escala no sea obvia para quien lee.",
      "Cierra con `defaultExpanded={[]}` cuando la matriz pase de unas 20 filas visibles.",
    ],
    dont: [
      "No lo uses para cruzar dos dimensiones anónimas sin jerarquía: para eso está HeatmapChart, que escala mejor.",
      "No cambies `bands` por colores de marca; la escala es semántica y se comparte con el resto del sistema.",
      "No metas más de unas 12 columnas: a partir de ahí la primera columna fija deja de bastar para orientarse.",
    ],
  },
  related: ["heatmap-chart", "metric-card", "table-shell", "status-badge"],
});
