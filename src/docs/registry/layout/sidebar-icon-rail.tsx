import * as React from "react";
import { SidebarIconRail } from "@/components/app-shell/SidebarIconRail";
import { BrandMark } from "@/components/app-shell";
import { NAV_TREE, type NavRoot } from "@/components/app-shell/appShellData";
import { ShellConfigContext, resolveShellConfig, type ShellMode } from "@/components/app-shell";
import { defineEntry, definePlayground } from "../types";
import { DemoButton, DemoCanvas, ShellFrame } from "./layoutDemo";

const MODES = ["workspace", "agent"] as const;
const NODE_IDS = ["inicio", "vacantes", "contenidos", "encuestas", "tareas"] as const;

/**
 * La misma regla que aplica AppSidebar: la raíz se enciende si el nodo activo
 * es ella, uno de sus hijos o una hoja de un hijo.
 */
function holdsCurrent(item: NavRoot, currentNodeId: string): boolean {
  if (item.id === currentNodeId) return true;
  return (item.children ?? []).some((child) => child.id === currentNodeId || (child.children ?? []).some((leaf) => leaf.id === currentNodeId));
}

/** El rail con la columna de contenido al lado y los callbacks que en la app pone AppSidebar. */
function RailDemo({
  initialNodeId = "inicio",
  initialMode = "workspace",
  hideModeSwitch = false,
  height = 480,
}: {
  initialNodeId?: string;
  initialMode?: ShellMode;
  hideModeSwitch?: boolean;
  height?: number;
}) {
  const [currentNodeId, setCurrentNodeId] = React.useState(initialNodeId);
  const [mode, setMode] = React.useState<ShellMode>(initialMode);
  const [lastEvent, setLastEvent] = React.useState("Pasa el puntero por una sección con hijos");
  const config = React.useMemo(
    () => resolveShellConfig({ chrome: { modeSwitch: !hideModeSwitch } }),
    [hideModeSwitch]
  );

  return (
    <ShellConfigContext.Provider value={config}>
      <ShellFrame height={height}>
        <div className="flex h-full gap-2 bg-background p-2">
          <SidebarIconRail
            className="rounded-2xl border"
            navigation={NAV_TREE}
            currentNodeId={currentNodeId}
            holdsCurrent={holdsCurrent}
            onSelectRoot={(item) => {
              setCurrentNodeId(item.id);
              setLastEvent(`onSelectRoot(${item.id})`);
            }}
            onSelectNode={(id) => {
              setCurrentNodeId(id);
              setLastEvent(`onSelectNode(${id})`);
            }}
            mode={mode}
            onModeChange={setMode}
            onExpand={() => setLastEvent("onExpand()")}
            onOpenFeedback={() => setLastEvent("onOpenFeedback()")}
            brandMark={<BrandMark name="Thema" />}
            brandLabel="Thema"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <DemoButton active={mode === "agent"} onClick={() => setMode(mode === "agent" ? "workspace" : "agent")}>
                mode: {mode}
              </DemoButton>
              <DemoButton onClick={() => setCurrentNodeId("encuestas")}>Ir a «Encuestas»</DemoButton>
            </div>
            <DemoCanvas label={`currentNodeId: ${currentNodeId} · ${lastEvent}`} />
          </div>
        </div>
      </ShellFrame>
    </ShellConfigContext.Provider>
  );
}

