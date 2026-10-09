import { ProgressRing, type ProgressRingColor } from "@/components/data-display/ProgressRing";
import { Text } from "@/components/typography";
import { ThemaIcon } from "@/icons";
import { defineEntry, definePlayground } from "../types";

const COLORS = ["primary", "success", "warning", "destructive"] as const;
const SIZES = ["sm", "md", "lg"] as const;

export const progressRingEntry = defineEntry({
  id: "progress-ring",
  name: "ProgressRing",
  group: "data-display",
  description:
    "Avance en un anillo: lo conseguido en color pleno y, opcional, lo que suma la acción en curso en un tono más suave. Para avances cortos y contables —visitas de una membresía, sesiones de un paquete, pasos— con el conteo o un icono en el centro.",
  importPath: 'import { ProgressRing } from "@/components/data-display/ProgressRing"',
  sourcePath: "src/components/data-display/ProgressRing.tsx",
  status: "beta",
  tags: ["svg", "progreso"],
  playground: definePlayground({
    controls: {
      value: { type: "number", default: 6, min: 0, max: 10, step: 1 },
      pending: { type: "number", default: 1, min: 0, max: 3, step: 1 },
      size: { type: "select", options: SIZES, default: "md" },
      color: { type: "select", options: COLORS, default: "primary" },
    },
    render: ({ value, pending, size, color }) => (
      <ProgressRing value={value} pending={pending} max={10} size={size as (typeof SIZES)[number]} color={color as ProgressRingColor} aria-label={`${value + pending} de 10 visitas`}>
        <Text as="span" size="xs" weight="semibold" tabular>
          {Math.min(value + pending, 10)}
        </Text>
      </ProgressRing>
    ),
    code: ({ value, pending, size, color }) =>
      `<ProgressRing value={${value}}${pending ? ` pending={${pending}}` : ""} max={10}${size !== "md" ? ` size="${size}"` : ""}${color !== "primary" ? ` color="${color}"` : ""} aria-label="${value + pending} de 10 visitas">
  <Text as="span" size="xs" weight="semibold" tabular>${Math.min(value + pending, 10)}</Text>
</ProgressRing>`,
  }),
  examples: [
    {
      id: "membership",
      title: "Membresía en el pago",
      description: "Seis visitas hechas y la cita que se está pagando suma la séptima, en tono suave hasta que ocurra.",
      code: `<ProgressRing value={6} pending={1} max={10} aria-label="7 de 10 visitas">
  <Text as="span" size="xs" weight="semibold" tabular>7<span className="text-text-muted">/10</span></Text>
</ProgressRing>`,
      render: () => (
        <div className="flex items-center gap-3">
          <ProgressRing value={6} pending={1} max={10} aria-label="7 de 10 visitas">
            <Text as="span" size="xs" weight="semibold" tabular>
              7<span className="text-text-muted">/10</span>
            </Text>
          </ProgressRing>
          <Text size="sm">Esta cita suma: 7 de 10 visitas</Text>
        </div>
      ),
    },
    {
      id: "earned",
      title: "Premio ganado",
      description: "Completo y con un icono en el centro: ya no es avance, es algo por usar.",
      code: `<ProgressRing value={10} max={10} aria-label="Cortesía lista">
  <ThemaIcon name="award" size="sm" tone="primary" />
</ProgressRing>`,
      render: () => (
        <ProgressRing value={10} max={10} aria-label="Cortesía lista">
          <ThemaIcon name="award" size="sm" tone="primary" />
        </ProgressRing>
      ),
    },
    {
      id: "sizes",
      title: "Tamaños",
      description: "`sm` en una fila densa, `md` junto a un texto de dos líneas, `lg` como dato principal de una tarjeta.",
      code: `<ProgressRing size="sm" value={2} max={4} aria-label="2 de 4 sesiones" />
<ProgressRing value={2} max={4} aria-label="2 de 4 sesiones" />
<ProgressRing size="lg" value={2} max={4} color="success" aria-label="2 de 4 sesiones">…</ProgressRing>`,
      render: () => (
        <div className="flex items-center gap-4">
          <ProgressRing size="sm" value={2} max={4} aria-label="2 de 4 sesiones" />
          <ProgressRing value={2} max={4} aria-label="2 de 4 sesiones" />
          <ProgressRing size="lg" value={2} max={4} color="success" aria-label="2 de 4 sesiones">
            <Text as="span" size="sm" weight="semibold" tabular>
              2/4
            </Text>
          </ProgressRing>
        </div>
      ),
    },
  ],
  props: [
    { name: "value", type: "number", description: "Lo conseguido, de 0 a `max`." },
    { name: "max", type: "number", default: "100", description: "El total del anillo." },
    { name: "pending", type: "number", default: "0", description: "Tramo que se suma en tono suave: lo que aporta la acción en curso. No cuenta en `aria-valuenow`." },
    { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "32, 44 o 64 px." },
    { name: "color", type: '"primary" | "success" | "warning" | "destructive"', default: '"primary"', description: "Color de los arcos." },
    { name: "children", type: "React.ReactNode", description: "El centro (conteo o icono). Es decorativo: el avance se anuncia con `aria-label`." },
    { name: "aria-label", type: "string", description: "Qué avanza y cuánto («6 de 10 visitas»). Obligatorio en la práctica." },
  ],
  guidelines: {
    do: ["Úsalo para totales pequeños y contables (hasta ~20): visitas, sesiones, pasos.", "Pon el conteo en el centro y di en el `aria-label` qué avanza.", "Usa `pending` para enseñar lo que aporta la acción que el usuario está por confirmar."],
    dont: ["No lo uses para cargas o porcentajes largos: usa `Progress`.", "No lo uses para repartir un total en partes: usa `DonutChart`.", "No lo pongas sin texto al lado ni `aria-label`: un anillo solo no dice de qué es."],
  },
  related: ["progress", "donut-chart"],
});
