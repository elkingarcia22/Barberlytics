import * as React from "react";
import { BarChart3, FileText, Layers, Video } from "lucide-react";
import { SelectableCard, type SelectionOption } from "@/components/selection";
import { defineEntry, definePlayground } from "../types";

const MODES = ["single", "multiple"] as const;

const BLOCKS: SelectionOption[] = [
  { value: "video", label: "Video", description: "Sube o enlaza una grabación.", icon: Video },
  { value: "doc", label: "Documento", description: "PDF o presentación descargable.", icon: FileText, badge: "Beta" },
  { value: "quiz", label: "Evaluación", description: "Preguntas con puntaje automático.", icon: BarChart3 },
  { value: "module", label: "Módulo", description: "Agrupa varios bloques.", icon: Layers, disabled: true },
];

function PlaygroundDemo({ mode, disabled, badge }: { mode: "single" | "multiple"; disabled: boolean; badge: string }) {
  const [selected, setSelected] = React.useState(true);
  const option: SelectionOption = { ...BLOCKS[0], badge: badge || undefined };
  return (
    <div className="w-full max-w-xs">
      <SelectableCard option={option} selected={selected} disabled={disabled} mode={mode} onSelect={() => setSelected((value) => !value)} />
    </div>
  );
}

function SingleDemo() {
  const [value, setValue] = React.useState<string | undefined>("video");
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {BLOCKS.map((option) => (
        <SelectableCard key={option.value} option={option} selected={value === option.value} onSelect={setValue} />
      ))}
    </div>
  );
}

function MultipleDemo() {
  const [values, setValues] = React.useState<string[]>(["video", "quiz"]);
  const toggle = (next: string) => setValues((prev) => (prev.includes(next) ? prev.filter((item) => item !== next) : [...prev, next]));
  return (
    <div className="w-full space-y-3">
      <div className="grid gap-4 sm:grid-cols-3">
        {BLOCKS.slice(0, 3).map((option) => (
          <SelectableCard key={option.value} option={option} mode="multiple" selected={values.includes(option.value)} onSelect={toggle} />
        ))}
      </div>
      <p className="text-xs text-text-muted">{values.length} bloque(s) elegidos</p>
    </div>
  );
}

export const selectableCardEntry = defineEntry({
  id: "selectable-card",
  name: "SelectableCard",
  group: "selection",
  description:
    "La tarjeta individual que usan CardSelection y CheckboxCardGroup, expuesta como pieza suelta con `selected` y `onSelect`. Úsala cuando necesites tu propia grilla, un layout mixto o una lógica de selección que los grupos no cubren.",
  importPath: 'import { SelectableCard } from "@/components/selection"',
  sourcePath: "src/components/selection/SelectableCard.tsx",
  status: "stable",
  tags: ["primitive", "card"],
  playground: definePlayground({
    controls: {
      mode: { type: "select", label: "Modo", options: MODES, default: "single" },
      badge: { type: "text", default: "Nuevo" },
      disabled: { type: "boolean", label: "Deshabilitada", default: false },
    },
    render: ({ mode, badge, disabled }) => <PlaygroundDemo mode={mode as (typeof MODES)[number]} badge={badge} disabled={disabled} />,
    code: ({ mode, badge, disabled }) => {
      const attrs = [mode !== "single" ? `mode="${mode}"` : "", disabled ? "disabled" : ""].filter(Boolean).join(" ");
      return `const [selected, setSelected] = React.useState(true);

<SelectableCard
  option={{ value: "video", label: "Video", description: "Sube o enlaza una grabación.", icon: Video${badge ? `, badge: "${badge}"` : ""} }}
  selected={selected}
  onSelect={() => setSelected((v) => !v)}${attrs ? `\n  ${attrs}` : ""}
/>`;
    },
  }),
  examples: [
    {
      id: "single",
      title: "Grilla propia en modo único",
      description: "El consumidor decide la grilla; la tarjeta solo sabe si está elegida.",
      layout: "stretch",
      code: `const [value, setValue] = React.useState<string>("video");

<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {blocks.map((option) => (
    <SelectableCard key={option.value} option={option} selected={value === option.value} onSelect={setValue} />
  ))}
</div>`,
      render: () => <SingleDemo />,
    },
    {
      id: "multiple",
      title: "Modo múltiple",
      description: "Con mode=\"multiple\" el rol es checkbox y el indicador muestra un círculo vacío al pasar el cursor.",
      layout: "stretch",
      code: `const toggle = (next: string) =>
  setValues((prev) => (prev.includes(next) ? prev.filter((v) => v !== next) : [...prev, next]));

{blocks.map((option) => (
  <SelectableCard key={option.value} option={option} mode="multiple" selected={values.includes(option.value)} onSelect={toggle} />
))}`,
      render: () => <MultipleDemo />,
    },
    {
      id: "disabled",
      title: "Deshabilitada",
      code: `<SelectableCard option={{ value: "module", label: "Módulo", description: "Agrupa varios bloques.", icon: Layers, disabled: true }} />`,
      render: () => (
        <div className="w-full max-w-xs">
          <SelectableCard option={BLOCKS[3]} />
        </div>
      ),
    },
  ],
  props: [
    { name: "option", type: "SelectionOption", description: "Los datos de la tarjeta: value, label, description, eyebrow, badge, icon, disabled." },
    { name: "selected", type: "boolean", default: "false", description: "Estado elegido; controla borde, ring e indicador." },
    { name: "disabled", type: "boolean", default: "false", description: "Deshabilita la tarjeta además de option.disabled." },
    { name: "onSelect", type: "(value: string) => void", description: "Se llama con option.value al pulsar." },
    { name: "mode", type: '"single" | "multiple"', default: '"single"', description: "Define el role (radio o checkbox) y el indicador." },
    { name: "className", type: "string", description: "Clases para el botón exterior." },
  ],
  guidelines: {
    do: ["Úsala cuando la grilla o la lógica no encajan en los grupos ya hechos.", "Mantén el role coherente con la lógica: single para uno, multiple para varios."],
    dont: ["No reconstruyas CardSelection a mano si el grupo ya resuelve el caso.", "No olvides el estado disabled visual cuando una opción no aplica."],
  },
  related: ["card-selection", "checkbox-card-group", "option-tile", "card"],
});
