import * as React from "react";
import { RangeSlider } from "@/components/range";
import { defineEntry, definePlayground } from "../types";
import { ValueReadout } from "./_shared";

type Pair = [number, number];
const currency = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

function PlaygroundDemo({ label, min, max, step, showValue, disabled, error }: { label: string; min: number; max: number; step: number; showValue: boolean; disabled: boolean; error: string }) {
  const [value, setValue] = React.useState<Pair>([min, max]);
  React.useEffect(() => setValue([min, max]), [min, max]);
  return (
    <div className="w-80 space-y-3">
      <RangeSlider value={value} onChange={setValue} label={label || undefined} min={min} max={max} step={step} showValue={showValue} disabled={disabled} error={error || undefined} />
      <ValueReadout value={`${value[0]} – ${value[1]}`} />
    </div>
  );
}

function BasicDemo() {
  const [value, setValue] = React.useState<Pair>([20, 80]);
  return (
    <div className="w-80 space-y-3">
      <RangeSlider value={value} onChange={setValue} label="Porcentaje de avance" />
      <ValueReadout value={`${value[0]} – ${value[1]}`} />
    </div>
  );
}

function CurrencyDemo() {
  const [value, setValue] = React.useState<Pair>([2_000_000, 6_500_000]);
  return (
    <div className="w-80 space-y-3">
      <RangeSlider value={value} onChange={setValue} label="Rango salarial" min={1_000_000} max={10_000_000} step={250_000} valueFormatter={(v) => currency.format(v)} description="Paso de 250.000 COP." />
      <ValueReadout value={`${value[0]} – ${value[1]}`} />
    </div>
  );
}

function StepDemo() {
  const [value, setValue] = React.useState<Pair>([18, 45]);
  return (
    <div className="w-80 space-y-3">
      <RangeSlider value={value} onChange={setValue} label="Edad" min={18} max={65} step={1} valueFormatter={(v) => `${v} años`} />
      <ValueReadout value={`${value[0]} – ${value[1]}`} />
    </div>
  );
}

function StatesDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-8 sm:grid-cols-3">
      <RangeSlider value={[10, 90]} label="Sin valor visible" showValue={false} />
      <RangeSlider value={[70, 75]} label="Con error" error="El rango es demasiado estrecho." />
      <RangeSlider value={[30, 60]} label="Deshabilitado" disabled />
    </div>
  );
}

export const rangeSliderEntry = defineEntry({
  id: "range-slider",
  name: "RangeSlider",
  group: "date",
  description:
    "Slider de dos manejadores para acotar un rango numérico, con etiqueta, valores visibles y formateador propio. Envuelve el Slider base y reporta siempre una tupla `[min, max]`.",
  importPath: 'import { RangeSlider } from "@/components/range"',
  sourcePath: "src/components/range/RangeSlider.tsx",
  status: "stable",
  tags: ["controlado", "slider", "radix"],
  playground: definePlayground({
    controls: {
      label: { type: "text", default: "Porcentaje de avance" },
      min: { type: "number", default: 0, min: -1000, max: 1000 },
      max: { type: "number", default: 100, min: -1000, max: 10000 },
      step: { type: "number", default: 1, min: 1, max: 100 },
      showValue: { type: "boolean", label: "Mostrar valores", default: true },
      error: { type: "text", default: "" },
      disabled: { type: "boolean", default: false },
    },
    render: (values) => <PlaygroundDemo {...values} />,
    code: ({ label, min, max, step, showValue, disabled, error }) => {
      const attrs = [
        label ? `label="${label}"` : "",
        min !== 0 ? `min={${min}}` : "",
        max !== 100 ? `max={${max}}` : "",
        step !== 1 ? `step={${step}}` : "",
        !showValue ? "showValue={false}" : "",
        error ? `error="${error}"` : "",
        disabled ? "disabled" : "",
      ].filter(Boolean);
      return `const [value, setValue] = React.useState<[number, number]>([${min}, ${max}])

<RangeSlider
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
      description: "Arrastra cualquiera de los dos manejadores; `onChange` recibe la tupla ordenada.",
      code: `const [value, setValue] = React.useState<[number, number]>([20, 80])

<RangeSlider value={value} onChange={setValue} label="Porcentaje de avance" />`,
      render: () => <BasicDemo />,
    },
    {
      id: "currency",
      title: "Con formateador",
      description: "`valueFormatter` solo afecta al texto mostrado; el valor sigue siendo numérico.",
      code: `const currency = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })

<RangeSlider
  value={value}
  onChange={setValue}
  label="Rango salarial"
  min={1_000_000}
  max={10_000_000}
  step={250_000}
  valueFormatter={(v) => currency.format(v)}
/>`,
      render: () => <CurrencyDemo />,
    },
    {
      id: "step",
      title: "Con límites y unidad",
      code: `<RangeSlider value={value} onChange={setValue} label="Edad" min={18} max={65} valueFormatter={(v) => \`\${v} años\`} />`,
      render: () => <StepDemo />,
    },
    {
      id: "states",
      title: "Sin valores, error y deshabilitado",
      code: `<RangeSlider value={[10, 90]} label="Sin valor visible" showValue={false} />
<RangeSlider value={[70, 75]} label="Con error" error="El rango es demasiado estrecho." />
<RangeSlider value={[30, 60]} label="Deshabilitado" disabled />`,
      render: () => <StatesDemo />,
    },
  ],
  props: [
    { name: "value", type: "[number, number]", default: "[0, 100]", description: "Rango seleccionado como tupla `[inicio, fin]`." },
    { name: "onChange", type: "(value: [number, number]) => void", description: "Se dispara mientras se arrastra cualquiera de los manejadores." },
    { name: "min", type: "number", default: "0", description: "Valor mínimo de la pista." },
    { name: "max", type: "number", default: "100", description: "Valor máximo de la pista." },
    { name: "step", type: "number", default: "1", description: "Incremento entre posiciones." },
    { name: "label", type: "string", description: "Etiqueta visible enlazada por `aria-labelledby`." },
    { name: "description", type: "string", description: "Ayuda bajo el slider; se oculta si hay error." },
    { name: "error", type: "string", description: "Mensaje de error; tiñe pista y manejadores de destructivo." },
    { name: "showValue", type: "boolean", default: "true", description: "Muestra `inicio — fin` a la derecha de la etiqueta." },
    { name: "valueFormatter", type: "(value: number) => string", default: "String", description: "Formatea cada valor mostrado." },
    { name: "disabled", type: "boolean", default: "false", description: "Desactiva el slider." },
    { name: "className", type: "string", description: "Clases extra para el contenedor." },
  ],
  guidelines: {
    do: ["Úsalo para acotar filtros numéricos continuos (salario, edad, porcentaje).", "Formatea con unidad o moneda para que el rango se lea sin contexto adicional.", "Mantén `value` dentro de `[min, max]` al cambiar los límites desde fuera."],
    dont: ["No lo uses para fechas: existen los pickers de rango.", "No lo uses cuando el usuario necesita escribir un valor exacto; ofrece inputs numéricos junto al slider."],
  },
  related: ["slider", "input", "date-range-picker"],
});
