import { FolderOpen, Upload } from "lucide-react";
import { EmptyGalleryState, Gallery } from "@/components/media";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

export const emptyGalleryStateEntry = defineEntry({
  id: "empty-gallery-state",
  name: "EmptyGalleryState",
  group: "media",
  description:
    "El estado vacío especializado para colecciones multimedia: icono de imagen, textos por defecto en español y altura mínima para que la sección no colapse. Es lo que Gallery renderiza cuando `items` está vacío.",
  importPath: 'import { EmptyGalleryState } from "@/components/media"',
  sourcePath: "src/components/media/EmptyGalleryState.tsx",
  status: "stable",
  tags: ["estado-vacio", "card"],
  playground: definePlayground({
    controls: {
      title: { type: "text", label: "Título", default: "Sin elementos multimedia" },
      description: {
        type: "text",
        label: "Descripción",
        default: "No se han encontrado recursos en esta colección. Sube archivos o ajusta los filtros.",
      },
      withAction: { type: "boolean", label: "Con acción", default: true },
    },
    layout: "stretch",
    render: ({ title, description, withAction }) => (
      <EmptyGalleryState
        title={title}
        description={description}
        action={
          withAction ? (
            <Button size="sm">
              <Upload /> Subir archivos
            </Button>
          ) : undefined
        }
        className="w-full"
      />
    ),
    code: ({ title, description, withAction }) => {
      const attrs = [
        title !== "Sin elementos multimedia" ? `title="${title}"` : "",
        description !== "No se han encontrado recursos en esta colección. Sube archivos o ajusta los filtros." ? `description="${description}"` : "",
        withAction ? 'action={<Button size="sm"><Upload /> Subir archivos</Button>}' : "",
      ]
        .filter(Boolean)
        .map((attr) => `\n  ${attr}`)
        .join("");
      return attrs ? `<EmptyGalleryState${attrs}\n/>` : "<EmptyGalleryState />";
    },
  }),
  examples: [
    {
      id: "default",
      title: "Por defecto",
      description: "Sin props ya trae icono, título y descripción genéricos.",
      layout: "stretch",
      code: `<EmptyGalleryState />`,
      render: () => <EmptyGalleryState className="w-full" />,
    },
    {
      id: "with-action",
      title: "Con acción",
      description: "La acción que llena la colección; normalmente la misma que en la cabecera de la Gallery.",
      layout: "stretch",
      code: `<EmptyGalleryState
  title="Aún no hay evidencias"
  description="Sube fotos o documentos para respaldar el cierre de esta actividad."
  action={<Button size="sm"><Upload /> Subir evidencias</Button>}
/>`,
      render: () => (
        <EmptyGalleryState
          title="Aún no hay evidencias"
          description="Sube fotos o documentos para respaldar el cierre de esta actividad."
          action={
            <Button size="sm">
              <Upload /> Subir evidencias
            </Button>
          }
          className="w-full"
        />
      ),
    },
    {
      id: "filters",
      title: "Sin resultados por filtros",
      description: "Cuando el vacío viene de un filtro, la acción correcta es limpiarlo, no subir.",
      layout: "stretch",
      code: `<Gallery
  title="Recursos de Ventas"
  items={filtered}
  emptyState={
    <EmptyGalleryState
      title="Ningún recurso coincide"
      description="Prueba con otro tipo o quita los filtros activos."
      action={<Button size="sm" variant="outline"><FolderOpen /> Quitar filtros</Button>}
    />
  }
/>`,
      render: () => (
        <Gallery
          title="Recursos de Ventas"
          description="Filtrado por: Video · Último mes"
          items={[]}
          emptyState={
            <EmptyGalleryState
              title="Ningún recurso coincide"
              description="Prueba con otro tipo o quita los filtros activos."
              action={
                <Button size="sm" variant="outline">
                  <FolderOpen /> Quitar filtros
                </Button>
              }
            />
          }
          className="w-full"
        />
      ),
    },
  ],
  props: [
    { name: "title", type: "string", default: '"Sin elementos multimedia"', description: "Título del estado vacío." },
    { name: "description", type: "string", default: '"No se han encontrado recursos…"', description: "Explicación breve bajo el título." },
    { name: "action", type: "ReactNode", description: "Botón o enlace que resuelve el vacío." },
    { name: "className", type: "string", description: "Clases extra; por defecto trae `min-h-[300px]` y borde discontinuo." },
  ],
  guidelines: {
    do: [
      "Adapta título y descripción al contexto (curso, actividad, filtros) en lugar de dejar el genérico.",
      "Ofrece siempre una acción cuando el usuario puede resolver el vacío.",
    ],
    dont: [
      "No lo uses fuera de colecciones multimedia: EmptyState es el genérico.",
      "No lo apiles con otro mensaje de aviso; ya explica por qué no hay nada.",
    ],
  },
  related: ["gallery", "empty-state", "upload-zone", "image-grid"],
});
