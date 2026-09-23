import * as React from "react";
import { AiAgentDrawer, type AiAgentContext } from "@/components/ai/AiAgentDrawer";
import { AGENT_PANEL_DURATION_MS, AGENT_PANEL_EASING, AGENT_PANEL_GUTTER, AGENT_PANEL_SHELL_FRAME, AGENT_PANEL_WIDTH } from "@/components/ai/agentPanelMotion";
import { ShellAgentPanelSlotProvider } from "@/components/app-shell/shellAgentPanelSlot";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const CONTEXTS = ["dashboard", "builder", "results", "demographics", "custom"] as const;

/**
 * Host mínimo que imita lo que AdminShell hace por el drawer: provee el
 * ancla (un hermano flex de la columna de contenido) a través del contexto
 * del slot, así al abrir el panel la columna se estrecha en vez de taparse.
 */
function DrawerHost({ context, customPanel }: { context: AiAgentContext; customPanel?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [host, setHost] = React.useState<HTMLDivElement | null>(null);
  return (
    <div className="flex h-[480px] w-full gap-2 overflow-hidden rounded-2xl border border-border/60 bg-background p-2">
      <ShellAgentPanelSlotProvider value={host}>
        <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-2xl border border-border/60 bg-surface p-4 shadow-card">
          <Button className="self-start" variant={open ? "outline" : "default"} onClick={() => setOpen((value) => !value)}>
            {open ? "Cerrar Agente IA" : "Abrir Agente IA"}
          </Button>
          <p className="text-sm text-text-secondary">
            Esta columna es el contenido de la pantalla. Al abrir el panel se estrecha exactamente {AGENT_PANEL_WIDTH}, en{" "}
            {AGENT_PANEL_DURATION_MS}ms, porque el drawer es un hermano flex y no un overlay.
          </p>
          <div className="grid flex-1 grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="rounded-xl border border-dashed border-border/70 bg-background" />
            ))}
          </div>
        </div>
        <AiAgentDrawer open={open} onOpenChange={setOpen} context={context} customPanel={customPanel} />
      </ShellAgentPanelSlotProvider>
      <div ref={setHost} className="relative flex h-full shrink-0" />
    </div>
  );
}

function CustomPanel() {
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-border/60 bg-surface p-5 shadow-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">Compositor de objetivos</p>
      <h2 className="text-lg font-bold text-text-primary">Tu panel a medida</h2>
      <p className="text-sm text-text-secondary">
        Con <code>context="custom"</code> el drawer solo abre y cierra el hueco; el producto entrega aquí su propia UI.
      </p>
    </div>
  );
}

const MOTION_TOKENS = [
  { name: "AGENT_PANEL_WIDTH", value: AGENT_PANEL_WIDTH, note: "Ancho del panel abierto; cede en ventanas angostas." },
  { name: "AGENT_PANEL_DURATION_MS", value: `${AGENT_PANEL_DURATION_MS}`, note: "Duración compartida por panel, cajón y velo." },
  { name: "AGENT_PANEL_EASING", value: AGENT_PANEL_EASING, note: "Curva de salida expo." },
  { name: "AGENT_PANEL_GUTTER", value: `${AGENT_PANEL_GUTTER}px`, note: "Aire a la izquierda de un Sheet corrido." },
  { name: "AGENT_PANEL_SHELL_FRAME", value: `${AGENT_PANEL_SHELL_FRAME}px`, note: "Padding + gap de la concha que un Sheet fijo debe descontar." },
];

