import * as React from "react";
import { AppShell, Header, PageShell } from "@/components/layout";
import { navigationConfig } from "@/config/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemaLogo } from "@/components/ui/ThemaLogo";
import { cn } from "@/lib/utils";
import { defineEntry, definePlayground } from "../types";
import { DemoLongContent, DemoStats, ShellFrame } from "./layoutDemo";

const NAV_IDS = navigationConfig.map((item) => item.id);

/**
 * El slot `sidebar` acepta cualquier nodo: este rail mínimo existe solo para
 * la demostración. En una aplicación real ese hueco lo ocupa `AppSidebar`
 * (la navegación completa del shell de administración) o la navegación
 * propia del producto.
 */
function DemoRail({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  return (
    <nav
      aria-label="Secciones"
      className="flex h-full w-16 shrink-0 flex-col items-center gap-2 border-r border-border bg-surface-nav py-4"
    >
      <span className="mb-4 flex size-9 items-center justify-center">
        <ThemaLogo size={20} />
      </span>
      {navigationConfig.map((item) => {
        const isActive = item.id === activeId;
        return (
          <Tooltip key={item.id} delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                  isActive ? "bg-white text-surface-nav" : "text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="size-[18px]" strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

/** Los tres componentes compuestos: el rail cambia la sección y el header la describe leyendo navigationConfig. */
function ComposedShellDemo({
  initialActive = "overview",
  withSidebar = true,
  withHeader = true,
  height = 520,
}: {
  initialActive?: string;
  withSidebar?: boolean;
  withHeader?: boolean;
  height?: number;
}) {
  const [activeId, setActiveId] = React.useState(initialActive);
  const item = navigationConfig.find((entry) => entry.id === activeId) ?? navigationConfig[0];
  return (
    <ShellFrame height={height}>
      <AppShell
        className="h-full"
        sidebar={withSidebar ? <DemoRail activeId={activeId} onSelect={setActiveId} /> : undefined}
        header={withHeader ? <Header title={item.label} description={item.description} breadcrumbs={item.breadcrumbs} /> : undefined}
      >
        <PageShell>
          <DemoStats />
          <DemoLongContent rows={3} />
        </PageShell>
      </AppShell>
    </ShellFrame>
  );
}

export const appShellEntry = defineEntry({
  id: "app-shell",
  name: "AppShell",
  group: "layout",
  description:
    "El esqueleto de pantalla completa: dos slots, `sidebar` y `header`, alrededor de un viewport que hace scroll por su cuenta. No impone qué navegación va en el hueco lateral; en estos ejemplos se compone con Header y PageShell, alimentados por navigationConfig para que sección, título y migas cuenten la misma historia.",
  importPath: 'import { AppShell, Header, PageShell } from "@/components/layout"',
  sourcePath: "src/components/layout/AppShell.tsx",
  status: "stable",
  tags: ["h-screen", "slots", "forwardRef"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      activeId: { type: "select", label: "Sección activa", options: NAV_IDS, default: "overview" },
      withSidebar: { type: "boolean", label: "Con navegación", default: true },
      withHeader: { type: "boolean", label: "Con Header", default: true },
    },
    render: ({ activeId, withSidebar, withHeader }) => (
      <ComposedShellDemo key={activeId} initialActive={activeId} withSidebar={withSidebar} withHeader={withHeader} />
    ),
    code: ({ activeId, withSidebar, withHeader }) => {
      const sidebar = withSidebar ? `\n  sidebar={<AppSidebar activeId={activeId} onSelect={setActiveId} />}` : "";
      const header = withHeader ? `\n  header={<Header title={item.label} description={item.description} breadcrumbs={item.breadcrumbs} />}` : "";
      return `const [activeId, setActiveId] = React.useState("${activeId}");
const item = navigationConfig.find((entry) => entry.id === activeId)!;

<AppShell${sidebar}${header}>
  <PageShell>{children}</PageShell>
</AppShell>`;
    },
  }),
  examples: [
    {
      id: "composed",
      title: "Navegación, header y página compuestos",
      description:
        "Pulsa un icono del rail: la sección activa cambia y el header toma título, descripción y migas de navigationConfig. El scroll vive dentro del viewport del shell.",
      layout: "stretch",
      code: `const [activeId, setActiveId] = React.useState("overview");
const item = navigationConfig.find((entry) => entry.id === activeId)!;

<AppShell
  sidebar={<AppSidebar activeId={activeId} onSelect={setActiveId} />}
  header={<Header title={item.label} description={item.description} breadcrumbs={item.breadcrumbs} />}
>
  <PageShell>
    <Stats />
    <Sections />
  </PageShell>
</AppShell>`,
      render: () => <ComposedShellDemo initialActive="learning" />,
    },
    {
      id: "viewport-only",
      title: "Solo el viewport",
      description: "Sin `sidebar` ni `header` el shell es la caja de pantalla completa con scroll interno; útil para pantallas de acceso o vistas embebidas.",
      layout: "stretch",
      code: `<AppShell>
  <PageShell maxWidth="constrained">{children}</PageShell>
</AppShell>`,
      render: () => <ComposedShellDemo withSidebar={false} withHeader={false} height={360} />,
    },
  ],
  props: [
    {
      name: "sidebar",
      type: "React.ReactNode",
      description: "Slot de navegación; cualquier nodo sirve. Para el shell de administración, AppSidebar.",
    },
    { name: "header", type: "React.ReactNode", description: "Slot superior del viewport; normalmente un Header." },
    { name: "children", type: "React.ReactNode", description: "El contenido; va dentro de un contenedor `flex-1 overflow-auto`." },
    { name: "className", type: "string", description: "Se mezcla con la raíz (`flex h-screen w-full overflow-hidden bg-background`); `h-full` la acota a un contenedor." },
    { name: "...props", type: "React.HTMLAttributes<HTMLDivElement>", description: "Atributos nativos de la raíz. Reenvía `ref`." },
  ],
  guidelines: {
    do: [
      "Monta un solo AppShell por aplicación y cambia solo lo que va en sus slots.",
      "Deriva el título y las migas del header de navigationConfig, no de estado duplicado.",
      "Pon el scroll en PageShell o en el viewport, nunca en el body.",
    ],
    dont: [
      "No lo anides dentro de otro contenedor con scroll: usa `className=\"h-full\"` y deja que el shell mida el alto.",
      "No mezcles este shell con AdminShell en la misma vista; son dos cascarones distintos.",
    ],
  },
  related: ["header", "page-shell", "admin-shell", "app-sidebar"],
});
