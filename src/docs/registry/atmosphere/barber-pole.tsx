import { BarberPole } from "@/components/atmosphere";
import { Heading, Text } from "@/components/typography";
import { defineEntry, definePlayground } from "../types";
import { Stage } from "./fixtures";

export const barberPoleEntry = defineEntry({
  id: "barber-pole",
  name: "BarberPole",
  group: "atmosphere",
  description:
    "El poste de barbería girando: dos remates dorados y un cilindro con las franjas diagonales desplazándose en vertical, el giro clásico hecho con un solo translateY en bucle. La franja de marca es el primario del tema; el marfil y la tinta son materiales fijos.",
  importPath: 'import { BarberPole } from "@/components/atmosphere"',
  sourcePath: "src/components/atmosphere/BarberPole.tsx",
  status: "stable",
  tags: ["barbería", "bucle", "decorativo"],
  playground: definePlayground({
    controls: {
      height: { type: "select", label: "Alto", options: ["h-40", "h-64", "h-80"], default: "h-64" },
    },
    render: ({ height }) => <BarberPole className={height} />,
    code: ({ height }) => `<BarberPole className="${height}" />`,
  }),
  examples: [
    {
      id: "beside-title",
      title: "De pie junto al titular",
      description: "En la landing acompaña al titular en pantallas `xl`; el poste estira al alto del bloque con `self-stretch`.",
      layout: "stretch",
      code: `<div className="flex items-stretch gap-10">
  <BarberPole className="hidden self-stretch xl:flex" />
  <div>
    <Heading level={2}>Beta privada · Solo por invitación</Heading>
    <Text variant="lead">…</Text>
  </div>
</div>`,
      render: () => (
        <Stage>
          <div className="flex items-stretch gap-8 p-card">
            <BarberPole className="self-stretch" />
            <div className="flex flex-col justify-center gap-2">
              <Heading level={2}>Beta privada · Solo por invitación</Heading>
              <Text variant="lead">Un grupo corto de barberías está entrenando la IA antes que nadie.</Text>
            </div>
          </div>
        </Stage>
      ),
    },
  ],
  props: [{ name: "className", type: "string", description: "Alto y posición. El ancho es fijo (24px); el alto lo pone el contenedor." }],
  guidelines: {
    do: ["Uno por pantalla, de pie junto a un titular o a un panel.", "Escóndelo en pantallas angostas (`hidden xl:flex`): ahí no hay margen para él."],
    dont: ["No lo uses como icono ni como indicador de carga.", "No cambies el marfil ni la tinta: son los materiales del objeto, no colores de interfaz."],
  },
  related: ["pole-ring", "rotating-seal"],
});