export const aiAgentDrawerEntry = defineEntry({
  id: "ai-agent-drawer",
  name: "AiAgentDrawer",
  group: "ai",
  description:
    "El panel lateral del Agente IA. Se porta al ancla que AdminShell reserva junto a la columna de contenido (ShellAgentPanelSlot), así abrirlo estrecha la pantalla en vez de taparla; el contexto define título, placeholder y sugerencias, o se entrega un panel a medida.",
  importPath: 'import { AiAgentDrawer } from "@/components/ai/AiAgentDrawer"',
  sourcePath: "src/components/ai/AiAgentDrawer.tsx",
  status: "stable",
  tags: ["ia", "portal", "shell", "framer-motion"],
  playground: definePlayground({
    controls: {
      context: { type: "select", label: "Contexto", options: CONTEXTS, default: "dashboard" },
    },
    layout: "stretch",
    render: ({ context }) => (
      <DrawerHost key={context} context={context as AiAgentContext} customPanel={context === "custom" ? <CustomPanel /> : undefined} />
    ),
    code: ({ context }) => `const [open, setOpen] = React.useState(false);

// Dentro de <AdminShell>, que provee el ancla del panel:
<Button onClick={() => setOpen(true)}>Abrir Agente IA</Button>
<AiAgentDrawer open={open} onOpenChange={setOpen} context="${context}"${context === "custom" ? " customPanel={<MiPanel />}" : ""} />`,
  }),
  examples: [
    {
      id: "host",
      title: "Cómo funciona el ancla",
      description: "Fuera de AdminShell hay que proveer el ancla a mano: un `ShellAgentPanelSlotProvider` con un div hermano de la columna de contenido. Sin proveedor el drawer no renderiza nada.",
      layout: "stretch",
      code: `const [open, setOpen] = React.useState(false);
const [host, setHost] = React.useState<HTMLDivElement | null>(null);

<div className="flex h-[480px] gap-2 overflow-hidden p-2">
  <ShellAgentPanelSlotProvider value={host}>
    <div className="flex min-w-0 flex-1 flex-col">
      <Button onClick={() => setOpen((v) => !v)}>Abrir Agente IA</Button>
      {/* contenido de la pantalla */}
    </div>
    <AiAgentDrawer open={open} onOpenChange={setOpen} context="results" />
  </ShellAgentPanelSlotProvider>
  {/* el ancla: hermano flex de la columna */}
  <div ref={setHost} className="relative flex h-full shrink-0" />
</div>`,
      render: () => <DrawerHost context="results" />,
    },
    {
      id: "custom",
      title: "Panel a medida",
      description: "Con `context=\"custom\"` y `customPanel` el drawer solo anima el hueco; el contenido aparece mientras se abre, no después.",
      layout: "stretch",
      code: `<AiAgentDrawer
  open={open}
  onOpenChange={setOpen}
  context="custom"
  customPanel={<ObjectiveComposer />}
/>`,
      render: () => <DrawerHost context="custom" customPanel={<CustomPanel />} />,
    },
    {
      id: "motion",
      title: "Tokens de movimiento (agentPanelMotion)",
      description: "Abrir el panel mueve tres cosas a la vez (panel, cajón y velo). Estas constantes viven en un solo sitio para que compartan duración y curva; `agentPanelShift(open)` devuelve los estilos con los que un Sheet se corre para dejarle sitio.",
      layout: "stretch",
      code: `import { agentPanelShift, agentPanelTransition } from "@/components/ai/agentPanelMotion";

const shift = agentPanelShift(agentOpen);
<SheetContent style={shift.content} overlayStyle={shift.overlay} />

// o para una propiedad suelta:
style={{ width: open ? AGENT_PANEL_WIDTH : 0, transition: agentPanelTransition("width") }}`,
      render: () => (
        <dl className="grid gap-2 text-sm">
          {MOTION_TOKENS.map((token) => (
            <div key={token.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-0.5 rounded-lg border border-border/60 bg-surface px-3 py-2 md:grid-cols-[220px_minmax(0,1fr)_auto]">
              <code className="font-mono text-xs text-text-primary">{token.name}</code>
              <span className="hidden text-[13px] text-text-secondary md:block">{token.note}</span>
              <code className="font-mono text-xs text-primary">{token.value}</code>
            </div>
          ))}
        </dl>
      ),
    },
  ],
  props: [
    { name: "open", type: "boolean", description: "Si el panel está abierto. Cerrado colapsa a 0px pero sigue montado." },
    { name: "onOpenChange", type: "(open: boolean) => void", description: "Se llama con `false` desde el botón de cerrar." },
    { name: "context", type: '"dashboard" | "builder" | "results" | "demographics" | "custom"', default: '"dashboard"', description: "Define título, placeholder y sugerencias. `custom` desactiva la conversación genérica." },
    { name: "customPanel", type: "React.ReactNode", description: "UI a medida que reemplaza la conversación. Solo se usa con `context=\"custom\"`." },
  ],
  guidelines: {
    do: ["Renderízalo dentro de AdminShell (o provee el ancla como en el ejemplo) para que estreche la columna en vez de taparla.", "Usa `agentPanelShift` en los Sheets que convivan con el panel abierto.", "Elige el `context` de la pantalla para que las sugerencias tengan sentido."],
    dont: ["No lo montes como overlay fijo: perdería el gesto de «hacer sitio» que comparte con el cajón.", "No reutilices el degradado ni el fondo `ai-mesh-agent` en paneles que no son de IA.", "No animes con clases `duration-*`: las transiciones van en línea para que ganen a las del Sheet."],
  },
  related: ["sheet", "ai-panel", "admin-shell"],
});
