import * as React from "react";
import { SidebarRail } from "@/components/layout";
import { navigationConfig } from "@/config/navigation";
import { defineEntry, definePlayground } from "../types";
import { DemoCanvas, ShellFrame } from "./layoutDemo";

const NAV_IDS = navigationConfig.map((item) => item.id);

/** El rail con una columna de contenido al lado, para que los submenús al pasar el cursor tengan sitio. */
function RailDemo({ initialActive = "overview", height = 480 }: { initialActive?: string; height?: number }) {
  const [activeId, setActiveId] = React.useState(initialActive);
  const item = navigationConfig.find((entry) => entry.id === activeId);
  return (
    <ShellFrame height={height}>
      <div className="flex h-full">
        <SidebarRail className="h-full" activeId={activeId} onItemSelect={setActiveId} />
        <DemoCanvas className="m-4" label={item ? `onItemSelect("${item.id}") → ${item.label}` : "Pulsa un icono"} />
      </div>
    </ShellFrame>
  );
}

/** Lo que el rail lee de navigationConfig, fila a fila. */
function ConfigTable() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border/60 bg-surface">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-surface-subtle text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
          <tr>
            <th className="px-3 py-2">id</th>
            <th className="px-3 py-2">label</th>
            <th className="px-3 py-2">breadcrumbs</th>
            <th className="px-3 py-2">submenu</th>
          </tr>
        </thead>
        <tbody>
          {navigationConfig.map((item) => (
            <tr key={item.id} className="border-t border-border/60">
              <td className="px-3 py-2 font-mono text-xs text-text-primary">{item.id}</td>
              <td className="px-3 py-2 text-text-primary">
                <span className="inline-flex items-center gap-2">
                  <item.icon className="size-4 text-text-muted" /> {item.label}
                </span>
              </td>
              <td className="px-3 py-2 text-text-secondary">{item.breadcrumbs.join(" / ")}</td>
              <td className="px-3 py-2 text-text-secondary">{item.submenu ? `${item.submenu.length} opciones` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const sidebarRailEntry = defineEntry({
  id: "sidebar-rail",
  name: "SidebarRail",
  group: "layout",
  description:
    "El rail oscuro de 80px con el logo Thema, un icono por sección de navigationConfig y, abajo, el cambio de tema y el perfil. Al pasar el cursor cada icono despliega un panel con su nombre y su submenú; el rail no navega, solo avisa con onItemSelect.",
  importPath: 'import { SidebarRail } from "@/components/layout"',
  sourcePath: "src/components/layout/SidebarRail.tsx",
  status: "stable",
  tags: ["h-screen", "navigationConfig", "hover-menu"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      activeId: { type: "select", label: "activeId", options: NAV_IDS, default: "overview" },
    },
    render: ({ activeId }) => <RailDemo key={activeId} initialActive={activeId} />,
    code: ({ activeId }) => `const [activeId, setActiveId] = React.useState("${activeId}");

<SidebarRail activeId={activeId} onItemSelect={setActiveId} />`,
  }),
  examples: [
    {
      id: "interactive",
      title: "Selección controlada",
      description: "El rail no guarda estado: la pantalla decide qué icono está activo y recibe el id al pulsar. Pasa el cursor por un icono para ver su submenú.",
      layout: "stretch",
      code: `const [activeId, setActiveId] = React.useState("learning");

<SidebarRail activeId={activeId} onItemSelect={setActiveId} />`,
      render: () => <RailDemo initialActive="learning" />,
    },
    {
      id: "config",
      title: "Lo que lee de navigationConfig",
      description: "Cada entrada aporta icono, rótulo, migas para el Header y, si lo tiene, el submenú del panel flotante. Añadir una sección es añadir una fila aquí.",
      layout: "stretch",
      code: `// src/config/navigation.ts
export const navigationConfig: NavItemConfig[] = [
  { id: "overview", label: "Inicio", icon: Home, path: "/", breadcrumbs: ["Plataforma", "Inicio"] },
  { id: "learning", label: "Aprendizaje", icon: GraduationCap, path: "/learning", breadcrumbs: [...], submenu: [...] },
  …
];`,
      render: () => <ConfigTable />,
    },
  ],
  props: [
    { name: "activeId", type: "string", description: "Id de la sección resaltada (fondo blanco)." },
    { name: "onItemSelect", type: "(id: string) => void", description: "Se llama con el id de la sección pulsada; el rail no navega por sí mismo." },
    { name: "className", type: "string", description: "Se mezcla con la raíz (`h-screen w-20 bg-surface-nav`); `h-full` la acota a un contenedor." },
    { name: "...props", type: 'React.HTMLAttributes<HTMLDivElement>', description: "Atributos nativos de la raíz. Reenvía `ref`." },
  ],
  guidelines: {
    do: [
      "Mantén `activeId` sincronizado con la ruta para que el rail y el header coincidan.",
      "Declara nuevas secciones en navigationConfig; el rail y el header las recogen solos.",
    ],
    dont: [
      "No añadas un segundo toggle de tema: el rail ya lo lleva y escribe la clase `dark` en `<html>`.",
      "No lo pongas dentro de un contenedor con `overflow: hidden` estrecho: sus submenús se abren hacia la derecha, fuera de los 80px.",
    ],
  },
  related: ["app-shell", "header", "app-sidebar"],
});
