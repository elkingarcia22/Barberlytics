import { Marquee } from "@/components/atmosphere";
import { defineEntry, definePlayground } from "../types";
import { Stage, TRADE_WORDS } from "./fixtures";

export const marqueeEntry = defineEntry({
  id: "marquee",
  name: "Marquee",
  group: "atmosphere",
  description:
    "Ticker de vocabulario en bucle: los extremos se funden con el fondo, cada palabra lleva su rombo del primario y se pausa al pasar el puntero. Es decorativo (aria-hidden): lo que diga tiene que estar también en el contenido. Con prefers-reduced-motion se vuelve una lista fija que envuelve.",
  importPath: 'import { Marquee } from "@/components/atmosphere"',
  sourcePath: "src/components/atmosphere/Marquee.tsx",
  status: "stable",
  tags: ["ticker", "bucle", "decorativo"],
  playground: definePlayground({
    controls: {
      duration: { type: "number", label: "Segundos por vuelta", default: 48, min: 10, max: 120, step: 2 },
    },
    layout: "stretch",
    render: ({ duration }) => (
      <Stage>
        <Marquee items={TRADE_WORDS} duration={duration} />
      </Stage>
    ),
    code: ({ duration }) => `const ITEMS = ["Fade", "Taper", "Navaja", "Barba", "Agenda", "Cierre de caja"];

<Marquee items={ITEMS}${duration === 48 ? "" : ` duration={${duration}}`} />`,
  }),
  examples: [
    {
      id: "under-hero",
      title: "Bajo la portada",
      description: "En la landing va justo después del hero, con el vocabulario del oficio y del negocio mezclados.",
      layout: "stretch",
      code: `<Marquee items={["Fade", "Taper", "Navaja", "Agenda", "Comisiones", "IA que aprende"]} />`,
      render: () => (
        <Stage>
          <Marquee items={TRADE_WORDS} />
        </Stage>
      ),
    },
  ],
  props: [
    { name: "items", type: "readonly string[]", description: "Las palabras. Se duplican por dentro para que el bucle no tenga costura." },
    { name: "duration", type: "number", default: "48", description: "Segundos que tarda una vuelta completa." },
    { name: "...props", type: 'React.ComponentProps<"div">', description: "Atributos del contenedor; `className` para márgenes." },
  ],
  guidelines: {
    do: ["Ocho a quince palabras cortas; el ticker se lee de reojo.", "Ponlo a todo el ancho, entre dos bloques, con sus bordes superior e inferior."],
    dont: ["No metas enlaces ni botones: es aria-hidden y no recibe foco.", "No lo uses para avisos o noticias; un ticker con contenido real es un carrusel sin controles."],
  },
  related: ["cut-line", "foil"],
});
