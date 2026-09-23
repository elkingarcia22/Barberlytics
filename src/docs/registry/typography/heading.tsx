import { Card } from "@/components/ui/card";
import { Heading, type HeadingLevel, type HeadingTone, type HeadingWeight } from "@/components/typography";
import { Text } from "@/components/typography";
import { defineEntry, definePlayground } from "../types";

const LEVELS = ["1", "2", "3", "4", "5", "6"] as const;
const WEIGHTS = ["semibold", "bold", "medium"] as const;
const TONES = ["default", "muted", "inverse"] as const;

const SCALE: { level: HeadingLevel; px: string; use: string }[] = [
  { level: 1, px: "36 / 44 · 48 en lg", use: "Portadas y marketing" },
  { level: 2, px: "30 / 38", use: "Título de página" },
  { level: 3, px: "24 / 32", use: "Sección de página" },
  { level: 4, px: "20 / 28", use: "Card, drawer, diálogo" },
  { level: 5, px: "18 / 26", use: "Subsección dentro de una card" },
  { level: 6, px: "16 / 24", use: "Encabezado de bloque o lista" },
];

export const headingEntry = defineEntry({
  id: "heading",
  name: "Heading",
  group: "typography",
  description:
    "Los seis niveles de título del sistema como un componente. El nivel fija tamaño, interlínea y etiqueta (h1–h6); `as` desacopla la etiqueta cuando la semántica del documento no coincide con el tamaño. Nadie escribe `text-[Npx]` ni `font-bold` a mano.",
  importPath: 'import { Heading } from "@/components/typography"',
  sourcePath: "src/components/typography/Heading.tsx",
  status: "stable",
  tags: ["cva", "typography"],
  playground: definePlayground({
    controls: {
      level: { type: "select", label: "Nivel", options: LEVELS, default: "2" },
      weight: { type: "select", label: "Peso", options: WEIGHTS, default: "semibold" },
      tone: { type: "select", label: "Tono", options: TONES, default: "default" },
      text: { type: "text", label: "Texto", default: "Evaluación de desempeño 2026" },
    },
    render: ({ level, weight, tone, text }) => (
      <div className={tone === "inverse" ? "rounded-xl bg-text-primary px-6 py-4" : undefined}>
        <Heading level={Number(level) as HeadingLevel} weight={weight as HeadingWeight} tone={tone as HeadingTone}>
          {text}
        </Heading>
      </div>
    ),
    code: ({ level, weight, tone, text }) => {
      const attrs = [`level={${level}}`, weight !== "semibold" ? `weight="${weight}"` : "", tone !== "default" ? `tone="${tone}"` : ""]
        .filter(Boolean)
        .join(" ");
      return `<Heading ${attrs}>${text}</Heading>`;
    },
  }),
  examples: [
    {
      id: "scale",
      title: "Escala completa",
      description: "Del 1 al 6. Dentro del producto la página arranca en el nivel 2; el 1 queda para portadas y páginas de marketing.",
      layout: "stretch",
      code: `<Heading level={1}>Nivel 1</Heading>
<Heading level={2}>Nivel 2</Heading>
<Heading level={3}>Nivel 3</Heading>
<Heading level={4}>Nivel 4</Heading>
<Heading level={5}>Nivel 5</Heading>
<Heading level={6}>Nivel 6</Heading>`,
      render: () => (
        <Card className="w-full divide-y divide-border/50">
          {SCALE.map((item) => (
            <div key={item.level} className="grid items-baseline gap-inline px-card py-4 sm:grid-cols-[1fr_auto]">
              <Heading level={item.level}>Configuración de objetivos</Heading>
              <span className="text-right">
                <Text as="span" variant="code">
                  level={"{"}
                  {item.level}
                  {"}"}
                </Text>
                <Text as="span" variant="caption" className="block">
                  {item.px}px · {item.use}
                </Text>
              </span>
            </div>
          ))}
        </Card>
      ),
    },
    {
      id: "page-header",
      title: "Cabecera de página",
      description: "Nivel 2 para el título y un `Text variant=\"lead\"` debajo. Es la pareja que abre cualquier pantalla del producto.",
      layout: "start",
      code: `<Heading level={2}>Encuestas de clima</Heading>
<Text variant="lead" className="mt-2 max-w-xl">
  Mide cómo se siente el equipo y detecta a tiempo lo que hay que cambiar.
</Text>`,
      render: () => (
        <div>
          <Heading level={2}>Encuestas de clima</Heading>
          <Text variant="lead" className="mt-2 max-w-xl">
            Mide cómo se siente el equipo y detecta a tiempo lo que hay que cambiar.
          </Text>
        </div>
      ),
    },
    {
      id: "card-hierarchy",
      title: "Jerarquía dentro de una card",
      description: "La card entra en nivel 4 y sus bloques bajan al 5 y al 6, sin saltarse ninguno. Los lectores de pantalla navegan por esa escalera.",
      code: `<Card className="p-card">
  <Heading level={4}>Ciclo Q3</Heading>
  <Text variant="muted" className="mt-1">Del 1 de julio al 30 de septiembre</Text>

  <Heading level={5} className="mt-5">Participantes</Heading>
  <Text className="mt-1">142 personas en 6 equipos.</Text>

  <Heading level={6} className="mt-4">Evaluadores</Heading>
  <Text className="mt-1">Líder directo y dos pares.</Text>
</Card>`,
      render: () => (
        <Card className="w-full max-w-md p-card">
          <Heading level={4}>Ciclo Q3</Heading>
          <Text variant="muted" className="mt-1">
            Del 1 de julio al 30 de septiembre
          </Text>
          <Heading level={5} className="mt-5">
            Participantes
          </Heading>
          <Text className="mt-1">142 personas en 6 equipos.</Text>
          <Heading level={6} className="mt-4">
            Evaluadores
          </Heading>
          <Text className="mt-1">Líder directo y dos pares.</Text>
        </Card>
      ),
    },
    {
      id: "truncate",
      title: "Truncado",
      description: "`truncate` deja una sola línea con elipsis. El contenedor tiene que acotar el ancho (`min-w-0` dentro de un flex).",
      code: `<div className="flex w-72 items-center gap-3">
  <Heading level={5} truncate className="min-w-0 flex-1">
    Plan de desarrollo individual de María Fernanda Restrepo Gómez
  </Heading>
  <Badge>Activo</Badge>
</div>`,
      render: () => (
        <div className="flex w-72 items-center gap-3 rounded-lg border border-border/60 bg-surface px-4 py-3">
          <Heading level={5} truncate className="min-w-0 flex-1">
            Plan de desarrollo individual de María Fernanda Restrepo Gómez
          </Heading>
          <Text as="span" variant="small" tone="positive">
            Activo
          </Text>
        </div>
      ),
    },
  ],
  props: [
    { name: "level", type: "1 | 2 | 3 | 4 | 5 | 6", description: "Obligatoria. Fija tamaño, interlínea y la etiqueta por defecto (`h{level}`)." },
    { name: "as", type: "keyof JSX.IntrinsicElements", default: "h{level}", description: "Etiqueta a renderizar cuando la semántica no coincide con el nivel visual." },
    { name: "weight", type: '"semibold" | "bold" | "medium"', default: '"semibold"', description: "Peso. `bold` para portadas; `medium` para títulos secundarios." },
    { name: "tone", type: '"default" | "muted" | "inverse"', default: '"default"', description: "Color: `text-text-primary`, `text-text-muted` o `text-text-inverse` sobre fondos oscuros." },
    { name: "truncate", type: "boolean", default: "false", description: "Una sola línea con elipsis." },
    { name: "...props", type: 'React.HTMLAttributes<HTMLHeadingElement>', description: "Atributos nativos del encabezado, incluido `className`." },
  ],
  guidelines: {
    do: [
      "La página empieza en nivel 2; el nivel 1 es para portadas.",
      "Baja de nivel en orden, sin saltos: una card en nivel 4 tiene sus bloques en 5 y 6.",
      "Usa `as` cuando necesites el tamaño de un nivel con otra etiqueta, no otro nivel.",
    ],
    dont: [
      "No fijes tamaños con `text-[Npx]` ni pesos con `font-*` en un Heading.",
      "No uses Heading para cifras: eso es `Text size=\"xl\" weight=\"semibold\" tabular`.",
      "No uses Heading para etiquetas de formulario ni eyebrows: eso es Label o `Text variant=\"small\"`.",
    ],
  },
  related: ["text", "page-header", "section-header"],
});
