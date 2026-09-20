import * as React from "react";
import { MonthPicker, formatMonthYear } from "@/components/date";
import { defineEntry, definePlayground } from "../types";
import { PICKER_FRAME, ValueReadout } from "./_shared";

type MonthValue = { year: number; month: number } | undefined;
const readable = (v: MonthValue) => (v ? formatMonthYear(v.year, v.month, "es-ES") : "");

function PlaygroundDemo({ label, placeholder, minYear, maxYear, disabled, error }: { label: string; placeholder: string; minYear: number; maxYear: number; disabled: boolean; error: string }) {
  const [value, setValue] = React.useState<MonthValue>();
  return (
    <div className="w-64 space-y-3">
      <MonthPicker value={value} onChange={setValue} label={label || undefined} placeholder={placeholder} minYear={minYear} maxYear={maxYear} disabled={disabled} error={error || undefined} />
      <ValueReadout value={readable(value)} />
    </div>
  );
}

function BasicDemo() {
  const [value, setValue] = React.useState<MonthValue>();
  return (
    <div className="w-64 space-y-3">
      <MonthPicker value={value} onChange={setValue} label="Mes de cierre" placeholder="Elige un mes" />
      <ValueReadout value={readable(value)} />
    </div>
  );
}

function BoundedDemo() {
  const now = new Date();
  const [value, setValue] = React.useState<MonthValue>({ year: now.getFullYear(), month: now.getMonth() });
  return (
    <div className="w-64 space-y-3">
      <MonthPicker value={value} onChange={setValue} label="Periodo contable" description="Solo los últimos tres ejercicios." minYear={now.getFullYear() - 2} maxYear={now.getFullYear()} />
      <ValueReadout value={readable(value)} />
    </div>
  );
}

function StatesDemo() {
  return (
    <div className="grid w-full max-w-lg gap-6 sm:grid-cols-2">
      <MonthPicker label="Con error" error="Elige un mes." />
      <MonthPicker label="Deshabilitado" disabled placeholder="Sin acceso" />
    </div>
  );
}

export const monthPickerEntry = defineEntry({
  id: "month-picker",
  name: "MonthPicker",
  group: "date",
  description:
    "Selector de mes y año con una cuadrícula de doce meses y navegación por año. Devuelve `{ year, month }` con el mes indexado desde cero, listo para construir fechas nativas.",
  importPath: 'import { MonthPicker } from "@/components/date"',
  sourcePath: "src/components/date/MonthPicker.tsx",
  status: "stable",
  tags: ["controlado", "popover"],
  playground: definePlayground({
    layout: "start",
    controls: {
      label: { type: "text", default: "Mes de cierre" },
      placeholder: { type: "text", default: "Elige un mes" },
      minYear: { type: "number", label: "Año mínimo", default: 2020, min: 1900, max: 2100 },
      maxYear: { type: "number", label: "Año máximo", default: 2030, min: 1900, max: 2100 },
      error: { type: "text", default: "" },
      disabled: { type: "boolean", default: false },
    },
    render: (values) => <PlaygroundDemo {...values} />,
    code: ({ label, placeholder, minYear, maxYear, disabled, error }) => {
      const attrs = [
        label ? `label="${label}"` : "",
        `placeholder="${placeholder}"`,
        `minYear={${minYear}}`,
        `maxYear={${maxYear}}`,
        error ? `error="${error}"` : "",
        disabled ? "disabled" : "",
      ].filter(Boolean);
      return `const [value, setValue] = React.useState<{ year: number; month: number }>()

<MonthPicker
  value={value}
  onChange={setValue}
  ${attrs.join("\n  ")}
/>`;
    },
  }),
  examples: [
    {
      id: "basic",
      title: "Controlado",
      description: "Las flechas cambian el año visible; el clic sobre un mes selecciona y cierra.",
      layout: "start",
      frameClassName: PICKER_FRAME,
      code: `const [value, setValue] = React.useState<{ year: number; month: number }>()

<MonthPicker value={value} onChange={setValue} label="Mes de cierre" placeholder="Elige un mes" />`,
      render: () => <BasicDemo />,
    },
    {
      id: "bounded",
      title: "Con valor inicial y años acotados",
      description: "`minYear`/`maxYear` deshabilitan las flechas en los extremos.",
      layout: "start",
      frameClassName: PICKER_FRAME,
      code: `const now = new Date()
const [value, setValue] = React.useState({ year: now.getFullYear(), month: now.getMonth() })

<MonthPicker
  value={value}
  onChange={setValue}
  label="Periodo contable"
  minYear={now.getFullYear() - 2}
  maxYear={now.getFullYear()}
/>`,
      render: () => <BoundedDemo />,
    },
    {
      id: "states",
      title: "Error y deshabilitado",
      layout: "start",
      code: `<MonthPicker label="Con error" error="Elige un mes." />
<MonthPicker label="Deshabilitado" disabled placeholder="Sin acceso" />`,
      render: () => <StatesDemo />,
    },
  ],
  props: [
    { name: "value", type: "{ year: number; month: number }", description: "Mes seleccionado; `month` va de 0 (enero) a 11 (diciembre)." },
    { name: "onChange", type: "(value: { year: number; month: number }) => void", description: "Se dispara al elegir un mes." },
    { name: "minYear", type: "number", default: "1900", description: "Primer año navegable." },
    { name: "maxYear", type: "number", default: "2100", description: "Último año navegable." },
    { name: "label", type: "string", description: "Etiqueta visible." },
    { name: "description", type: "string", description: "Ayuda bajo el campo; se oculta si hay error." },
    { name: "error", type: "string", description: "Mensaje de error; activa el estado destructivo." },
    { name: "placeholder", type: "string", default: '"Select month"', description: "Texto del campo sin valor." },
    { name: "disabled", type: "boolean", default: "false", description: "Desactiva el campo." },
    { name: "className", type: "string", description: "Clases extra para el contenedor y el botón." },
  ],
  guidelines: {
    do: ["Úsalo para periodos mensuales: nóminas, cierres contables, informes.", "Acota los años al rango con datos reales para evitar navegación inútil."],
    dont: ["No lo uses si el usuario necesita un día concreto: usa DatePicker.", "No olvides que `month` es base cero al construir un `Date`."],
  },
  related: ["quarter-selector", "date-picker", "period-selector", "popover"],
});
