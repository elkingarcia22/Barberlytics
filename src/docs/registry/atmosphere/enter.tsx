import { Enter } from "@/components/atmosphere";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/typography";
import { defineEntry, definePlayground } from "../types";

export const enterEntry = defineEntry({
  id: "enter",
  name: "Enter",
  group: "atmosphere",
  description:
    "Entrada de los bloques de portada. A diferencia de Reveal, no espera a un IntersectionObserver: la animación es de CSS, arranca sola y termina en su estado visible, así que el contenido sobre el pliegue se pinta aunque el JavaScript llegue tarde o no llegue.",
  importPath: 'import { Enter } from "@/components/atmosphere"',
  sourcePath: "src/components/atmosphere/Enter.tsx",
  status: "stable",
  tags: ["portada", "css", "lcp"],
  playground: definePlayground({
    controls: {
      step: { type: "number", label: "Paso (ms)", default: 60, min: 0, max: 200, step: 10 },
    },
    render: ({ step }) => (
      <div key={step} className="flex flex-col items-center gap-4 text-center">
        <Enter>
          <Text variant="caption">Beta privada · Solo por invitación</Text>
        </Enter>
        <Enter delay={step}>
          <Heading level={2}>Una IA que trabaja para tu barbería.</Heading>
        </Enter>
        <Enter delay={step * 2}>
          <Text variant="lead">Pocas sillas, mucha voz.</Text>
        </Enter>
        <Enter delay={step * 3}>
          <Button>Entrar al canal privado</Button>
        </Enter>
      </div>
    ),
    code: ({ step }) => `<Enter><Text variant="caption">Beta privada</Text></Enter>
<Enter delay={${step}}><Heading level={1}>…</Heading></Enter>
<Enter delay={${step * 2}}><Text variant="lead">…</Text></Enter>
<Enter delay={${step * 3}}><Button>Entrar al canal</Button></Enter>`,
  }),
  examples: [],
  props: [
    { name: "delay", type: "number", default: "0", description: "Retardo de la animación en ms; la portada escalona de 60 a 80 ms por bloque." },
    { name: "...props", type: 'React.ComponentProps<"div">', description: "Atributos del div." },
  ],
  guidelines: {
    do: ["Úsalo solo en lo que se ve al cargar: eyebrow, titular, párrafo, botones y el sello.", "Escalona en pasos cortos; la portada entera debe estar en su sitio antes de 600 ms."],
    dont: ["No lo uses bajo el pliegue: ahí la animación ya habría terminado cuando el usuario llega (usa Reveal).", "No lo combines con Reveal en el mismo bloque."],
  },
  related: ["reveal", "rotating-seal"],
});
