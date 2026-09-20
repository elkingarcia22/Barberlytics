import * as React from "react";
import { Download, Filter, Plus } from "lucide-react";
import { AdminShell, ShellAgentPanelSlot, ShellHeaderSlot, ShellRailSlot } from "@/components/app-shell";
import { ActionRailShell, RailButton, RailPrimaryAction } from "@/components/action-rail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";
import { DemoButton, DemoLongContent, DemoStats, ShellFrame } from "./layoutDemo";

const ICON = "h-[20px] w-[20px]";

/** Un dashboard: el shell hace scroll del contenido y muestra el pie legal. */
function DashboardDemo({ scrollContent = true, showFooter }: { scrollContent?: boolean; showFooter?: boolean }) {
  return (
    <ShellFrame height={560}>
      <AdminShell scrollContent={scrollContent} showFooter={showFooter}>
        <div className="flex h-full flex-col gap-3 overflow-y-auto pt-1">
          <DemoStats />
          <DemoLongContent rows={4} />
        </div>
      </AdminShell>
    </ShellFrame>
  );
}

/** Una pantalla tipo app: gestiona su scroll, pone su identidad en el header y su barra en el ancla del pie. */
function AppScreenDemo() {
  const [homeClicks, setHomeClicks] = React.useState(0);
  return (
    <ShellFrame height={560}>
      <AdminShell scrollContent={false} onNavigateHome={() => setHomeClicks((value) => value + 1)}>
        <ShellHeaderSlot>
          <span className="truncate text-sm font-semibold text-text-primary">Ciclo de desempeño 2026</span>
          <Badge variant="secondary">Borrador</Badge>
        </ShellHeaderSlot>
        <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-surface shadow-card">
          <div className="border-b border-border/60 px-4 py-3 text-[13px] text-text-secondary">
            Esta columna hace su propio scroll. Pulsa «Objetivos» en el sidebar: onNavigateHome se ha disparado {homeClicks} {homeClicks === 1 ? "vez" : "veces"}.
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <DemoLongContent rows={5} />
          </div>
        </div>
        <ShellRailSlot>
          <ActionRailShell
            persistent={
              <>
                <RailButton icon={<Download className={ICON} strokeWidth={2} />} label="Exportar" onClick={() => undefined} />
                <RailButton icon={<Filter className={ICON} strokeWidth={2} />} label="Filtrar" onClick={() => undefined} />
                <RailPrimaryAction icon={<Plus className="size-4" strokeWidth={2.5} />} label="Nuevo objetivo" />
              </>
            }
          />
        </ShellRailSlot>
      </AdminShell>
    </ShellFrame>
  );
}

/** Un panel lateral portalado al ancla del Agente IA: abrirlo estrecha la columna en vez de taparla. */
function SidePanelDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <ShellFrame height={480}>
      <AdminShell scrollContent={false} showFooter={false}>
        <div className="flex h-full flex-col gap-3 rounded-2xl border border-border/60 bg-surface p-4 shadow-card">
          <Button className="self-start" variant={open ? "outline" : "default"} onClick={() => setOpen((value) => !value)}>
            {open ? "Cerrar panel" : "Abrir panel lateral"}
          </Button>
          <p className="text-[13px] text-text-secondary">El panel es un hermano flex de esta columna, no un overlay: al abrirse, la columna cede su ancho.</p>
          <DemoStats className="xl:grid-cols-2" />
        </div>
        {open && (
          <ShellAgentPanelSlot>
            <div className="flex h-full w-72 flex-col gap-2 rounded-2xl border border-border/60 bg-surface p-4 shadow-card">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">Panel lateral</p>
              <p className="text-sm font-semibold text-text-primary">Contenido de la pantalla</p>
              <p className="text-[13px] text-text-secondary">Aquí va lo que la pantalla quiera mostrar junto al contenido: un chat, un detalle, un compositor.</p>
              <DemoButton onClick={() => setOpen(false)}>Cerrar</DemoButton>
            </div>
          </ShellAgentPanelSlot>
        )}
      </AdminShell>
    </ShellFrame>
  );
}

