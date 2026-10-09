import { AiSparkGlyph } from "@/components/ai-interaction";
import { defineEntry, definePlayground } from "../types";

export const aiSparkGlyphEntry = defineEntry({
  id: "ai-spark-glyph",
  name: "AiSparkGlyph",
  group: "ai",
  description:
    "La marca de «la IA está trabajando»: el orbe de Clipper pensando (gira rápido, halo vivo). Vive suelta porque es la misma marca a 42px en el panel de análisis y a 18px en una tarjeta que se rehace; por debajo de 32px va sin halo ni anillo.",
  importPath: 'import { AiSparkGlyph } from "@/components/ai-interaction"',
  sourcePath: "src/components/ai-interaction/AiSparkGlyph.tsx",
  status: "stable",
  tags: ["ia", "clipper", "degradado"],
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
      description: "El orbe escala con el tamaño; bajo 32px pierde el halo y el anillo.",
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
      description: "Con el halo difuminado detrás, para cuando la pieza es la protagonista (a partir de 32px ya lo trae).",
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
    { name: "className", type: "string", description: "Clases extra. Es `aria-hidden`: acompáñalo de texto." },
  ],
  guidelines: {
    do: ["Úsala como marca de «la IA está trabajando» junto a un texto que lo diga.", "Prefiere AiAnalyzingState o AiGeneratedBadge; usa el glifo suelto solo para composiciones nuevas de IA."],
    dont: ["No la uses como icono decorativo en superficies que no son de IA: el degradado está reservado.", "No dibujes otra chispa: usa este glifo o `ClipperOrb`."],
  },
  related: ["clipper-orb", "ai-analyzing-state", "ai-generated-badge", "thema-icon"],
});
