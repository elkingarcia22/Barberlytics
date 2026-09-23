import { Tilt } from "@/components/atmosphere";
import { Card } from "@/components/ui/card";
import { Heading, Text } from "@/components/typography";
import { defineEntry, definePlayground } from "../types";

export const tiltEntry = defineEntry({
  id: "tilt",
  name: "Tilt",
  group: "atmosphere",
  description:
    "Perspectiva hacia el puntero: el panel se inclina siguiendo al ratón (rotateX/rotateY con perspectiva) y vuelve a su sitio al salir. Solo con puntero fino y sin prefers-reduced-motion; en táctil es un div normal. Escribe el transform directamente en el nodo, fuera del ciclo de React.",
  importPath: 'import { Tilt } from "@/components/atmosphere"',
  sourcePath: "src/components/atmosphere/Tilt.tsx",
  status: "stable",
  tags: ["hover", "3d", "puntero"],
  playground: definePlayground({
    controls: {
      maxDegrees: { type: "number", label: "Grados máximos", default: 6, min: 1, max: 12, step: 0.5 },
    },
    render: ({ maxDegrees }) => (
      <Tilt key={maxDegrees} maxDegrees={maxDegrees} className="w-full max-w-sm">
        <Card className="brand-ring panel-sheen p-card">
          <Heading level={4}>Lo que hace la IA</Heading>
          <Text variant="muted">Llena los huecos de la agenda y avisa qué cliente se está yendo.</Text>
        </Card>
      </Tilt>
    ),
    code: ({ maxDegrees }) => `<Tilt${maxDegrees === 6 ? "" : ` maxDegrees={${maxDegrees}}`}>
  <Card className="brand-ring panel-sheen p-card">…</Card>
</Tilt>`,
  }),
  examples: [
    {
      id: "panel",
      title: "Un panel grande, poca inclinación",
      description: "A más superficie, menos grados: 2–3 para un panel de sección, 6–7 para una card de rejilla.",
      layout: "stretch",
      code: `<Tilt maxDegrees={2.5}>
  <Card className="brand-ring panel-sheen grid gap-8 rounded-3xl p-8 lg:grid-cols-12">…</Card>
</Tilt>`,
      render: () => (
        <Tilt maxDegrees={2.5} className="w-full">
          <Card className="brand-ring panel-sheen grid gap-4 rounded-3xl p-8 sm:grid-cols-2">
            <div>
              <Heading level={3}>El acuerdo</Heading>
              <Text variant="muted">Lo que esperamos y lo que ponemos.</Text>
            </div>
            <Text>Usarla con tus citas y tus precios. Cada corte, cada cobro y cada corrección tuya es lo que la entrena.</Text>
          </Card>
        </Tilt>
      ),
    },
  ],
  props: [
    { name: "maxDegrees", type: "number", default: "6", description: "Grados máximos de inclinación en cada eje." },
    { name: "...props", type: 'React.ComponentProps<"div">', description: "Atributos del div envoltorio." },
  ],
  guidelines: {
    do: ["Envuelve la card o el panel completo; el hijo no debe tener `transform` propio.", "Reserva la inclinación fuerte para cards pequeñas en rejilla."],
    dont: ["No lo uses en controles (botones, campos): el foco y el clic se vuelven imprecisos.", "No lo pongas en listas largas: un tilt por fila es ruido."],
  },
  related: ["magic-card", "reveal"],
});
