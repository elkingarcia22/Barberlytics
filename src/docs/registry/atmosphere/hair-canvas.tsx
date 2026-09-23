import { HairCanvas } from "@/components/atmosphere";
import { Heading, Text } from "@/components/typography";
import { defineEntry, definePlayground } from "../types";
import { Stage } from "./fixtures";

export const hairCanvasEntry = defineEntry({
  id: "hair-canvas",
  name: "HairCanvas",
  group: "atmosphere",
  description:
    "Cabello cayendo sobre una portada: hebras finas y curvas que bajan, se mecen y giran, la mitad en el color de marca y la otra mitad en el del texto. Es un canvas 2D que se detiene fuera de pantalla y con la pestaña oculta, relee la paleta al cambiar el tema y con prefers-reduced-motion no se monta.",
  importPath: 'import { HairCanvas } from "@/components/atmosphere"',
  sourcePath: "src/components/atmosphere/HairCanvas.tsx",
  status: "stable",
  tags: ["canvas", "fondo", "barbería", "reduced-motion"],
  playground: definePlayground({
    controls: {
      density: { type: "number", label: "Densidad", default: 1, min: 0.2, max: 2, step: 0.1 },
    },
    layout: "stretch",
    render: ({ density }) => (
      <Stage className="min-h-[320px]">
        <HairCanvas key={density} density={density} />
        <div className="relative flex min-h-[320px] flex-col items-center justify-center gap-3 p-section text-center">
          <Heading level={2}>Una IA que trabaja para tu barbería.</Heading>
          <Text variant="lead">Pocas sillas, mucha voz.</Text>
        </div>
      </Stage>
    ),
    code: ({ density }) => `<section className="relative overflow-hidden">
  ${density === 1 ? "<HairCanvas />" : `<HairCanvas density={${density}} />`}
  <div className="relative">…</div>
</section>`,
  }),
  examples: [
    {
      id: "cover",
      title: "Portada",
      description: "Va como primer hijo de una sección `relative overflow-hidden`; el contenido después, también `relative`, para quedar por delante.",
      layout: "stretch",
      code: `<section className="relative overflow-hidden">
  <HairCanvas />
  <div className="relative mx-auto max-w-4xl text-center">…</div>
</section>`,
      render: () => (
        <Stage className="min-h-[280px]">
          <HairCanvas />
          <div className="relative flex min-h-[280px] items-center justify-center p-section">
            <Heading level={3}>Construido con barberos.</Heading>
          </div>
        </Stage>
      ),
    },
    {
      id: "closing",
      title: "Cierre con menos densidad",
      description: "En el cierre de la página baja a 0.7 para no repetir la portada con la misma fuerza.",
      layout: "stretch",
      code: `<HairCanvas density={0.7} />`,
      render: () => (
        <Stage className="min-h-[220px]">
          <HairCanvas density={0.7} />
          <div className="relative flex min-h-[220px] items-center justify-center p-section">
            <Text variant="lead">La construimos juntos.</Text>
          </div>
        </Stage>
      ),
    },
  ],
  props: [
    { name: "density", type: "number", default: "1", description: "Multiplicador de hebras: 1 es una hebra por cada 22 000 px², con tope en 70." },
    { name: "className", type: "string", description: "Clases extra para el <canvas>, que ya es absolute inset-0 y no intercepta el puntero." },
  ],
  guidelines: {
    do: [
      "Úsalo en la portada y, con menos densidad, en el cierre: dos veces por página como mucho.",
      "El contenedor tiene que ser `relative` y con `overflow-hidden`; el canvas mide al padre.",
      "Confía en que se apaga solo fuera de pantalla: no lo desmontes a mano al hacer scroll.",
    ],
    dont: [
      "No lo pongas detrás de texto largo ni de un formulario: es textura para titulares.",
      "No lo dupliques dentro de cards; una card no tiene atmósfera propia.",
      "No le des colores: los toma del tema (`--primary` y `--foreground`).",
    ],
  },
  related: ["pole-ring", "halo", "grain"],
});
