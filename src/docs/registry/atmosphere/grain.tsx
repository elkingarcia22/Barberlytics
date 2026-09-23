import { Grain, Halo } from "@/components/atmosphere";
import { Heading, Text } from "@/components/typography";
import { defineEntry, definePlayground } from "../types";
import { Stage } from "./fixtures";

export const grainEntry = defineEntry({
  id: "grain",
  name: "Grain",
  group: "atmosphere",
  description:
    "Grano: una textura de ruido (un SVG en línea, sin coste de red) fundida sobre el fondo con soft-light y sin interceptar el puntero. Es lo que separa un fondo plano de una superficie con material. Con scope=\"page\" se fija al viewport una sola vez; con \"container\", al padre relative.",
  importPath: 'import { Grain } from "@/components/atmosphere"',
  sourcePath: "src/components/atmosphere/Grain.tsx",
  status: "stable",
  tags: ["fondo", "textura", "svg"],
  playground: definePlayground({
    controls: {
      withHalo: { type: "boolean", label: "Con halo", default: true },
    },
    layout: "stretch",
    render: ({ withHalo }) => (
      <Stage className="min-h-[240px]">
        {withHalo && <Halo x="12%" y="-10%" size="60rem 40rem" strength={0.16} />}
        <Grain />
        <div className="relative flex min-h-[240px] flex-col justify-end p-section">
          <Heading level={3}>Superficie con material</Heading>
          <Text variant="muted">El grano se nota sobre el halo, no sobre el fondo plano.</Text>
        </div>
      </Stage>
    ),
    code: ({ withHalo }) => `<div className="relative">
${withHalo ? '  <Halo x="12%" y="-10%" size="60rem 40rem" strength={0.16} />\n' : ""}  <Grain />
  <main className="relative">…</main>
</div>`,
  }),
  examples: [
    {
      id: "page",
      title: "En la página entera",
      description: "Una vez, en el contenedor de página, fijo al viewport. El contenido va `relative` para quedar por delante.",
      layout: "stretch",
      code: `<div className="page-atmosphere">
  <Grain scope="page" />
  <Vignette scope="page" />
  <main className="relative">…</main>
</div>`,
      render: () => (
        <Stage className="min-h-[160px]">
          <Grain />
          <div className="relative flex min-h-[160px] items-center p-section">
            <Text variant="muted">En esta demo el grano va al contenedor; en la página real, al viewport con scope=&quot;page&quot;.</Text>
          </div>
        </Stage>
      ),
    },
  ],
  props: [
    { name: "scope", type: '"page" | "container"', default: '"container"', description: "`page` lo fija al viewport (una vez por página); `container`, al padre relative." },
    { name: "className", type: "string", description: "Opacidad o mezcla distintas (`opacity-30`)." },
  ],
  guidelines: {
    do: ["Uno por página, junto a la atmósfera del tema (`.page-atmosphere`) y la viñeta.", "Deja el 40 % de opacidad: es un material, no un efecto."],
    dont: ["No lo pongas en cards ni en drawers: el grano es del fondo.", "No lo uses en pantallas de producto densas (tablas, formularios); es para páginas de marca."],
  },
  related: ["vignette", "halo", "hair-canvas"],
});
