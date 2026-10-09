import * as React from "react";
import { Chip, type ChipTone, type ChipSize } from "@/components/ai-interaction";
import { defineEntry, definePlayground } from "../types";

const TONES = ["default", "muted", "primary", "positive", "negative", "warning", "info", "ai"] as const;
const SIZES = ["sm", "md"] as const;

function FilterChips() {
  const [selected, setSelected] = React.useState<string[]>(["Ventas"]);
  const toggle = (area: string) =>
    setSelected((prev) => (prev.includes(area) ? prev.filter((item) => item !== area) : [...prev, area]));
  return (
    <div className="flex flex-wrap gap-2">
      {["Ventas", "Producto", "Operaciones", "Talento"].map((area) => (
        <Chip key={area} label={area} icon="users" selected={selected.includes(area)} onClick={() => toggle(area)} />
      ))}
    </div>
  );
}

function RemovableChips() {
  const [tags, setTags] = React.useState(["Q3 2026", "Bogotá", "Remoto"]);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <Chip key={tag} label={tag} tone="muted" removable onRemove={() => setTags((prev) => prev.filter((item) => item !== tag))} />
      ))}
      {tags.length === 0 && (
        <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => setTags(["Q3 2026", "Bogotá", "Remoto"])}>
          Restaurar filtros
        </button>
      )}
    </div>
  );
}

