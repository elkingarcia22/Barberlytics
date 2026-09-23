import { Foil } from "@/components/atmosphere";
import { Heading } from "@/components/typography";
import { defineEntry, definePlayground } from "../types";

export const foilEntry = defineEntry({
  id: "foil",
  name: "Foil",
  group: "atmosphere",
  description:
    "Lámina dorada: la palabra de marca de un titular con un barrido de luz cada siete segundos. El oro es --color-brand, así que en un tema azul la lámina es azul. Es el único sitio de la capa donde se anima background-position: una palabra, no una frase.",
  importPath: 'import { Foil } from "@/components/atmosphere"',
  sourcePath: "src/components/atmosphere/Foil.tsx",
  status: "stable",
  tags: ["texto", "marca", "gradiente"],
  playground: definePlayground({
    controls: {
      word: { type: "text", label: "Palabra", default: "contigo" },
      as: { type: "select", label: "Etiqueta", options: ["em", "span", "strong"], default: "em" },
    },
    render: ({ word, as }) => (
      <Heading level={1}>
        La entrenamos <Foil as={as as "em" | "span" | "strong"}>{word}</Foil>.
      </Heading>
    ),
    code: ({ word, as }) => `<Heading level={1}>
  La entrenamos <Foil${as === "span" ? "" : ` as="${as}"`}>${word}</Foil>.
</Heading>`,
  }),
  examples: [
    {
      id: "closing",
      title: "En el cierre",
      description: "La misma lámina cierra la página en el último titular; en medio, ninguna.",
      code: `<Heading level={2}>
  La IA que va a mover tu barbería se entrena en <Foil>este grupo</Foil>.
</Heading>`,
      render: () => (
        <Heading level={2}>
          La IA que va a mover tu barbería se entrena en <Foil>este grupo</Foil>.
        </Heading>
      ),
    },
  ],
  props: [
    { name: "as", type: '"span" | "em" | "strong"', default: '"span"', description: "Etiqueta en línea; `em` para la palabra enfática de un titular." },
    { name: "...props", type: "React.HTMLAttributes<HTMLElement>", description: "Atributos del elemento." },
  ],
  guidelines: {
    do: ["Una palabra o dos por pantalla, en el titular de portada y en el de cierre.", "Úsalo sobre un Heading grande: a 14px la lámina no se ve."],
    dont: ["No lo apliques a un párrafo ni a un botón.", "No lo combines con `text-brand-gradient` en el mismo titular: uno de los dos sobra."],
  },
  related: ["heading", "rotating-seal"],
});
