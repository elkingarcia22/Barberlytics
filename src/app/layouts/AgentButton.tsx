import { useAppT } from "@/app/i18n";
import { useRailVisible } from "@/components/action-rail";
import { AiSparkGlyph } from "@/components/ai-interaction";
import { Button } from "@/components/ui/button";

/**
 * El agente de IA en la cabecera de todas las pantallas: un botón del mismo
 * tamaño que las demás acciones, con el borde y la chispa de la IA. Abre la
 * conversación con el contexto de la pantalla.
 *
 * Cuando las acciones viven en la barra flotante, el agente va en ella (ver
 * `RailAgentProvider`) y este botón se quita para no estar dos veces.
 */
export function AgentButton({ onOpen }: { onOpen: () => void }) {
  const t = useAppT();
  const inRail = useRailVisible();
  if (inRail) return null;
  return (
    <Button variant="outline" className="border-ai-gradient-surface" onClick={onOpen} data-testid="agent-open">
      <AiSparkGlyph size={16} /> {t("agent.name")}
    </Button>
  );
}