export const chipEntry = defineEntry({
  id: "chip",
  name: "Chip",
  group: "ai",
  description:
    "Pastilla compacta para filtros, etiquetas y sugerencias. Ocho tonos semánticos (incluido el degradado de IA), dos tamaños, contador opcional y modo seleccionable o removible.",
  importPath: 'import { Chip } from "@/components/ai-interaction"',
  sourcePath: "src/components/ai-interaction/Chip.tsx",
  status: "stable",
  tags: ["ia", "cva", "filtros"],
  playground: definePlayground({
    controls: {
      tone: { type: "select", options: TONES, default: "default" },
      size: { type: "select", options: SIZES, default: "md" },
      label: { type: "text", default: "Marketing" },
      selected: { type: "boolean", label: "Seleccionado", default: false },
      removable: { type: "boolean", label: "Removible", default: false },
      withIcon: { type: "boolean", label: "Con icono", default: true },
      withCount: { type: "boolean", label: "Con contador", default: false },
      disabled: { type: "boolean", default: false },
    },
    render: ({ tone, size, label, selected, removable, withIcon, withCount, disabled }) => (
      <Chip
        label={label}
        tone={tone as ChipTone}
        size={size as ChipSize}
        selected={selected}
        removable={removable}
        icon={withIcon ? "sparkles" : undefined}
        count={withCount ? 12 : undefined}
        disabled={disabled}
        onClick={() => undefined}
      />
    ),
    code: ({ tone, size, label, selected, removable, withIcon, withCount, disabled }) => {
      const attrs = [
        `label="${label}"`,
        tone !== "default" ? `tone="${tone}"` : "",
        size !== "md" ? `size="${size}"` : "",
        withIcon ? 'icon="sparkles"' : "",
        withCount ? "count={12}" : "",
        selected ? "selected" : "",
        removable ? "removable onRemove={() => {}}" : "",
        disabled ? "disabled" : "",
        "onClick={() => {}}",
      ].filter(Boolean);
      return `<Chip\n  ${attrs.join("\n  ")}\n/>`;
    },
  }),
  examples: [
    {
      id: "tones",
      title: "Tonos",
      description: "Los tonos de estado se reservan para significado; `ai` marca contenido o sugerencias que vienen de la IA.",
      code: `<Chip label="Default" />
<Chip label="Muted" tone="muted" />
<Chip label="Primary" tone="primary" />
<Chip label="Positivo" tone="positive" />
<Chip label="Negativo" tone="negative" />
<Chip label="Alerta" tone="warning" />
<Chip label="Info" tone="info" />
<Chip label="Sugerido por Clipper" tone="ai" icon="sparkles" />`,
      render: () => (
        <div className="flex flex-wrap gap-2">
          <Chip label="Default" />
          <Chip label="Muted" tone="muted" />
          <Chip label="Primary" tone="primary" />
          <Chip label="Positivo" tone="positive" />
          <Chip label="Negativo" tone="negative" />
          <Chip label="Alerta" tone="warning" />
          <Chip label="Info" tone="info" />
          <Chip label="Sugerido por Clipper" tone="ai" icon="sparkles" />
        </div>
      ),
    },
    {
      id: "selectable",
      title: "Filtros seleccionables",
      description: "Con `onClick` el chip se convierte en un botón con `aria-pressed`; `selected` invierte el color.",
      code: `const [selected, setSelected] = React.useState<string[]>(["Ventas"]);
const toggle = (area: string) =>
  setSelected((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));

{["Ventas", "Producto", "Operaciones", "Talento"].map((area) => (
  <Chip key={area} label={area} icon="users" selected={selected.includes(area)} onClick={() => toggle(area)} />
))}`,
      render: () => <FilterChips />,
    },
    {
      id: "removable",
      title: "Removibles",
      description: "El botón de cierre dispara `onRemove` sin propagar el click al chip.",
      code: `const [tags, setTags] = React.useState(["Q3 2026", "Bogotá", "Remoto"]);

{tags.map((tag) => (
  <Chip key={tag} label={tag} tone="muted" removable onRemove={() => setTags((prev) => prev.filter((t) => t !== tag))} />
))}`,
      render: () => <RemovableChips />,
    },
    {
      id: "count-size",
      title: "Contador y tamaños",
      code: `<Chip label="Pendientes" count={8} size="sm" />
<Chip label="Pendientes" count={8} />
<Chip label="Sugerencias" tone="ai" icon="sparkles" count={3} />`,
      render: () => (
        <div className="flex flex-wrap items-center gap-2">
          <Chip label="Pendientes" count={8} size="sm" />
          <Chip label="Pendientes" count={8} />
          <Chip label="Sugerencias" tone="ai" icon="sparkles" count={3} />
        </div>
      ),
    },
  ],
  props: [
    { name: "label", type: "string", description: "Texto del chip. Obligatorio." },
    { name: "tone", type: '"default" | "muted" | "primary" | "positive" | "negative" | "warning" | "info" | "ai"', default: '"default"', description: "Color semántico. `ai` aplica el borde y el texto con degradado de IA." },
    { name: "size", type: '"sm" | "md"', default: '"md"', description: "Altura de 24px o 32px." },
    { name: "selected", type: "boolean", default: "false", description: "Estado activo; cambia el relleno en los tonos default, primary y positive." },
    { name: "removable", type: "boolean", default: "false", description: "Muestra el botón de cierre que dispara `onRemove`." },
    { name: "icon", type: "IconName", description: "Icono del registro Thema a la izquierda del texto." },
    { name: "count", type: "number", description: "Contador pequeño a la derecha del texto." },
    { name: "disabled", type: "boolean", default: "false", description: "Desactiva el chip y baja la opacidad." },
    { name: "onClick", type: "() => void", description: "Si se pasa, el chip se renderiza como <button> con `aria-pressed`." },
    { name: "onRemove", type: "() => void", description: "Callback del botón de cierre." },
    { name: "variant", type: '"solid" | "outline" | "ghost"', description: "Reservado en los tipos; hoy no altera el estilo." },
    { name: "className", type: "string", description: "Clases extra para el contenedor." },
  ],
  guidelines: {
    do: ["Usa `selected` + `onClick` para filtros de selección múltiple.", "Reserva el tono `ai` para sugerencias o etiquetas generadas por la IA.", "Mantén las etiquetas cortas: el texto se trunca, no salta de línea."],
    dont: ["No uses chips como acciones primarias; para eso está Button.", "No mezcles `removable` con `onClick` en el mismo grupo sin necesidad: confunde el gesto.", "No uses el degradado de IA en chips que no vienen de la IA."],
  },
  related: ["badge", "ai-button", "toggle-group"],
});
