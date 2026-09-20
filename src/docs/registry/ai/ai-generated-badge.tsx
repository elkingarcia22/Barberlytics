import { AiGeneratedBadge } from "@/components/ai-interaction";
import { Card, CardContent } from "@/components/ui/card";
import { defineEntry } from "../types";

function LabeledRow({ label, withBadge, children }: { label: string; withBadge?: boolean; children: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">{label}</span>
        {withBadge && <AiGeneratedBadge />}
      </div>
      <p className="text-sm text-text-primary">{children}</p>
    </div>
  );
}

export const aiGeneratedBadgeEntry = defineEntry({
  id: "ai-generated-badge",
  name: "AiGeneratedBadge",
  group: "ai",
  description:
    "Marca de procedencia: este contenido lo escribió la IA. Es solo la chispa con el degradado de IA y un tooltip que guarda la palabra; no es un estado ni una acción, y por eso no se puede pulsar ni cambia al editar.",
  importPath: 'import { AiGeneratedBadge } from "@/components/ai-interaction"',
  sourcePath: "src/components/ai-interaction/AiGeneratedBadge.tsx",
  status: "stable",
  tags: ["ia", "tooltip", "procedencia"],
  examples: [
    {
      id: "in-label",
      title: "En la línea del rótulo",
      description: "Va junto al rótulo en versalitas («OBJETIVO 1»), no junto al título, para leerse como metadato y no como parte del contenido. Pasa el cursor para ver el tooltip.",
      layout: "stretch",
      code: `<div className="flex items-center gap-1.5">
  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">Objetivo 1</span>
  <AiGeneratedBadge />
</div>
<p className="text-sm">Aumentar la retención del equipo comercial un 10% este semestre.</p>`,
      render: () => (
        <Card className="mx-auto w-full max-w-md">
          <CardContent className="space-y-4 pt-6">
            <LabeledRow label="Objetivo 1" withBadge>
              Aumentar la retención del equipo comercial un 10% este semestre.
            </LabeledRow>
            <LabeledRow label="Objetivo 2">Cerrar el plan de sucesión de las tres gerencias regionales.</LabeledRow>
            <LabeledRow label="Objetivo 3" withBadge>
              Reducir el tiempo de onboarding de 6 a 4 semanas.
            </LabeledRow>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "multiple",
      title: "Varias instancias",
      description: "Cada badge pinta con su propio id de degradado (`React.useId`), así varias en la misma vista no se pisan.",
      code: `<AiGeneratedBadge />
<AiGeneratedBadge className="opacity-60" />
<AiGeneratedBadge className="[&_svg]:size-5" />`,
      render: () => (
        <div className="flex items-center gap-4">
          <AiGeneratedBadge />
          <AiGeneratedBadge className="opacity-60" />
          <AiGeneratedBadge className="[&_svg]:size-5" />
        </div>
      ),
    },
  ],
  props: [{ name: "className", type: "string", description: "Clases extra para el contenedor inline. El icono mide 14px por defecto." }],
  guidelines: {
    do: ["Colócala junto al rótulo de la pieza, no junto al título.", "Úsala en todo contenido que redactó la IA y el usuario aún puede revisar.", "Deja que el tooltip diga la palabra: la chispa sola ya es la marca."],
    dont: ["No la conviertas en botón ni la uses como estado de carga.", "No la retires cuando el usuario edita el texto: sigue indicando su origen.", "No la uses en contenido escrito por personas: el degradado de IA marca procedencia."],
  },
  related: ["ai-spark-glyph", "badge", "tooltip"],
});
