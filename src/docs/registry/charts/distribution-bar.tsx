import { DistributionBar } from "@/components/charts";
import { defineEntry, definePlayground } from "../types";

const FRANJAS = [
  { id: "morning", label: "Mañana", hint: "hasta las 12", value: 105, tone: "warning" },
  { id: "afternoon", label: "Tarde", hint: "12 a 17", value: 138, tone: "brand" },
  { id: "evening", label: "Noche", hint: "desde las 17", value: 126, tone: "neutral" },
] as const;

const CANALES = [
  { id: "internal", label: "Desde la barbería", value: 322 },
  { id: "online", label: "En línea", value: 39 },
  { id: "walkIn", label: "Sin cita", value: 8 },
];

const FRANJAS_SNIPPET = `const franjas = [
  { id: "morning", label: "Mañana", hint: "hasta las 12", value: 105, tone: "warning" },
  { id: "afternoon", label: "Tarde", hint: "12 a 17", value: 138, tone: "brand" },
  { id: "evening", label: "Noche", hint: "desde las 17", value: 126, tone: "neutral" },
];`;

export const distributionBarEntry = defineEntry({
  id: "distribution-bar",
  name: "DistributionBar",
  group: "charts",
  description:
    "Un total repartido en pocos tramos contiguos —mañana, tarde y noche; con cita, sin cita— como una sola barra donde cada tramo ocupa lo que le toca, y debajo la leyenda con cada parte, su valor y su porcentaje. Es el hermano lineal de CompositionDonut: la misma pregunta cuando las partes tienen un orden natural que en un anillo se pierde.",
  importPath: 'import { DistributionBar } from "@/components/charts"',
  sourcePath: "src/components/charts/DistributionBar.tsx",
  status: "stable",
  tags: ["panel", "dashboard", "barras", "reparto"],
  playground: definePlayground({
    controls: {
      title: { type: "text", default: "Cuándo se reservan" },
      unit: { type: "text", label: "Unidad", default: "citas" },
      empty: { type: "boolean", label: "Sin datos", default: false },
    },
    layout: "center",
    render: ({ title, unit, empty }) => (
      <DistributionBar className="w-full max-w-sm" title={title} unit={unit || undefined} segments={empty ? [] : [...FRANJAS]} />
    ),
    code: ({ title, unit, empty }) => `${FRANJAS_SNIPPET}

<DistributionBar title="${title}"${unit ? ` unit="${unit}"` : ""} segments={${empty ? "[]" : "franjas"}} />`,
  }),
  examples: [
    {
      id: "franjas",
      title: "Franjas del día",
      description: "Los tramos van en el orden de la barra —mañana, tarde, noche— y cada uno lleva su franja como `hint`. Los tonos son los del sistema.",
      layout: "center",
      frameClassName: "min-h-[200px]",
      code: `${FRANJAS_SNIPPET}

<DistributionBar title="Cuándo se reservan" unit="citas" segments={franjas} />`,
      render: () => <DistributionBar className="w-full max-w-sm" title="Cuándo se reservan" unit="citas" segments={[...FRANJAS]} />,
    },
    {
      id: "sin-tono",
      title: "Sin tono ni tarjeta",
      description: "Sin `tone` el ciclo del tema reparte los colores; sin `title` es solo la barra con su leyenda, para meterla en otro panel.",
      layout: "center",
      frameClassName: "min-h-[160px]",
      code: `<DistributionBar unit="citas" segments={canales} />`,
      render: () => <DistributionBar className="w-full max-w-sm" unit="citas" segments={CANALES} />,
    },
  ],
  props: [
    { name: "title", type: "string", description: "Con título se envuelve en su Card con `PanelHeading`; sin él es solo la barra con su leyenda." },
    { name: "description", type: "string", description: "Una línea apagada bajo el título." },
    { name: "segments", type: "DistributionSegment[]", description: "Los tramos, en el orden en que se pintan: `{ id, label, value, tone?, hint? }`." },
    { name: "formatValue", type: "(value: number) => string", description: "Cómo se escribe cada valor; por defecto en es-ES." },
    { name: "unit", type: "string", description: "La unidad que acompaña al valor en la leyenda: «citas», «ventas»." },
    { name: "actions", type: "ReactNode", description: "Controles a la derecha del título." },
    { name: "emptyLabel", type: "string", description: "Qué decir cuando todos los tramos valen cero." },
    { name: "ariaLabel", type: "string", description: "Cómo se anuncia la barra; por defecto, el título con cada tramo y su valor." },
  ],
  guidelines: {
    do: [
      "Úsalo cuando los tramos tienen un orden natural (horas del día, pasos de un embudo, tallas).",
      "Mantén los tramos entre dos y cinco: más allá la barra se llena de rayas que no se distinguen.",
      "Da el mismo tono a la misma franja en todo el producto: la mañana es siempre ámbar, la tarde siempre marca.",
    ],
    dont: [
      "No lo uses para comparar magnitudes independientes; eso es un `BarList`.",
      "No lo pintes con todos los tramos en el mismo tono: sin contraste no hay reparto.",
    ],
  },
  related: ["composition-donut", "bar-list", "progress"],
});
