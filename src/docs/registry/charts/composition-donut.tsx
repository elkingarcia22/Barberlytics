import { CompositionDonut } from "@/components/charts";
import { defineEntry, definePlayground } from "../types";
import { ThemedChart } from "./themed";

const CITAS = [
  { id: "completed", label: "Completadas", value: 247, tone: "positive" },
  { id: "pending", label: "Por cobrar", value: 23, tone: "warning" },
  { id: "cancelled", label: "Canceladas", value: 86, tone: "negative" },
  { id: "noShow", label: "No-show", value: 13, tone: "neutral" },
] as const;

const PAGOS = [
  { id: "card", label: "Tarjeta", value: 10975 },
  { id: "cash", label: "Efectivo", value: 3019 },
  { id: "transfer", label: "Transferencia", value: 494 },
  { id: "gift", label: "Tarjeta regalo", value: 153 },
];

const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const CITAS_SNIPPET = `const citas = [
  { id: "completed", label: "Completadas", value: 247, tone: "positive" },
  { id: "pending", label: "Por cobrar", value: 23, tone: "warning" },
  { id: "cancelled", label: "Canceladas", value: 86, tone: "negative" },
  { id: "noShow", label: "No-show", value: 13, tone: "neutral" },
];`;

export const compositionDonutEntry = defineEntry({
  id: "composition-donut",
  name: "CompositionDonut",
  group: "charts",
  description:
    "El reparto de un total en pocas partes como panel de tablero: un anillo mudo con el total escrito en el centro y una leyenda al lado con cada parte, su valor y su porcentaje. A diferencia de DonutChart, el dato es la leyenda y el anillo es contexto; el texto lo pone el DOM, así que sigue al tema y a la densidad sin pasar por el canvas.",
  importPath: 'import { CompositionDonut } from "@/components/charts"',
  sourcePath: "src/components/charts/CompositionDonut.tsx",
  status: "stable",
  tags: ["echarts", "panel", "dashboard", "donut"],
  playground: definePlayground({
    controls: {
      title: { type: "text", default: "En qué acabaron las citas" },
      centerLabel: { type: "text", label: "Rótulo del centro", default: "clientes" },
      showShare: { type: "boolean", label: "Con porcentaje", default: true },
      size: { type: "number", label: "Diámetro (px)", default: 136, min: 96, max: 200, step: 8 },
      empty: { type: "boolean", label: "Sin datos", default: false },
    },
    layout: "center",
    render: ({ title, centerLabel, showShare, size, empty }) => (
      <ThemedChart>
        <CompositionDonut
          className="w-full max-w-sm"
          title={title}
          center={{ value: 303, label: centerLabel || undefined }}
          slices={empty ? [] : [...CITAS]}
          showShare={showShare}
          size={size}
        />
      </ThemedChart>
    ),
    code: ({ title, centerLabel, showShare, size, empty }) => `${CITAS_SNIPPET}

<CompositionDonut
  title="${title}"
  center={{ value: 303${centerLabel ? `, label: "${centerLabel}"` : ""} }}
  slices={${empty ? "[]" : "citas"}}${showShare ? "\n  showShare" : ""}${size !== 136 ? `\n  size={${size}}` : ""}
/>`,
  }),
  examples: [
    {
      id: "tres-repartos",
      title: "Tres repartos en una fila",
      description:
        "La forma natural del panel: tres tercios de fila con la misma anatomía. Con tono por porción cuando las partes son estados (completada, cancelada); sin tono cuando no significan nada más que «otra parte», y entonces el ciclo del tema reparte los colores.",
      layout: "stretch",
      frameClassName: "min-h-[240px]",
      code: `${CITAS_SNIPPET}

<div className="grid gap-3 lg:grid-cols-2">
  <CompositionDonut title="En qué acabaron las citas" center={{ value: 303, label: "clientes" }} slices={citas} showShare />
  <CompositionDonut title="Cómo se pagó" center={{ value: money(14641), label: "cobrado" }} slices={pagos} formatValue={money} showShare />
</div>`,
      render: () => (
        <ThemedChart>
          <div className="grid w-full gap-3 lg:grid-cols-2">
            <CompositionDonut title="En qué acabaron las citas" center={{ value: 303, label: "clientes" }} slices={[...CITAS]} showShare />
            <CompositionDonut title="Cómo se pagó" center={{ value: money(14641), label: "cobrado" }} slices={PAGOS} formatValue={money} showShare />
          </div>
        </ThemedChart>
      ),
    },
    {
      id: "vacio",
      title: "Sin datos",
      description: "Con todas las porciones a cero el anillo baja a un aro neutro y la leyenda cede el sitio a una línea que lo dice. Nunca un anillo pintado sobre nada.",
      layout: "center",
      frameClassName: "min-h-[220px]",
      code: `<CompositionDonut title="Cómo se agendaron" slices={[]} emptyLabel="Sin citas en este periodo" />`,
      render: () => (
        <ThemedChart>
          <CompositionDonut className="w-full max-w-sm" title="Cómo se agendaron" slices={[]} emptyLabel="Sin citas en este periodo" />
        </ThemedChart>
      ),
    },
  ],
  props: [
    { name: "title", type: "string", description: "Qué reparte el panel. Va en la cabecera compartida de los paneles (`PanelHeading`)." },
    { name: "description", type: "string", description: "Una línea apagada bajo el título." },
    { name: "slices", type: "CompositionSlice[]", description: "Las partes: `{ id, label, value, tone? }`. El tono es uno de los del sistema; sin él, el color sale por posición del ciclo del tema." },
    { name: "center", type: "{ value: ReactNode; label?: string }", description: "Lo que va escrito en el centro. Por defecto, la suma de las porciones formateada. Una cifra larga baja de tamaño sola." },
    { name: "formatValue", type: "(value: number) => string", description: "Cómo se escribe cada valor de la leyenda; por defecto en es-ES." },
    { name: "showShare", type: "boolean", default: "false", description: "Añade el porcentaje sobre el total a cada fila." },
    { name: "size", type: "number", default: "136", description: "Diámetro del anillo en píxeles." },
    { name: "actions", type: "ReactNode", description: "Controles a la derecha del título." },
    { name: "emptyLabel", type: "string", description: "Qué decir cuando no hay porciones o todas valen cero." },
    { name: "ariaLabel", type: "string", description: "Cómo se anuncia el anillo; por defecto, el título con cada parte y su valor." },
  ],
  guidelines: {
    do: [
      "Úsalo para un reparto de dos a cinco partes; a partir de seis, la leyenda deja de caber al lado y el anillo deja de leerse.",
      "Da tono a las porciones que son estados (positivo, aviso, negativo) y déjalo vacío cuando solo son «otra parte».",
      "Pasa `center` cuando el total tiene otra unidad o nombre que la suma: 303 clientes sobre 369 citas.",
      "Formatea el valor con la misma función que el resto del tablero, para que «US$ 14.641» se escriba igual en la tarjeta y en la leyenda.",
    ],
    dont: [
      "No lo uses para analizar una distribución con etiquetas sobre las porciones: para eso está `DonutChart`.",
      "No pintes un 0 como un anillo lleno de gris con una leyenda de ceros; deja que muestre su vacío.",
      "No lo metas dentro de otra `Card`: ya trae la suya.",
    ],
  },
  related: ["donut-chart", "distribution-bar", "bar-list", "metric-card"],
});
