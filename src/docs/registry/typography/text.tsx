import { Card } from "@/components/ui/card";
import { Text, type TextSize, type TextTone, type TextVariant, type TextWeight } from "@/components/typography";
import { defineEntry, definePlayground } from "../types";

const SIZES = ["xs", "sm", "base", "lg", "xl"] as const;
const WEIGHTS = ["normal", "medium", "semibold", "bold"] as const;
const TONES = ["default", "secondary", "muted", "inverse", "primary", "positive", "negative", "warning"] as const;
const VARIANTS = ["body", "lead", "muted", "small", "label", "caption", "code"] as const;

const SIZE_SPECS: { size: TextSize; px: string; use: string }[] = [
  { size: "xs", px: "12 / 16", use: "Badges, hints, tablas densas" },
  { size: "sm", px: "14 / 20", use: "Cuerpo de interfaz (por defecto)" },
  { size: "base", px: "16 / 24", use: "Párrafos largos, lead" },
  { size: "lg", px: "18 / 28", use: "Destacados" },
  { size: "xl", px: "20 / 28", use: "Cifras de KPI" },
];

const VARIANT_SPECS: { variant: TextVariant; sample: string; note: string }[] = [
  { variant: "body", sample: "El ciclo cierra el 30 de septiembre.", note: "sm · normal · primary" },
  { variant: "lead", sample: "Mide cómo se siente el equipo y actúa a tiempo.", note: "base · secondary · relaxed" },
  { variant: "muted", sample: "Última sincronización hace 4 minutos.", note: "sm · muted" },
  { variant: "small", sample: "12 pendientes", note: "xs · medium" },
  { variant: "label", sample: "Correo corporativo", note: "sm · medium · primary" },
  { variant: "caption", sample: "Solo lo ve el administrador.", note: "xs · muted" },
  { variant: "code", sample: "npm run dev", note: "xs · mono · span" },
];

const KPIS = [
  { label: "Participación", value: "87,4 %", delta: "+3,1", tone: "positive" as const },
  { label: "Respuestas", value: "1.284", delta: "+112", tone: "positive" as const },
  { label: "eNPS", value: "-4", delta: "-6", tone: "negative" as const },
];

