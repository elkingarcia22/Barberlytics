import * as React from "react";
import { CalendarDays, ChevronRight, Plus, Users } from "lucide-react";
import { PageHeader, Tag } from "@/components/utility";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { defineEntry, definePlayground } from "../types";

function Crumbs({ items }: { items: string[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="flex items-center gap-1 text-xs text-text-muted">
      {items.map((item, index) => (
        <React.Fragment key={item}>
          {index > 0 && <ChevronRight className="size-3" />}
          <span className={index === items.length - 1 ? "font-medium text-text-secondary" : undefined}>{item}</span>
        </React.Fragment>
      ))}
    </nav>
  );
}

function PublishDemo() {
  const [published, setPublished] = React.useState(false);
  return (
    <PageHeader
      breadcrumbs={<Crumbs items={["Programas", "Onboarding comercial"]} />}
      title={
        <span className="flex items-center gap-2">
          Onboarding comercial
          <Badge variant={published ? "default" : "neutral"}>{published ? "Publicado" : "Borrador"}</Badge>
        </span>
      }
      description="Ruta de 12 lecciones para nuevos ingresos del equipo de ventas."
      actions={
        <>
          <Button variant="outline" size="sm">
            Vista previa
          </Button>
          <Button size="sm" onClick={() => setPublished((value) => !value)}>
            {published ? "Despublicar" : "Publicar"}
          </Button>
        </>
      }
      meta={
        <>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4" /> 48 inscritos
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" /> Actualizado hace 2 días
          </span>
        </>
      }
    />
  );
}

export const pageHeaderEntry = defineEntry({
  id: "page-header",
  name: "PageHeader",
  group: "utility",
  description:
    "El encabezado de nivel superior de una pantalla: breadcrumbs, título h1 con descripción, acciones primarias a la derecha y una fila de metadatos. Úsalo una vez por página, justo debajo del header de la app, para que todas las vistas abran igual.",
  importPath: 'import { PageHeader } from "@/components/utility"',
  sourcePath: "src/components/utility/PageHeader.tsx",
  status: "stable",
  tags: ["heading", "layout"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      title: { type: "text", label: "Título", default: "Programas" },
      description: { type: "text", label: "Descripción", default: "Todo el contenido formativo de tu organización." },
      withBreadcrumbs: { type: "boolean", label: "Con breadcrumbs", default: true },
      withActions: { type: "boolean", label: "Con acciones", default: true },
      withMeta: { type: "boolean", label: "Con metadatos", default: false },
    },
    render: ({ title, description, withBreadcrumbs, withActions, withMeta }) => (
      <PageHeader
        title={title}
        description={description || undefined}
        breadcrumbs={withBreadcrumbs ? <Crumbs items={["Inicio", "Programas"]} /> : undefined}
        actions={
          withActions ? (
            <Button size="sm">
              <Plus /> Nuevo programa
            </Button>
          ) : undefined
        }
        meta={withMeta ? <span>24 programas · 3 en borrador</span> : undefined}
      />
    ),
    code: ({ title, description, withBreadcrumbs, withActions, withMeta }) => {
      const lines = [
        `  title="${title}"`,
        description ? `  description="${description}"` : "",
        withBreadcrumbs ? `  breadcrumbs={<Breadcrumbs items={["Inicio", "Programas"]} />}` : "",
        withActions ? `  actions={<Button size="sm"><Plus /> Nuevo programa</Button>}` : "",
        withMeta ? `  meta={<span>24 programas · 3 en borrador</span>}` : "",
      ].filter(Boolean);
      return `<PageHeader\n${lines.join("\n")}\n/>`;
    },
  }),
  examples: [
    {
      id: "full",
      title: "Completo, con estado en el título",
      description: "El título acepta nodos: aquí lleva un Badge que cambia al publicar.",
      layout: "stretch",
      code: `<PageHeader
  breadcrumbs={<Breadcrumbs items={["Programas", "Onboarding comercial"]} />}
  title={
    <span className="flex items-center gap-2">
      Onboarding comercial
      <Badge variant={published ? "default" : "neutral"}>{published ? "Publicado" : "Borrador"}</Badge>
    </span>
  }
  description="Ruta de 12 lecciones para nuevos ingresos del equipo de ventas."
  actions={
    <>
      <Button variant="outline" size="sm">Vista previa</Button>
      <Button size="sm" onClick={togglePublished}>{published ? "Despublicar" : "Publicar"}</Button>
    </>
  }
  meta={
    <>
      <span className="inline-flex items-center gap-1.5"><Users className="size-4" /> 48 inscritos</span>
      <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" /> Actualizado hace 2 días</span>
    </>
  }
/>`,
      render: () => <PublishDemo />,
    },
    {
      id: "minimal",
      title: "Solo título",
      description: "Para listados y pantallas de índice basta con el título y una acción.",
      layout: "stretch",
      code: `<PageHeader title="Equipos" actions={<Button size="sm"><Plus /> Crear equipo</Button>} />`,
      render: () => (
        <PageHeader
          title="Equipos"
          actions={
            <Button size="sm">
              <Plus /> Crear equipo
            </Button>
          }
        />
      ),
    },
    {
      id: "meta-tags",
      title: "Metadatos con Tags",
      layout: "stretch",
      code: `<PageHeader
  title="Reporte trimestral"
  description="Avance consolidado por área."
  meta={
    <>
      <Tag label="Q3 2026" />
      <Tag label="Comercial" tone="info" />
      <Tag label="Solo lectura" tone="warning" />
    </>
  }
/>`,
      render: () => (
        <PageHeader
          title="Reporte trimestral"
          description="Avance consolidado por área."
          meta={
            <>
              <Tag label="Q3 2026" />
              <Tag label="Comercial" tone="info" />
              <Tag label="Solo lectura" tone="warning" />
            </>
          }
        />
      ),
    },
  ],
  props: [
    { name: "title", type: "React.ReactNode", description: "Título de la página (h1). Acepta nodos para añadir badges o iconos." },
    { name: "description", type: "string", description: "Subtítulo en color muted bajo el título." },
    { name: "breadcrumbs", type: "React.ReactNode", description: "Fila superior de navegación contextual." },
    { name: "actions", type: "React.ReactNode", description: "Acciones alineadas a la derecha; en móvil pasan debajo del título." },
    { name: "meta", type: "React.ReactNode", description: "Fila inferior de metadatos con gap de 16px y texto en 14px muted." },
    { name: "...props", type: 'Omit<React.HTMLAttributes<HTMLDivElement>, "title">', description: "Atributos del contenedor." },
  ],
  guidelines: {
    do: ["Un solo PageHeader por pantalla, con una sola acción primaria.", "Usa los breadcrumbs cuando la página está a dos o más niveles de profundidad.", "Reserva `meta` para datos que cambian (contadores, fechas, estado)."],
    dont: ["No lo uses dentro de drawers o tarjetas: para secciones internas está SectionHeader.", "No pongas más de tres acciones; agrupa el resto en un menú."],
  },
  related: ["section-header", "tag", "badge", "button", "breadcrumb"],
});
