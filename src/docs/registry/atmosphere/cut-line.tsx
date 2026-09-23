import { CutLine } from "@/components/atmosphere";
import { Heading, Text } from "@/components/typography";
import { defineEntry } from "../types";
import { Stage } from "./fixtures";

export const cutLineEntry = defineEntry({
  id: "cut-line",
  name: "CutLine",
  group: "atmosphere",
  description:
    "Separador entre secciones: unas tijeras cruzan la página y dejan la línea continua convertida en línea de puntos. La continua se recorta con clip-path y las tijeras viajan con transform hasta el ancho que mide el propio componente. Arranca la primera vez que entra en pantalla; con prefers-reduced-motion queda en su estado final, ya cortada.",
  importPath: 'import { CutLine } from "@/components/atmosphere"',
  sourcePath: "src/components/atmosphere/CutLine.tsx",
  status: "stable",
  tags: ["barbería", "separador", "clip-path", "reveal"],
  examples: [
    {
      id: "between-sections",
      title: "Entre dos secciones",
      description: "Ocupa el ancho de su contenedor; el padding lateral lo pone la página, como con cualquier separador.",
      layout: "stretch",
      code: `<Section id="programa">…</Section>
<CutLine />
<Section id="camino">…</Section>`,
      render: () => (
        <Stage>
          <div className="space-y-stack p-card">
            <div>
              <Heading level={3}>01 · Quién eres aquí</Heading>
              <Text variant="muted">Los cuatro papeles del early adopter.</Text>
            </div>
            <CutLine />
            <div>
              <Heading level={3}>02 · El camino</Heading>
              <Text variant="muted">Las etapas de construcción y cuál es la actual.</Text>
            </div>
          </div>
        </Stage>
      ),
    },
  ],
  props: [{ name: "className", type: "string", description: "Márgenes verticales o ancho; el alto es fijo (2.5rem) para que la línea no salte." }],
  guidelines: {
    do: ["Úsalo como regla entre secciones grandes, una vez entre cada par.", "Déjale aire: el corte se lee cuando hay espacio arriba y abajo."],
    dont: ["No lo uses dentro de cards ni de listas: para eso está Separator.", "No lo pongas encima del pliegue: espera al scroll y ahí nadie lo ve moverse."],
  },
  related: ["separator", "reveal", "marquee"],
});
