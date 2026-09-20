import * as React from "react";
import { Tag } from "@/components/utility";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const TONES = ["neutral", "info", "success", "warning", "danger"] as const;
type TagTone = (typeof TONES)[number];

const INITIAL_FILTERS = ["Liderazgo", "Ventas", "Bogotá", "Q3 2026"];

function RemovableDemo() {
  const [tags, setTags] = React.useState<string[]>(INITIAL_FILTERS);
  const remove = (label: string) => setTags((prev) => prev.filter((item) => item !== label));
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap gap-2">
        {tags.map((label) => (
          <Tag key={label} label={label} tone="info" removable onRemove={() => remove(label)} />
        ))}
        {tags.length === 0 && <span className="text-xs text-text-muted">Sin filtros activos</span>}
      </div>
      {tags.length < INITIAL_FILTERS.length && (
        <Button size="xs" variant="ghost" onClick={() => setTags(INITIAL_FILTERS)}>
          Restablecer
        </Button>
      )}
    </div>
  );
}

export const tagEntry = defineEntry({
  id: "tag",
  name: "Tag",
  group: "utility",
  description:
    "Una etiqueta compacta para metadatos, filtros activos o categorías ligeras, con cinco tonos y una X opcional. A diferencia de un StatusBadge no representa el estado de una entidad, sino información que la acompaña o un filtro que el usuario puede quitar.",
  importPath: 'import { Tag } from "@/components/utility"',
  sourcePath: "src/components/utility/Tag.tsx",
  status: "stable",
  tags: ["chip", "filter"],
  playground: definePlayground({
    controls: {
      label: { type: "text", default: "Liderazgo" },
      tone: { type: "select", label: "Tono", options: TONES, default: "neutral" },
      removable: { type: "boolean", label: "Removible", default: false },
    },
    render: ({ label, tone, removable }) => <Tag label={label} tone={tone as TagTone} removable={removable} />,
    code: ({ label, tone, removable }) => {
      const attrs = [`label="${label}"`, tone !== "neutral" ? `tone="${tone}"` : "", removable ? "removable onRemove={handleRemove}" : ""].filter(Boolean).join(" ");
      return `<Tag ${attrs} />`;
    },
  }),
  examples: [
    {
      id: "tones",
      title: "Tonos",
      description: "neutral para categorías; info, success, warning y danger cuando el color aporta significado.",
      code: `<Tag label="Categoría" />
<Tag label="Informativo" tone="info" />
<Tag label="Completado" tone="success" />
<Tag label="Por vencer" tone="warning" />
<Tag label="Bloqueado" tone="danger" />`,
      render: () => (
        <div className="flex flex-wrap items-center gap-2">
          <Tag label="Categoría" />
          <Tag label="Informativo" tone="info" />
          <Tag label="Completado" tone="success" />
          <Tag label="Por vencer" tone="warning" />
          <Tag label="Bloqueado" tone="danger" />
        </div>
      ),
    },
    {
      id: "removable",
      title: "Filtros removibles",
      description: "Cada X llama a onRemove; el consumidor actualiza la lista.",
      code: `const [tags, setTags] = React.useState(["Liderazgo", "Ventas", "Bogotá", "Q3 2026"]);
const remove = (label: string) => setTags((prev) => prev.filter((t) => t !== label));

{tags.map((label) => (
  <Tag key={label} label={label} tone="info" removable onRemove={() => remove(label)} />
))}`,
      render: () => <RemovableDemo />,
    },
    {
      id: "metadata",
      title: "Como metadato en una fila",
      code: `<div className="flex items-center gap-3">
  <span className="text-sm font-medium">Onboarding comercial</span>
  <Tag label="Ruta" />
  <Tag label="12 lecciones" />
  <Tag label="Obligatorio" tone="warning" />
</div>`,
      render: () => (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-text-primary">Onboarding comercial</span>
          <Tag label="Ruta" />
          <Tag label="12 lecciones" />
          <Tag label="Obligatorio" tone="warning" />
        </div>
      ),
    },
  ],
  props: [
    { name: "label", type: "string", description: "Texto de la etiqueta; también forma el aria-label del botón de cierre." },
    { name: "tone", type: '"neutral" | "info" | "success" | "warning" | "danger"', default: '"neutral"', description: "Color semántico del fondo y el texto." },
    { name: "removable", type: "boolean", default: "false", description: "Muestra la X al final." },
    { name: "onRemove", type: "() => void", description: "Se llama al pulsar la X; el click no se propaga al contenedor." },
    { name: "...props", type: 'React.HTMLAttributes<HTMLDivElement>', description: "Atributos del contenedor." },
  ],
  guidelines: {
    do: ["Usa neutral por defecto y un tono de color solo si comunica algo.", "Mantén los labels en una o dos palabras.", "Si es removible, ofrece una forma de restablecer los filtros."],
    dont: ["No lo uses para estados de una entidad (Activo, Pendiente): eso es un badge de estado.", "No hagas clickeable el Tag entero; solo la X tiene acción."],
  },
  related: ["badge", "multi-select", "page-header"],
});
