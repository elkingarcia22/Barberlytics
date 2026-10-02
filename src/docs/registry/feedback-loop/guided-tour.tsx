import * as React from "react";
import { Button } from "@/components/ui/button";
import { GuidedTour, type TourStep } from "@/components/feedback-loop";
import { defineEntry } from "../types";

const STEPS: TourStep[] = [
  { id: "hola", icon: "rocket", title: "Bienvenido al nuevo módulo", description: "Tres pasos para conocerlo. Puedes salir cuando quieras con Escape." },
  { id: "filtros", icon: "filter", target: '[data-tour="demo-filtros"]', title: "Filtra lo que ves", description: "Los filtros recuerdan tu última elección." },
  {
    id: "crear",
    icon: "pointer",
    target: '[data-tour="demo-crear"]',
    advanceOnTargetClick: true,
    title: "Pruébalo tú",
    description: "Pulsa «Crear cita» para seguir: este paso avanza al tocar lo resaltado.",
  },
  { id: "fin", icon: "feedback", title: "¡Listo!", description: "Si algo no te convence, cuéntanoslo con el botón de feedback." },
];

function TourDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex w-full flex-col items-start gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" data-tour="demo-filtros">
          Filtros
        </Button>
        <Button data-tour="demo-crear">Crear cita</Button>
      </div>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Lanzar el recorrido
      </Button>
      <GuidedTour steps={STEPS} open={open} onOpenChange={setOpen} />
    </div>
  );
}

export const guidedTourEntry = defineEntry({
  id: "guided-tour",
  name: "GuidedTour",
  group: "feedback-loop",
  description:
    "Recorrido de coachmarks: una tarjeta por paso con «Paso N de M», barra de progreso y el elemento del paso recortado del velo y rodeado por un anillo. El recorte también deja pasar los clics, así que un paso puede avanzar cuando se pulsa lo resaltado. La tarjeta se coloca debajo, encima o acoplada abajo según el sitio, y vuelve a medirse con scroll y cambios de tamaño.",
  importPath: 'import { GuidedTour, type TourStep } from "@/components/feedback-loop"',
  sourcePath: "src/components/feedback-loop/GuidedTour.tsx",
  status: "beta",
  tags: ["onboarding", "coachmarks", "tour", "a11y"],
  examples: [
    {
      id: "basic",
      title: "Recorrido con objetivos",
      description: "El segundo paso señala «Filtros»; el tercero espera a que pulses «Crear cita».",
      layout: "start",
      code: `const pasos: TourStep[] = [
  { id: "hola", icon: "rocket", title: "Bienvenido", description: "…" },
  { id: "filtros", target: '[data-tour="filtros"]', title: "Filtra lo que ves", description: "…" },
  { id: "crear", target: '[data-tour="crear"]', advanceOnTargetClick: true, title: "Pruébalo tú", description: "…" },
]

<GuidedTour steps={pasos} open={open} onOpenChange={setOpen} onComplete={marcarVisto} />`,
      render: () => <TourDemo />,
    },
  ],
  props: [
    { name: "steps", type: "TourStep[]", description: "`{ id, title, description, icon?, target?, advanceOnTargetClick? }`. `target` es un selector CSS; admite una lista y gana el primero visible." },
    { name: "open / onOpenChange", type: "boolean / (open) => void", description: "Controlado. Cada apertura empieza en el primer paso." },
    { name: "onComplete", type: "() => void", description: "Solo al pulsar «Finalizar»; ✕, Escape o el velo cierran sin completar." },
    { name: "labels", type: "Partial<GuidedTourLabels>", description: "Textos de los botones y el formato de «Paso N de M»." },
  ],
  guidelines: {
    do: [
      "Marca los objetivos con `data-tour` en vez de depender de clases de estilo.",
      "Cuatro o cinco pasos como mucho; el último, hacia la acción que quieres (el botón de feedback).",
      "Da objetivos alternativos (`nav, aside`) cuando el elemento cambia entre escritorio y móvil.",
    ],
    dont: ["No lo relances en cada visita: recuerda que se vio (ver FeedbackCampaign).", "No escondas información imprescindible solo en el recorrido."],
  },
  related: ["feedback-campaign", "feedback-launcher", "popover"],
});
