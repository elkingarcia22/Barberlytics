import * as React from "react";
import { ColorPicker, Field } from "@/components/forms";
import { defineEntry, definePlayground } from "../types";

const LOGO_SWATCHES = [
  { color: "#C8102E", label: "Rojo del logo" },
  { color: "#0B3D91", label: "Azul del logo" },
];

function Controlled({ initial, swatches }: { initial: string; swatches?: typeof LOGO_SWATCHES }) {
  const [color, setColor] = React.useState(initial);
  return (
    <div className="w-full max-w-xs space-y-2">
      <ColorPicker value={color} onChange={setColor} label="Color primario" swatches={swatches} swatchesLabel="Colores de tu logo" />
      <p className="text-xs text-text-secondary">
        Elegido: <span className="font-mono">{color}</span>
      </p>
    </div>
  );
}

export const colorPickerEntry = defineEntry({
  id: "color-picker",
  name: "ColorPicker",
  group: "forms",
  description:
    "Elegir un color dentro del espectro: área de saturación y brillo, barra de matiz y el HEX escrito, con una fila opcional de muestras sugeridas (los colores de un logo, la paleta de la marca). Se maneja con ratón, dedo o teclado; entra y sale HEX `#RRGGBB`.",
  importPath: 'import { ColorPicker } from "@/components/forms"',
  sourcePath: "src/components/forms/ColorPicker.tsx",
  status: "beta",
  tags: ["form", "color", "a11y", "controlado"],
  playground: definePlayground({
    controls: {
      value: { type: "text", label: "Color inicial", default: "#C8102E", placeholder: "#RRGGBB" },
      swatches: { type: "boolean", label: "Muestras del logo", default: true },
    },
    render: ({ value, swatches }) => <Controlled key={value} initial={value} swatches={swatches ? LOGO_SWATCHES : undefined} />,
    code: ({ value, swatches }) =>
      `const [color, setColor] = React.useState("${value}");

<ColorPicker
  value={color}
  onChange={setColor}
  label="Color primario"${swatches ? `\n  swatches={[{ color: "#C8102E", label: "Rojo del logo" }, { color: "#0B3D91", label: "Azul del logo" }]}\n  swatchesLabel="Colores de tu logo"` : ""}
/>`,
  }),
  examples: [
    {
      id: "brand",
      title: "Color de marca con los colores del logo",
      description:
        "Es lo que usa el tema «Personalizado» de Personalización: arriba los colores que se leyeron del logo, debajo el espectro para afinarlos. Las muestras se marcan cuando coinciden con el color elegido.",
      code: `<ColorPicker
  value={color}
  onChange={setColor}
  label="Color primario"
  swatches={logoColors.map((color) => ({ color, label: \`Del logo: \${color}\` }))}
  swatchesLabel="Colores de tu logo"
/>`,
      render: () => <Controlled initial="#C8102E" swatches={LOGO_SWATCHES} />,
      layout: "start",
    },
    {
      id: "field",
      title: "Dentro de un formulario",
      description: "Con `Field` para la etiqueta y la ayuda; el selector ya trae sus propios nombres accesibles a partir de `label`.",
      code: `<Field label="Color de la categoría" description="Se ve en la agenda y en los reportes.">
  <ColorPicker value={color} onChange={setColor} label="Color de la categoría" />
</Field>`,
      render: () => (
        <div className="w-full max-w-xs">
          <Field label="Color de la categoría" description="Se ve en la agenda y en los reportes.">
            <Controlled initial="#1F7A5A" />
          </Field>
        </div>
      ),
      layout: "start",
    },
  ],
  props: [
    { name: "value", type: "string", description: "Color actual en HEX `#RRGGBB` (controlado)." },
    { name: "onChange", type: "(color: string) => void", description: "Se llama con el HEX en mayúsculas al arrastrar, teclear (al salir del campo o con Enter) o elegir una muestra." },
    { name: "label", type: "string", default: '"Color"', description: "Nombre accesible; de él salen los del área, la barra de matiz y el campo HEX." },
    { name: "swatches", type: "{ color: string; label?: string }[]", description: "Muestras sugeridas encima del espectro." },
    { name: "swatchesLabel", type: "string", default: '"Sugeridos"', description: "Título de la fila de muestras." },
    { name: "className", type: "string", description: "Se aplica al contenedor externo." },
  ],
  guidelines: {
    do: [
      "Úsalo cuando el color es un dato que la persona decide (su marca, una categoría), no para elegir entre unos pocos tonos fijos.",
      "Ofrece `swatches` cuando hay colores que probablemente quiere (los de su logo, los ya usados): casi nadie atina un color de marca a mano.",
      "Si el color se usa como texto o fondo de interfaz, ajústalo después para que contraste (el tema «Personalizado» lo hace con `fitToMode`) y dilo.",
    ],
    dont: [
      "No lo uses para elegir entre los colores del sistema: para eso están los presets y los tonos semánticos.",
      "No pintes con el valor tal cual texto pequeño sin comprobar el contraste.",
    ],
  },
  related: ["field", "single-select"],
});
