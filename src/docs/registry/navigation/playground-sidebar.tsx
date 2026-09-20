import * as React from "react";
import { PlaygroundSidebar } from "@/components/navigation";
import type { NavigationSection } from "@/components/navigation";
import { getPlaygroundNavigation, type PlaygroundRole } from "@/config/playgroundNavigation";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { defineEntry, definePlayground } from "../types";

const ROLES = ["admin", "collaborator", "creator", "recruitment"] as const;

const LOGO = (
  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
    <ThemaIcon name="sparkles" size="sm" tone="inverse" />
  </div>
);

const AVATAR = (
  <div className="flex size-10 items-center justify-center rounded-full bg-white/10 text-[12px] font-bold text-nav-foreground ring-1 ring-white/15">
    EM
  </div>
);

/** El rail vive `fixed` en la app; aquí se ancla al marco del ejemplo. */
function Shell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("relative h-[400px] w-full overflow-hidden rounded-2xl bg-surface-subtle", className)}>{children}</div>;
}

function SidebarDemo({ items, withHeader = true, withFooter = true }: { items: NavigationSection[]; withHeader?: boolean; withFooter?: boolean }) {
  const [active, setActive] = React.useState(items[0]?.items[0]?.id ?? "");
  const label = items.flatMap((section) => section.items).find((item) => item.id === active)?.label ?? "";
  return (
    <Shell>
      <PlaygroundSidebar
        items={items}
        activeItemId={active}
        onItemSelect={setActive}
        header={withHeader ? LOGO : undefined}
        footer={withFooter ? AVATAR : undefined}
        className="absolute bottom-4 left-4 top-4 z-0"
      />
      <div className="absolute inset-y-4 left-32 right-4 rounded-2xl border border-border/60 bg-surface p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Sección activa</p>
        <h3 className="mt-1 text-lg font-bold text-text-primary">{label}</h3>
        <p className="mt-2 text-[13px] text-text-secondary">Pasa el cursor por un icono para ver su etiqueta; haz clic para cambiar de sección.</p>
      </div>
    </Shell>
  );
}

function PlaygroundDemo({ role, withHeader, withFooter }: { role: PlaygroundRole; withHeader: boolean; withFooter: boolean }) {
  return <SidebarDemo key={role} items={getPlaygroundNavigation(role)} withHeader={withHeader} withFooter={withFooter} />;
}

const CUSTOM_SECTIONS: NavigationSection[] = [
  { id: "main", items: [{ id: "home", label: "Inicio", icon: "home" }, { id: "analytics", label: "Analítica", icon: "analytics" }] },
  { id: "tools", items: [{ id: "code", label: "Código", icon: "code" }, { id: "palette", label: "Tema", icon: "palette" }, { id: "help", label: "Ayuda", icon: "help" }] },
];

export const playgroundSidebarEntry = defineEntry({
  id: "playground-sidebar",
  name: "PlaygroundSidebar",
  group: "navigation",
  description:
    "El rail lateral azul marino de la app: una columna de iconos redondos con tooltip, logo arriba y perfil abajo. Recibe secciones de `NavigationSection` y resalta el activo con una píldora primaria y una marca en el borde.",
  importPath: 'import { PlaygroundSidebar } from "@/components/navigation"',
  sourcePath: "src/components/navigation/PlaygroundSidebar.tsx",
  status: "stable",
  tags: ["shell", "tooltip", "fixed"],
  playground: definePlayground({
    controls: {
      role: { type: "select", label: "Rol", options: ROLES, default: "collaborator" },
      withHeader: { type: "boolean", label: "Con logo", default: true },
      withFooter: { type: "boolean", label: "Con perfil", default: true },
    },
    layout: "stretch",
    render: ({ role, withHeader, withFooter }) => <PlaygroundDemo role={role as PlaygroundRole} withHeader={withHeader} withFooter={withFooter} />,
    code: ({ role, withHeader, withFooter }) => {
      const attrs = [`items={getPlaygroundNavigation("${role}")}`, "activeItemId={active}", "onItemSelect={setActive}", withHeader ? "header={<Logo />}" : "", withFooter ? "footer={<Avatar />}" : ""].filter(Boolean);
      return `import { getPlaygroundNavigation } from "@/config/playgroundNavigation";\n\nconst [active, setActive] = React.useState("aprendizaje");\n\n<PlaygroundSidebar\n  ${attrs.join("\n  ")}\n/>`;
    },
  }),
  examples: [
    {
      id: "admin",
      title: "Navegación de administrador",
      description: "Las seis secciones del rol admin desde `@/config/playgroundNavigation`. Estado controlado en el padre.",
      layout: "stretch",
      frameClassName: "min-h-[440px]",
      code: `import { ADMIN_NAVIGATION } from "@/config/playgroundNavigation";

const [active, setActive] = React.useState("inicio");

<PlaygroundSidebar
  items={ADMIN_NAVIGATION}
  activeItemId={active}
  onItemSelect={setActive}
  header={<Logo />}
  footer={<Avatar />}
/>`,
      render: () => <SidebarDemo items={getPlaygroundNavigation("admin")} />,
    },
    {
      id: "sections",
      title: "Varias secciones",
      description: "Cada `NavigationSection` se separa con más aire; el rail no dibuja divisores.",
      layout: "stretch",
      frameClassName: "min-h-[440px]",
      code: `const sections: NavigationSection[] = [
  { id: "main", items: [{ id: "home", label: "Inicio", icon: "home" }, { id: "analytics", label: "Analítica", icon: "analytics" }] },
  { id: "tools", items: [{ id: "code", label: "Código", icon: "code" }, { id: "palette", label: "Tema", icon: "palette" }] },
];

<PlaygroundSidebar items={sections} activeItemId={active} onItemSelect={setActive} header={<Logo />} />`,
      render: () => <SidebarDemo items={CUSTOM_SECTIONS} withFooter={false} />,
    },
  ],
  props: [
    { name: "items", type: "NavigationSection[]", description: "Secciones con sus ítems; cada ítem necesita `id`, `label` e `icon` (un `IconName`)." },
    { name: "activeItemId", type: "string", description: "Id del ítem resaltado. Alias legacy: `activeId`." },
    { name: "onItemSelect", type: "(id: string) => void", description: "Se llama al pulsar un ítem. Alias legacy: `onItemClick`." },
    { name: "header", type: "React.ReactNode", description: "Bloque superior, normalmente el logo." },
    { name: "footer", type: "React.ReactNode", description: "Bloque inferior, normalmente el avatar del perfil." },
    { name: "className", type: "string", description: "Clases para el <aside>. Trae `fixed left-6 top-4 bottom-4`; sobrescríbelas para anclarlo a otro contenedor." },
  ],
  guidelines: {
    do: ["Usa los `NavigationSection` de `@/config/playgroundNavigation` para los roles oficiales.", "Deja siempre un `header` con el logo: el rail sin marca parece un panel de herramientas.", "Mantén los ítems por debajo de ocho; el rail no colapsa ni agrupa."],
    dont: ["No lo combines con la sub-navegación para el mismo nivel: el rail cambia de módulo, la sub-nav de pestaña.", "No metas texto en los ítems; la etiqueta vive en el tooltip."],
  },
  related: ["thema-sub-nav", "thema-mobile-tab-bar", "sidebar", "tooltip"],
});
