import * as React from "react";
import { AgentView } from "@/components/app-shell/AgentView";
import { ShellConfigContext, resolveShellConfig } from "@/components/app-shell";
import { defineEntry } from "../types";
import { ShellFrame } from "./layoutDemo";

/** La vista con un ShellConfig propio y un registro del último prompt enviado. */
function AgentViewDemo({ userName, suggestions, height = 560 }: { userName?: string; suggestions?: readonly string[]; height?: number }) {
  const [lastPrompt, setLastPrompt] = React.useState<string | null>(null);

  const config = React.useMemo(
    () =>
      resolveShellConfig({
        ...(userName ? { user: { name: userName, email: "demo@ejemplo.com" } } : {}),
        ...(suggestions ? { agentSuggestions: suggestions } : {}),
        onAgentPrompt: setLastPrompt,
      }),
    [userName, suggestions]
  );

  return (
    <ShellConfigContext.Provider value={config}>
      <ShellFrame height={height}>
        <div className="relative h-full bg-background">
          <AgentView />
          <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[12px] text-text-muted">
            {lastPrompt ? `onAgentPrompt("${lastPrompt}")` : "Escribe algo y envía, o pulsa una sugerencia"}
          </p>
        </div>
      </ShellFrame>
    </ShellConfigContext.Provider>
  );
}

export const agentViewEntry = defineEntry({
  id: "agent-view",
  name: "AgentView",
  group: "layout",
  description:
    "La pantalla inicial del Agente IA que AdminShell muestra en modo «agent»: saludo con el nombre de la persona, la tarjeta de prompt con el borde animado de IA y cuatro sugerencias que rellenan el campo. No tiene props: lee `user`, `agentSuggestions` y `onAgentPrompt` de ShellConfig, y de momento es solo la portada, sin hilo de conversación.",
  importPath: 'import { AgentView } from "@/components/app-shell/AgentView"',
  sourcePath: "src/components/app-shell/AgentView.tsx",
  status: "beta",
  tags: ["shell-config", "ai", "moving-border-beam"],
  examples: [
    {
      id: "default",
      title: "Portada del agente",
      description: "Con el ShellConfig por defecto saluda a Carolina y ofrece las `AGENT_SUGGESTIONS` de demostración. Enviar limpia el campo y dispara `onAgentPrompt` con el texto recortado.",
      layout: "stretch",
      code: `// AdminShell la monta cuando mode === "agent":
<AdminShell config={{ onAgentPrompt: (prompt) => askAgent(prompt) }}>…</AdminShell>

// Suelta, dentro de un contenedor con altura:
<div className="h-full bg-background">
  <AgentView />
</div>`,
      render: () => <AgentViewDemo />,
    },
    {
      id: "custom-config",
      title: "Persona y sugerencias propias",
      description: "Todo lo que muestra sale de ShellConfig: el primer nombre del `user`, las `agentSuggestions` y el callback. Aquí un provider local sustituye los datos de demostración.",
      layout: "stretch",
      code: `const config = resolveShellConfig({
  user: { name: "Andrés Malo", email: "andres@ejemplo.com" },
  agentSuggestions: [
    "¿Qué vacantes llevan más de 30 días abiertas?",
    "Resume el desempeño del equipo de Ventas.",
    "¿Quién no ha terminado el onboarding?",
    "Prepara el informe de clima para liderazgo.",
  ],
  onAgentPrompt: (prompt) => askAgent(prompt),
});

<ShellConfigContext.Provider value={config}>
  <AgentView />
</ShellConfigContext.Provider>`,
      render: () => (
        <AgentViewDemo
          userName="Andrés Malo"
          suggestions={[
            "¿Qué vacantes llevan más de 30 días abiertas?",
            "Resume el desempeño del equipo de Ventas.",
            "¿Quién no ha terminado el onboarding?",
            "Prepara el informe de clima para liderazgo.",
          ]}
        />
      ),
    },
    {
      id: "compact",
      title: "En poco alto",
      description: "El contenido se centra verticalmente y hace scroll si no cabe; las sugerencias pasan de cuatro columnas a dos y a una según el ancho.",
      layout: "stretch",
      code: `<div className="h-[360px] bg-background">
  <AgentView />
</div>`,
      render: () => <AgentViewDemo height={360} />,
    },
  ],
  props: [
    { name: "config.user", type: "ShellUser", description: "Vía ShellConfig. Del `name` se toma el primer nombre para el saludo." },
    { name: "config.agentSuggestions", type: "readonly string[]", description: "Vía ShellConfig. Las tarjetas de sugerencia; al pulsarlas rellenan el prompt y enfocan el campo." },
    { name: "config.onAgentPrompt", type: "(prompt: string) => void", description: "Vía ShellConfig. Se llama con el texto recortado al pulsar «Enviar»; un prompt vacío no dispara nada." },
  ],
  guidelines: {
    do: [
      "Conecta `onAgentPrompt` en el `config` de AdminShell; la vista se encarga de vaciar el campo.",
      "Mantén las sugerencias en cuatro y escritas como peticiones completas: son el prompt tal cual.",
      "Móntala dentro de un contenedor con altura definida; se centra con `h-full`.",
    ],
    dont: [
      "No le añadas estado de conversación: para el hilo de chat está AiAgentDrawer o el panel del agente.",
      "No la uses fuera del modo «agent» del shell; su saludo y su borde de IA presuponen ese contexto.",
    ],
  },
  related: ["admin-shell", "app-sidebar", "ai-agent-drawer"],
});
