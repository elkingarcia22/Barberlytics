import * as React from "react";
import { RefreshCw } from "lucide-react";
import { AIInsightCard, AIPanel } from "@/components/ai";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const REFRESH_MS = 1600;

function RefreshablePanel() {
  const [loading, setLoading] = React.useState(false);
  const [generation, setGeneration] = React.useState(1);
  React.useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(() => {
      setLoading(false);
      setGeneration((value) => value + 1);
    }, REFRESH_MS);
    return () => clearTimeout(timeout);
  }, [loading]);
  return (
    <AIPanel
      title="Insights del trimestre"
      description={`Generación ${generation} · basada en 1.240 respuestas`}
      loading={loading}
      actions={
        <Button variant="outline" size="sm" onClick={() => setLoading(true)} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : undefined} /> Regenerar
        </Button>
      }
      footer={<p className="text-xs text-text-muted">La IA puede cometer errores; verifica antes de actuar.</p>}
    >
      <AIInsightCard type="insight" title="El eNPS sube 6 puntos en equipos híbridos" evidence="+6 vs Q2" impact="Retención" />
      <AIInsightCard type="risk" title="Soporte reporta carga alta tres meses seguidos" confidence="medium" evidence="72% sobre umbral" impact="Rotación" />
    </AIPanel>
  );
}

export const aiPanelEntry = defineEntry({
  id: "ai-panel",
  name: "AIPanel",
  group: "ai",
  description:
    "Contenedor de insights de IA: una Card con la chispa en el título, acciones en la cabecera, pie opcional y estados de carga y vacío ya resueltos. Sus hijos suelen ser AIInsightCard apilados en una columna.",
  importPath: 'import { AIPanel } from "@/components/ai"',
  sourcePath: "src/components/ai/AIPanel.tsx",
  status: "stable",
  tags: ["ia", "card", "insights"],
  playground: definePlayground({
    controls: {
      title: { type: "text", default: "Insights de Clipper" },
      description: { type: "text", default: "Basados en las respuestas de la última semana" },
      loading: { type: "boolean", label: "Cargando", default: false },
      empty: { type: "boolean", label: "Vacío", default: false },
      withActions: { type: "boolean", label: "Con acciones", default: true },
      withFooter: { type: "boolean", label: "Con pie", default: false },
    },
    layout: "stretch",
    render: ({ title, description, loading, empty, withActions, withFooter }) => (
      <AIPanel
        title={title}
        description={description || undefined}
        loading={loading}
        empty={empty}
        actions={withActions ? <Button variant="outline" size="sm">Regenerar</Button> : undefined}
        footer={withFooter ? <p className="text-xs text-text-muted">Actualizado hace 2 minutos.</p> : undefined}
      >
        <AIInsightCard type="insight" title="La participación creció un 12%" evidence="+12% vs mes anterior" impact="Representatividad" />
        <AIInsightCard type="recommendation" title="Enviar recordatorio a Operaciones" confidence="medium" />
      </AIPanel>
    ),
    code: ({ title, description, loading, empty, withActions, withFooter }) => {
      const attrs = [
        title !== "Insights de Clipper" ? `title="${title}"` : "",
        description ? `description="${description}"` : "",
        loading ? "loading" : "",
        empty ? "empty" : "",
        withActions ? 'actions={<Button variant="outline" size="sm">Regenerar</Button>}' : "",
        withFooter ? 'footer={<p className="text-xs text-text-muted">Actualizado hace 2 minutos.</p>}' : "",
      ].filter(Boolean);
      const open = attrs.length ? `<AIPanel\n  ${attrs.join("\n  ")}\n>` : "<AIPanel>";
      return `${open}
  <AIInsightCard type="insight" title="La participación creció un 12%" evidence="+12% vs mes anterior" impact="Representatividad" />
  <AIInsightCard type="recommendation" title="Enviar recordatorio a Operaciones" confidence="medium" />
</AIPanel>`;
    },
  }),
  examples: [
    {
      id: "refresh",
      title: "Con acciones y regeneración",
      description: "El botón de la cabecera pone el panel en `loading`; al terminar los hijos vuelven a montarse.",
      layout: "stretch",
      frameClassName: "min-h-[320px]",
      code: `const [loading, setLoading] = React.useState(false);

<AIPanel
  title="Insights del trimestre"
  description="Basada en 1.240 respuestas"
  loading={loading}
  actions={<Button variant="outline" size="sm" onClick={() => setLoading(true)}><RefreshCw /> Regenerar</Button>}
  footer={<p className="text-xs text-text-muted">La IA puede cometer errores; verifica antes de actuar.</p>}
>
  <AIInsightCard type="insight" title="El eNPS sube 6 puntos en equipos híbridos" evidence="+6 vs Q2" impact="Retención" />
  <AIInsightCard type="risk" title="Soporte reporta carga alta tres meses seguidos" confidence="medium" />
</AIPanel>`,
      render: () => <RefreshablePanel />,
    },
    {
      id: "empty",
      title: "Vacío",
      description: "Con `empty` muestra un EmptyState por defecto; `emptyState` lo reemplaza.",
      layout: "stretch",
      code: `<AIPanel empty>
  {/* los hijos no se renderizan */}
</AIPanel>`,
      render: () => (
        <AIPanel empty>
          <span />
        </AIPanel>
      ),
    },
  ],
  props: [
    { name: "title", type: "string", default: '"Insights de Clipper"', description: "Título junto a la chispa." },
    { name: "description", type: "string", description: "Subtítulo bajo el título." },
    { name: "children", type: "React.ReactNode", description: "Contenido, normalmente AIInsightCard. Se apila en una columna con gap." },
    { name: "actions", type: "React.ReactNode", description: "Botones a la derecha de la cabecera." },
    { name: "footer", type: "React.ReactNode", description: "Pie separado por una línea." },
    { name: "loading", type: "boolean", default: "false", description: "Reemplaza el contenido por un spinner con texto." },
    { name: "empty", type: "boolean", default: "false", description: "Reemplaza el contenido por el estado vacío." },
    { name: "emptyState", type: "React.ReactNode", description: "Estado vacío a medida; por defecto usa EmptyState." },
    { name: "className", type: "string", description: "Clases extra para la Card." },
  ],
  guidelines: {
    do: ["Agrupa aquí todo lo que generó la IA en la vista, en vez de dispersar tarjetas.", "Ofrece una acción de regenerar cuando el usuario pueda cambiar la entrada.", "Deja el aviso de verificación en el `footer`."],
    dont: ["No lo uses como contenedor genérico: la identidad de IA marca procedencia del contenido.", "No mezcles `loading` y `empty` a la vez; `loading` gana y el estado vacío no se ve."],
  },
  related: ["ai-insight-card", "card", "empty-state"],
});
