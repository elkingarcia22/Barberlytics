import { Halo, PoleRing } from "@/components/atmosphere";
import { Heading, Text } from "@/components/typography";
import { defineEntry, definePlayground } from "../types";
import { Stage } from "./fixtures";

export const haloEntry = defineEntry({
  id: "halo",
  name: "Halo",
  group: "atmosphere",
  description:
    "Halo: un resplandor del primario en un punto del contenedor relative, que se funde en el fondo. Dos halos (uno arriba a la izquierda, otro al fondo) son la atmósfera de una landing; uno detrás de un titular es su luz. Solo pinta un gradiente: no cuesta scroll.",
  importPath: 'import { Halo } from "@/components/atmosphere"',
  sourcePath: "src/components/atmosphere/Halo.tsx",
  status: "stable",
  tags: ["fondo", "gradiente", "luz"],
  playground: definePlayground({
    controls: {
      x: { type: "text", label: "x", default: "50%" },
      y: { type: "text", label: "y", default: "22%" },
      strength: { type: "number", label: "Fuerza", default: 0.18, min: 0.04, max: 0.5, step: 0.02 },
    },
    layout: "stretch",
    render: ({ x, y, strength }) => (
      <Stage className="min-h-[280px]">
        <Halo x={x} y={y} strength={strength} />
        <div className="relative flex min-h-[280px] items-center justify-center p-section">
          <Heading level={2}>La luz del titular</Heading>
        </div>
      </Stage>
    ),
    code: ({ x, y, strength }) => `<Halo x="${x}" y="${y}" strength={${strength}} />`,
  }),
  examples: [
    {
      id: "landing",
      title: "La atmósfera de una landing",
      description: "Dos halos sobre el fondo de página: uno grande arriba a la izquierda y otro más suave arriba a la derecha.",
      layout: "stretch",
      code: `<div className="relative">
  <Halo x="12%" y="-10%" size="60rem 40rem" strength={0.16} />
  <Halo x="95%" y="8%" size="45rem 30rem" strength={0.08} />
  <main className="relative">…</main>
</div>`,
      render: () => (
        <Stage className="min-h-[240px]">
          <Halo x="12%" y="-10%" size="60rem 40rem" strength={0.16} />
          <Halo x="95%" y="8%" size="45rem 30rem" strength={0.08} />
          <div className="relative flex min-h-[240px] items-end p-section">
            <Text variant="muted">Dos halos, ningún coste de scroll.</Text>
          </div>
        </Stage>
      ),
    },
    {
      id: "with-ring",
      title: "Con la rueda detrás del cierre",
      description: "En el cierre de la landing el halo sube desde abajo y la rueda gira en el centro.",
      layout: "stretch",
      code: `<section className="relative overflow-hidden">
  <Halo x="50%" y="100%" size="40rem 20rem" strength={0.22} />
  <PoleRing size="56rem" opacity={0.6} />
  <div className="relative">…</div>
</section>`,
      render: () => (
        <Stage className="min-h-[300px]">
          <Halo x="50%" y="100%" size="40rem 20rem" strength={0.22} />
          <PoleRing size="36rem" opacity={0.6} />
          <div className="relative flex min-h-[300px] items-center justify-center p-section text-center">
            <Heading level={2}>La construimos juntos.</Heading>
          </div>
        </Stage>
      ),
    },
  ],
  props: [
    { name: "x", type: "string", default: '"50%"', description: "Centro horizontal del resplandor." },
    { name: "y", type: "string", default: '"22%"', description: "Centro vertical del resplandor." },
    { name: "size", type: "string", default: '"52rem 28rem"', description: "Tamaño de la elipse, «ancho alto»." },
    { name: "strength", type: "number", default: "0.18", description: "Opacidad del primario en el centro." },
    { name: "className", type: "string", description: "Alto o recorte distintos (`h-[44rem]`, `inset-x-0 top-0`)." },
  ],
  guidelines: {
    do: ["Uno detrás de cada titular grande; dos como atmósfera de página.", "Mantén la fuerza por debajo de 0.25: el halo se nota por contraste, no por color."],
    dont: ["No lo uses dentro de cards: la atmósfera del tema ya cae sobre la página.", "No lo animes; la luz quieta es lo que hace que el cabello y la rueda se lean como movimiento."],
  },
  related: ["pole-ring", "grain", "vignette", "hair-canvas"],
});
