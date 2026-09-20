import * as React from "react";
import { QuarterSelector, formatQuarter, getQuarterFromDate } from "@/components/date";
import { defineEntry, definePlayground } from "../types";
import { PICKER_FRAME, ValueReadout } from "./_shared";

type Quarter = 1 | 2 | 3 | 4;
type QuarterValue = { year: number; quarter: Quarter } | undefined;
const readable = (v: QuarterValue) => (v ? formatQuarter(v.year, v.quarter) : "");

function PlaygroundDemo({ label, placeholder, minYear, maxYear, disabled, error }: { label: string; placeholder: string; minYear: number; maxYear: number; disabled: boolean; error: string }) {
  const [value, setValue] = React.useState<QuarterValue>();
  return (
    <div className="w-64 space-y-3">
      <QuarterSelector value={value} onChange={setValue} label={label || undefined} placeholder={placeholder} minYear={minYear} maxYear={maxYear} disabled={disabled} error={error || undefined} />
      <ValueReadout value={readable(value)} />
    </div>
  );
}

function BasicDemo() {
  const [value, setValue] = React.useState<QuarterValue>();
  return (
    <div className="w-64 space-y-3">
      <QuarterSelector value={value} onChange={setValue} label="Trimestre fiscal" placeholder="Elige un trimestre" />
      <ValueReadout value={readable(value)} />
    </div>
  );
}

function CurrentDemo() {
  const now = new Date();
  const [value, setValue] = React.useState<QuarterValue>({ year: now.getFullYear(), quarter: getQuarterFromDate(now) });
  return (
    <div className="w-64 space-y-3">
      <QuarterSelector value={value} onChange={setValue} label="Trimestre en curso" description="Inicializado con getQuarterFromDate." minYear={now.getFullYear() - 3} maxYear={now.getFullYear()} />
      <ValueReadout value={readable(value)} />
    </div>
  );
}

function StatesDemo() {
  return (
    <div className="grid w-full max-w-lg gap-6 sm:grid-cols-2">
      <QuarterSelector label="Con error" error="Selecciona un trimestre." />
      <QuarterSelector label="Deshabilitado" disabled />
    </div>
  );
}

export const quarterSelectorEntry = defineEntry({
  id: "quarter-selector",
  name: "QuarterSelector",
  group: "date",
  description:
    "Selector de trimestre y año con cuatro botones (Q1–Q4) y navegación por año. Devuelve `{ year, quarter }` y se formatea como `Q2 2026` con las utilidades de fecha.",
  importPath: 'import { QuarterSelector } from "@/components/date"',
  sourcePath: "src/components/date/QuarterSelector.tsx",
  status: "stable",
  tags: ["controlado", "popover"],
  playground: definePlayground({
    layout: "start",
    controls: {
      label: { type: "text", default: "Trimestre fiscal" },
      placeholder: { type: "text", default: "Elige un trimestre" },
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
      return `const [value, setValue] = React.useState<{ year: number; quarter: 1 | 2 | 3 | 4 }>()

<QuarterSelector
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
      layout: "start",
      frameClassName: PICKER_FRAME,
      code: `const [value, setValue] = React.useState<{ year: number; quarter: 1 | 2 | 3 | 4 }>()

<QuarterSelector value={value} onChange={setValue} label="Trimestre fiscal" placeholder="Elige un trimestre" />`,
      render: () => <BasicDemo />,
    },
    {
      id: "current",
      title: "Trimestre en curso por defecto",
      description: "`getQuarterFromDate` calcula el trimestre de cualquier fecha; aquí inicializa el valor.",
      layout: "start",
      frameClassName: PICKER_FRAME,
      code: `const now = new Date()
const [value, setValue] = React.useState({ year: now.getFullYear(), quarter: getQuarterFromDate(now) })

<QuarterSelector
  value={value}
  onChange={setValue}
  label="Trimestre en curso"
  minYear={now.getFullYear() - 3}
  maxYear={now.getFullYear()}
/>`,
      render: () => <CurrentDemo />,
    },
    {
      id: "states",
      title: "Error y deshabilitado",
      layout: "start",
      code: `<QuarterSelector label="Con error" error="Selecciona un trimestre." />
<QuarterSelector label="Deshabilitado" disabled />`,
      render: () => <StatesDemo />,
    },
  ],
  props: [
    { name: "value", type: "{ year: number; quarter: 1 | 2 | 3 | 4 }", description: "Trimestre seleccionado." },
    { name: "onChange", type: "(value: { year: number; quarter: 1 | 2 | 3 | 4 }) => void", description: "Se dispara al elegir un trimestre." },
    { name: "minYear", type: "number", default: "1900", description: "Primer año navegable." },
    { name: "maxYear", type: "number", default: "2100", description: "Último año navegable." },
    { name: "label", type: "string", description: "Etiqueta visible." },
    { name: "description", type: "string", description: "Ayuda bajo el campo; se oculta si hay error." },
    { name: "error", type: "string", description: "Mensaje de error; activa el estado destructivo." },
    { name: "placeholder", type: "string", default: '"Select quarter"', description: "Texto del campo sin valor." },
    { name: "disabled", type: "boolean", default: "false", description: "Desactiva el campo." },
    { name: "className", type: "string", description: "Clases extra para el contenedor y el botón." },
  ],
  guidelines: {
    do: ["Úsalo en objetivos, OKR y reportes trimestrales.", "Traduce el trimestre a fechas reales con `getQuarterFromDate` y `formatQuarter` para mantener una sola fuente de verdad."],
    dont: ["No lo uses para rangos arbitrarios: usa DateRangePicker.", "No dejes `minYear`/`maxYear` en sus valores por defecto (1900–2100) en pantallas de producto."],
  },
  related: ["month-picker", "period-selector", "date-utils", "popover"],
});
