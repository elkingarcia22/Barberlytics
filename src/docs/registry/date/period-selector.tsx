import * as React from "react";
import { PeriodSelector } from "@/components/date";
import type { PeriodSelectorOption } from "@/components/date";
import { defineEntry, definePlayground } from "../types";
import { ValueReadout } from "./_shared";

const PERIODOS: PeriodSelectorOption[] = [
  { label: "Hoy", value: "today" },
  { label: "Ayer", value: "yesterday" },
  { label: "Últimos 7 días", value: "last_7_days" },
  { label: "Últimos 30 días", value: "last_30_days" },
  { label: "Este mes", value: "this_month" },
  { label: "Mes anterior", value: "last_month" },
  { label: "Este trimestre", value: "this_quarter" },
  { label: "Este año", value: "this_year" },
  { label: "Rango personalizado", value: "custom" },
];

const CICLOS: PeriodSelectorOption[] = [
  { label: "Ciclo 2026-H1", value: "2026-h1", description: "Enero – junio" },
  { label: "Ciclo 2026-H2", value: "2026-h2", description: "Julio – diciembre" },
  { label: "Ciclo 2025-H2", value: "2025-h2", description: "Cerrado" },
];

function PlaygroundDemo({ label, placeholder, description, error, disabled, spanish }: { label: string; placeholder: string; description: string; error: string; disabled: boolean; spanish: boolean }) {
  const [value, setValue] = React.useState<string | undefined>();
  return (
    <div className="w-64 space-y-3">
      <PeriodSelector
        value={value}
        onChange={setValue}
        options={spanish ? PERIODOS : undefined}
        label={label || undefined}
        placeholder={placeholder}
        description={description || undefined}
        error={error || undefined}
        disabled={disabled}
      />
      <ValueReadout value={value ?? ""} />
    </div>
  );
}

function BasicDemo() {
  const [value, setValue] = React.useState<string | undefined>("last_30_days");
  return (
    <div className="w-64 space-y-3">
      <PeriodSelector value={value} onChange={setValue} options={PERIODOS} label="Periodo" placeholder="Elige un periodo" />
      <ValueReadout value={value ?? ""} />
    </div>
  );
}

function CustomDemo() {
  const [value, setValue] = React.useState<string | undefined>();
  return (
    <div className="w-64 space-y-3">
      <PeriodSelector value={value} onChange={setValue} options={CICLOS} label="Ciclo de evaluación" placeholder="Elige un ciclo" description="Cada opción admite una descripción secundaria." />
      <ValueReadout value={value ?? ""} />
    </div>
  );
}

function StatesDemo() {
  return (
    <div className="grid w-full max-w-lg gap-6 sm:grid-cols-2">
      <PeriodSelector options={PERIODOS} label="Con error" error="Selecciona un periodo." />
      <PeriodSelector options={PERIODOS} label="Deshabilitado" value="this_month" disabled />
    </div>
  );
}

export const periodSelectorEntry = defineEntry({
  id: "period-selector",
  name: "PeriodSelector",
  group: "date",
  description:
    "Select de periodos predefinidos (hoy, últimos 7 días, este mes…) con etiqueta, ayuda y error. Acepta opciones propias con descripción secundaria para ciclos o cohortes de negocio.",
  importPath: 'import { PeriodSelector } from "@/components/date"',
  sourcePath: "src/components/date/PeriodSelector.tsx",
  status: "stable",
  tags: ["controlado", "select"],
  playground: definePlayground({
    layout: "start",
    controls: {
      label: { type: "text", default: "Periodo" },
      placeholder: { type: "text", default: "Elige un periodo" },
      description: { type: "text", label: "Descripción", default: "" },
      error: { type: "text", default: "" },
      spanish: { type: "boolean", label: "Opciones en español", default: true },
      disabled: { type: "boolean", default: false },
    },
    render: (values) => <PlaygroundDemo {...values} />,
    code: ({ label, placeholder, description, error, disabled, spanish }) => {
      const attrs = [
        spanish ? "options={PERIODOS}" : "",
        label ? `label="${label}"` : "",
        `placeholder="${placeholder}"`,
        description ? `description="${description}"` : "",
        error ? `error="${error}"` : "",
        disabled ? "disabled" : "",
      ].filter(Boolean);
      return `const [value, setValue] = React.useState<string>()

<PeriodSelector
  value={value}
  onChange={setValue}
  ${attrs.join("\n  ")}
/>`;
    },
  }),
  examples: [
    {
      id: "basic",
      title: "Periodos habituales",
      description: "Las opciones por defecto vienen en inglés; en producto pásalas traducidas con `options`.",
      layout: "start",
      frameClassName: "min-h-[300px] items-start pt-8",
      code: `const PERIODOS: PeriodSelectorOption[] = [
  { label: "Hoy", value: "today" },
  { label: "Últimos 7 días", value: "last_7_days" },
  { label: "Últimos 30 días", value: "last_30_days" },
  { label: "Este mes", value: "this_month" },
  { label: "Rango personalizado", value: "custom" },
]
const [value, setValue] = React.useState<string>("last_30_days")

<PeriodSelector value={value} onChange={setValue} options={PERIODOS} label="Periodo" />`,
      render: () => <BasicDemo />,
    },
    {
      id: "custom",
      title: "Opciones con descripción",
      layout: "start",
      frameClassName: "min-h-[300px] items-start pt-8",
      code: `const CICLOS: PeriodSelectorOption[] = [
  { label: "Ciclo 2026-H1", value: "2026-h1", description: "Enero – junio" },
  { label: "Ciclo 2026-H2", value: "2026-h2", description: "Julio – diciembre" },
  { label: "Ciclo 2025-H2", value: "2025-h2", description: "Cerrado" },
]

<PeriodSelector value={value} onChange={setValue} options={CICLOS} label="Ciclo de evaluación" />`,
      render: () => <CustomDemo />,
    },
    {
      id: "states",
      title: "Error y deshabilitado",
      layout: "start",
      code: `<PeriodSelector options={PERIODOS} label="Con error" error="Selecciona un periodo." />
<PeriodSelector options={PERIODOS} label="Deshabilitado" value="this_month" disabled />`,
      render: () => <StatesDemo />,
    },
  ],
  props: [
    { name: "value", type: "string", description: "`value` de la opción seleccionada." },
    { name: "onChange", type: "(value: string) => void", description: "Se dispara al elegir una opción." },
    { name: "options", type: "PeriodSelectorOption[]", default: "9 periodos en inglés", description: "Lista de `{ label, value, description? }`." },
    { name: "label", type: "string", description: "Etiqueta visible." },
    { name: "description", type: "string", description: "Ayuda bajo el campo; se oculta si hay error." },
    { name: "error", type: "string", description: "Mensaje de error; activa el estado destructivo." },
    { name: "placeholder", type: "string", default: '"Select period"', description: "Texto del trigger sin valor." },
    { name: "disabled", type: "boolean", default: "false", description: "Desactiva el select." },
    { name: "className", type: "string", description: "Clases extra para el contenedor y el trigger." },
  ],
  guidelines: {
    do: ["Ofrece siempre una opción `custom` que abra un DateRangePicker.", "Resuelve el `value` a fechas reales en un solo lugar (un helper) para que todos los informes coincidan."],
    dont: ["No mezcles periodos relativos (últimos 7 días) con fechas fijas en la misma lista sin separarlos visualmente.", "No dejes las opciones por defecto en inglés en interfaces en español."],
  },
  related: ["select", "date-range-picker", "date-filter-bar", "quarter-selector"],
});
