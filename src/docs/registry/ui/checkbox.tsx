import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { defineEntry, definePlayground } from "../types";

const STATES = ["unchecked", "checked", "indeterminate"] as const;
type CheckedState = boolean | "indeterminate";

const MODULES = ["Introducción", "Comunicación efectiva", "Gestión del tiempo", "Evaluación final"] as const;

function SelectAllList() {
  const [selected, setSelected] = React.useState<string[]>(["Introducción"]);
  const all = selected.length === MODULES.length;
  const some = selected.length > 0 && !all;
  const headerState: CheckedState = all ? true : some ? "indeterminate" : false;

  const toggle = (name: string, checked: CheckedState) =>
    setSelected((items) => (checked === true ? [...items, name] : items.filter((item) => item !== name)));

  return (
    <div className="w-full max-w-sm rounded-xl border border-border/60 bg-surface">
      <label className="flex items-center gap-3 border-b border-border/60 px-4 py-3 text-sm font-medium text-text-primary">
        <Checkbox checked={headerState} onCheckedChange={(checked) => setSelected(checked === true ? [...MODULES] : [])} aria-label="Seleccionar todos" />
        Todos los módulos
        <span className="ml-auto text-xs font-normal text-text-muted">
          {selected.length}/{MODULES.length}
        </span>
      </label>
      {MODULES.map((name) => (
        <label key={name} className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-muted/40">
          <Checkbox checked={selected.includes(name)} onCheckedChange={(checked) => toggle(name, checked)} />
          {name}
        </label>
      ))}
    </div>
  );
}

function TermsForm() {
  const [accepted, setAccepted] = React.useState(false);
  return (
    <div className="flex items-start gap-3">
      <Checkbox id="terms" checked={accepted} onCheckedChange={(checked) => setAccepted(checked === true)} className="mt-0.5" />
      <div className="grid gap-1">
        <Label htmlFor="terms">Acepto los términos y la política de privacidad</Label>
        <p className="text-[13px] text-text-muted">{accepted ? "Listo, puedes continuar con el registro." : "Es necesario para crear la cuenta."}</p>
      </div>
    </div>
  );
}

export const checkboxEntry = defineEntry({
  id: "checkbox",
  name: "Checkbox",
  group: "ui",
  description:
    "Casilla de 16px para elegir una o varias opciones de un conjunto, con estado indeterminado para selecciones parciales. Úsalo en formularios y listas seleccionables; para una preferencia on/off usa Switch.",
  importPath: 'import { Checkbox } from "@/components/ui/checkbox"',
  sourcePath: "src/components/ui/checkbox.tsx",
  status: "stable",
  tags: ["radix"],
  playground: definePlayground({
    controls: {
      state: { type: "select", label: "Estado", options: STATES, default: "checked" },
      label: { type: "text", default: "Recibir resumen semanal" },
      disabled: { type: "boolean", default: false },
      invalid: { type: "boolean", label: "Inválido", default: false },
    },
    render: ({ state, label, disabled, invalid }) => {
      const checked: CheckedState = state === "checked" ? true : state === "indeterminate" ? "indeterminate" : false;
      return (
        <div className="flex items-center gap-2">
          <Checkbox id="pg-checkbox" checked={checked} disabled={disabled} aria-invalid={invalid || undefined} />
          <Label htmlFor="pg-checkbox">{label}</Label>
        </div>
      );
    },
    code: ({ state, label, disabled, invalid }) => {
      const attrs = [
        state === "checked" ? "checked" : state === "indeterminate" ? 'checked="indeterminate"' : "",
        disabled ? "disabled" : "",
        invalid ? "aria-invalid" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<div className="flex items-center gap-2">
  <Checkbox id="weekly"${attrs ? ` ${attrs}` : ""} />
  <Label htmlFor="weekly">${label}</Label>
</div>`;
    },
  }),
  examples: [
    {
      id: "with-label",
      title: "Con etiqueta y descripción",
      description: "Asocia el `id` con `htmlFor` para que la etiqueta también active la casilla.",
      code: `const [accepted, setAccepted] = React.useState(false);

<div className="flex items-start gap-3">
  <Checkbox id="terms" checked={accepted} onCheckedChange={(checked) => setAccepted(checked === true)} />
  <div className="grid gap-1">
    <Label htmlFor="terms">Acepto los términos y la política de privacidad</Label>
    <p className="text-[13px] text-text-muted">Es necesario para crear la cuenta.</p>
  </div>
</div>`,
      render: () => <TermsForm />,
    },
    {
      id: "select-all",
      title: "Seleccionar todo con estado indeterminado",
      description: "La casilla del encabezado refleja el conjunto: vacía, parcial (`indeterminate`) o completa.",
      code: `const all = selected.length === MODULES.length;
const some = selected.length > 0 && !all;

<Checkbox
  checked={all ? true : some ? "indeterminate" : false}
  onCheckedChange={(checked) => setSelected(checked === true ? [...MODULES] : [])}
  aria-label="Seleccionar todos"
/>
{MODULES.map((name) => (
  <label key={name} className="flex items-center gap-3">
    <Checkbox checked={selected.includes(name)} onCheckedChange={(checked) => toggle(name, checked)} />
    {name}
  </label>
))}`,
      render: () => <SelectAllList />,
    },
    {
      id: "states",
      title: "Deshabilitado e inválido",
      code: `<Checkbox disabled />
<Checkbox disabled checked />
<Checkbox aria-invalid />`,
      render: () => (
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox id="cb-disabled" disabled />
            <Label htmlFor="cb-disabled" className="text-text-muted">
              Deshabilitado
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="cb-disabled-checked" disabled checked />
            <Label htmlFor="cb-disabled-checked" className="text-text-muted">
              Marcado y deshabilitado
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="cb-invalid" aria-invalid />
            <Label htmlFor="cb-invalid" className="text-destructive">
              Campo requerido
            </Label>
          </div>
        </div>
      ),
    },
  ],
  props: [
    { name: "checked / defaultChecked", type: 'boolean | "indeterminate"', description: "Estado de la casilla. `indeterminate` muestra un guion para selecciones parciales." },
    { name: "onCheckedChange", type: '(checked: boolean | "indeterminate") => void', description: "Se dispara al cambiar el estado." },
    { name: "disabled", type: "boolean", default: "false", description: "Desactiva la casilla y baja la opacidad." },
    { name: "required", type: "boolean", default: "false", description: "Marca el control como obligatorio en formularios nativos." },
    { name: "name / value", type: "string", description: "Se envían con el formulario como un input oculto." },
    { name: "aria-invalid", type: "boolean", description: "Aplica el borde y anillo destructivos." },
  ],
  guidelines: {
    do: ["Coloca siempre una etiqueta visible o `aria-label`.", "Usa `indeterminate` solo en casillas que resumen un grupo.", "Alinea la casilla con la primera línea del texto cuando la etiqueta es larga."],
    dont: ["No lo uses para acciones inmediatas; para eso está Switch.", "No hagas depender el envío del formulario de una única casilla sin explicar por qué.", "No lo hagas más pequeño de 16px: el área táctil ya es mínima."],
  },
  related: ["switch", "radio-group", "label"],
});
