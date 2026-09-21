import * as React from "react";
import { AppSidebar } from "@/components/app-shell/AppSidebar";
import type { ShellMode } from "@/components/app-shell";
import { defineEntry, definePlayground } from "../types";
import { DemoButton, DemoCanvas, ShellFrame } from "./layoutDemo";

const MODES = ["workspace", "agent"] as const;

/** El sidebar con la columna de contenido al lado y los controles que en la app pone AdminShell. */
function SidebarDemo({
  initialCollapsed = false,
  initialMode = "workspace",
  height = 520,
}: {
  initialCollapsed?: boolean;
  initialMode?: ShellMode;
  height?: number;
}) {
  const [collapsed, setCollapsed] = React.useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mode, setMode] = React.useState<ShellMode>(initialMode);
  const [feedbackRequests, setFeedbackRequests] = React.useState(0);
  const [lastHome, setLastHome] = React.useState<string | null>(null);

  const toggle = () => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setMobileOpen((value) => !value);
      return;
    }
    setCollapsed((value) => !value);
  };

  return (
    <ShellFrame height={height}>
      <div className="flex h-full gap-2 bg-background p-2">
        <AppSidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          mode={mode}
          onModeChange={setMode}
          onToggleCollapse={toggle}
          onCloseMobile={() => setMobileOpen(false)}
          onOpenFeedback={() => setFeedbackRequests((value) => value + 1)}
          onNavigateHome={() => setLastHome(new Date().toLocaleTimeString())}
        />
        {mobileOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <DemoButton onClick={toggle}>{collapsed ? "Expandir" : "Contraer"} (onToggleCollapse)</DemoButton>
            <DemoButton active={mode === "agent"} onClick={() => setMode(mode === "agent" ? "workspace" : "agent")}>
              mode: {mode}
            </DemoButton>
          </div>
          <DemoCanvas
            label={`onOpenFeedback × ${feedbackRequests}${lastHome ? ` · onNavigateHome a las ${lastHome}` : ""}`}
          />
        </div>
      </div>
    </ShellFrame>
  );
}

export const appSidebarEntry = defineEntry({
  id: "app-sidebar",
  name: "AppSidebar",
  group: "layout",
  description:
    "El sidebar del AdminShell, en dos capas: un rail de iconos de 64px que está siempre y no se mueve, y un panel de 240px que se desliza por encima con la identidad de la empresa, el segmentado Workspace / Agente IA, el árbol con acordeones y drill, la tarjeta promocional y el feedback. Plegar no encoge el panel: lo aparta y descubre el rail, así los iconos se quedan quietos y las etiquetas nunca se estrujan. Es un componente controlado: AdminShell le dice si está plegado, si el cajón móvil está abierto y en qué modo está.",
  importPath: 'import { AppSidebar } from "@/components/app-shell/AppSidebar"',
  sourcePath: "src/components/app-shell/AppSidebar.tsx",
  status: "stable",
  tags: ["controlled", "framer-motion", "NAV_TREE"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      collapsed: { type: "boolean", label: "collapsed", default: false },
      mode: { type: "select", label: "mode", options: MODES, default: "workspace" },
    },
    render: ({ collapsed, mode }) => <SidebarDemo key={`${collapsed}-${mode}`} initialCollapsed={collapsed} initialMode={mode as ShellMode} />,
    code: ({ collapsed, mode }) => `const [collapsed, setCollapsed] = React.useState(${collapsed});
const [mode, setMode] = React.useState<ShellMode>("${mode}");

<AppSidebar
  collapsed={collapsed}
  mobileOpen={false}
  mode={mode}
  onModeChange={setMode}
  onToggleCollapse={() => setCollapsed((value) => !value)}
  onOpenFeedback={openFeedback}
/>`,
  }),
  examples: [
    {
      id: "navigation",
      title: "Acordeones y drill",
      description:
        "«Desempeño» se abre en el sitio; «Aprendizaje» tiene hijos con nietos y cada uno abre un panel con botón de volver. Plegado, el nodo activo se señala en el icono de su módulo y los rótulos pasan a tooltips.",
      layout: "stretch",
      code: `<AppSidebar
  collapsed={collapsed}
  mobileOpen={mobileOpen}
  mode="workspace"
  onModeChange={setMode}
  onToggleCollapse={toggle}
  onCloseMobile={() => setMobileOpen(false)}
  onOpenFeedback={openFeedback}
  onNavigateHome={goHome}
/>`,
      render: () => <SidebarDemo />,
    },
    {
      id: "agent",
      title: "Modo Agente IA",
      description: "Con `mode=\"agent\"` el árbol se sustituye por el historial de chats y la tarjeta promocional desaparece. El segmentado desliza su fondo con el degradado de IA.",
      layout: "stretch",
      code: `<AppSidebar mode="agent" onModeChange={setMode} … />`,
      render: () => <SidebarDemo initialMode="agent" height={480} />,
    },
    {
      id: "collapsed",
      title: "Plegado",
      description: "El panel se aparta y queda el rail: los iconos de cada sección con su etiqueta en tooltip, el conmutador de modo apilado y los grupos convertidos en separadores. Una sección con hijos no cabe en 64px, así que su icono vuelve a abrir el panel con ese acordeón desplegado en vez de no hacer nada. Cualquier pliegue borra el drill.",
      layout: "stretch",
      code: `<AppSidebar collapsed onToggleCollapse={toggle} … />`,
      render: () => <SidebarDemo initialCollapsed height={480} />,
    },
  ],
  props: [
    { name: "collapsed", type: "boolean", description: "Aparta el panel de 240px y deja a la vista el rail de 64px con tooltips." },
    { name: "mobileOpen", type: "boolean", description: "Por debajo de `lg` el sidebar es un cajón fijo; esto lo muestra." },
    { name: "mode", type: '"workspace" | "agent"', description: "Qué muestra el segmentado y el árbol: navegación o historial de chats." },
    { name: "onModeChange", type: "(mode: ShellMode) => void", description: "Al pulsar el segmentado." },
    { name: "onToggleCollapse", type: "() => void", description: "Al pulsar el botón de plegar (solo visible desde `lg`)." },
    { name: "onOpenFeedback", type: "() => void", description: "Al pulsar «Feedback» en el pie." },
    { name: "onCloseMobile", type: "() => void", description: "Tras cualquier selección, para cerrar el cajón móvil." },
    { name: "onNavigateHome", type: "() => void", description: "Al aterrizar en «Objetivos», el nodo que significa «volver a la lista»." },
  ],
  guidelines: {
    do: [
      "Deja que AdminShell lo controle; monta el sidebar suelto solo para probarlo.",
      "Añade secciones en NAV_TREE (appShellData.ts): con `children` es acordeón, con nietos abre un drill.",
      "Cierra el cajón móvil en `onCloseMobile` después de navegar.",
    ],
    dont: [
      "No guardes `collapsed` dentro del sidebar: el header móvil también lo alterna.",
      "No pongas más de dos niveles bajo un acordeón; el drill existe para el tercero.",
    ],
  },
  related: ["admin-shell", "app-header", "app-shell"],
});
