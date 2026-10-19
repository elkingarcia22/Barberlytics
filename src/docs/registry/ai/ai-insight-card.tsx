import { AIInsightCard, type AIConfidence, type AIInsightType } from "@/components/ai";
import { defineEntry, definePlayground } from "../types";

const TYPES = ["insight", "risk", "recommendation", "opportunity"] as const;
const CONFIDENCES = ["low", "medium", "high"] as const;

export const aiInsightCardEntry = defineEntry({
  id: "ai-insight-card",
  name: "AIInsightCard",
  group: "ai",
  description:
    "Tarjeta para un hallazgo de la IA: tipo (insight, riesgo, recomendación u oportunidad), nivel de confianza, evidencia e impacto en dos columnas y una acción opcional al pie. Es la unidad que AIPanel agrupa.",
  importPath: 'import { AIInsightCard } from "@/components/ai"',
  sourcePath: "src/components/ai/AIInsightCard.tsx",
  status: "stable",
  tags: ["ia", "card", "insights"],
  playground: definePlayground({
    controls: {
      type: { type: "select", options: TYPES, default: "insight" },
      confidence: { type: "select", label: "Confianza", options: CONFIDENCES, default: "high" },
      title: { type: "text", default: "La rotación en Ventas subió 4 puntos" },
      withDetails: { type: "boolean", label: "Evidencia e impacto", default: true },
      actionLabel: { type: "text", label: "Acción", default: "Ver detalle" },
    },
    layout: "stretch",
    render: ({ type, confidence, title, withDetails, actionLabel }) => (
      <div className="mx-auto w-full max-w-md">
        <AIInsightCard
          type={type as AIInsightType}
          confidence={confidence as AIConfidence}
          title={title}
          description="Comparado con el trimestre anterior, concentrado en el equipo de la región Andina."
          evidence={withDetails ? "23 salidas en 90 días" : undefined}
          impact={withDetails ? "Alto en cumplimiento de cuota" : undefined}
          actionLabel={actionLabel || undefined}
        />
      </div>
    ),
    code: ({ type, confidence, title, withDetails, actionLabel }) => {
      const attrs = [
        type !== "insight" ? `type="${type}"` : "",
        confidence ? `confidence="${confidence}"` : "",
        `title="${title}"`,
        'description="Comparado con el trimestre anterior, concentrado en el equipo de la región Andina."',
        withDetails ? 'evidence="23 salidas en 90 días"' : "",
        withDetails ? 'impact="Alto en cumplimiento de cuota"' : "",
        actionLabel ? `actionLabel="${actionLabel}"\n  onAction={() => {}}` : "",
      ].filter(Boolean);
      return `<AIInsightCard\n  ${attrs.join("\n  ")}\n/>`;
    },
  }),
  examples: [
    {
      id: "types",
      title: "Tipos",
      description: "El icono, la etiqueta y el color del encabezado cambian por tipo.",
      layout: "stretch",
      code: `<AIInsightCard type="insight" title="El eNPS mejora en equipos con líder nuevo" confidence="high" />
<AIInsightCard type="risk" title="Riesgo de burnout en Soporte" confidence="medium" />
<AIInsightCard type="recommendation" title="Reforzar el onboarding de Producto" confidence="medium" />
<AIInsightCard type="opportunity" title="Talento interno listo para promoción" confidence="low" />`,
      render: () => (
        <div className="grid gap-4 md:grid-cols-2">
          <AIInsightCard type="insight" title="El eNPS mejora en equipos con líder nuevo" confidence="high" />
          <AIInsightCard type="risk" title="Riesgo de burnout en Soporte" confidence="medium" />
          <AIInsightCard type="recommendation" title="Reforzar el onboarding de Producto" confidence="medium" />
          <AIInsightCard type="opportunity" title="Talento interno listo para promoción" confidence="low" />
        </div>
      ),
    },
    {
      id: "full",
      title: "Con evidencia, impacto y acción",
      description: "Evidencia e impacto se muestran en dos columnas; `actionLabel` añade el pie con la flecha.",
      layout: "stretch",
      code: `<AIInsightCard
  type="risk"
  confidence="high"
  title="Tres gerencias sin plan de sucesión"
  description="Ninguna de las gerencias regionales tiene un sucesor identificado."
  evidence="0 de 3 con sucesor"
  impact="Continuidad operativa"
  actionLabel="Crear plan de sucesión"
  onAction={() => {}}
/>`,
      render: () => (
        <div className="mx-auto w-full max-w-md">
          <AIInsightCard
            type="risk"
            confidence="high"
            title="Tres gerencias sin plan de sucesión"
            description="Ninguna de las gerencias regionales tiene un sucesor identificado."
            evidence="0 de 3 con sucesor"
            impact="Continuidad operativa"
            actionLabel="Crear plan de sucesión"
            onAction={() => undefined}
          />
        </div>
      ),
    },
  ],
  props: [
    { name: "title", type: "string", description: "Titular del hallazgo. Obligatorio." },
    { name: "description", type: "string", description: "Explicación breve bajo el título." },
    { name: "type", type: '"insight" | "risk" | "recommendation" | "opportunity"', default: '"insight"', description: "Naturaleza del hallazgo; define icono, etiqueta y color." },
    { name: "confidence", type: '"low" | "medium" | "high" | null', default: "null", description: "Nivel de confianza mostrado como badge en la esquina. Sin valor no se muestra: pásalo solo cuando un modelo dé una confianza real, nunca sobre una regla." },
    { name: "evidence", type: "string", description: "Dato que sustenta el hallazgo." },
    { name: "impact", type: "string", description: "Consecuencia esperada." },
    { name: "actionLabel", type: "string", description: "Texto del botón al pie. Sin él no hay pie." },
    { name: "onAction", type: "() => void", description: "Callback de la acción del pie." },
    { name: "className", type: "string", description: "Clases extra para la Card." },
  ],
  guidelines: {
    do: ["Muestra siempre la confianza: el usuario decide cuánto fiarse.", "Rellena evidencia e impacto cuando existan; es lo que hace accionable el hallazgo.", "Usa `risk` solo para lo que requiere atención, no para cualquier dato negativo."],
    dont: ["No mezcles varios hallazgos en una tarjeta; una tarjeta, un insight.", "No uses la tarjeta para contenido que no generó la IA: la identidad de IA marca procedencia."],
  },
  related: ["ai-panel", "card", "badge"],
});
