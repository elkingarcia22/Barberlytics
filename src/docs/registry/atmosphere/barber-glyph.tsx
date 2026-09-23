import { BarberGlyph } from "@/components/atmosphere";
import { Heading, Text } from "@/components/typography";
import { defineEntry, definePlayground } from "../types";
import { Stage } from "./fixtures";

const KINDS = ["comb", "razor"] as const;
type Kind = (typeof KINDS)[number];

export const barberGlyphEntry = defineEntry({
  id: "barber-glyph",
  name: "BarberGlyph",
  group: "atmosphere",
  description:
    "Grafismos de fondo en línea, un peine y una navaja abierta, dibujados con currentColor a muy baja opacidad detrás de una sección. Son textura, no contenido: siempre aria-hidden, sin puntero, y con `floating` se mecen despacio (14 s) sobre la inclinación que se les dé.",
  importPath: 'import { BarberGlyph } from "@/components/atmosphere"',
  sourcePath: "src/components/atmosphere/BarberGlyph.tsx",
  status: "stable",
  tags: ["svg", "barbería", "fondo"],
  playground: definePlayground({
    controls: {
      kind: { type: "select", label: "Glifo", options: KINDS, default: "razor" },
      floating: { type: "boolean", label: "Flotando", default: true },
      rotate: { type: "number", label: "Inclinación (°)", default: -8, min: -45, max: 45, step: 1 },
    },
    layout: "stretch",
    render: ({ kind, floating, rotate }) => (
      <Stage className="min-h-[260px]">
        <BarberGlyph kind={kind as Kind} floating={floating} rotate={rotate} className="absolute -bottom-6 -left-16 w-[28rem] text-text-primary opacity-[0.08]" />
        <div className="relative flex min-h-[260px] items-center justify-end p-section">
          <Heading level={3}>03 · El acuerdo</Heading>
        </div>
      </Stage>
    ),
    code: ({ kind, floating, rotate }) =>
      `<BarberGlyph kind="${kind}"${floating ? " floating" : ""}${rotate ? ` rotate={${rotate}}` : ""} className="absolute -bottom-10 -left-24 w-[40rem] text-text-primary opacity-[0.05]" />`,
  }),
  examples: [
    {
      id: "razor-corner",
      title: "La navaja en la esquina de una sección",
      description: "Como en la sección del acuerdo: abajo a la izquierda, a 5 % de opacidad, solo desde `lg`.",
      layout: "stretch",
      code: `<Section className="relative overflow-hidden">
  <BarberGlyph kind="razor" floating rotate={-8} className="absolute -bottom-10 -left-24 hidden w-[40rem] text-text-primary opacity-[0.05] lg:block" />
  …
</Section>`,
      render: () => (
        <Stage className="min-h-[240px]">
          <BarberGlyph kind="razor" floating rotate={-8} className="absolute -bottom-10 -left-24 w-[32rem] text-text-primary opacity-[0.06]" />
          <div className="relative flex min-h-[240px] flex-col items-end justify-center gap-1 p-section text-right">
            <Heading level={3}>Lo que ponemos</Heading>
            <Text variant="muted">Acceso completo, línea directa y condiciones de fundador.</Text>
          </div>
        </Stage>
      ),
    },
    {
      id: "comb",
      title: "El peine",
      description: "El peine es horizontal y funciona mejor cruzando el borde superior o inferior de la sección.",
      layout: "stretch",
      code: `<BarberGlyph kind="comb" floating rotate={4} className="absolute -right-20 -top-8 w-[30rem] text-primary opacity-[0.08]" />`,
      render: () => (
        <Stage className="min-h-[200px]">
          <BarberGlyph kind="comb" floating rotate={4} className="absolute -right-16 -top-4 w-[26rem] text-primary opacity-[0.1]" />
          <div className="relative flex min-h-[200px] items-center p-section">
            <Heading level={3}>02 · El camino</Heading>
          </div>
        </Stage>
      ),
    },
  ],
  props: [
    { name: "kind", type: '"comb" | "razor"', description: "El glifo: peine o navaja abierta." },
    { name: "floating", type: "boolean", default: "false", description: "Flotación lenta de 14 s sobre la inclinación de `rotate`." },
    { name: "rotate", type: "number", default: "0", description: "Grados de inclinación en reposo." },
    { name: "className", type: "string", description: "Posición absoluta, ancho, color (`text-text-primary`) y opacidad (`opacity-[0.05]`)." },
  ],
  guidelines: {
    do: ["Opacidad entre 4 % y 10 %: si se lee como dibujo, sobra.", "Uno por sección y solo en pantallas anchas (`hidden lg:block`)."],
    dont: ["No los uses como iconos ni como ilustración de un estado vacío.", "No los animes con otra cosa que `floating`: un glifo que se mueve mucho deja de ser fondo."],
  },
  related: ["hair-canvas", "pole-ring"],
});
