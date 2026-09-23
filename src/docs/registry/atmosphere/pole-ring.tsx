import { PoleRing } from "@/components/atmosphere";
import { Heading, Text } from "@/components/typography";
import { defineEntry, definePlayground } from "../types";
import { Stage } from "./fixtures";

export const poleRingEntry = defineEntry({
  id: "pole-ring",
  name: "PoleRing",
  group: "atmosphere",
  description:
    "La rueda: el poste visto desde arriba, un anillo de ticks radiales del primario girando muy despacio (una vuelta cada 80 s) detrás de un titular o un panel. Va centrado en su padre `relative`; el giro pisa cualquier otro transform, así que el centrado vive en el contenedor del componente.",
  importPath: 'import { PoleRing } from "@/components/atmosphere"',
  sourcePath: "src/components/atmosphere/PoleRing.tsx",
  status: "stable",
  tags: ["barbería", "fondo", "bucle"],
  playground: definePlayground({
    controls: {
      size: { type: "number", label: "Diámetro (px)", default: 520, min: 200, max: 1200, step: 20 },
      opacity: { type: "number", label: "Opacidad", default: 0.6, min: 0.1, max: 1, step: 0.1 },
    },
    layout: "stretch",
    render: ({ size, opacity }) => (
      <Stage className="min-h-[320px]">
        <PoleRing size={size} opacity={opacity} />
        <div className="relative flex min-h-[320px] items-center justify-center p-section">
          <Heading level={2}>Cohorte 01</Heading>
        </div>
      </Stage>
    ),
    code: ({ size, opacity }) => `<section className="relative overflow-hidden">
  <PoleRing size={${size}} opacity={${opacity}} />
  <div className="relative">…</div>
</section>`,
  }),
  examples: [
    {
      id: "behind-title",
      title: "Detrás del titular de portada",
      description: "En la portada va grande (64rem) y muy tenue, desplazado hacia arriba con `top-[34%]` para que el titular caiga sobre el borde del anillo.",
      layout: "stretch",
      code: `<PoleRing size="64rem" opacity={0.3} className="top-[34%]" />`,
      render: () => (
        <Stage className="min-h-[300px]">
          <PoleRing size="64rem" opacity={0.3} className="top-[34%]" />
          <div className="relative flex min-h-[300px] flex-col items-center justify-center gap-2 p-section text-center">
            <Heading level={2}>Una IA que trabaja para tu barbería.</Heading>
            <Text variant="lead">La entrenamos contigo.</Text>
          </div>
        </Stage>
      ),
    },
  ],
  props: [
    { name: "size", type: "number | string", default: '"56rem"', description: "Diámetro del anillo; px si es número, o cualquier longitud CSS." },
    { name: "opacity", type: "number", default: "0.6", description: "Opacidad del conjunto. El anillo ya es tenue (primario al 28%)." },
    { name: "className", type: "string", description: "Posición del contenedor centrado (`top-[34%]`, `left-[70%]`…)." },
  ],
  guidelines: {
    do: ["Ponlo en un padre `relative overflow-hidden`: casi siempre es más grande que la sección.", "Combínalo con un Halo: el anillo dibuja, el halo ilumina."],
    dont: ["No lo uses a tamaño pequeño como spinner ni como avatar.", "No apliques `transform` al contenedor por `className`: el giro lo pisaría."],
  },
  related: ["barber-pole", "halo", "hair-canvas"],
});