export const adminShellEntry = defineEntry({
  id: "admin-shell",
  name: "AdminShell",
  group: "layout",
  description:
    "El cascarón del panel de administración: AppSidebar plegable (se recoge solo a los dos segundos), AppHeader, pie legal y un diálogo de feedback, todo en un `h-dvh` con margen de 8px. Expone tres anclas por portal —ShellHeaderSlot, ShellRailSlot y ShellAgentPanelSlot— para que una pantalla ponga su identidad, su barra flotante y su panel lateral sin levantar estado al router.",
  importPath: 'import { AdminShell, ShellHeaderSlot, ShellRailSlot, ShellAgentPanelSlot } from "@/components/app-shell"',
  sourcePath: "src/components/app-shell/AdminShell.tsx",
  status: "stable",
  tags: ["h-dvh", "portals", "slots"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      scrollContent: { type: "boolean", label: "scrollContent", default: true },
      showFooter: { type: "boolean", label: "showFooter (forzar)", default: false },
    },
    render: ({ scrollContent, showFooter }) => (
      <DashboardDemo key={`${scrollContent}-${showFooter}`} scrollContent={scrollContent} showFooter={showFooter || undefined} />
    ),
    code: ({ scrollContent, showFooter }) => {
      const attrs = [!scrollContent ? "scrollContent={false}" : "", showFooter ? "showFooter" : ""].filter(Boolean).join(" ");
      return `<AdminShell${attrs ? ` ${attrs}` : ""}>
  <Dashboard />
</AdminShell>`;
    },
  }),
  examples: [
    {
      id: "app-screen",
      title: "Pantalla tipo app con los tres slots",
      description:
        "`scrollContent={false}`: la pantalla gestiona su scroll. ShellHeaderSlot pone el nombre y el estado junto al header; ShellRailSlot deja la barra flotante fuera del scroller, así no se va con la tabla.",
      layout: "stretch",
      code: `<AdminShell scrollContent={false} onNavigateHome={goHome}>
  <ShellHeaderSlot>
    <span className="text-sm font-semibold">Ciclo de desempeño 2026</span>
    <Badge variant="secondary">Borrador</Badge>
  </ShellHeaderSlot>

  <div className="flex h-full flex-col">{/* contenido con su propio overflow-y-auto */}</div>

  <ShellRailSlot>
    <ActionRailShell persistent={<ScreenActions />} />
  </ShellRailSlot>
</AdminShell>`,
      render: () => <AppScreenDemo />,
    },
    {
      id: "side-panel",
      title: "ShellAgentPanelSlot",
      description: "El ancla del panel lateral es un hermano flex de la columna de contenido. Lo que se portala ahí trae su propio ancho y estrecha la columna en vez de flotar encima; es lo que usa AiAgentDrawer.",
      layout: "stretch",
      code: `{open && (
  <ShellAgentPanelSlot>
    <aside className="h-full w-72 rounded-2xl border bg-surface p-4 shadow-card">…</aside>
  </ShellAgentPanelSlot>
)}`,
      render: () => <SidePanelDemo />,
    },
    {
      id: "dashboard",
      title: "Dashboard con scroll del shell",
      description: "Con `scrollContent` (por defecto) el shell hace scroll del contenido y muestra el pie legal. Espera dos segundos: el sidebar se pliega solo.",
      layout: "stretch",
      code: `<AdminShell>
  <Stats />
  <Sections />
</AdminShell>`,
      render: () => <DashboardDemo />,
    },
  ],
  props: [
    { name: "children", type: "React.ReactNode", description: "La pantalla. Con `scrollContent` va dentro de un scroller; sin él, en una caja `overflow-hidden` que debe llenar con `h-full`." },
    { name: "scrollContent", type: "boolean", default: "true", description: "El shell hace scroll del contenido y muestra el pie. Las pantallas tipo app pasan `false` y gestionan su scroll." },
    { name: "showFooter", type: "boolean", default: "scrollContent || modo agente", description: "Fuerza el pie legal aunque `scrollContent` sea false." },
    { name: "onNavigateHome", type: "() => void", description: "Se dispara al pulsar «Objetivos» en el sidebar: la vuelta a la lista." },
    { name: "ShellHeaderSlot", type: "{ children }", description: "Portala junto al toggle del header: identidad viva de la pantalla (nombre, estado, autosave)." },
    { name: "ShellRailSlot", type: "{ children }", description: "Portala al ancla inferior centrada del `main`, fuera del scroller; para ActionRailShell." },
    { name: "ShellAgentPanelSlot", type: "{ children }", description: "Portala al ancla lateral, hermana de la columna de contenido; el hijo trae su ancho." },
  ],
  guidelines: {
    do: [
      "Una pantalla con tabla y barra flotante pasa `scrollContent={false}` y monta su barra en ShellRailSlot.",
      "Pon en ShellHeaderSlot solo identidad que la pantalla ya posee; el shell no debe conocerla.",
      "Deja que el shell escriba la clase `dark` en `<html>`; no lo hagas también desde la pantalla.",
    ],
    dont: [
      "No rendericen los slots fuera de AdminShell: sin proveedor devuelven null en silencio.",
      "No pongas un panel lateral como overlay sobre la columna; usa ShellAgentPanelSlot para que la columna ceda ancho.",
      "No anides AdminShell dentro de AppShell; son cascarones alternativos.",
    ],
  },
  related: ["app-sidebar", "app-header", "action-rail-shell", "ai-agent-drawer", "app-shell"],
});
