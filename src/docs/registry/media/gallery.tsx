import * as React from "react";
import { Filter, Upload } from "lucide-react";
import { EmptyGalleryState, Gallery, type ImageGridColumns, type ImageGridVariant } from "@/components/media";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";
import { BENTO_ITEMS, COURSE_ITEMS } from "./fixtures";

const VARIANTS = ["cards", "compact", "bento"] as const;
const COLUMNS = ["2", "3", "4"] as const;

/** Galería con selección única y acción que depende de ella. */
function SingleSelectGallery() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = COURSE_ITEMS.find((item) => item.id === selectedId);
  return (
    <Gallery
      title="Elige la portada"
      description={selected ? `Seleccionado: ${selected.title}` : "Haz clic en una miniatura."}
      actions={
        <Button size="sm" disabled={!selected} onClick={() => setSelectedId(null)}>
          Usar portada
        </Button>
      }
      items={COURSE_ITEMS.slice(0, 4)}
      variant="compact"
      columns={4}
      selectable
      selectedIds={selectedId ? [selectedId] : []}
      onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
    />
  );
}

/** Galería que se vacía y se vuelve a llenar desde el estado vacío. */
function EmptyToggleGallery() {
  const [items, setItems] = React.useState(COURSE_ITEMS.slice(0, 3));
  return (
    <Gallery
      title="Material del curso"
      actions={
        <Button size="sm" variant="outline" onClick={() => setItems([])} disabled={items.length === 0}>
          Vaciar
        </Button>
      }
      items={items}
      emptyState={
        <EmptyGalleryState
          title="Este curso aún no tiene material"
          description="Sube el primer recurso para que aparezca aquí."
          action={
            <Button size="sm" onClick={() => setItems(COURSE_ITEMS.slice(0, 3))}>
              <Upload /> Subir material
            </Button>
          }
        />
      }
    />
  );
}

