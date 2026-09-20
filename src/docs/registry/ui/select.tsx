import * as React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defineEntry, definePlayground } from "../types";

const SIZES = ["sm", "default"] as const;

const AREAS = ["Producto", "Ingeniería", "Personas", "Ventas", "Finanzas"];

function ControlledSelect() {
  const [area, setArea] = React.useState("Personas");
  return (
    <div className="flex w-64 flex-col gap-2">
      <Label htmlFor="area">Área</Label>
      <Select value={area} onValueChange={setArea}>
        <SelectTrigger id="area">
          <SelectValue placeholder="Elige un área" />
        </SelectTrigger>
        <SelectContent>
          {AREAS.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-text-secondary">Filtrando por: {area}</p>
    </div>
  );
}

export const selectEntry = defineEntry({
  id: "select",
  name: "Select",
  group: "ui",
  description:
    "Desplegable de una sola opción con chevron que gira al abrir, píldora de resaltado que se desliza entre ítems y entrada en cascada. Úsalo para listas de 5 a ~30 opciones conocidas; para buscar entre muchas, usa Command.",
  importPath: 'import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select"',
  sourcePath: "src/components/ui/select.tsx",
  status: "stable",
  tags: ["radix", "fluid-highlight", "formulario"],
  playground: definePlayground({
    controls: {
      size: { type: "select", options: SIZES, default: "default" },
      placeholder: { type: "text", default: "Elige una frecuencia" },
      disabled: { type: "boolean", default: false },
    },
    render: ({ size, placeholder, disabled }) => (
      <Select disabled={disabled}>
        <SelectTrigger size={size as (typeof SIZES)[number]} className={size === "sm" ? "h-8 w-56 text-xs" : "w-56"}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="weekly">Semanal</SelectItem>
          <SelectItem value="biweekly">Quincenal</SelectItem>
          <SelectItem value="monthly">Mensual</SelectItem>
        </SelectContent>
      </Select>
    ),
    code: ({ size, placeholder, disabled }) => `<Select${disabled ? " disabled" : ""}>
  <SelectTrigger${size === "sm" ? ' size="sm" className="h-8 w-56 text-xs"' : ' className="w-56"'}>
    <SelectValue placeholder="${placeholder}" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="weekly">Semanal</SelectItem>
    <SelectItem value="biweekly">Quincenal</SelectItem>
    <SelectItem value="monthly">Mensual</SelectItem>
  </SelectContent>
</Select>`,
  }),
  examples: [
    {
      id: "controlled",
      title: "Controlado con Label",
      code: `const [area, setArea] = React.useState("Personas");

<Label htmlFor="area">Área</Label>
<Select value={area} onValueChange={setArea}>
  <SelectTrigger id="area"><SelectValue placeholder="Elige un área" /></SelectTrigger>
  <SelectContent>
    {areas.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
  </SelectContent>
</Select>`,
      render: () => <ControlledSelect />,
    },
    {
      id: "groups",
      title: "Grupos y separador",
      description: "SelectLabel titula cada grupo; SelectSeparator dibuja la línea entre ellos.",
      code: `<Select defaultValue="bogota">
  <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Colombia</SelectLabel>
      <SelectItem value="bogota">Bogotá</SelectItem>
      <SelectItem value="medellin">Medellín</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>México</SelectLabel>
      <SelectItem value="cdmx">Ciudad de México</SelectItem>
      <SelectItem value="gdl">Guadalajara</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>`,
      render: () => (
        <Select defaultValue="bogota">
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Colombia</SelectLabel>
              <SelectItem value="bogota">Bogotá</SelectItem>
              <SelectItem value="medellin">Medellín</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>México</SelectLabel>
              <SelectItem value="cdmx">Ciudad de México</SelectItem>
              <SelectItem value="gdl">Guadalajara</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      ),
    },
    {
      id: "popper",
      title: "Posición popper y opción deshabilitada",
      description: "`position=\"popper\"` cuelga el panel bajo el disparador con su mismo ancho, en vez de alinear el ítem activo.",
      code: `<Select>
  <SelectTrigger className="w-64"><SelectValue placeholder="Plantilla" /></SelectTrigger>
  <SelectContent position="popper">
    <SelectItem value="pulse">Pulso semanal</SelectItem>
    <SelectItem value="climate">Clima organizacional</SelectItem>
    <SelectItem value="exit" disabled>Salida (próximamente)</SelectItem>
  </SelectContent>
</Select>`,
      render: () => (
        <Select>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Plantilla" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="pulse">Pulso semanal</SelectItem>
            <SelectItem value="climate">Clima organizacional</SelectItem>
            <SelectItem value="exit" disabled>
              Salida (próximamente)
            </SelectItem>
          </SelectContent>
        </Select>
      ),
    },
  ],
  props: [
    { name: "value / defaultValue", type: "string", description: "Opción elegida (controlado / inicial), en `Select`." },
    { name: "onValueChange", type: "(value: string) => void", description: "Se dispara al elegir." },
    { name: "disabled", type: "boolean", default: "false", description: "En `Select` desactiva el control; en `SelectItem`, esa opción." },
    { name: "SelectTrigger.size", type: '"sm" | "default"', default: '"default"', description: "Marca `data-size`; combina con `h-8 text-xs` para la versión compacta." },
    { name: "SelectValue.placeholder", type: "string", description: "Texto cuando no hay valor." },
    { name: "SelectContent.position", type: '"item-aligned" | "popper"', default: '"item-aligned"', description: "Alineado al ítem activo (nativo) o colgando del disparador." },
    { name: "SelectContent.collisionPadding", type: "number", default: "16", description: "Margen con los bordes del viewport." },
  ],
  guidelines: {
    do: ["Pon un placeholder que diga qué se elige, no «Seleccionar».", "Agrupa con SelectLabel cuando hay más de ~8 opciones.", "Asocia un Label con `htmlFor` al id del SelectTrigger."],
    dont: ["No lo uses para 2–4 opciones visibles: usa RadioGroup o Tabs.", "No lo uses para selección múltiple.", "No pongas acciones en la lista: es para elegir un valor."],
  },
  related: ["radio-group", "command", "dropdown-menu", "input", "label"],
});
