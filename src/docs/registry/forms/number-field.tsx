import * as React from "react";
import { Field, NumberField } from "@/components/forms";
import { defineEntry, definePlayground } from "../types";

const STEPPERS = ["inline", "sides", "none"] as const;
const SIZES = ["default", "sm"] as const;

type Stepper = (typeof STEPPERS)[number];
type Size = (typeof SIZES)[number];

function PlaygroundDemo({ stepper, size, suffix, disabled }: { stepper: Stepper; size: Size; suffix: string; disabled: boolean }) {
  const [value, setValue] = React.useState<number | null>(12);
  return (
    <NumberField
      value={value}
      onValueChange={setValue}
      min={0}
      max={100}
      stepper={stepper}
      size={size}
      suffix={suffix || undefined}
      disabled={disabled}
      aria-label="Valor"
    />
  );
}

function SeatsDemo() {
  const [seats, setSeats] = React.useState<number | null>(24);
  const taken = 19;
  return (
    <Field
      label="Cupos del plan de formación"
      description={`Ya hay ${taken} personas inscritas: no puedes bajar de ahí.`}
      error={seats !== null && seats < taken ? `Hay ${taken} personas inscritas.` : undefined}
    >
      <NumberField value={seats} onValueChange={setSeats} min={1} max={200} />
    </Field>
  );
}

function HoursDemo() {
  const [hours, setHours] = React.useState<number | null>(7.5);
  return (
    <div className="w-full space-y-3">
      <Field label="Duración del curso" description="En horas de dedicación; se acepta media hora.">
        <NumberField value={hours} onValueChange={setHours} min={0.5} max={40} step={0.5} precision={1} suffix="horas" stepper="sides" />
      </Field>
      <p className="text-xs text-text-muted">Valor emitido: {hours === null ? "null" : hours}</p>
    </div>
  );
}

function ProgressDemo() {
  const [progress, setProgress] = React.useState<number | null>(65);
  return (
    <div className="flex w-full flex-col gap-3">
      <Field label="Porcentaje de avance" description="Shift + flecha mueve de 10 en 10.">
        <NumberField value={progress} onValueChange={setProgress} min={0} max={100} step={5} suffix="%" />
      </Field>
      <Field label="Presupuesto por persona">
        <NumberField defaultValue={180000} min={0} step={10000} prefix="$" stepper="none" />
      </Field>
    </div>
  );
}