export const textEntry = defineEntry({
  id: "text",
  name: "Text",
  group: "typography",
  description:
    "Todo el texto que no es un título: cuerpo, etiquetas, ayudas, cifras y código inline. Tres ejes (`size`, `weight`, `tone`) y unos `variant` que los combinan. Por defecto es un párrafo de 14px, el tamaño de la interfaz.",
  importPath: 'import { Text } from "@/components/typography"',
  sourcePath: "src/components/typography/Text.tsx",
  status: "stable",
  tags: ["cva", "typography"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", options: VARIANTS, default: "body" },
      size: { type: "select", label: "Tamaño", options: ["auto", ...SIZES], default: "auto" },
      weight: { type: "select", label: "Peso", options: ["auto", ...WEIGHTS], default: "auto" },
      tone: { type: "select", label: "Tono", options: ["auto", ...TONES], default: "auto" },
      truncate: { type: "boolean", label: "Truncado", default: false },
    },
    layout: "stretch",
    render: ({ variant, size, weight, tone, truncate }) => (
      <div className={tone === "inverse" ? "w-full max-w-md rounded-xl bg-text-primary px-6 py-4" : "w-full max-w-md"}>
        <Text
          variant={variant as TextVariant}
          size={size === "auto" ? undefined : (size as TextSize)}
          weight={weight === "auto" ? undefined : (weight as TextWeight)}
          tone={tone === "auto" ? undefined : (tone as TextTone)}
          truncate={truncate}
        >
          Objetivos claros, resultados visibles. La plataforma de personas que conecta aprendizaje, desempeño y clima.
        </Text>
      </div>
    ),
    code: ({ variant, size, weight, tone, truncate }) => {
      const attrs = [
        variant !== "body" ? `variant="${variant}"` : "",
        size !== "auto" ? `size="${size}"` : "",
        weight !== "auto" ? `weight="${weight}"` : "",
        tone !== "auto" ? `tone="${tone}"` : "",
        truncate ? "truncate" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<Text${attrs ? ` ${attrs}` : ""}>Objetivos claros, resultados visibles.</Text>`;
    },
  }),
  examples: [
    {
      id: "sizes",
      title: "Tamaños",
      description: "Cinco pasos. `sm` es el cuerpo de la interfaz y el valor por defecto; `base` solo para lectura larga.",
      layout: "stretch",
      code: `<Text size="xs">12px</Text>
<Text>14px (sm, por defecto)</Text>
<Text size="base">16px</Text>
<Text size="lg">18px</Text>
<Text size="xl">20px</Text>`,
      render: () => (
        <Card className="w-full divide-y divide-border/50">
          {SIZE_SPECS.map((item) => (
            <div key={item.size} className="grid items-center gap-inline px-card py-3 sm:grid-cols-[90px_1fr_auto]">
              <Text as="span" variant="code">
                {item.size}
              </Text>
              <Text as="span" size={item.size}>
                Configura el ciclo y asigna objetivos
              </Text>
              <Text as="span" variant="caption">
                {item.px}px · {item.use}
              </Text>
            </div>
          ))}
        </Card>
      ),
    },
    {
      id: "weights",
      title: "Pesos",
      description: "`normal` para cuerpo, `medium` para etiquetas y botones, `semibold` para énfasis y cifras. `bold` casi nunca fuera de un Heading.",
      code: `<Text weight="normal">Normal</Text>
<Text weight="medium">Medium</Text>
<Text weight="semibold">Semibold</Text>
<Text weight="bold">Bold</Text>`,
      render: () => (
        <div className="flex flex-wrap items-baseline gap-6">
          {WEIGHTS.map((weight) => (
            <div key={weight} className="flex flex-col gap-1">
              <Text as="span" size="lg" weight={weight}>
                Ágil
              </Text>
              <Text as="span" variant="code">
                {weight}
              </Text>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "variants",
      title: "Variantes listas",
      description: "Cada `variant` fija una combinación habitual. Un eje explícito (`tone`, `size`, `weight`) la sobreescribe.",
      layout: "stretch",
      code: `<Text>Cuerpo por defecto</Text>
<Text variant="lead">Introducción de página</Text>
<Text variant="muted">Meta y ayudas</Text>
<Text variant="small">Contadores y chips</Text>
<Text variant="label">Etiqueta de campo</Text>
<Text variant="caption">Nota al pie</Text>
<Text variant="code">npm run dev</Text>`,
      render: () => (
        <Card className="w-full divide-y divide-border/50">
          {VARIANT_SPECS.map((item) => (
            <div key={item.variant} className="grid items-center gap-inline px-card py-3 sm:grid-cols-[90px_1fr_auto]">
              <Text as="span" variant="code">
                {item.variant}
              </Text>
              <Text variant={item.variant} as={item.variant === "code" ? "span" : "p"}>
                {item.sample}
              </Text>
              <Text as="span" variant="caption">
                {item.note}
              </Text>
            </div>
          ))}
        </Card>
      ),
    },
    {
      id: "tones",
      title: "Tonos semánticos",
      description: "`positive`, `negative` y `warning` mapean a los tokens de estado; `primary` al color de marca. No dependas solo del color para el significado.",
      code: `<Text tone="positive">Completado a tiempo</Text>
<Text tone="warning">Vence en 2 días</Text>
<Text tone="negative">Sin respuesta</Text>
<Text tone="primary">Ver detalle</Text>`,
      render: () => (
        <div className="flex flex-wrap items-center gap-6">
          <Text as="span" weight="medium" tone="positive">
            Completado a tiempo
          </Text>
          <Text as="span" weight="medium" tone="warning">
            Vence en 2 días
          </Text>
          <Text as="span" weight="medium" tone="negative">
            Sin respuesta
          </Text>
          <Text as="span" weight="medium" tone="primary">
            Ver detalle
          </Text>
        </div>
      ),
    },
    {
      id: "kpi",
      title: "Cifras tabulares en una fila de KPI",
      description: "`size=\"xl\" weight=\"semibold\" tabular` es la cifra de KPI. Con `tabular` los dígitos ocupan el mismo ancho y las columnas no bailan al cambiar de valor.",
      layout: "stretch",
      code: `<div className="grid grid-cols-3 divide-x">
  {kpis.map((kpi) => (
    <div key={kpi.label} className="px-4">
      <Text variant="caption">{kpi.label}</Text>
      <Text as="span" size="xl" weight="semibold" tabular className="block">{kpi.value}</Text>
      <Text as="span" variant="small" tone={kpi.tone} tabular>{kpi.delta}</Text>
    </div>
  ))}
</div>`,
      render: () => (
        <Card className="grid w-full max-w-lg grid-cols-3 divide-x divide-border/50 py-4">
          {KPIS.map((kpi) => (
            <div key={kpi.label} className="px-card">
              <Text variant="caption">{kpi.label}</Text>
              <Text as="span" size="xl" weight="semibold" tabular className="mt-1 block">
                {kpi.value}
              </Text>
              <Text as="span" variant="small" tone={kpi.tone} tabular>
                {kpi.delta} vs. ciclo anterior
              </Text>
            </div>
          ))}
        </Card>
      ),
    },
    {
      id: "truncate",
      title: "Párrafo con truncado",
      description: "`truncate` corta en una línea con elipsis. Para varias líneas usa `line-clamp-N` por `className`.",
      code: `<Text truncate className="w-64">
  Ana María Ospina completó la autoevaluación y envió comentarios a tres pares.
</Text>
<Text className="w-64 line-clamp-2">
  Ana María Ospina completó la autoevaluación y envió comentarios a tres pares.
</Text>`,
      render: () => (
        <div className="flex flex-col gap-4">
          <Text truncate className="w-64">
            Ana María Ospina completó la autoevaluación y envió comentarios a tres pares.
          </Text>
          <Text className="w-64 line-clamp-2">
            Ana María Ospina completó la autoevaluación y envió comentarios a tres pares del equipo de producto.
          </Text>
        </div>
      ),
    },
  ],
  props: [
    { name: "size", type: '"xs" | "sm" | "base" | "lg" | "xl"', default: '"sm"', description: "12, 14, 16, 18 o 20px con su interlínea." },
    { name: "weight", type: '"normal" | "medium" | "semibold" | "bold"', default: '"normal"', description: "Peso de la fuente." },
    { name: "tone", type: '"default" | "secondary" | "muted" | "inverse" | "primary" | "positive" | "negative" | "warning"', default: '"default"', description: "Color desde tokens. Gana al tono que fije el `variant`." },
    { name: "variant", type: '"body" | "lead" | "muted" | "small" | "label" | "caption" | "code"', default: '"body"', description: "Combinación lista de tamaño, peso y tono. `code` además usa `span` y monoespaciada." },
    { name: "as", type: "keyof JSX.IntrinsicElements", default: '"p"', description: "Etiqueta a renderizar. Usa `span` para texto en línea." },
    { name: "truncate", type: "boolean", default: "false", description: "Una sola línea con elipsis." },
    { name: "tabular", type: "boolean", default: "false", description: "`tabular-nums`: dígitos de ancho fijo para cifras alineadas." },
    { name: "...props", type: "React.HTMLAttributes<HTMLElement>", description: "Atributos nativos, incluido `className`." },
  ],
  guidelines: {
    do: [
      "Deja el tamaño por defecto (`sm`) para la interfaz; sube a `base` solo en lectura larga.",
      "Usa `tabular` en cualquier cifra que viva en una columna o cambie en vivo.",
      "Pasa `as=\"span\"` cuando el texto va en línea con otros elementos; un `<p>` dentro de un botón o una celda no es válido.",
    ],
    dont: [
      "No escribas `text-[13px]`, `font-light` ni `text-gray-500`: cada eje tiene una prop.",
      "No uses Text para títulos: la jerarquía es de Heading.",
      "No combines más de dos tonos semánticos en la misma frase.",
    ],
  },
  related: ["heading", "label", "badge"],
});
