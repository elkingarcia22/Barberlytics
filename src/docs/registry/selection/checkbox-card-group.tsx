import * as React from "react";
import { Bell, FileBarChart, Link2, ShieldCheck } from "lucide-react";
import { CheckboxCardGroup, type SelectionOption } from "@/components/selection";
import { defineEntry, definePlayground } from "../types";

const COLUMNS = ["1", "2", "3", "4"] as const;

const MODULES: SelectionOption[] = [
  { value: "reports", label: "Reportes", description: "Avance por persona y por equipo.", icon: FileBarChart },
  { value: "reminders", label: "Recordatorios", description: "Notificaciones automáticas de vencimiento.", icon: Bell, badge: "Incluido" },
  { value: "integrations", label: "Integraciones", description: "Slack, Teams y calendario.", icon: Link2 },
  { value: "sso", label: "SSO", description: "Solo en plan Enterprise.", icon: ShieldCheck, disabled: true },
];

function PlaygroundDemo({ columns, disabled, label }: { columns: 1 | 2 | 3 | 4; disabled: boolean; label: string }) {
  const [value, setValue] = React.useState<string[]>(["reports"]);
  return <CheckboxCardGroup options={MODULES} value={value} onChange={setValue} columns={columns} disabled={disabled} label={label || undefined} />;
}

function BasicDemo() {
  const [value, setValue] = React.useState<string[]>(["reports", "reminders"]);
  return (
    <div className="w-full space-y-3">
      <CheckboxCardGroup options={MODULES} value={value} onChange={setValue} label="Módulos activos" description="Puedes activar varios." />
      <p className="text-xs text-text-muted">{value.length} módulo(s): {value.join(", ") || "ninguno"}</p>
    </div>
  );
}

function MinimumDemo() {
  const [value, setValue] = React.useState<string[]>([]);
  return <CheckboxCardGroup options={MODULES.slice(0, 3)} value={value} onChange={setValue} columns={3} label="Elige al menos un módulo" error={value.length === 0 ? "Selecciona al menos uno." : undefined} />;
}

export const checkboxCardGroupEntry = defineEntry({
  id: "checkbox-card-group",
  name: "CheckboxCardGroup",
  group: "selection",
  description:
    "La grilla de tarjetas para selección múltiple: cada una alterna su presencia en un arreglo y muestra un checkbox cuadrado en la esquina. Úsala para activar módulos, permisos o funcionalidades cuando cada opción merece una descripción.",
  importPath: 'import { CheckboxCardGroup } from "@/components/selection"',
  sourcePath: "src/components/selection/CheckboxCardGroup.tsx",
  status: "stable",
  tags: ["multiple", "grid", "field"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      columns: { type: "select", label: "Columnas", options: COLUMNS, default: "2" },
      label: { type: "text", label: "Etiqueta", default: "Módulos activos" },
      disabled: { type: "boolean", label: "Deshabilitado", default: false },
    },
    render: ({ columns, label, disabled }) => <PlaygroundDemo columns={Number(columns) as 1 | 2 | 3 | 4} disabled={disabled} label={label} />,
    code: ({ columns, label, disabled }) => {
      const attrs = [columns !== "2" ? `columns={${columns}}` : "", label ? `label="${label}"` : "", disabled ? "disabled" : ""].filter(Boolean).join(" ");
      return `const [value, setValue] = React.useState<string[]>(["reports"]);

<CheckboxCardGroup options={modules} value={value} onChange={setValue}${attrs ? ` ${attrs}` : ""} />`;
    },
  }),
  examples: [
    {
      id: "basic",
      title: "Controlado",
      description: "onChange recibe el arreglo completo ya actualizado.",
      layout: "stretch",
      code: `const [value, setValue] = React.useState<string[]>(["reports", "reminders"]);

<CheckboxCardGroup
  label="Módulos activos"
  description="Puedes activar varios."
  options={[
    { value: "reports", label: "Reportes", description: "Avance por persona y por equipo.", icon: FileBarChart },
    { value: "reminders", label: "Recordatorios", description: "Notificaciones automáticas.", icon: Bell, badge: "Incluido" },
    { value: "integrations", label: "Integraciones", description: "Slack, Teams y calendario.", icon: Link2 },
    { value: "sso", label: "SSO", description: "Solo en plan Enterprise.", icon: ShieldCheck, disabled: true },
  ]}
  value={value}
  onChange={setValue}
/>`,
      render: () => <BasicDemo />,
    },
    {
      id: "minimum",
      title: "Con mínimo requerido",
      description: "Desmarca todas para ver el error del Field.",
      layout: "stretch",
      code: `<CheckboxCardGroup
  label="Elige al menos un módulo"
  columns={3}
  options={modules}
  value={value}
  onChange={setValue}
  error={value.length === 0 ? "Selecciona al menos uno." : undefined}
/>`,
      render: () => <MinimumDemo />,
    },
  ],
  props: [
    { name: "options", type: "SelectionOption[]", description: "value, label, description, eyebrow, badge, icon y disabled por opción." },
    { name: "value", type: "string[]", default: "[]", description: "Valores marcados (controlado)." },
    { name: "onChange", type: "(value: string[]) => void", description: "Recibe el arreglo resultante tras alternar una tarjeta." },
    { name: "columns", type: "1 | 2 | 3 | 4", default: "2", description: "Columnas en desktop." },
    { name: "disabled", type: "boolean", default: "false", description: "Deshabilita todo el grupo." },
    { name: "label", type: "string", description: "Etiqueta del Field envolvente." },
    { name: "description", type: "string", description: "Ayuda bajo la grilla." },
    { name: "error", type: "string", description: "Mensaje de error del Field." },
    { name: "className", type: "string", description: "Clases para el contenedor." },
  ],
  guidelines: {
    do: ["Úsalo para 2 a 8 opciones con descripción.", "Valida mínimos y máximos en el consumidor y comunícalos con `error`."],
    dont: ["No lo uses para una sola elección: RadioCardGroup o CardSelection.", "No superes cuatro columnas: las tarjetas pierden legibilidad."],
  },
  related: ["card-selection", "radio-card-group", "selectable-card", "checkbox", "multi-select"],
});
