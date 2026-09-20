import { Sparkles } from "lucide-react";
import { MovingBorderBeam } from "@/components/ui/moving-border-beam";
import { defineEntry, definePlayground } from "../types";

const MODES = ["glow", "line"] as const;

export const movingBorderBeamEntry = defineEntry({
  id: "moving-border-beam",
  name: "MovingBorderBeam",
  group: "ui",
  description:
    "Un haz de luz con el degradado de IA que recorre el perímetro del contenedor. Es decorativo: se coloca dentro de un elemento `relative` y señala que una acción o un panel es de IA.",
  importPath: 'import { MovingBorderBeam } from "@/components/ui/moving-border-beam"',
  sourcePath: "src/components/ui/moving-border-beam.tsx",
  status: "stable",
  tags: ["framer-motion", "decorative"],
  playground: definePlayground({
    controls: {
      mode: { type: "select", options: MODES, default: "glow" },
      duration: { type: "number", label: "Duración (ms)", default: 6000, min: 1000, max: 15000, step: 500 },
      borderWidth: { type: "number", label: "Grosor", default: 1.5, min: 1, max: 4, step: 0.5 },
      radius: { type: "number", label: "Radio", default: 22, min: 4, max: 40, step: 2 },
    },
    render: ({ mode, duration, borderWidth, radius }) => (
      <div className="relative border border-border/60 bg-surface px-6 py-4 shadow-card" style={{ borderRadius: radius }}>
        <MovingBorderBeam mode={mode as (typeof MODES)[number]} duration={duration} borderWidth={borderWidth} rx={radius} ry={radius} />
        <p className="relative flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 text-ai-gradient-start" /> Asistente IA
        </p>
      </div>
    ),
    code: ({ mode, duration, borderWidth, radius }) => `<div className="relative rounded-[${radius}px] border border-border/60 bg-surface px-6 py-4 shadow-card">
  <MovingBorderBeam mode="${mode}" duration={${duration}} borderWidth={${borderWidth}} rx={${radius}} ry={${radius}} />
  <p className="relative flex items-center gap-2 text-sm font-medium">
    <Sparkles className="size-4" /> Asistente IA
  </p>
</div>`,
  }),
  examples: [
    {
      id: "icon-button",
      title: "Botón de icono (glow)",
      description: "El modo `glow` es un cometa suave; funciona en formas casi cuadradas como los botones de 40px del action rail.",
      code: `<button type="button" className="relative flex size-10 items-center justify-center rounded-[12px] bg-surface shadow-card" aria-label="Abrir asistente">
  <MovingBorderBeam mode="glow" rx={12} ry={12} beamSize={90} duration={4000} />
  <Sparkles className="relative size-4" />
</button>`,
      render: () => (
        <button type="button" className="relative flex size-10 items-center justify-center rounded-[12px] bg-surface text-text-primary shadow-card" aria-label="Abrir asistente">
          <MovingBorderBeam mode="glow" rx={12} ry={12} beamSize={90} duration={4000} />
          <Sparkles className="relative size-4" />
        </button>
      ),
    },
    {
      id: "pill",
      title: "Píldora ancha (line)",
      description: "En una forma ancha y baja el blob se partiría en dos; el modo `line` es un trazo que solo puede estar en un sitio.",
      code: `<div className="relative inline-flex h-10 items-center gap-2 rounded-full bg-surface px-5 text-sm font-medium shadow-card">
  <MovingBorderBeam mode="line" rx={20} ry={20} borderWidth={2} duration={5000} />
  <Sparkles className="size-4" /> Resumir con IA
</div>`,
      render: () => (
        <div className="relative inline-flex h-10 items-center gap-2 rounded-full bg-surface px-5 text-sm font-medium text-text-primary shadow-card">
          <MovingBorderBeam mode="line" rx={20} ry={20} borderWidth={2} duration={5000} />
          <Sparkles className="size-4" /> Resumir con IA
        </div>
      ),
    },
    {
      id: "card",
      title: "Dentro de una tarjeta",
      description: "Colores propios y un recorrido más lento para una superficie grande.",
      code: `<div className="relative w-80 rounded-2xl border border-border/60 bg-surface p-5 shadow-card">
  <MovingBorderBeam mode="line" rx={16} ry={16} duration={9000} colorFrom="hsl(var(--primary))" colorTo="hsl(var(--ai-gradient-end))" />
  <h3 className="text-sm font-semibold">Plan sugerido</h3>
  <p className="mt-1 text-xs text-text-secondary">Generado a partir de las respuestas del último trimestre.</p>
</div>`,
      render: () => (
        <div className="relative w-80 rounded-2xl border border-border/60 bg-surface p-5 shadow-card">
          <MovingBorderBeam mode="line" rx={16} ry={16} duration={9000} colorFrom="hsl(var(--primary))" colorTo="hsl(var(--ai-gradient-end))" />
          <h3 className="text-sm font-semibold text-text-primary">Plan sugerido</h3>
          <p className="mt-1 text-xs text-text-secondary">Generado a partir de las respuestas del último trimestre.</p>
        </div>
      ),
    },
  ],
  props: [
    { name: "mode", type: '"glow" | "line"', default: '"glow"', description: "`glow`: blob radial recortado al borde. `line`: trazo con fundido en los extremos, estable en cualquier proporción." },
    { name: "duration", type: "number", default: "6000", description: "Milisegundos por vuelta completa." },
    { name: "borderWidth", type: "number", default: "1.5", description: "Grosor del anillo (px)." },
    { name: "rx / ry", type: "number | string", default: "22", description: "Radios del rectángulo; deben coincidir con el `border-radius` del contenedor." },
    { name: "colorFrom / colorTo", type: "string", default: "degradado IA", description: "Extremos del degradado del haz." },
    { name: "beamSize", type: "number", default: "160", description: "Diámetro del blob; solo aplica al modo `glow`." },
    { name: "className", type: "string", description: "Clases extra para la capa absoluta." },
  ],
  guidelines: {
    do: ["Coloca el haz dentro de un contenedor `relative` con el mismo radio.", "Usa `line` en píldoras y tarjetas anchas; `glow` en botones cuadrados.", "Resérvalo para la superficie de IA del producto."],
    dont: ["No lo pongas en varios elementos a la vez en la misma vista.", "No lo uses como indicador de foco o de estado seleccionado."],
  },
  related: ["magic-card", "ai-button", "card"],
});
