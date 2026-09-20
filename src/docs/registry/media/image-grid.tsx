import * as React from "react";
import { ImageGrid, type ImageGridColumns, type ImageGridVariant } from "@/components/media";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";
import { BENTO_ITEMS, COURSE_ITEMS, ICON_ITEMS, PLACEHOLDER_SNIPPET } from "./fixtures";

const VARIANTS = ["cards", "compact", "bento"] as const;
const COLUMNS = ["2", "3", "4"] as const;

/** Selección múltiple controlada por el padre. */
function SelectableGrid() {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([COURSE_ITEMS[0].id]);
  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span>{selectedIds.length} seleccionados</span>
        <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])} disabled={selectedIds.length === 0}>
          Limpiar
        </Button>
      </div>
      <ImageGrid items={COURSE_ITEMS.slice(0, 4)} columns={4} variant="compact" selectable selectedIds={selectedIds} onSelect={toggle} />
    </div>
  );
}

export const imageGridEntry = defineEntry({
  id: "image-grid",
  name: "ImageGrid",
  group: "media",
  description:
    "La grilla técnica que pinta una lista de `MediaItem` en tarjetas, miniaturas compactas o un bento con spans. Soporta selección múltiple controlada y estado deshabilitado por ítem o global.",
  importPath: 'import { ImageGrid } from "@/components/media"',
  sourcePath: "src/components/media/ImageGrid.tsx",
  status: "stable",
  tags: ["grid", "bento", "seleccion"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", options: VARIANTS, default: "cards" },
      columns: { type: "select", label: "Columnas", options: COLUMNS, default: "3" },
      selectable: { type: "boolean", label: "Seleccionable", default: false },
      disabled: { type: "boolean", default: false },
    },
    layout: "stretch",
    render: ({ variant, columns, selectable, disabled }) => {
      const isBento = variant === "bento";
      return (
        <ImageGrid
          items={isBento ? BENTO_ITEMS : COURSE_ITEMS}
          variant={variant as ImageGridVariant}
          columns={Number(columns) as ImageGridColumns}
          selectable={selectable}
          selectedIds={selectable ? [COURSE_ITEMS[1].id] : []}
          disabled={disabled}
          className="w-full"
        />
      );
    },
    code: ({ variant, columns, selectable, disabled }) => {
      const attrs = [
        variant !== "cards" ? `variant="${variant}"` : "",
        columns !== "3" && variant !== "bento" ? `columns={${columns}}` : "",
        selectable ? "selectable selectedIds={selectedIds} onSelect={toggle}" : "",
        disabled ? "disabled" : "",
      ]
        .filter(Boolean)
        .map((attr) => `\n  ${attr}`)
        .join("");
      return `<ImageGrid items={${variant === "bento" ? "bentoItems" : "items"}}${attrs}
/>`;
    },
  }),
  examples: [
    {
      id: "cards",
      title: "Tarjetas",
      description: "Imagen 16:9, título, metadato y descripción. El `badge` se pinta sobre la imagen.",
      layout: "stretch",
      code: `${PLACEHOLDER_SNIPPET}

const items: MediaItem[] = [
  { id: "liderazgo", title: "Liderazgo situacional", src: placeholder("Liderazgo"), kind: "video", badge: "Nuevo", metadata: "12 lecciones" },
  // …
];

<ImageGrid items={items} columns={3} />`,
      render: () => <ImageGrid items={COURSE_ITEMS} columns={3} className="w-full" />,
    },
    {
      id: "compact",
      title: "Miniaturas compactas",
      description: "Cuadradas y con solo el título: para selectores de recursos o bibliotecas densas.",
      layout: "stretch",
      code: `<ImageGrid items={items} variant="compact" columns={4} />`,
      render: () => <ImageGrid items={COURSE_ITEMS.slice(0, 4)} variant="compact" columns={4} className="w-full" />,
    },
    {
      id: "bento",
      title: "Bento",
      description: "Los ítems con `colSpan`/`rowSpan` ocupan más celdas; `grid-flow-dense` rellena los huecos. Las columnas se fijan en 4.",
      layout: "stretch",
      code: `const bentoItems: MediaItem[] = [
  { ...items[0], colSpan: 2, rowSpan: 2 },
  items[1],
  items[2],
  { ...items[3], colSpan: 2 },
  items[4],
  items[5],
];

<ImageGrid items={bentoItems} variant="bento" />`,
      render: () => <ImageGrid items={BENTO_ITEMS} variant="bento" className="w-full" />,
    },
    {
      id: "selectable",
      title: "Selección múltiple",
      description: "`selectedIds` y `onSelect` viven en el padre; la grilla solo avisa qué id se pulsó.",
      layout: "stretch",
      code: `const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
const toggle = (id: string) =>
  setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

<ImageGrid items={items} variant="compact" columns={4} selectable selectedIds={selectedIds} onSelect={toggle} />`,
      render: () => <SelectableGrid />,
    },
    {
      id: "icons",
      title: "Sin miniatura",
      description: "Cuando un ítem no trae `src`, se muestra el icono según `kind`.",
      layout: "stretch",
      code: `const items: MediaItem[] = [
  { id: "img", title: "Imagen sin miniatura", kind: "image", metadata: "PNG" },
  { id: "vid", title: "Video sin miniatura", kind: "video", metadata: "MP4" },
  { id: "doc", title: "Documento", kind: "document", metadata: "PDF" },
  { id: "oth", title: "Otro recurso", kind: "other", metadata: "ZIP" },
];

<ImageGrid items={items} columns={4} />`,
      render: () => <ImageGrid items={ICON_ITEMS} columns={4} className="w-full" />,
    },
  ],
  props: [
    { name: "items", type: "MediaItem[]", description: "Lista de ítems: `id`, `title`, `src`, `kind`, `badge`, `metadata`, `colSpan`, `rowSpan`…" },
    { name: "columns", type: "2 | 3 | 4", default: "3", description: "Columnas en escritorio (se reducen en móvil). Ignorado en bento." },
    { name: "variant", type: '"cards" | "compact" | "bento"', default: '"cards"', description: "Tarjeta completa, miniatura cuadrada o bento con spans." },
    { name: "selectable", type: "boolean", default: "false", description: "Activa el click y el indicador de selección." },
    { name: "selectedIds", type: "string[]", default: "[]", description: "Ids seleccionados (controlado)." },
    { name: "onSelect", type: "(id: string) => void", description: "Se llama con el id pulsado; el padre decide si añade o quita." },
    { name: "disabled", type: "boolean", default: "false", description: "Deshabilita toda la grilla. Cada ítem puede traer su propio `disabled`." },
    { name: "className", type: "string", description: "Clases del contenedor grid." },
  ],
  guidelines: {
    do: [
      "Usa `compact` para elegir entre muchos recursos y `cards` cuando la descripción importa.",
      "En bento, limita los ítems con span a uno o dos por bloque para que la composición respire.",
      "Provee `alt` en los ítems cuando la imagen aporta información.",
    ],
    dont: [
      "No uses ImageGrid suelto en una página: Gallery añade cabecera y estado vacío.",
      "No mezcles `colSpan`/`rowSpan` fuera de la variante bento; se ignoran.",
    ],
  },
  related: ["gallery", "preview-card", "card", "ubits-carousel"],
});
