import { AiSparkGlyph } from "@/components/ai-interaction";
import { defineEntry, definePlayground } from "../types";

export const aiSparkGlyphEntry = defineEntry({
  id: "ai-spark-glyph",
  name: "AiSparkGlyph",
  group: "ai",
  description:
    "La chispa de la IA: el destello grande con dos satélites que laten a destiempo. Vive suelta porque es la misma marca a 42px en el panel de análisis y a 18px en una tarjeta que se rehace; el latido escalonado es lo que la hace leerse como trabajo en curso.",
  importPath: 'import { AiSparkGlyph } from "@/components/ai-interaction"',
  sourcePath: "src/components/ai-interaction/AiSparkGlyph.tsx",
  status: "stable",
  tags: ["ia", "svg", "degradado"],
  playground: definePlayground({
    controls: {
      size: { type: "number", label: "Tamaño (px)", default: 42, min: 12, max: 96, step: 2 },
    },
    render: ({ size }) => <AiSparkGlyph size={size} />,
    code: ({ size }) => (size === 42 ? "<AiSparkGlyph />" : `<AiSparkGlyph size={${size}} />`),
  }),
  examples: [
    {
      id: "sizes",
      title: "Tamaños",
      description: "El SVG escala sin perder el trazo relativo; el degradado usa un id único por instancia.",
      code: `<AiSparkGlyph size={18} />
<AiSparkGlyph size={24} />
<AiSparkGlyph />
<AiSparkGlyph size={64} />`,
      render: () => (
        <div className="flex items-end gap-6">
          <AiSparkGlyph size={18} />
          <AiSparkGlyph size={24} />
          <AiSparkGlyph />
          <AiSparkGlyph size={64} />
        </div>
      ),
    },
    {
      id: "halo",
      title: "Con halo",
      description: "El halo difuminado que usa AiAnalyzingState detrás de la chispa, para cuando la pieza es la protagonista.",
      code: `<div className="relative flex h-16 w-16 items-center justify-center">
  <div className="absolute h-11 w-11 animate-pulse rounded-full bg-ai-gradient opacity-20 blur-xl" />
  <AiSparkGlyph size={42} />
</div>`,
      render: () => (
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute h-11 w-11 animate-pulse rounded-full bg-ai-gradient opacity-20 blur-xl" />
          <AiSparkGlyph size={42} />
        </div>
      ),
    },
  ],
  props: [
    { name: "size", type: "number", default: "42", description: "Lado del glifo en píxeles." },
    { name: "className", type: "string", description: "Clases extra para el <svg>. Es `aria-hidden`: acompáñalo de texto." },
  ],
  guidelines: {
    do: ["Úsala como marca de «la IA está trabajando» junto a un texto que lo diga.", "Prefiere AiAnalyzingState o AiGeneratedBadge; usa el glifo suelto solo para composiciones nuevas de IA."],
    dont: ["No la uses como icono decorativo en superficies que no son de IA: el degradado está reservado.", "No dupliques el SVG en otro componente; importa este para que el dibujo no se separe."],
  },
  related: ["ai-analyzing-state", "ai-generated-badge", "ubits-icon"],
});