export const galleryEntry = defineEntry({
  id: "gallery",
  name: "Gallery",
  group: "media",
  description:
    "El contenedor de página para colecciones multimedia: SectionHeader con título y acciones, ImageGrid debajo y un estado vacío automático cuando no hay ítems. Acepta las mismas props de grilla y selección que ImageGrid.",
  importPath: 'import { Gallery } from "@/components/media"',
  sourcePath: "src/components/media/Gallery.tsx",
  status: "stable",
  tags: ["seccion", "grid", "estado-vacio"],
  playground: definePlayground({
    controls: {
      title: { type: "text", label: "Título", default: "Biblioteca de recursos" },
      variant: { type: "select", options: VARIANTS, default: "cards" },
      columns: { type: "select", label: "Columnas", options: COLUMNS, default: "3" },
      withActions: { type: "boolean", label: "Con acciones", default: true },
      empty: { type: "boolean", label: "Sin ítems", default: false },
    },
    layout: "stretch",
    render: ({ title, variant, columns, withActions, empty }) => (
      <Gallery
        title={title || undefined}
        description={title ? "Todo lo que tu equipo ha compartido." : undefined}
        actions={
          withActions ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Filter /> Filtrar
              </Button>
              <Button size="sm">
                <Upload /> Subir
              </Button>
            </div>
          ) : undefined
        }
        items={empty ? [] : variant === "bento" ? BENTO_ITEMS : COURSE_ITEMS}
        variant={variant as ImageGridVariant}
        columns={Number(columns) as ImageGridColumns}
        className="w-full"
      />
    ),
    code: ({ title, variant, columns, withActions, empty }) => {
      const attrs = [
        title ? `title="${title}"` : "",
        withActions ? "actions={<Button size=\"sm\"><Upload /> Subir</Button>}" : "",
        `items={${empty ? "[]" : "items"}}`,
        variant !== "cards" ? `variant="${variant}"` : "",
        columns !== "3" && variant !== "bento" ? `columns={${columns}}` : "",
      ]
        .filter(Boolean)
        .map((attr) => `\n  ${attr}`)
        .join("");
      return `<Gallery${attrs}
/>`;
    },
  }),
  examples: [
    {
      id: "section",
      title: "Sección con acciones",
      description: "Título, descripción y botones a la derecha. Sin `title` la cabecera no se renderiza.",
      layout: "stretch",
      code: `<Gallery
  title="Biblioteca de recursos"
  description="Todo lo que tu equipo ha compartido."
  actions={<Button size="sm"><Upload /> Subir</Button>}
  items={items}
/>`,
      render: () => (
        <Gallery
          title="Biblioteca de recursos"
          description="Todo lo que tu equipo ha compartido."
          actions={
            <Button size="sm">
              <Upload /> Subir
            </Button>
          }
          items={COURSE_ITEMS}
          className="w-full"
        />
      ),
    },
    {
      id: "single-select",
      title: "Selección única",
      description: "Con un solo id en `selectedIds` la galería funciona como selector; la acción se habilita al elegir.",
      layout: "stretch",
      code: `const [selectedId, setSelectedId] = React.useState<string | null>(null);

<Gallery
  title="Elige la portada"
  actions={<Button size="sm" disabled={!selectedId}>Usar portada</Button>}
  items={items}
  variant="compact"
  columns={4}
  selectable
  selectedIds={selectedId ? [selectedId] : []}
  onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
/>`,
      render: () => (
        <div className="w-full">
          <SingleSelectGallery />
        </div>
      ),
    },
    {
      id: "empty",
      title: "Estado vacío",
      description: "Con `items` vacío aparece EmptyGalleryState; pásalo por `emptyState` para personalizar texto y acción.",
      layout: "stretch",
      code: `<Gallery
  title="Material del curso"
  items={items}
  emptyState={
    <EmptyGalleryState
      title="Este curso aún no tiene material"
      description="Sube el primer recurso para que aparezca aquí."
      action={<Button size="sm"><Upload /> Subir material</Button>}
    />
  }
/>`,
      render: () => (
        <div className="w-full">
          <EmptyToggleGallery />
        </div>
      ),
    },
  ],
  props: [
    { name: "items", type: "MediaItem[]", description: "Ítems a mostrar. Vacío o indefinido activa el estado vacío." },
    { name: "title", type: "string", description: "Título de la sección; activa el SectionHeader." },
    { name: "description", type: "string", description: "Subtítulo bajo el título." },
    { name: "actions", type: "ReactNode", description: "Botones alineados a la derecha de la cabecera." },
    { name: "emptyState", type: "ReactNode", description: "Reemplaza el EmptyGalleryState por defecto." },
    { name: "columns", type: "2 | 3 | 4", default: "3", description: "Columnas de la grilla (ignorado en bento)." },
    { name: "variant", type: '"cards" | "compact" | "bento"', default: '"cards"', description: "Variante visual que se pasa a ImageGrid." },
    { name: "selectable", type: "boolean", default: "false", description: "Habilita la selección de ítems." },
    { name: "selectedIds", type: "string[]", default: "[]", description: "Ids seleccionados (controlado)." },
    { name: "onSelect", type: "(id: string) => void", description: "Avisa el id pulsado." },
    { name: "disabled", type: "boolean", default: "false", description: "Deshabilita toda la grilla." },
    { name: "className", type: "string", description: "Clases del contenedor." },
  ],
  guidelines: {
    do: [
      "Coloca la acción principal (subir, crear) en `actions`, y repítela en el `emptyState` para no dejar al usuario sin salida.",
      "Usa `title` siempre que la galería sea una sección de página; sin él usa ImageGrid directamente.",
    ],
    dont: [
      "No pongas más de dos acciones en la cabecera; el resto va a un menú.",
      "No uses Gallery para un único recurso: para eso está MediaPreview.",
    ],
  },
  related: ["image-grid", "empty-gallery-state", "preview-card", "upload-zone"],
});
