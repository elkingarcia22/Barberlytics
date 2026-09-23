import { RotatingSeal } from "@/components/atmosphere";
import { Heading } from "@/components/typography";
import { defineEntry, definePlayground } from "../types";

export const rotatingSealEntry = defineEntry({
  id: "rotating-seal",
  name: "RotatingSeal",
  group: "atmosphere",
  description:
    "El sello de membresía: un anillo de texto girando muy despacio (36 s por vuelta) alrededor de una pieza central, por defecto la flecha del logo. Es el detalle que abre una portada o marca una invitación. Decorativo: el texto tiene que estar también como contenido real.",
  importPath: 'import { RotatingSeal } from "@/components/atmosphere"',
  sourcePath: "src/components/atmosphere/RotatingSeal.tsx",
  status: "stable",
  tags: ["svg", "textPath", "bucle", "marca"],
  playground: definePlayground({
    controls: {
      text: { type: "text", label: "Texto", default: "Beta privada · Solo por invitación · Cohorte 01 ·" },
      size: { type: "number", label: "Lado (px)", default: 128, min: 80, max: 240, step: 8 },
    },
    render: ({ text, size }) => <RotatingSeal text={text} size={size} />,
    code: ({ text, size }) => `<RotatingSeal${text === "Beta privada · Solo por invitación · Cohorte 01 ·" ? "" : ` text="${text}"`}${size === 128 ? "" : ` size={${size}}`} />`,
  }),
  examples: [
    {
      id: "hero",
      title: "Abriendo la portada",
      description: "Centrado sobre el titular, dentro de un `Enter` para que entre con el resto del bloque.",
      code: `<Enter>
  <RotatingSeal />
</Enter>
<p>Beta privada · Solo por invitación</p>`,
      render: () => (
        <div className="flex flex-col items-center gap-6 text-center">
          <RotatingSeal />
          <Heading level={3}>Beta privada · Solo por invitación</Heading>
        </div>
      ),
    },
    {
      id: "custom-center",
      title: "Con otra pieza en el centro",
      description: "El número de la cohorte, una inicial o un icono del registro.",
      code: `<RotatingSeal text="Cohorte 02 · Cupos abiertos ·" size={112}>
  <span className="font-heading text-xl font-semibold text-text-primary">02</span>
</RotatingSeal>`,
      render: () => (
        <RotatingSeal text="Cohorte 02 · Cupos abiertos ·" size={112}>
          <span className="font-heading text-xl font-semibold text-text-primary">02</span>
        </RotatingSeal>
      ),
    },
  ],
  props: [
    { name: "text", type: "string", default: '"Beta privada · Solo por invitación · Cohorte 01 ·"', description: "El texto del anillo. Termina en «·» para que la vuelta no tenga costura; unos 45 caracteres llenan el carril." },
    { name: "children", type: "React.ReactNode", description: "La pieza central. Por defecto, la flecha del logo Barberlytics." },
    { name: "size", type: "number", default: "128", description: "Lado del sello en px; el texto y el centro escalan con él." },
    { name: "className", type: "string", description: "Márgenes y posición." },
  ],
  guidelines: {
    do: ["Uno por página, en la portada o en la invitación.", "Escribe el mismo mensaje como texto real justo debajo."],
    dont: ["No lo uses como avatar ni como botón.", "No cambies la velocidad: 36 s es lo que hace que se note sin distraer."],
  },
  related: ["barberlytics-logo", "enter", "barber-pole"],
});
