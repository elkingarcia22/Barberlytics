import * as React from "react";
import { CalendarClock, Mail, MessageSquare, Zap } from "lucide-react";
import { RadioCardGroup, type SelectionOption } from "@/components/selection";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const COLUMNS = ["1", "2", "3", "4"] as const;

const CHANNELS: SelectionOption[] = [
  { value: "email", label: "Correo", description: "Un resumen por correo cada semana.", icon: Mail },
  { value: "chat", label: "Chat interno", description: "Mensaje directo en tu herramienta de chat.", icon: MessageSquare, badge: "Nuevo" },
  { value: "push", label: "Notificación push", description: "Aviso inmediato en la app móvil.", icon: Zap },
  { value: "digest", label: "Agenda", description: "Se integra con tu calendario.", icon: CalendarClock, disabled: true },
];

function PlaygroundDemo({ columns, disabled, label }: { columns: 1 | 2 | 3 | 4; disabled: boolean; label: string }) {
  const [value, setValue] = React.useState<string | undefined>("email");
  return <RadioCardGroup options={CHANNELS} value={value} onChange={setValue} columns={columns} disabled={disabled} label={label || undefined} />;
}

function KeyboardDemo() {
  const [value, setValue] = React.useState<string | undefined>("chat");
  return (
    <div className="w-full space-y-3">
      <RadioCardGroup name="channel" options={CHANNELS} value={value} onChange={setValue} label="Canal de recordatorios" description="Usa las flechas del teclado para moverte entre tarjetas." />
      <p className="text-xs text-text-muted">Valor del formulario (name=&quot;channel&quot;): {value ?? "—"}</p>
    </div>
  );
}

function FormDemo() {
  const [value, setValue] = React.useState<string | undefined>(undefined);
  const [submitted, setSubmitted] = React.useState(false);
  return (
    <form
      className="w-full space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <RadioCardGroup name="channel" columns={3} options={CHANNELS.slice(0, 3)} value={value} onChange={setValue} label="Canal" error={submitted && !value ? "Selecciona un canal." : undefined} />
      <Button type="submit" size="sm">
        Guardar preferencia
      </Button>
    </form>
  );
}

export const radioCardGroupEntry = defineEntry({
  id: "radio-card-group",
  name: "RadioCardGroup",
  group: "selection",
  description:
    "Las mismas tarjetas de CardSelection, pero montadas sobre Radix RadioGroup: navegación con flechas, roving tabindex y un input oculto con name para formularios nativos. Es la opción a elegir cuando el grupo vive dentro de un form o necesita accesibilidad de radio real.",
  importPath: 'import { RadioCardGroup } from "@/components/selection"',
  sourcePath: "src/components/selection/RadioCardGroup.tsx",
  status: "stable",
  tags: ["radix", "single", "form"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      columns: { type: "select", label: "Columnas", options: COLUMNS, default: "2" },
      label: { type: "text", label: "Etiqueta", default: "Canal de recordatorios" },
      disabled: { type: "boolean", label: "Deshabilitado", default: false },
    },
    render: ({ columns, label, disabled }) => <PlaygroundDemo columns={Number(columns) as 1 | 2 | 3 | 4} disabled={disabled} label={label} />,
    code: ({ columns, label, disabled }) => {
      const attrs = [columns !== "2" ? `columns={${columns}}` : "", label ? `label="${label}"` : "", disabled ? "disabled" : ""].filter(Boolean).join(" ");
      return `const [value, setValue] = React.useState<string>("email");

<RadioCardGroup options={channels} value={value} onChange={setValue}${attrs ? ` ${attrs}` : ""} />`;
    },
  }),
  examples: [
    {
      id: "keyboard",
      title: "Navegación con teclado",
      description: "Enfoca una tarjeta y usa las flechas: Radix mueve la selección y salta las deshabilitadas.",
      layout: "stretch",
      code: `const [value, setValue] = React.useState<string>("chat");

<RadioCardGroup
  name="channel"
  label="Canal de recordatorios"
  options={[
    { value: "email", label: "Correo", description: "Un resumen por correo cada semana.", icon: Mail },
    { value: "chat", label: "Chat interno", description: "Mensaje directo.", icon: MessageSquare, badge: "Nuevo" },
    { value: "push", label: "Notificación push", description: "Aviso inmediato.", icon: Zap },
    { value: "digest", label: "Agenda", description: "Se integra con tu calendario.", icon: CalendarClock, disabled: true },
  ]}
  value={value}
  onChange={setValue}
/>`,
      render: () => <KeyboardDemo />,
    },
    {
      id: "form",
      title: "Dentro de un formulario",
      description: "Envía sin elegir para ver el error del Field.",
      layout: "stretch",
      code: `<form onSubmit={handleSubmit}>
  <RadioCardGroup
    name="channel"
    columns={3}
    label="Canal"
    options={channels}
    value={value}
    onChange={setValue}
    error={submitted && !value ? "Selecciona un canal." : undefined}
  />
  <Button type="submit" size="sm">Guardar preferencia</Button>
</form>`,
      render: () => <FormDemo />,
    },
  ],
  props: [
    { name: "options", type: "SelectionOption[]", description: "value, label, description, eyebrow, badge, icon y disabled por opción." },
    { name: "value", type: "string", description: "Valor elegido (controlado)." },
    { name: "onChange", type: "(value: string) => void", description: "Recibe el nuevo valor desde Radix." },
    { name: "name", type: "string", description: "Nombre del input oculto para envíos nativos de formulario." },
    { name: "columns", type: "1 | 2 | 3 | 4", default: "2", description: "Columnas en desktop." },
    { name: "disabled", type: "boolean", default: "false", description: "Deshabilita todo el grupo." },
    { name: "label", type: "string", description: "Etiqueta del Field envolvente." },
    { name: "description", type: "string", description: "Ayuda bajo la grilla." },
    { name: "error", type: "string", description: "Mensaje de error del Field." },
    { name: "className", type: "string", description: "Clases para el contenedor." },
  ],
  guidelines: {
    do: ["Prefiérelo sobre CardSelection dentro de formularios o cuando importa la navegación con teclado.", "Pasa `name` si el formulario se envía de forma nativa."],
    dont: ["No lo uses para selección múltiple: usa CheckboxCardGroup.", "No dejes el grupo sin valor inicial si hay una opción por defecto razonable."],
  },
  related: ["card-selection", "radio-group", "checkbox-card-group", "field"],
});
