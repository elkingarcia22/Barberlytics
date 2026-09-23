import * as React from "react";
import { Header } from "@/components/layout";
import { navigationConfig } from "@/config/navigation";
import { defineEntry, definePlayground } from "../types";
import { DemoButton } from "./layoutDemo";

/** Un header acotado en su propio marco claro. */
function HeaderFrame({ children }: { children: React.ReactNode }) {
  return <div className="w-full overflow-hidden rounded-xl border border-border/60 bg-surface">{children}</div>;
}

/** El header toma título, descripción y migas de la entrada activa de navigationConfig. */
function ConfigHeaderDemo() {
  const [activeId, setActiveId] = React.useState("learning");
  const item = navigationConfig.find((entry) => entry.id === activeId) ?? navigationConfig[0];
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {navigationConfig.slice(0, 4).map((entry) => (
          <DemoButton key={entry.id} active={entry.id === activeId} onClick={() => setActiveId(entry.id)}>
            {entry.label}
          </DemoButton>
        ))}
      </div>
      <HeaderFrame>
        <Header title={item.label} description={item.description} breadcrumbs={item.breadcrumbs} />
      </HeaderFrame>
    </div>
  );
}

export const headerEntry = defineEntry({
  id: "header",
  name: "Header",
  group: "layout",
  description:
    "La franja superior de 80px del shell: migas, título y descripción a la izquierda; buscador y notificaciones a la derecha. El AdminShell usa su propio AppHeader con un slot para la identidad de la pantalla.",
  importPath: 'import { Header } from "@/components/layout"',
  sourcePath: "src/components/layout/Header.tsx",
  status: "stable",
  tags: ["breadcrumbs", "forwardRef"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      title: { type: "text", default: "Aprendizaje" },
      description: { type: "text", default: "Gestión de programas y cursos" },
      withBreadcrumbs: { type: "boolean", label: "Con migas", default: true },
    },
    render: ({ title, description, withBreadcrumbs }) => (
      <HeaderFrame>
        <Header title={title} description={description || undefined} breadcrumbs={withBreadcrumbs ? ["Plataforma", title] : []} />
      </HeaderFrame>
    ),
    code: ({ title, description, withBreadcrumbs }) => {
      const attrs = [
        `title="${title}"`,
        description ? `description="${description}"` : "",
        withBreadcrumbs ? `breadcrumbs={["Plataforma", "${title}"]}` : "",
      ]
        .filter(Boolean)
        .join("\n  ");
      return `<Header\n  ${attrs}\n/>`;
    },
  }),
  examples: [
    {
      id: "basic",
      title: "Título y descripción",
      description: "Sin migas, el bloque de título ocupa la altura completa. La descripción es opcional.",
      layout: "stretch",
      code: `<Header title="Encuestas" description="Gestión de encuestas de clima y satisfacción" />`,
      render: () => (
        <HeaderFrame>
          <Header title="Encuestas" description="Gestión de encuestas de clima y satisfacción" />
        </HeaderFrame>
      ),
    },
    {
      id: "breadcrumbs",
      title: "Con migas",
      description: "`breadcrumbs` es un array de textos; el último se marca como actual por Breadcrumbs.",
      layout: "stretch",
      code: `<Header title="Usuarios" description="Administración de usuarios y roles" breadcrumbs={["Administración", "Usuarios"]} />`,
      render: () => (
        <HeaderFrame>
          <Header title="Usuarios" description="Administración de usuarios y roles" breadcrumbs={["Administración", "Usuarios"]} />
        </HeaderFrame>
      ),
    },
    {
      id: "from-config",
      title: "Alimentado por navigationConfig",
      description: "La misma entrada que resalta la navegación da al header su título, descripción y migas: una sola fuente para toda la cabecera.",
      layout: "stretch",
      code: `const item = navigationConfig.find((entry) => entry.id === activeId)!;

<Header title={item.label} description={item.description} breadcrumbs={item.breadcrumbs} />`,
      render: () => <ConfigHeaderDemo />,
    },
  ],
  props: [
    { name: "title", type: "string", description: "El `<h1>` de la pantalla." },
    { name: "description", type: "string", description: "Una línea bajo el título." },
    { name: "breadcrumbs", type: "string[]", default: "[]", description: "Migas sobre el título; con array vacío no se renderizan." },
    { name: "className", type: "string", description: "Se mezcla con el `<header>` (`h-20 border-b bg-surface px-8`)." },
    { name: "...props", type: 'React.HTMLAttributes<HTMLElement>', description: "Atributos nativos del `<header>`. Reenvía `ref`." },
  ],
  guidelines: {
    do: [
      "Deriva `title`, `description` y `breadcrumbs` de navigationConfig, no los escribas dos veces.",
      "Úsalo como cabecera de una app clásica con scroll interno en PageShell; su `shrink-0` y el borde inferior están pensados para ahí.",
    ],
    dont: [
      "No lo uses como cabecera de una tarjeta o sección: para eso están PageHeader y SectionHeader.",
      "No combines Header con AppHeader: pertenecen a shells distintos.",
    ],
  },
  related: ["page-shell", "app-header", "breadcrumbs", "page-header"],
});
