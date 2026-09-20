import * as React from "react";
import { Field, SearchableSelect, type SearchableSelectOption } from "@/components/forms";
import { defineEntry, definePlayground } from "../types";

const COUNTRIES: SearchableSelectOption[] = [
  { value: "co", label: "Colombia" },
  { value: "mx", label: "México" },
  { value: "pe", label: "Perú" },
  { value: "cl", label: "Chile" },
  { value: "ar", label: "Argentina" },
  { value: "ec", label: "Ecuador" },
  { value: "uy", label: "Uruguay" },
];

const MANAGERS: SearchableSelectOption[] = [
  { value: "ana", label: "Ana Rodríguez", description: "Gerente comercial · Bogotá" },
  { value: "luis", label: "Luis Herrera", description: "Director de operaciones · CDMX" },
  { value: "sofia", label: "Sofía Méndez", description: "Head of People · Lima" },
  { value: "carlos", label: "Carlos Peña", description: "Fuera de la organización", disabled: true },
];

function PlaygroundDemo({ placeholder, searchPlaceholder, disabled }: { placeholder: string; searchPlaceholder: string; disabled: boolean }) {
  const [value, setValue] = React.useState<string | undefined>(undefined);
  return <SearchableSelect options={COUNTRIES} value={value} onValueChange={setValue} placeholder={placeholder} searchPlaceholder={searchPlaceholder} disabled={disabled} />;
}

function BasicDemo() {
  const [value, setValue] = React.useState<string | undefined>("co");
  const selected = COUNTRIES.find((option) => option.value === value);
  return (
    <div className="w-full space-y-3">
      <SearchableSelect options={COUNTRIES} value={value} onValueChange={setValue} placeholder="País de operación" searchPlaceholder="Escribe para filtrar…" />
      <p className="text-xs text-text-muted">Seleccionado: {selected ? selected.label : "ninguno"}</p>
    </div>
  );
}

function ManagerDemo() {
  const [value, setValue] = React.useState<string | undefined>(undefined);
  return (
    <Field label="Responsable del programa" required description="Solo aparecen personas activas en la organización." error={value ? undefined : "Elige un responsable para continuar."}>
      <SearchableSelect options={MANAGERS} value={value} onValueChange={setValue} placeholder="Buscar por nombre" emptyMessage="Ninguna persona coincide." />
    </Field>
  );
}

export const searchableSelectEntry = defineEntry({
  id: "searchable-select",
  name: "SearchableSelect",
  group: "forms",
  description:
    "Un select de una sola opción con búsqueda integrada en el popover, filtrada por cmdk. Úsalo cuando la lista supera las diez opciones o el usuario sabe lo que busca y prefiere escribir a desplazarse.",
  importPath: 'import { SearchableSelect } from "@/components/forms"',
  sourcePath: "src/components/forms/SearchableSelect.tsx",
  status: "stable",
  tags: ["popover", "command", "controlled"],
  playground: definePlayground({
    layout: "start",
    controls: {
      placeholder: { type: "text", default: "Selecciona una opción" },
      searchPlaceholder: { type: "text", label: "Placeholder de búsqueda", default: "Buscar..." },
      disabled: { type: "boolean", label: "Deshabilitado", default: false },
    },
    render: ({ placeholder, searchPlaceholder, disabled }) => (
      <div className="w-full max-w-sm">
        <PlaygroundDemo placeholder={placeholder} searchPlaceholder={searchPlaceholder} disabled={disabled} />
      </div>
    ),
    code: ({ placeholder, searchPlaceholder, disabled }) => {
      const attrs = [
        placeholder !== "Selecciona una opción" ? `placeholder="${placeholder}"` : "",
        searchPlaceholder !== "Buscar..." ? `searchPlaceholder="${searchPlaceholder}"` : "",
        disabled ? "disabled" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `const [value, setValue] = React.useState<string>();

<SearchableSelect options={countries} value={value} onValueChange={setValue}${attrs ? ` ${attrs}` : ""} />`;
    },
  }),
  examples: [
    {
      id: "basic",
      title: "Controlado con filtro",
      description: "Abre el popover y escribe: la lista se filtra por el label de cada opción.",
      layout: "start",
      frameClassName: "min-h-[360px]",
      code: `const [value, setValue] = React.useState<string>("co");

<SearchableSelect
  options={[
    { value: "co", label: "Colombia" },
    { value: "mx", label: "México" },
    { value: "pe", label: "Perú" },
  ]}
  value={value}
  onValueChange={setValue}
  placeholder="País de operación"
  searchPlaceholder="Escribe para filtrar…"
/>`,
      render: () => (
        <div className="w-full max-w-sm">
          <BasicDemo />
        </div>
      ),
    },
    {
      id: "descriptions",
      title: "Con descripciones, requerido y opción deshabilitada",
      description: "El error desaparece al elegir un responsable.",
      layout: "start",
      frameClassName: "min-h-[380px]",
      code: `<Field label="Responsable del programa" required error={value ? undefined : "Elige un responsable para continuar."}>
  <SearchableSelect
    options={[
      { value: "ana", label: "Ana Rodríguez", description: "Gerente comercial · Bogotá" },
      { value: "carlos", label: "Carlos Peña", description: "Fuera de la organización", disabled: true },
    ]}
    value={value}
    onValueChange={setValue}
    placeholder="Buscar por nombre"
    emptyMessage="Ninguna persona coincide."
  />
</Field>`,
      render: () => (
        <div className="w-full max-w-sm">
          <ManagerDemo />
        </div>
      ),
    },
    {
      id: "disabled",
      title: "Deshabilitado",
      layout: "start",
      code: `<SearchableSelect options={countries} value="co" disabled />`,
      render: () => (
        <div className="w-full max-w-sm">
          <SearchableSelect options={COUNTRIES} value="co" disabled />
        </div>
      ),
    },
  ],
  props: [
    { name: "options", type: "SearchableSelectOption[]", description: "Opciones con value, label, description opcional y disabled." },
    { name: "value", type: "string", description: "Valor seleccionado (controlado)." },
    { name: "onValueChange", type: "(value: string) => void", description: "Se llama al elegir; el popover se cierra solo." },
    { name: "placeholder", type: "string", default: '"Selecciona una opción"', description: "Texto del trigger sin selección." },
    { name: "searchPlaceholder", type: "string", default: '"Buscar..."', description: "Placeholder del CommandInput." },
    { name: "emptyMessage", type: "string", default: '"No se encontraron resultados."', description: "Mensaje cuando el filtro no coincide con nada." },
    { name: "disabled", type: "boolean", default: "false", description: "Deshabilita el trigger." },
    { name: "className", type: "string", description: "Clases extra para el trigger." },
  ],
  guidelines: {
    do: ["Úsalo a partir de ~10 opciones o con nombres propios (personas, ciudades).", "Aprovecha `description` para desambiguar homónimos.", "Personaliza `emptyMessage` con una acción posible cuando exista."],
    dont: ["No lo uses para 3 o 4 opciones: el buscador estorba; usa Select o SegmentedControl.", "No dependas del filtro para listas de miles: pagina o busca en servidor."],
  },
  related: ["single-select", "multi-select", "select", "field", "popover"],
});
