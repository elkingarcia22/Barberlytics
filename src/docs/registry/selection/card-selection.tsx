import * as React from "react";
import { BookOpen, Compass, Sparkles, Users } from "lucide-react";
import { CardSelection, type SelectionOption } from "@/components/selection";
import { defineEntry, definePlayground } from "../types";

const COLUMNS = ["1", "2", "3", "4"] as const;

const FORMATS: SelectionOption[] = [
  { value: "course", label: "Curso", description: "Lecciones en video con evaluación final.", icon: BookOpen },
  { value: "path", label: "Ruta", description: "Varios cursos encadenados con un objetivo.", icon: Compass, badge: "Popular" },
  { value: "cohort", label: "Cohorte", description: "Sesiones en vivo con un facilitador.", icon: Users },
];

const PLANS: SelectionOption[] = [
  { value: "starter", eyebrow: "Equipos pequeños", label: "Starter", description: "Hasta 50 colaboradores, reportes básicos.", badge: "Gratis" },
  { value: "growth", eyebrow: "Empresas", label: "Growth", description: "Hasta 500 colaboradores, rutas e integraciones.", badge: "Recomendado", icon: Sparkles },
  { value: "enterprise", eyebrow: "Corporativo", label: "Enterprise", description: "Ilimitado, SSO y gerente de éxito.", disabled: true },
];

function PlaygroundDemo({ columns, disabled, label }: { columns: 1 | 2 | 3 | 4; disabled: boolean; label: string }) {
  const [value, setValue] = React.useState<string | undefined>("path");
  return <CardSelection options={FORMATS} value={value} onChange={setValue} columns={columns} disabled={disabled} label={label || undefined} />;
}

function BasicDemo() {
  const [value, setValue] = React.useState<string | undefined>(undefined);
  return (
    <div className="w-full space-y-3">
      <CardSelection options={FORMATS} value={value} onChange={setValue} label="Formato del contenido" description="Podrás cambiarlo antes de publicar." />
      <p className="text-xs text-text-muted">Seleccionado: {value ?? "ninguno"}</p>
    </div>
  );
}

function ValidationDemo() {
  const [value, setValue] = React.useState<string | undefined>(undefined);
  return <CardSelection options={PLANS} value={value} onChange={setValue} columns={3} label="Plan" error={value ? undefined : "Elige un plan para continuar."} />;
}

export const cardSelectionEntry = defineEntry({
  id: "card-selection",
  name: "CardSelection",
  group: "selection",
  description:
    "Una grilla de tarjetas donde solo una puede estar elegida, con icono, eyebrow, badge y descripción por opción. Úsala cuando la decisión merece contexto visual, como elegir un formato, un plan o una plantilla.",
  importPath: 'import { CardSelection } from "@/components/selection"',
  sourcePath: "src/components/selection/CardSelection.tsx",
  status: "stable",
  tags: ["single", "grid", "field"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      columns: { type: "select", label: "Columnas", options: COLUMNS, default: "3" },
      label: { type: "text", label: "Etiqueta", default: "Formato del contenido" },
      disabled: { type: "boolean", label: "Deshabilitado", default: false },
    },
    render: ({ columns, label, disabled }) => <PlaygroundDemo columns={Number(columns) as 1 | 2 | 3 | 4} disabled={disabled} label={label} />,
    code: ({ columns, label, disabled }) => {
      const attrs = [columns !== "3" ? `columns={${columns}}` : "", label ? `label="${label}"` : "", disabled ? "disabled" : ""].filter(Boolean).join(" ");
      return `const [value, setValue] = React.useState<string>("path");

<CardSelection options={formats} value={value} onChange={setValue}${attrs ? ` ${attrs}` : ""} />`;
    },
  }),
  examples: [
    {
      id: "basic",
      title: "Con iconos y etiqueta",
      description: "Cada opción es un botón con role=radio; el check aparece en la esquina de la elegida.",
      layout: "stretch",
      code: `const [value, setValue] = React.useState<string>();

<CardSelection
  label="Formato del contenido"
  description="Podrás cambiarlo antes de publicar."
  options={[
    { value: "course", label: "Curso", description: "Lecciones en video con evaluación final.", icon: BookOpen },
    { value: "path", label: "Ruta", description: "Varios cursos encadenados con un objetivo.", icon: Compass, badge: "Popular" },
    { value: "cohort", label: "Cohorte", description: "Sesiones en vivo con un facilitador.", icon: Users },
  ]}
  value={value}
  onChange={setValue}
/>`,
      render: () => <BasicDemo />,
    },
    {
      id: "validation",
      title: "Eyebrow, badge, error y opción deshabilitada",
      description: "El error viene del Field interno y desaparece al elegir.",
      layout: "stretch",
      code: `<CardSelection
  label="Plan"
  columns={3}
  error={value ? undefined : "Elige un plan para continuar."}
  options={[
    { value: "starter", eyebrow: "Equipos pequeños", label: "Starter", description: "Hasta 50 colaboradores.", badge: "Gratis" },
    { value: "growth", eyebrow: "Empresas", label: "Growth", description: "Hasta 500 colaboradores.", badge: "Recomendado", icon: Sparkles },
    { value: "enterprise", eyebrow: "Corporativo", label: "Enterprise", description: "Ilimitado, SSO.", disabled: true },
  ]}
  value={value}
  onChange={setValue}
/>`,
      render: () => <ValidationDemo />,
    },
    {
      id: "single-column",
      title: "Una columna",
      description: "En una columna las tarjetas se apilan; útil en drawers estrechos.",
      layout: "stretch",
      code: `<CardSelection columns={1} options={formats.slice(0, 2)} value="course" />`,
      render: () => (
        <div className="mx-auto w-full max-w-sm">
          <CardSelection columns={1} options={FORMATS.slice(0, 2)} value="course" />
        </div>
      ),
    },
  ],
  props: [
    { name: "options", type: "SelectionOption[]", description: "value, label, description, eyebrow, badge, icon y disabled por opción." },
    { name: "value", type: "string", description: "Valor elegido (controlado)." },
    { name: "onChange", type: "(value: string) => void", description: "Se llama al pulsar una tarjeta." },
    { name: "columns", type: "1 | 2 | 3 | 4", default: "3", description: "Columnas en desktop; en móvil siempre es una." },
    { name: "disabled", type: "boolean", default: "false", description: "Deshabilita todas las tarjetas." },
    { name: "label", type: "string", description: "Etiqueta del Field envolvente." },
    { name: "description", type: "string", description: "Ayuda bajo la grilla." },
    { name: "error", type: "string", description: "Mensaje de error del Field." },
    { name: "className", type: "string", description: "Clases para el contenedor." },
  ],
  guidelines: {
    do: ["Úsala para 2 a 6 opciones con descripción; más de eso, pasa a OptionTile.", "Da a cada opción un icono o un eyebrow para que se distingan de un vistazo.", "Reserva el badge para una sola tarjeta (Recomendado, Popular)."],
    dont: ["No la uses cuando el label basta: un RadioGroup normal es más liviano.", "No mezcles tarjetas con y sin descripción en la misma grilla."],
  },
  related: ["radio-card-group", "selectable-card", "option-tile", "radio-group", "checkbox-card-group"],
});
