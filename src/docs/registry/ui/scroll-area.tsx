import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { defineEntry } from "../types";

const VERSIONS = Array.from({ length: 30 }, (_, index) => `v1.${29 - index}.0`);
const COURSES = ["Liderazgo", "Feedback efectivo", "Datos para RR. HH.", "Comunicación", "Gestión del tiempo", "Onboarding", "Bienestar", "Negociación"];

export const scrollAreaEntry = defineEntry({
  id: "scroll-area",
  name: "ScrollArea",
  group: "ui",
  description:
    "Contenedor con scroll y barra personalizada de 10px que aparece solo al desplazarse, coherente entre navegadores. Úsalo en listas y paneles con altura fija: sidebars, listas de resultados, carruseles de tarjetas.",
  importPath: 'import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"',
  sourcePath: "src/components/ui/scroll-area.tsx",
  status: "stable",
  tags: ["radix"],
  examples: [
    {
      id: "vertical",
      title: "Lista vertical",
      description: "Fija la altura en el ScrollArea; el viewport hereda el radio del borde.",
      code: `<ScrollArea className="h-64 w-56 rounded-xl border border-border/60 bg-surface">
  <div className="p-3">
    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Versiones</h4>
    {versions.map((version) => (
      <React.Fragment key={version}>
        <div className="py-1.5 text-sm">{version}</div>
        <Separator />
      </React.Fragment>
    ))}
  </div>
</ScrollArea>`,
      render: () => (
        <ScrollArea className="h-64 w-56 rounded-xl border border-border/60 bg-surface">
          <div className="p-3">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Versiones</h4>
            {VERSIONS.map((version) => (
              <div key={version}>
                <div className="py-1.5 text-sm text-text-primary">{version}</div>
                <Separator />
              </div>
            ))}
          </div>
        </ScrollArea>
      ),
    },
    {
      id: "horizontal",
      title: "Horizontal",
      description: "Añade un `ScrollBar orientation=\"horizontal\"` y deja que el contenido desborde en ancho.",
      code: `<ScrollArea className="w-full whitespace-nowrap rounded-xl border border-border/60 bg-surface">
  <div className="flex w-max gap-3 p-3">
    {courses.map((course) => (
      <figure key={course} className="w-40 shrink-0 rounded-lg border border-border/60 bg-background p-3">
        <div className="mb-2 h-20 rounded-md bg-primary/10" />
        <figcaption className="text-sm font-medium">{course}</figcaption>
      </figure>
    ))}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>`,
      layout: "stretch",
      render: () => (
        <ScrollArea className="w-full whitespace-nowrap rounded-xl border border-border/60 bg-surface">
          <div className="flex w-max gap-3 p-3">
            {COURSES.map((course) => (
              <figure key={course} className="w-40 shrink-0 rounded-lg border border-border/60 bg-background p-3">
                <div className="mb-2 h-20 rounded-md bg-primary/10" />
                <figcaption className="text-sm font-medium text-text-primary">{course}</figcaption>
              </figure>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ),
    },
    {
      id: "text",
      title: "Texto largo",
      description: "Para términos, descripciones o logs dentro de un diálogo.",
      code: `<ScrollArea className="h-40 w-full max-w-md rounded-xl border border-border/60 bg-surface p-4 text-sm leading-relaxed">
  <p>…</p>
</ScrollArea>`,
      render: () => (
        <ScrollArea className="h-40 w-full max-w-md rounded-xl border border-border/60 bg-surface p-4 text-sm leading-relaxed text-text-secondary">
          {Array.from({ length: 6 }, (_, index) => (
            <p key={index} className="mb-3 last:mb-0">
              Las respuestas se guardan de forma anónima. Ningún administrador puede ver quién respondió qué; solo se muestran agregados cuando un segmento reúne al menos cinco personas. Párrafo {index + 1}.
            </p>
          ))}
        </ScrollArea>
      ),
    },
  ],
  props: [
    { name: "className", type: "string", description: "Va en la raíz: aquí se fija la altura o el ancho máximos." },
    { name: "children", type: "React.ReactNode", description: "Contenido del viewport." },
    { name: "type", type: '"auto" | "always" | "scroll" | "hover"', default: '"hover"', description: "Cuándo se muestra la barra (prop de Radix)." },
    { name: "ScrollBar.orientation", type: '"vertical" | "horizontal"', default: '"vertical"', description: "La vertical ya viene incluida; añade una horizontal cuando el contenido desborde en ancho." },
  ],
  guidelines: {
    do: ["Fija la altura en el ScrollArea, no en el contenido.", "Usa `w-max` en el contenido cuando el scroll es horizontal.", "Redondea el ScrollArea y el viewport heredará el radio."],
    dont: ["No anides ScrollAreas: confunde el scroll con la rueda.", "No lo uses para la página entera; es para regiones."],
  },
  related: ["separator", "table", "sheet"],
});
