import { Reveal } from "@/components/atmosphere";
import { Card } from "@/components/ui/card";
import { Heading, Text } from "@/components/typography";
import { defineEntry, definePlayground } from "../types";

const STAGES = [
  { title: "Agenda", body: "Citas, huecos y recordatorios." },
  { title: "Caja", body: "Cierre del día y comisiones." },
  { title: "Clientes", body: "Ficha, historial y riesgo de fuga." },
] as const;

export const revealEntry = defineEntry({
  id: "reveal",
  name: "Reveal",
  group: "atmosphere",
  description:
    "Envoltorio que aparece al entrar en pantalla: 14px de ascenso y opacidad, una sola vez, con un IntersectionObserver por elemento y ningún manejador de scroll. Para lo que está bajo el pliegue; lo que está sobre él usa Enter, que no espera a nadie. Con prefers-reduced-motion se muestra sin transición.",
  importPath: 'import { Reveal } from "@/components/atmosphere"',
  sourcePath: "src/components/atmosphere/Reveal.tsx",
  status: "stable",
  tags: ["scroll", "intersection-observer", "reduced-motion"],
  playground: definePlayground({
    controls: {
      delay: { type: "number", label: "Escalonado (ms)", default: 90, min: 0, max: 300, step: 10 },
    },
    layout: "stretch",
    render: ({ delay }) => (
      <ul key={delay} className="grid w-full gap-3 sm:grid-cols-3">
        {STAGES.map((stage, index) => (
          <Reveal key={stage.title} as="li" delay={index * delay}>
            <Card className="p-card">
              <Heading level={4}>{stage.title}</Heading>
              <Text variant="muted">{stage.body}</Text>
            </Card>
          </Reveal>
        ))}
      </ul>
    ),
    code: ({ delay }) => `<ul className="grid gap-3 sm:grid-cols-3">
  {stages.map((stage, index) => (
    <Reveal key={stage.title} as="li" delay={index * ${delay}}>
      <Card>…</Card>
    </Reveal>
  ))}
</ul>`,
  }),
  examples: [
    {
      id: "section",
      title: "Un bloque entero",
      description: "Lo habitual: el contenido de una sección envuelto una vez. La cabecera de sección y su cuerpo entran juntos.",
      layout: "stretch",
      code: `<Reveal className="mx-auto max-w-3xl text-center">
  <Heading level={2}>La construimos juntos.</Heading>
  <Text variant="lead">Entra al canal y preséntate con el nombre de tu barbería.</Text>
</Reveal>`,
      render: () => (
        <Reveal className="mx-auto max-w-3xl text-center">
          <Heading level={2}>La construimos juntos.</Heading>
          <Text variant="lead">Entra al canal y preséntate con el nombre de tu barbería.</Text>
        </Reveal>
      ),
    },
  ],
  props: [
    { name: "delay", type: "number", default: "0", description: "Retardo de la transición en ms, para escalonar listas y rejillas (60–120 ms entre ítems)." },
    { name: "as", type: '"div" | "li" | "article" | "section"', default: '"div"', description: "Etiqueta a renderizar; `li` dentro de una lista para no romper el marcado." },
    { name: "...props", type: "React.HTMLAttributes<HTMLElement>", description: "Atributos del elemento." },
  ],
  guidelines: {
    do: ["Envuelve bloques, no palabras: una sección, una card, una fila.", "Escalona con `delay` solo dentro de una misma rejilla; entre secciones el scroll ya escalona."],
    dont: ["No lo uses sobre el pliegue: el titular de portada es el LCP y no puede esperar a un observador (usa Enter).", "No lo anides: un Reveal dentro de otro se revela dos veces."],
  },
  related: ["enter", "cut-line", "tilt"],
});
