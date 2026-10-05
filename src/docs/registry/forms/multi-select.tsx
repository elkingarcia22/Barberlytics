import * as React from "react";
import { Field, MultiSelect, type MultiSelectOption } from "@/components/forms";
import { defineEntry, definePlayground } from "../types";

const SKILLS: MultiSelectOption[] = [
  { value: "leadership", label: "Liderazgo" },
  { value: "communication", label: "Comunicación" },
  { value: "data", label: "Análisis de datos" },
  { value: "sales", label: "Ventas consultivas" },
  { value: "design", label: "Diseño de producto" },
];

const AREAS: MultiSelectOption[] = [
  { value: "sales", label: "Comercial", description: "Equipos de venta y preventa" },
  { value: "ops", label: "Operaciones", description: "Logística y soporte" },
  { value: "people", label: "Talento", description: "Selección y cultura" },
  { value: "finance", label: "Finanzas", description: "Solo lectura", disabled: true },
];

function useSelection(initial: string[] = []) {
  return React.useState<string[]>(initial);
}

function PlaygroundDemo({ placeholder, disabled }: { placeholder: string; disabled: boolean }) {
  const [value, setValue] = useSelection(["leadership"]);
  return <MultiSelect options={SKILLS} value={value} onValueChange={setValue} placeholder={placeholder} disabled={disabled} />;
}

function BasicDemo() {
  const [value, setValue] = useSelection([]);
  return (
    <div className="w-full space-y-3">
      <MultiSelect options={SKILLS} value={value} onValueChange={setValue} />
      <p className="text-xs text-text-muted">{value.length === 0 ? "Nada seleccionado" : `${value.length} habilidad(es): ${value.join(", ")}`}</p>
    </div>
  );
}

function DescriptionsDemo() {
  const [value, setValue] = useSelection(["sales", "people"]);
  return (
    <Field label="Áreas participantes" description="Finanzas no puede añadirse desde aquí.">
      <MultiSelect options={AREAS} value={value} onValueChange={setValue} placeholder="Elige una o varias áreas" />
    </Field>
  );
}

function LimitDemo() {
  const MAX = 2;
  const [value, setValue] = useSelection([]);
  const handleChange = (next: string[]) => setValue(next.slice(0, MAX));
  return (
    <Field label="Habilidades prioritarias" error={value.length >= MAX ? `Máximo ${MAX} habilidades.` : undefined}>
      <MultiSelect options={SKILLS} value={value} onValueChange={handleChange} placeholder="Hasta dos habilidades" />
    </Field>
  );
}

export const multiSelectEntry = defineEntry({
  id: "multi-select",
  name: "MultiSelect",
  group: "forms",
  description:
    "Un combobox controlado para elegir varias opciones, que muestra lo elegido como chips removibles dentro del trigger. Úsalo cuando el usuario necesita combinar etiquetas, áreas o habilidades sin abandonar el formulario.",
  importPath: 'import { MultiSelect } from "@/components/forms"',
  sourcePath: "src/components/forms/MultiSelect.tsx",
  status: "stable",
  tags: ["popover", "command", "controlled"],
  playground: definePlayground({
    layout: "start",
    controls: {
      placeholder: { type: "text", default: "Seleccionar opciones" },
      disabled: { type: "boolean", label: "Deshabilitado", default: false },
    },
    render: ({ placeholder, disabled }) => (
      <div className="w-full max-w-md">
        <PlaygroundDemo placeholder={placeholder} disabled={disabled} />
      </div>
    ),
    code: ({ placeholder, disabled }) => {
      const attrs = [placeholder !== "Seleccionar opciones" ? `placeholder="${placeholder}"` : "", disabled ? "disabled" : ""].filter(Boolean).join(" ");
      return `const [value, setValue] = React.useState<string[]>(["leadership"]);

<MultiSelect options={options} value={value} onValueChange={setValue}${attrs ? ` ${attrs}` : ""} />`;
    },
  }),
  examples: [
    {
      id: "basic",
      title: "Controlado",
      description: "El valor es un arreglo de strings; cada chip tiene su propia X para quitarlo.",
      layout: "start",
      frameClassName: "min-h-[320px]",
      code: `const [value, setValue] = React.useState<string[]>([]);

<MultiSelect
  options={[
    { value: "leadership", label: "Liderazgo" },
    { value: "communication", label: "Comunicación" },
    { value: "data", label: "Análisis de datos" },
  ]}
  value={value}
  onValueChange={setValue}
/>`,
      render: () => (
        <div className="w-full max-w-md">
          <BasicDemo />
        </div>
      ),
    },
    {
      id: "descriptions",
      title: "Con descripciones y opción deshabilitada",
      layout: "start",
      frameClassName: "min-h-[340px]",
      code: `<Field label="Áreas participantes" description="Finanzas no puede añadirse desde aquí.">
  <MultiSelect
    options={[
      { value: "sales", label: "Comercial", description: "Equipos de venta y preventa" },
      { value: "finance", label: "Finanzas", description: "Solo lectura", disabled: true },
    ]}
    value={value}
    onValueChange={setValue}
    placeholder="Elige una o varias áreas"
  />
</Field>`,
      render: () => (
        <div className="w-full max-w-md">
          <DescriptionsDemo />
        </div>
      ),
    },
    {
      id: "limit",
      title: "Con límite de selección",
      description: "El límite vive en el onValueChange del consumidor; el componente no lo impone.",
      layout: "start",
      frameClassName: "min-h-[320px]",
      code: `const MAX = 2;
const handleChange = (next: string[]) => setValue(next.slice(0, MAX));

<Field label="Habilidades prioritarias" error={value.length >= MAX ? \`Máximo \${MAX} habilidades.\` : undefined}>
  <MultiSelect options={options} value={value} onValueChange={handleChange} placeholder="Hasta dos habilidades" />
</Field>`,
      render: () => (
        <div className="w-full max-w-md">
          <LimitDemo />
        </div>
      ),
    },
  ],
  props: [
    { name: "options", type: "MultiSelectOption[]", description: "Lista de opciones: value, label y, opcionales, description, leading (avatar o miniatura) y disabled. Se filtra por label y description." },
    { name: "value", type: "string[]", default: "[]", description: "Valores seleccionados (controlado)." },
    { name: "onValueChange", type: "(value: string[]) => void", description: "Se llama con el arreglo completo al añadir o quitar una opción." },
    { name: "placeholder", type: "string", default: '"Seleccionar opciones"', description: "Texto del trigger cuando no hay selección." },
    { name: "searchPlaceholder", type: "string", default: '"Buscar..."', description: "Placeholder del campo de búsqueda del popover." },
    { name: "emptyMessage", type: "string", default: '"No se encontraron resultados."', description: "Mensaje cuando la lista queda vacía." },
    { name: "disabled", type: "boolean", default: "false", description: "Deshabilita el trigger completo." },
    { name: "className", type: "string", description: "Clases extra para el trigger." },
  ],
  guidelines: {
    do: ["Úsalo a partir de 5 opciones; con menos, un CheckboxCardGroup se lee mejor.", "Envuélvelo en un Field para etiqueta, ayuda y error.", "Ordena las opciones por frecuencia de uso o alfabéticamente."],
    dont: ["No lo uses para una sola elección: para eso está SingleSelect.", "No superes 3 o 4 chips visibles sin dar un resumen (`+N`) desde el consumidor."],
  },
  related: ["single-select", "searchable-select", "checkbox-card-group", "field", "badge"],
});
