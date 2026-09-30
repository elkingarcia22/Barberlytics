import { BarList } from "@/components/charts";
import { Card } from "@/components/ui/card";
import { defineEntry, definePlayground } from "../types";

const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const SERVICIOS = [
  { id: "maintenance", label: "Corte de mantenimiento", value: 148, meta: money(6660) },
  { id: "cut-beard", label: "Corte + barba", value: 68, meta: money(4420) },
  { id: "kids", label: "Corte infantil", value: 17, meta: money(544) },
  { id: "beard", label: "Arreglo de barba o afeitado", value: 9, meta: money(270) },
  { id: "first", label: "Primera visita", value: 3, meta: money(165) },
];

const INGRESO = [
  { id: "services", label: "Servicios", value: 12219 },
  { id: "products", label: "Productos", value: 865 },
  { id: "taxes", label: "Impuestos", value: 60.55 },
  { id: "tips", label: "Propinas", value: 2422 },
  { id: "fees", label: "Comisiones", value: 381.61 },
];

const SERVICIOS_SNIPPET = `const servicios = [
  { id: "maintenance", label: "Corte de mantenimiento", value: 148, meta: "US$ 6.660" },
  { id: "cut-beard", label: "Corte + barba", value: 68, meta: "US$ 4.420" },
  { id: "kids", label: "Corte infantil", value: 17, meta: "US$ 544" },
];`;

const TONES = ["brand", "positive", "warning", "negative", "neutral"] as const;

export const barListEntry = defineEntry({
  id: "bar-list",
  name: "BarList",
  group: "charts",
  description:
    "Un ranking: qué se vendió más, de dónde salió el ingreso, qué servicio se pidió. Cada fila lleva su nombre, una barra proporcional al máximo y su valor escrito; la barra compara y el número informa. Con título trae su propia Card; sin él es solo la lista, para meterla dentro de otro panel sin caja dentro de caja.",
  importPath: 'import { BarList } from "@/components/charts"',
  sourcePath: "src/components/charts/BarList.tsx",
  status: "stable",
  tags: ["ranking", "panel", "dashboard", "barras"],
  playground: definePlayground({
    controls: {
      title: { type: "text", default: "Servicios más vendidos" },
      count: { type: "text", label: "Cifra del título", default: "247" },
      tone: { type: "select", options: TONES, default: "positive" },
      sorted: { type: "boolean", label: "Ordenar de mayor a menor", default: true },
      limit: { type: "number", label: "Filas (0 = todas)", default: 0, min: 0, max: 5 },
    },
    layout: "center",
    render: ({ title, count, tone, sorted, limit }) => (
      <BarList
        className="w-full max-w-md"
        title={title}
        count={count || undefined}
        items={SERVICIOS}
        tone={tone as (typeof TONES)[number]}
        sorted={sorted}
        limit={limit || undefined}
      />
    ),
    code: ({ title, count, tone, sorted, limit }) => `${SERVICIOS_SNIPPET}

<BarList
  title="${title}"${count ? `\n  count="${count}"` : ""}
  items={servicios}
  tone="${tone}"${sorted ? "" : "\n  sorted={false}"}${limit ? `\n  limit={${limit}}` : ""}
/>`,
  }),
  examples: [
    {
      id: "ranking",
      title: "Ranking con importe al lado",
      description: "`meta` pone un segundo dato apagado junto al valor: las unidades mandan en la barra y el importe acompaña. El título lleva la cifra total en su badge.",
      layout: "center",
      frameClassName: "min-h-[280px]",
      code: `${SERVICIOS_SNIPPET}

<BarList title="Servicios más vendidos" count={247} items={servicios} tone="positive" />`,
      render: () => <BarList className="w-full max-w-md" title="Servicios más vendidos" count={247} items={SERVICIOS} tone="positive" />,
    },
    {
      id: "desglose",
      title: "Desglose en el orden del negocio",
      description:
        "Con `sorted={false}` las filas se quedan como llegan: un desglose del ingreso se lee en el orden contable —servicios, productos, impuestos—, no de mayor a menor. `formatValue` escribe la moneda.",
      layout: "center",
      frameClassName: "min-h-[260px]",
      code: `<BarList
  title="Origen del ingreso"
  count="US$ 15.642"
  items={ingreso}
  formatValue={money}
  sorted={false}
/>`,
      render: () => <BarList className="w-full max-w-md" title="Origen del ingreso" count={money(15642)} items={INGRESO} formatValue={money} sorted={false} />,
    },
    {
      id: "sin-tarjeta",
      title: "Dentro de otro panel",
      description: "Sin `title` el componente es solo la lista. Así entra en una Card que ya tiene cabecera propia sin duplicar el marco.",
      layout: "center",
      frameClassName: "min-h-[220px]",
      code: `<Card className="p-card">
  <h3 className="mb-stack text-sm font-semibold">Top 3 del mes</h3>
  <BarList items={servicios} limit={3} />
</Card>`,
      render: () => (
        <Card className="w-full max-w-md p-card">
          <h3 className="mb-stack text-sm font-semibold text-text-primary">Top 3 del mes</h3>
          <BarList items={SERVICIOS} limit={3} />
        </Card>
      ),
    },
  ],
  props: [
    { name: "title", type: "string", description: "Con título el componente se envuelve en su Card con `PanelHeading`; sin él es solo la lista." },
    { name: "description", type: "string", description: "Una línea apagada bajo el título." },
    { name: "count", type: "ReactNode", description: "Una cifra junto al título: cuántos elementos suman las filas, cuánto es el total." },
    { name: "items", type: "BarListItem[]", description: "Las filas: `{ id, label, value, tone?, meta? }`. `meta` es un segundo dato apagado junto al valor." },
    { name: "formatValue", type: "(value: number) => string", description: "Cómo se escribe el valor de cada fila; por defecto en es-ES." },
    { name: "tone", type: '"brand" | "positive" | "warning" | "negative" | "neutral"', default: '"brand"', description: "El tono de las barras. Una fila puede traer el suyo." },
    { name: "sorted", type: "boolean", default: "true", description: "Ordena de mayor a menor antes de pintar." },
    { name: "limit", type: "number", description: "Deja fuera las filas a partir de esta posición." },
    { name: "actions", type: "ReactNode", description: "Controles a la derecha del título." },
    { name: "emptyLabel", type: "string", description: "Qué decir cuando no hay filas." },
  ],
  guidelines: {
    do: [
      "Deja que la barra compare y el número informe: el valor va siempre escrito.",
      "Apaga `sorted` cuando el orden significa algo (un desglose contable, los pasos de un embudo).",
      "Usa `meta` para el importe cuando la barra mide unidades, o al revés; nunca dos barras para el mismo concepto.",
    ],
    dont: [
      "No pases más de diez filas sin `limit`: a partir de ahí es una tabla, no un ranking.",
      "No mezcles tonos por fila sin motivo; el color por fila es para señalar una (la que está en riesgo), no para decorar.",
    ],
  },
  related: ["bar-chart", "composition-donut", "distribution-bar", "table-shell"],
});
