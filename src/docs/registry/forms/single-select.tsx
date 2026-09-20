import * as React from "react";
import { Field } from "@/components/forms";
import { SingleSelect, type SingleSelectOption } from "@/components/forms/SingleSelect";
import { defineEntry, definePlayground } from "../types";

const LEVELS: SingleSelectOption[] = [
  { value: "basic", label: "Básico" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
  { value: "expert", label: "Experto" },
];

const PLANS: SingleSelectOption[] = [
  { value: "starter", label: "Starter", description: "Hasta 50 colaboradores" },
  { value: "growth", label: "Growth", description: "Hasta 500 colaboradores" },
  { value: "enterprise", label: "Enterprise", description: "Sin límite, con SSO" },
  { value: "legacy", label: "Plan legado", description: "Ya no disponible", disabled: true },
];

function PlaygroundDemo({ placeholder, disabled }: { placeholder: string; disabled: boolean }) {
  const [value, setValue] = React.useState<string | undefined>(undefined);
  return <SingleSelect options={LEVELS} value={value} onValueChange={setValue} placeholder={placeholder} disabled={disabled} />;
}

function BasicDemo() {
  const [value, setValue] = React.useState<string | undefined>("intermediate");
  return (
    <div className="w-full space-y-3">
      <SingleSelect options={LEVELS} value={value} onValueChange={setValue} placeholder="Nivel del curso" />
      <p className="text-xs text-text-muted">Valor: {value ?? "—"}</p>
    </div>
  );
}

function PlanDemo() {
  const [value, setValue] = React.useState<string | undefined>(undefined);
  const plan = PLANS.find((option) => option.value === value);
  return (
    <Field label="Plan de la organización" description={plan ? plan.description : "Define cuántos colaboradores puedes invitar."}>
      <SingleSelect options={PLANS} value={value} onValueChange={setValue} placeholder="Elige un plan" />
    </Field>
  );
}

export const singleSelectEntry = defineEntry({
  id: "single-select",
  name: "SingleSelect",
  group: "forms",
  description:
    "El select de una opción con el mismo trigger y lista que MultiSelect: fondo muted, filas redondeadas y check a la derecha. Úsalo en formularios donde conviven ambos para que los triggers se vean idénticos.",
  importPath: 'import { SingleSelect } from "@/components/forms/SingleSelect"',
  sourcePath: "src/components/forms/SingleSelect.tsx",
  status: "stable",
  tags: ["popover", "command", "controlled"],
  playground: definePlayground({
    layout: "start",
    controls: {
      placeholder: { type: "text", default: "Seleccionar..." },
      disabled: { type: "boolean", label: "Deshabilitado", default: false },
    },
    render: ({ placeholder, disabled }) => (
      <div className="w-full max-w-sm">
        <PlaygroundDemo placeholder={placeholder} disabled={disabled} />
      </div>
    ),
    code: ({ placeholder, disabled }) => {
      const attrs = [placeholder !== "Seleccionar..." ? `placeholder="${placeholder}"` : "", disabled ? "disabled" : ""].filter(Boolean).join(" ");
      return `const [value, setValue] = React.useState<string>();

<SingleSelect options={levels} value={value} onValueChange={setValue}${attrs ? ` ${attrs}` : ""} />`;
    },
  }),
  examples: [
    {
      id: "basic",
      title: "Controlado",
      layout: "start",
      frameClassName: "min-h-[320px]",
      code: `const [value, setValue] = React.useState<string>("intermediate");

<SingleSelect
  options={[
    { value: "basic", label: "Básico" },
    { value: "intermediate", label: "Intermedio" },
    { value: "advanced", label: "Avanzado" },
  ]}
  value={value}
  onValueChange={setValue}
  placeholder="Nivel del curso"
/>`,
      render: () => (
        <div className="w-full max-w-sm">
          <BasicDemo />
        </div>
      ),
    },
    {
      id: "descriptions",
      title: "Con descripciones dentro de un Field",
      description: "La descripción del Field cambia según la opción elegida.",
      layout: "start",
      frameClassName: "min-h-[360px]",
      code: `<Field label="Plan de la organización" description={plan?.description ?? "Define cuántos colaboradores puedes invitar."}>
  <SingleSelect
    options={[
      { value: "starter", label: "Starter", description: "Hasta 50 colaboradores" },
      { value: "growth", label: "Growth", description: "Hasta 500 colaboradores" },
      { value: "legacy", label: "Plan legado", description: "Ya no disponible", disabled: true },
    ]}
    value={value}
    onValueChange={setValue}
    placeholder="Elige un plan"
  />
</Field>`,
      render: () => (
        <div className="w-full max-w-sm">
          <PlanDemo />
        </div>
      ),
    },
    {
      id: "disabled",
      title: "Deshabilitado",
      layout: "start",
      code: `<SingleSelect options={levels} value="advanced" disabled />`,
      render: () => (
        <div className="w-full max-w-sm">
          <SingleSelect options={LEVELS} value="advanced" disabled />
        </div>
      ),
    },
  ],
  props: [
    { name: "options", type: "SingleSelectOption[]", description: "Opciones con value, label, description opcional y disabled." },
    { name: "value", type: "string", description: "Valor seleccionado (controlado)." },
    { name: "onValueChange", type: "(value: string) => void", description: "Se llama al elegir; el popover se cierra solo." },
    { name: "placeholder", type: "string", default: '"Seleccionar..."', description: "Texto del trigger sin selección." },
    { name: "searchPlaceholder", type: "string", default: '"Buscar..."', description: "Placeholder del campo de búsqueda del popover." },
    { name: "emptyMessage", type: "string", default: '"No se encontraron resultados."', description: "Mensaje cuando la lista queda vacía." },
    { name: "disabled", type: "boolean", default: "false", description: "Deshabilita el trigger." },
    { name: "className", type: "string", description: "Clases extra para el trigger." },
  ],
  guidelines: {
    do: ["Úsalo junto a MultiSelect para que ambos triggers compartan estilo.", "Mantén los labels cortos: el trigger trunca en una línea."],
    dont: ["No lo importes desde el barrel `@/components/forms`: no está exportado ahí.", "No lo uses para listas largas que requieran filtrar: SearchableSelect sí filtra."],
  },
  related: ["multi-select", "searchable-select", "select", "field"],
});
