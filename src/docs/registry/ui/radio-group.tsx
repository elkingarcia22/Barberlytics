import * as React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { defineEntry, definePlayground } from "../types";

const LAYOUTS = ["vertical", "horizontal"] as const;

const FREQUENCIES = [
  { value: "weekly", label: "Semanal" },
  { value: "biweekly", label: "Quincenal" },
  { value: "monthly", label: "Mensual" },
];

function FrequencyPicker() {
  const [value, setValue] = React.useState("biweekly");
  return (
    <div className="flex flex-col gap-3">
      <RadioGroup value={value} onValueChange={setValue}>
        {FREQUENCIES.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <RadioGroupItem id={`freq-${option.value}`} value={option.value} />
            <Label htmlFor={`freq-${option.value}`}>{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
      <p className="text-xs text-text-secondary">Seleccionado: {value}</p>
    </div>
  );
}

const AUDIENCES = [
  { value: "all", title: "Toda la empresa", hint: "1.240 personas" },
  { value: "team", title: "Mi equipo", hint: "18 personas" },
  { value: "custom", title: "Segmento", hint: "Filtra por área o sede" },
];

function AudienceCards() {
  const [value, setValue] = React.useState("team");
  return (
    <RadioGroup value={value} onValueChange={setValue} className="max-w-sm">
      {AUDIENCES.map((option) => (
        <Label
          key={option.value}
          htmlFor={`aud-${option.value}`}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
            value === option.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
          )}
        >
          <RadioGroupItem id={`aud-${option.value}`} value={option.value} className="mt-0.5" />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium leading-none">{option.title}</span>
            <span className="text-xs font-normal text-text-secondary">{option.hint}</span>
          </span>
        </Label>
      ))}
    </RadioGroup>
  );
}

export const radioGroupEntry = defineEntry({
  id: "radio-group",
  name: "RadioGroup",
  group: "ui",
  description:
    "Grupo de opciones excluyentes con navegación por flechas y un punto de 16px que se rellena en primario. Úsalo cuando hay de dos a cinco opciones que deben verse todas a la vez; con más, prefiere un Select.",
  importPath: 'import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"',
  sourcePath: "src/components/ui/radio-group.tsx",
  status: "stable",
  tags: ["radix", "formulario"],
  playground: definePlayground({
    controls: {
      layout: { type: "select", options: LAYOUTS, default: "vertical" },
      disabled: { type: "boolean", default: false },
    },
    render: ({ layout, disabled }) => (
      <RadioGroup defaultValue="weekly" disabled={disabled} className={layout === "horizontal" ? "flex w-auto gap-4" : undefined}>
        {FREQUENCIES.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <RadioGroupItem id={`pg-${option.value}`} value={option.value} />
            <Label htmlFor={`pg-${option.value}`}>{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
    ),
    code: ({ layout, disabled }) => {
      const attrs = [disabled ? " disabled" : "", layout === "horizontal" ? ' className="flex w-auto gap-4"' : ""].join("");
      return `<RadioGroup defaultValue="weekly"${attrs}>
  <div className="flex items-center gap-2">
    <RadioGroupItem id="weekly" value="weekly" />
    <Label htmlFor="weekly">Semanal</Label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem id="biweekly" value="biweekly" />
    <Label htmlFor="biweekly">Quincenal</Label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem id="monthly" value="monthly" />
    <Label htmlFor="monthly">Mensual</Label>
  </div>
</RadioGroup>`;
    },
  }),
  examples: [
    {
      id: "controlled",
      title: "Controlado",
      description: "`value` + `onValueChange`; cada ítem se asocia a su Label por id.",
      code: `const [value, setValue] = React.useState("biweekly");

<RadioGroup value={value} onValueChange={setValue}>
  {options.map((option) => (
    <div key={option.value} className="flex items-center gap-2">
      <RadioGroupItem id={option.value} value={option.value} />
      <Label htmlFor={option.value}>{option.label}</Label>
    </div>
  ))}
</RadioGroup>`,
      render: () => <FrequencyPicker />,
    },
    {
      id: "cards",
      title: "Opciones como tarjetas",
      description: "El Label envuelve toda la fila, así la tarjeta completa es clicable.",
      code: `<RadioGroup value={value} onValueChange={setValue}>
  {options.map((option) => (
    <Label key={option.value} htmlFor={option.value}
      className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-3",
        value === option.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
      <RadioGroupItem id={option.value} value={option.value} className="mt-0.5" />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{option.title}</span>
        <span className="text-xs font-normal text-text-secondary">{option.hint}</span>
      </span>
    </Label>
  ))}
</RadioGroup>`,
      render: () => <AudienceCards />,
    },
    {
      id: "disabled-item",
      title: "Opción deshabilitada",
      code: `<RadioGroup defaultValue="es">
  <div className="flex items-center gap-2">
    <RadioGroupItem id="es" value="es" />
    <Label htmlFor="es">Español</Label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem id="pt" value="pt" disabled />
    <Label htmlFor="pt">Portugués (próximamente)</Label>
  </div>
</RadioGroup>`,
      render: () => (
        <RadioGroup defaultValue="es" className="w-auto">
          <div className="flex items-center gap-2">
            <RadioGroupItem id="lang-es" value="es" />
            <Label htmlFor="lang-es">Español</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem id="lang-pt" value="pt" disabled />
            <Label htmlFor="lang-pt">Portugués (próximamente)</Label>
          </div>
        </RadioGroup>
      ),
    },
  ],
  props: [
    { name: "value / defaultValue", type: "string", description: "Opción seleccionada (controlado / inicial), en `RadioGroup`." },
    { name: "onValueChange", type: "(value: string) => void", description: "Se dispara al elegir otra opción." },
    { name: "disabled", type: "boolean", default: "false", description: "En el grupo desactiva todo; en un ítem, solo esa opción." },
    { name: "orientation", type: '"horizontal" | "vertical"', description: "Solo afecta a la navegación por teclado; la disposición se cambia con `className`." },
    { name: "RadioGroupItem.value", type: "string", description: "Valor del ítem. Requerido." },
  ],
  guidelines: {
    do: ["Asocia cada ítem a un Label con `htmlFor`.", "Elige una opción por defecto cuando exista una razonable.", "Ordena las opciones de forma predecible (frecuencia, tamaño, alfabético)."],
    dont: ["No lo uses para más de ~5 opciones.", "No lo uses para activar/desactivar algo: es un Switch."],
  },
  related: ["checkbox", "switch", "select", "label", "magic-card"],
});
