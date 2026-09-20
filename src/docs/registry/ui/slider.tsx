import * as React from "react";
import { Volume2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { defineEntry, definePlayground } from "../types";

const ORIENTATIONS = ["horizontal", "vertical"] as const;
type Orientation = (typeof ORIENTATIONS)[number];

function LabelledSlider() {
  const [value, setValue] = React.useState([65]);
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="slider-volume" className="flex items-center gap-1.5">
          <Volume2 className="size-4 text-text-secondary" /> Volumen
        </Label>
        <span className="text-xs tabular-nums text-text-secondary">{value[0]}%</span>
      </div>
      <Slider id="slider-volume" value={value} onValueChange={setValue} max={100} step={1} />
    </div>
  );
}

const MIN_BUDGET = 0;
const MAX_BUDGET = 5000;
const BUDGET_STEP = 100;
const currency = new Intl.NumberFormat("es-CO", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function RangeSlider() {
  const [range, setRange] = React.useState([1200, 3600]);
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-text-primary">Presupuesto por persona</span>
        <span className="tabular-nums text-text-secondary">
          {currency.format(range[0])} – {currency.format(range[1])}
        </span>
      </div>
      <Slider value={range} onValueChange={setRange} min={MIN_BUDGET} max={MAX_BUDGET} step={BUDGET_STEP} minStepsBetweenThumbs={2} />
    </div>
  );
}

const STEP_LABELS = ["Nunca", "Rara vez", "A veces", "Seguido", "Siempre"];

function SteppedSlider() {
  const [value, setValue] = React.useState([2]);
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <span className="text-sm font-medium text-text-primary">¿Con qué frecuencia recibes feedback?</span>
      <Slider value={value} onValueChange={setValue} min={0} max={STEP_LABELS.length - 1} step={1} />
      <div className="flex justify-between text-[11px] text-text-muted">
        {STEP_LABELS.map((label, index) => (
          <span key={label} className={index === value[0] ? "font-semibold text-primary" : undefined}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function VerticalSliders() {
  const [values, setValues] = React.useState([40, 75, 55]);
  const update = (index: number) => (next: number[]) => setValues((prev) => prev.map((item, i) => (i === index ? next[0] : item)));
  return (
    <div className="flex h-48 items-stretch gap-8">
      {["Q1", "Q2", "Q3"].map((label, index) => (
        <div key={label} className="flex flex-col items-center gap-2">
          <Slider orientation="vertical" value={[values[index]]} onValueChange={update(index)} max={100} step={5} />
          <span className="text-xs text-text-secondary">{label}</span>
        </div>
      ))}
    </div>
  );
}

export const sliderEntry = defineEntry({
  id: "slider",
  name: "Slider",
  group: "ui",
  description:
    "Control deslizante de Radix con pista fina, rango en color primario y un pulgar que crece al pasar el cursor. Acepta uno o varios pulgares (rango), pasos discretos y orientación vertical.",
  importPath: 'import { Slider } from "@/components/ui/slider"',
  sourcePath: "src/components/ui/slider.tsx",
  status: "stable",
  tags: ["radix", "form"],
  playground: definePlayground({
    controls: {
      value: { type: "number", label: "Valor", default: 40, min: 0, max: 100, step: 1 },
      step: { type: "number", label: "Paso", default: 1, min: 1, max: 25, step: 1 },
      orientation: { type: "select", label: "Orientación", options: ORIENTATIONS, default: "horizontal" },
      disabled: { type: "boolean", default: false },
    },
    render: ({ value, step, orientation, disabled }) => (
      <div className={orientation === "vertical" ? "h-48" : "w-full max-w-sm"}>
        <Slider
          key={`${value}-${step}-${orientation}`}
          defaultValue={[value]}
          step={step}
          orientation={orientation as Orientation}
          disabled={disabled}
          max={100}
        />
      </div>
    ),
    code: ({ value, step, orientation, disabled }) => {
      const attrs = [
        `defaultValue={[${value}]}`,
        "max={100}",
        step !== 1 ? `step={${step}}` : "",
        orientation !== "horizontal" ? `orientation="${orientation}"` : "",
        disabled ? "disabled" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<Slider ${attrs} />`;
    },
  }),
  examples: [
    {
      id: "labelled",
      title: "Controlado con etiqueta y valor",
      description: "`value` es siempre un array; muestra el número al lado para que el ajuste sea preciso.",
      code: `const [value, setValue] = React.useState([65]);

<div className="flex items-center justify-between">
  <Label htmlFor="volume"><Volume2 /> Volumen</Label>
  <span className="text-xs tabular-nums">{value[0]}%</span>
</div>
<Slider id="volume" value={value} onValueChange={setValue} max={100} step={1} />`,
      render: () => <LabelledSlider />,
    },
    {
      id: "range",
      title: "Rango (dos pulgares)",
      description: "Con dos valores se pintan dos pulgares; `minStepsBetweenThumbs` evita que se crucen.",
      code: `const [range, setRange] = React.useState([1200, 3600]);

<Slider value={range} onValueChange={setRange} min={0} max={5000} step={100} minStepsBetweenThumbs={2} />`,
      render: () => <RangeSlider />,
    },
    {
      id: "stepped",
      title: "Escala discreta",
      description: "Pasos enteros con etiquetas debajo: útil para escalas Likert.",
      code: `const LABELS = ["Nunca", "Rara vez", "A veces", "Seguido", "Siempre"];
const [value, setValue] = React.useState([2]);

<Slider value={value} onValueChange={setValue} min={0} max={LABELS.length - 1} step={1} />
<div className="flex justify-between text-[11px]">
  {LABELS.map((label, i) => <span key={label} className={i === value[0] ? "font-semibold text-primary" : ""}>{label}</span>)}
</div>`,
      render: () => <SteppedSlider />,
    },
    {
      id: "vertical",
      title: "Vertical",
      description: "Con `orientation=\"vertical\"` el contenedor define la altura (mínimo 160px).",
      code: `<div className="h-48">
  <Slider orientation="vertical" value={[value]} onValueChange={([v]) => setValue(v)} max={100} step={5} />
</div>`,
      render: () => <VerticalSliders />,
    },
  ],
  props: [
    { name: "value / defaultValue", type: "number[]", description: "Uno o más valores; cada uno pinta un pulgar." },
    { name: "onValueChange", type: "(value: number[]) => void", description: "Se dispara en cada movimiento. Usa `onValueCommit` para reaccionar solo al soltar." },
    { name: "min / max", type: "number", default: "0 / 100", description: "Límites de la escala." },
    { name: "step", type: "number", default: "1", description: "Incremento entre valores válidos." },
    { name: "minStepsBetweenThumbs", type: "number", default: "0", description: "Separación mínima entre pulgares en un rango." },
    { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "En vertical toma la altura del contenedor." },
    { name: "disabled", type: "boolean", default: "false", description: "Baja la opacidad al 50% y bloquea la interacción." },
  ],
  guidelines: {
    do: ["Muestra el valor numérico al lado; el pulgar solo no basta para leerlo.", "Usa `step` acorde a la precisión que importa (100 en montos, 1 en porcentajes).", "Asocia un Label con `htmlFor` al `id` del slider."],
    dont: ["No lo uses para elegir entre pocas opciones nombradas: usa RadioGroup o SegmentedControl.", "No dispares peticiones en `onValueChange`; usa `onValueCommit`."],
  },
  related: ["range-slider", "progress", "radio-group"],
});