export const numberFieldEntry = defineEntry({
  id: "number-field",
  name: "NumberField",
  group: "forms",
  description:
    "Campo numérico con botones de − y +. Va con `inputMode=\"decimal\"` y no con `type=\"number\"`: así la rueda del ratón no cambia el valor al desplazar la página. Las flechas suben y bajan, Shift multiplica por diez y el valor se recorta a min/max al salir del campo.",
  importPath: 'import { NumberField } from "@/components/forms"',
  sourcePath: "src/components/forms/NumberField.tsx",
  status: "stable",
  tags: ["form", "controlled", "a11y"],
  playground: definePlayground({
    layout: "start",
    controls: {
      stepper: { type: "select", options: STEPPERS, default: "inline" },
      size: { type: "select", options: SIZES, default: "default" },
      suffix: { type: "text", label: "Sufijo", default: "horas" },
      disabled: { type: "boolean", label: "Deshabilitado", default: false },
    },
    render: ({ stepper, size, suffix, disabled }) => (
      <div className="w-full max-w-xs">
        <PlaygroundDemo stepper={stepper as Stepper} size={size as Size} suffix={suffix} disabled={disabled} />
      </div>
    ),
    code: ({ stepper, size, suffix, disabled }) => {
      const attrs = [
        "value={value}",
        "onValueChange={setValue}",
        "min={0}",
        "max={100}",
        stepper !== "inline" ? `stepper="${stepper}"` : "",
        size !== "default" ? `size="${size}"` : "",
        suffix ? `suffix="${suffix}"` : "",
        disabled ? "disabled" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `const [value, setValue] = React.useState<number | null>(12);

<NumberField ${attrs} />`;
    },
  }),
  examples: [
    {
      id: "seats",
      title: "Cupos de un plan de formación",
      description: "Con min y max: los botones se apagan solos al tocar el límite y escribir 500 se recorta al salir del campo.",
      layout: "start",
      code: `const [seats, setSeats] = React.useState<number | null>(24);

<Field label="Cupos del plan de formación" error={seats < 19 ? "Hay 19 personas inscritas." : undefined}>
  <NumberField value={seats} onValueChange={setSeats} min={1} max={200} />
</Field>`,
      render: () => (
        <div className="w-full max-w-sm">
          <SeatsDemo />
        </div>
      ),
    },
    {
      id: "hours",
      title: "Duración en horas, con medios pasos",
      description: "`step={0.5}` y `precision={1}` fijan el formato; `stepper=\"sides\"` separa − y + a los lados.",
      layout: "start",
      code: `<NumberField
  value={hours}
  onValueChange={setHours}
  min={0.5}
  max={40}
  step={0.5}
  precision={1}
  suffix="horas"
  stepper="sides"
/>`,
      render: () => (
        <div className="w-full max-w-sm">
          <HoursDemo />
        </div>
      ),
    },
    {
      id: "progress",
      title: "Porcentaje y moneda",
      description: "`suffix` y `prefix` aceptan cualquier nodo. Sin botones (`stepper=\"none\"`) el campo sigue respondiendo a las flechas.",
      layout: "start",
      code: `<NumberField value={progress} onValueChange={setProgress} min={0} max={100} step={5} suffix="%" />

<NumberField defaultValue={180000} min={0} step={10000} prefix="$" stepper="none" />`,
      render: () => (
        <div className="w-full max-w-sm">
          <ProgressDemo />
        </div>
      ),
    },
    {
      id: "states",
      title: "Tamaño sm, solo lectura y deshabilitado",
      layout: "start",
      code: `<NumberField defaultValue={3} size="sm" />
<NumberField value={12} readOnly />
<NumberField value={12} disabled />`,
      render: () => (
        <div className="flex w-full max-w-sm flex-col gap-3">
          <NumberField defaultValue={3} size="sm" aria-label="Intentos" />
          <NumberField value={12} readOnly aria-label="Solo lectura" />
          <NumberField value={12} disabled aria-label="Deshabilitado" />
        </div>
      ),
    },
  ],
  props: [
    { name: "value", type: "number | null", description: "Valor controlado. `null` deja el campo vacío." },
    { name: "defaultValue", type: "number", description: "Valor inicial cuando no está controlado." },
    { name: "onValueChange", type: "(value: number | null) => void", description: "Se llama con el valor saneado; `null` si el campo queda vacío." },
    { name: "min / max", type: "number", description: "Límites. El valor se recorta al salir del campo y apagan el botón correspondiente." },
    { name: "step", type: "number", default: "1", description: "Salto de flechas y botones. Con Shift se multiplica por 10; PageUp/PageDown también." },
    { name: "precision", type: "number", description: "Decimales fijos al mostrar. Si no se pasa, se deducen del `step`." },
    { name: "size", type: '"sm" | "default"', default: '"default"', description: "Alto de 32px o de 40px, el mismo que Input." },
    { name: "prefix / suffix", type: "React.ReactNode", description: "Adornos dentro del campo: «$», «horas», «%». Son decorativos (`aria-hidden`)." },
    { name: "stepper", type: '"inline" | "sides" | "none"', default: '"inline"', description: "Botones pegados a la derecha, a cada lado, o sin botones." },
    { name: "disabled / readOnly", type: "boolean", description: "`readOnly` deja leer y copiar; `disabled` apaga el campo entero." },
    { name: "aria-label", type: "string", description: "Obligatorio si el campo no va dentro de un `Field` con etiqueta." },
  ],
  guidelines: {
    do: [
      "Pon `min` y `max` siempre que existan: es lo que apaga los botones y evita el error después de enviar.",
      "Usa `suffix` para la unidad («horas», «%») en vez de meterla en la etiqueta.",
      "Deja que `Field` inyecte el `id` y la descripción; el campo los propaga al input.",
    ],
    dont: [
      "No lo uses para cantidades largas sin sentido aritmético (cédula, teléfono, código): ahí va Input o PhoneInput.",
      "No pongas `step` decimal sin `precision`: el valor acaba mostrando 0.30000000000000004.",
      "No escondas los límites en la ayuda si puedes expresarlos con `min`/`max`.",
    ],
  },
  related: ["field", "input", "slider", "rating"],
});