export const sidebarIconRailEntry = defineEntry({
  id: "sidebar-icon-rail",
  name: "SidebarIconRail",
  group: "layout",
  description:
    "El rail de iconos de 64px que queda a la vista cuando el sidebar se pliega: no es el panel encogido, sino una capa propia que nunca cambia de ancho, así los iconos no viajan durante la transición. Cada raíz sin hijos navega directo; una sección con hijos abre su árbol a la derecha al pasar el puntero, con submenú para los nietos; los grupos se vuelven separadores y el conmutador Workspace / Agente IA se apila.",
  importPath: 'import { SidebarIconRail } from "@/components/app-shell/SidebarIconRail"',
  sourcePath: "src/components/app-shell/SidebarIconRail.tsx",
  status: "stable",
  tags: ["controlled", "tooltip", "dropdown-menu", "hover"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      currentNodeId: { type: "select", label: "currentNodeId", options: NODE_IDS, default: "inicio" },
      mode: { type: "select", label: "mode", options: MODES, default: "workspace" },
      hideModeSwitch: { type: "boolean", label: "Sin conmutador de modo", default: false },
    },
    render: ({ currentNodeId, mode, hideModeSwitch }) => (
      <RailDemo
        key={`${currentNodeId}-${mode}-${hideModeSwitch}`}
        initialNodeId={currentNodeId}
        initialMode={mode as ShellMode}
        hideModeSwitch={hideModeSwitch}
      />
    ),
    code: ({ currentNodeId, mode, hideModeSwitch }) => {
      const chrome = [hideModeSwitch ? "modeSwitch: false" : ""].filter(Boolean).join(", ");
      const provider = chrome ? `// Apaga piezas desde ShellConfig, no con CSS:\n// resolveShellConfig({ chrome: { ${chrome} } })\n\n` : "";
      return `${provider}<SidebarIconRail
  navigation={NAV_TREE}
  currentNodeId="${currentNodeId}"
  holdsCurrent={holdsCurrent}
  onSelectRoot={(item) => navigate(item.id)}
  onSelectNode={(id) => navigate(id)}
  mode="${mode}"
  onModeChange={setMode}
  onExpand={expand}
  onOpenFeedback={openFeedback}
  brandMark={<BrandMark name={brand.productName} />}
  brandLabel={brand.productName}
/>`;
    },
  }),
  examples: [
    {
      id: "navigation",
      title: "Raíces, secciones y grupos",
      description:
        "«Inicio», «Diagnóstico», «Tareas» y «Avisos» navegan al pulsar. «Selección», «Aprendizaje» y «Desempeño» tienen hijos: su icono abre el árbol al pasar el puntero (también con clic y teclado) y «Aprendizaje» muestra submenús para LMS Creator, Planes y Certificados. Los dos grupos de NAV_TREE son los separadores.",
      layout: "stretch",
      code: `function holdsCurrent(item: NavRoot, currentNodeId: string) {
  if (item.id === currentNodeId) return true;
  return (item.children ?? []).some(
    (child) => child.id === currentNodeId || (child.children ?? []).some((leaf) => leaf.id === currentNodeId)
  );
}

<SidebarIconRail
  navigation={NAV_TREE}
  currentNodeId={currentNodeId}
  holdsCurrent={holdsCurrent}
  onSelectRoot={(item) => setCurrentNodeId(item.id)}
  onSelectNode={setCurrentNodeId}
  mode={mode}
  onModeChange={setMode}
  onExpand={expand}
  onOpenFeedback={openFeedback}
  brandMark={<BrandMark name={brand.productName} />}
  brandLabel={brand.productName}
/>`,
      render: () => <RailDemo />,
    },
    {
      id: "active-inside",
      title: "Activo dentro de una sección",
      description: "Con `currentNodeId=\"encuestas\"` se enciende el icono de «Desempeño», porque `holdsCurrent` mira hijos y nietos. Así la persona sabe dónde está aunque el panel esté plegado.",
      layout: "stretch",
      code: `<SidebarIconRail currentNodeId="encuestas" holdsCurrent={holdsCurrent} … />`,
      render: () => <RailDemo initialNodeId="encuestas" height={440} />,
    },
    {
      id: "chrome-off",
      title: "Sin conmutador de agente",
      description: "El rail lee `chrome.modeSwitch` de ShellConfig. Una vista sin agente (la documentación, por ejemplo) lo apaga ahí y el rail va de la marca directo a la navegación. La marca del producto no se apaga: es lo único que no cambia nunca.",
      layout: "stretch",
      code: `<ShellConfigContext.Provider value={resolveShellConfig({ chrome: { modeSwitch: false } })}>
  <SidebarIconRail … />
</ShellConfigContext.Provider>`,
      render: () => <RailDemo hideModeSwitch height={420} />,
    },
  ],
  props: [
    { name: "navigation", type: "readonly NavEntry[]", description: "El árbol del sidebar: raíces (`kind: \"item\"`) y grupos (`kind: \"group\"`), normalmente `NAV_TREE` o `config.navigation`." },
    { name: "currentNodeId", type: "string", description: "Id del nodo activo, en cualquier nivel." },
    { name: "holdsCurrent", type: "(item: NavRoot, currentNodeId: string) => boolean", description: "Decide si una raíz se enciende: ella misma o algo que cuelgue de ella." },
    { name: "onSelectRoot", type: "(item: NavRoot) => void", description: "Al pulsar una raíz sin hijos." },
    { name: "onSelectNode", type: "(id: string) => void", description: "Al elegir un hijo o una hoja desde el desplegable de una sección." },
    { name: "mode", type: '"workspace" | "agent"', description: "Qué botón del conmutador apilado está pulsado." },
    { name: "onModeChange", type: "(mode: ShellMode) => void", description: "Al pulsar Workspace o Agente IA." },
    { name: "onExpand", type: "() => void", description: "Al pulsar «Expandir menú», el botón superior." },
    { name: "onOpenFeedback", type: "() => void", description: "Al pulsar «Feedback» en el pie." },
    { name: "brandMark", type: "React.ReactNode", description: "La marca del producto; AppSidebar pasa `<BrandMark name={brand.productName} />`. El espacio activo (empresa, sucursal) se cambia desde la cabecera, no desde aquí." },
    { name: "brandLabel", type: "string", description: "Nombre del producto, para el tooltip y el `aria-label` de la marca." },
    { name: "className", type: "string", description: "Clases extra del `<nav>`." },
  ],
  guidelines: {
    do: [
      "Deja que AppSidebar lo monte y lo superponga al panel; suelto solo sirve para probarlo.",
      "Pasa el mismo `holdsCurrent` que usa el panel para que ambos enciendan la misma raíz.",
      "Apaga la marca o el conmutador desde `chrome` en ShellConfig, nunca con CSS.",
    ],
    dont: [
      "No animes su ancho: la gracia es que mide 64px siempre y el panel se desliza por encima.",
      "No pongas raíces sin icono en NAV_TREE; en el rail el icono es lo único que se ve.",
      "No metas más de tres niveles: el submenú del desplegable es el último.",
    ],
  },
  related: ["app-sidebar", "company-menu", "admin-shell", "tooltip", "dropdown-menu"],
});
