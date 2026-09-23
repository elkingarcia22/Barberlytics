import * as React from "react";
import { Bold, Eye, EyeOff, Italic, Pin, Underline } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { defineEntry, definePlayground } from "../types";

const VARIANTS = ["default", "outline"] as const;
type Variant = (typeof VARIANTS)[number];
const SIZES = ["sm", "default", "lg"] as const;
type Size = (typeof SIZES)[number];

function PinnedCourse() {
  const [pinned, setPinned] = React.useState(false);
  return (
    <div className="flex w-full max-w-sm items-center justify-between rounded-xl border border-border/60 bg-surface px-4 py-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-text-primary">Liderazgo situacional</span>
        <span className="text-xs text-text-secondary">{pinned ? "Fijado en tu tablero" : "12 lecciones · 3 h"}</span>
      </div>
      <Toggle aria-label="Fijar curso" pressed={pinned} onPressedChange={setPinned} size="sm">
        <Pin className={pinned ? "fill-current" : undefined} />
      </Toggle>
    </div>
  );
}

function ShowSalary() {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-sm tabular-nums text-text-primary">{visible ? "$ 4.850.000" : "$ •••••••••"}</span>
      <Toggle variant="outline" size="sm" aria-label="Mostrar salario" pressed={visible} onPressedChange={setVisible}>
        {visible ? <EyeOff /> : <Eye />}
        {visible ? "Ocultar" : "Mostrar"}
      </Toggle>
    </div>
  );
}

export const toggleEntry = defineEntry({
  id: "toggle",
  name: "Toggle",
  group: "ui",
  description:
    "Botón de dos estados que se ve activo o inactivo en el acto: negrita, fijar, mostrar u ocultar. Comparte alturas con Button (28, 32 y 36px) para convivir en la misma barra. Para varias opciones relacionadas, usa ToggleGroup.",
  importPath: 'import { Toggle } from "@/components/ui/toggle"',
  sourcePath: "src/components/ui/toggle.tsx",
  status: "stable",
  tags: ["radix", "cva"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", options: VARIANTS, default: "default" },
      size: { type: "select", options: SIZES, default: "default" },
      pressed: { type: "boolean", label: "Activado", default: true },
      disabled: { type: "boolean", default: false },
      label: { type: "text", label: "Texto (vacío = solo icono)", default: "Negrita" },
    },
    render: ({ variant, size, pressed, disabled, label }) => (
      <Toggle variant={variant as Variant} size={size as Size} pressed={pressed} disabled={disabled} aria-label="Negrita">
        <Bold />
        {label || null}
      </Toggle>
    ),
    code: ({ variant, size, pressed, disabled, label }) => {
      const attrs = [
        variant !== "default" ? `variant="${variant}"` : "",
        size !== "default" ? `size="${size}"` : "",
        `pressed={${pressed}}`,
        "onPressedChange={setPressed}",
        disabled ? "disabled" : "",
        'aria-label="Negrita"',
      ]
        .filter(Boolean)
        .join(" ");
      return `<Toggle ${attrs}>\n  <Bold />${label ? `\n  ${label}` : ""}\n</Toggle>`;
    },
  }),
  examples: [
    {
      id: "formatting",
      title: "Formato de texto",
      description: "Tres toggles independientes en la barra de un editor de descripción de vacante; cada uno guarda su propio estado.",
      code: `<Toggle aria-label="Negrita"><Bold /></Toggle>
<Toggle aria-label="Cursiva"><Italic /></Toggle>
<Toggle aria-label="Subrayado"><Underline /></Toggle>`,
      render: () => (
        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-surface p-1">
          <Toggle aria-label="Negrita" defaultPressed>
            <Bold />
          </Toggle>
          <Toggle aria-label="Cursiva">
            <Italic />
          </Toggle>
          <Toggle aria-label="Subrayado">
            <Underline />
          </Toggle>
        </div>
      ),
    },
    {
      id: "controlled",
      title: "Controlado: fijar un curso",
      description: "`pressed` y `onPressedChange` dejan el estado en el padre, que aquí cambia la línea de ayuda de la tarjeta.",
      code: `const [pinned, setPinned] = React.useState(false);

<Toggle aria-label="Fijar curso" size="sm" pressed={pinned} onPressedChange={setPinned}>
  <Pin className={pinned ? "fill-current" : undefined} />
</Toggle>`,
      render: () => <PinnedCourse />,
    },
    {
      id: "outline-with-text",
      title: "Outline con texto",
      description: "La variante `outline` se lee como botón; conviene cuando el toggle va solo y no dentro de una barra.",
      code: `<Toggle variant="outline" size="sm" aria-label="Mostrar salario" pressed={visible} onPressedChange={setVisible}>
  {visible ? <EyeOff /> : <Eye />}
  {visible ? "Ocultar" : "Mostrar"}
</Toggle>`,
      render: () => <ShowSalary />,
    },
    {
      id: "sizes",
      title: "Tamaños",
      code: `<Toggle size="sm" aria-label="Negrita"><Bold /></Toggle>
<Toggle aria-label="Negrita"><Bold /></Toggle>
<Toggle size="lg" aria-label="Negrita"><Bold /></Toggle>`,
      render: () => (
        <div className="flex items-center gap-3">
          {SIZES.map((size) => (
            <Toggle key={size} size={size} variant="outline" aria-label={`Negrita ${size}`} defaultPressed>
              <Bold />
            </Toggle>
          ))}
        </div>
      ),
    },
  ],
  props: [
    { name: "variant", type: '"default" | "outline"', default: '"default"', description: "Sin borde (para barras) o con borde (para ir solo)." },
    { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "28, 32 o 36px de alto, igual que Button." },
    { name: "pressed / defaultPressed", type: "boolean", description: "Estado controlado o inicial." },
    { name: "onPressedChange", type: "(pressed: boolean) => void", description: "Se dispara al conmutar." },
    { name: "disabled", type: "boolean", default: "false", description: "Sin eventos y con opacidad al 50%." },
    { name: "...props", type: "React.ComponentProps<TogglePrimitive.Root>", description: "Radix expone `aria-pressed` y `data-state=\"on\" | \"off\"`." },
  ],
  guidelines: {
    do: [
      "Etiqueta siempre con `aria-label` cuando solo lleva icono.",
      "Que el estado activo cambie algo visible al instante; si requiere guardar, usa Checkbox.",
      "Mantén la misma variante en toda la barra.",
    ],
    dont: [
      "No lo uses para navegar ni para abrir menús: ahí va Button.",
      "No lo uses para «sí / no» en formularios: eso es Switch o Checkbox.",
      "No cambies el icono y el color a la vez sin motivo; el fondo tintado ya marca el estado.",
    ],
  },
  related: ["toggle-group", "switch", "button", "segmented-control"],
});
