import { Vignette } from "@/components/atmosphere";
import { Heading, Text } from "@/components/typography";
import { defineEntry } from "../types";
import { Stage } from "./fixtures";

export const vignetteEntry = defineEntry({
  id: "vignette",
  name: "Vignette",
  group: "atmosphere",
  description:
    "Viñeta: los bordes se hunden y el centro respira. En oscuro es sombra; en claro, un velo del primario del tema. Va una vez, sobre el fondo de la página o de una portada, y nunca sobre una card.",
  importPath: 'import { Vignette } from "@/components/atmosphere"',
  sourcePath: "src/components/atmosphere/Vignette.tsx",
  status: "stable",
  tags: ["fondo", "gradiente"],
  examples: [
    {
      id: "cover",
      title: "Sobre una portada",
      description: "Cambia el modo con el conmutador de la doc: en claro el hundimiento toma el matiz del primario.",
      layout: "stretch",
      code: `<section className="relative overflow-hidden">
  <Vignette />
  <div className="relative">…</div>
</section>`,
      render: () => (
        <Stage className="min-h-[260px]">
          <Vignette />
          <div className="relative flex min-h-[260px] flex-col items-center justify-center gap-2 p-section text-center">
            <Heading level={2}>El centro respira</Heading>
            <Text variant="muted">Los bordes se hunden.</Text>
          </div>
        </Stage>
      ),
    },
  ],
  props: [
    { name: "scope", type: '"page" | "container"', default: '"container"', description: "`page` lo fija al viewport; `container`, al padre relative." },
    { name: "className", type: "string", description: "Clases extra." },
  ],
  guidelines: {
    do: ["Combínala con Grain y con la atmósfera del tema: las tres juntas son el fondo de una landing.", "Ponla antes del contenido en el árbol y deja el contenido `relative`."],
    dont: ["No la uses en el shell de producto: el sidebar y las tablas no quieren bordes hundidos.", "No apiles dos viñetas (página y sección)."],
  },
  related: ["grain", "halo"],
});
